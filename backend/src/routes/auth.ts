import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db/pool';
import { AppError } from '../middleware/errorHandler';
import { authenticate, signToken } from '../middleware/auth';
import { clearAuthCookie, setAuthCookie } from '../lib/cookie';
import { consumeEmailToken, issueEmailToken } from '../lib/emailTokens';
import {
  assertNotRateLimited,
  markSent,
  sendPasswordResetEmail,
  sendVerificationEmail,
} from '../lib/mail';

const router = Router();

interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  email_verified_at: Date | null;
}

function loginUser(res: Response, user: Pick<UserRow, 'id' | 'email' | 'name'>) {
  const token = signToken({
    userId: user.id,
    email: user.email,
    name: user.name,
  });
  setAuthCookie(res, token);
}

/**
 * @openapi
 * /api/auth/signup:
 *   post:
 *     tags: [Auth]
 *     summary: 회원가입 (인증 메일 발송)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *               name: { type: string }
 *     responses:
 *       201:
 *         description: 인증 메일 발송
 */
router.post('/signup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name } = req.body as {
      email?: string;
      password?: string;
      name?: string;
    };

    if (!email?.trim() || !password || !name?.trim()) {
      throw new AppError(400, '이메일, 비밀번호, 이름을 모두 입력해 주세요.');
    }

    if (password.length < 6) {
      throw new AppError(400, '비밀번호는 6자 이상이어야 합니다.');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password, 10);

    const existing = await query<UserRow>(
      'SELECT id, email, password_hash, name, email_verified_at FROM users WHERE email = $1',
      [normalizedEmail]
    );
    const current = existing.rows[0];

    if (current?.email_verified_at) {
      throw new AppError(409, '이미 등록된 이메일입니다.');
    }

    let user: UserRow;
    if (current) {
      const updated = await query<UserRow>(
        `UPDATE users
         SET password_hash = $1, name = $2, updated_at = NOW()
         WHERE id = $3
         RETURNING id, email, password_hash, name, email_verified_at`,
        [passwordHash, name.trim(), current.id]
      );
      user = updated.rows[0];
    } else {
      const created = await query<UserRow>(
        `INSERT INTO users (email, password_hash, name)
         VALUES ($1, $2, $3)
         RETURNING id, email, password_hash, name, email_verified_at`,
        [normalizedEmail, passwordHash, name.trim()]
      );
      user = created.rows[0];
    }

    assertNotRateLimited(`verify:${normalizedEmail}`);
    const token = await issueEmailToken(user.id, 'verify_email');
    await sendVerificationEmail(user.email, token);
    markSent(`verify:${normalizedEmail}`);

    res.status(201).json({
      message: '인증 메일을 보냈습니다. 메일함의 링크를 열어 가입을 완료해 주세요.',
    });
  } catch (error) {
    if ((error as { code?: string }).code === '23505') {
      next(new AppError(409, '이미 등록된 이메일입니다.'));
      return;
    }
    next(error);
  }
});

/**
 * @openapi
 * /api/auth/verify-email:
 *   post:
 *     tags: [Auth]
 *     summary: 이메일 인증
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token: { type: string }
 *     responses:
 *       200:
 *         description: 인증 성공 후 로그인
 */
router.post('/verify-email', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
    if (!token) {
      throw new AppError(400, '인증 토큰이 필요합니다.');
    }

    const userId = await consumeEmailToken(token, 'verify_email');
    if (!userId) {
      throw new AppError(400, '인증 링크가 유효하지 않거나 만료되었습니다.');
    }

    const result = await query<UserRow>(
      `UPDATE users
       SET email_verified_at = COALESCE(email_verified_at, NOW()), updated_at = NOW()
       WHERE id = $1
       RETURNING id, email, password_hash, name, email_verified_at`,
      [userId]
    );
    const user = result.rows[0];
    if (!user) {
      throw new AppError(400, '인증 링크가 유효하지 않거나 만료되었습니다.');
    }

    loginUser(res, user);
    res.json({ user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/auth/resend-verification:
 *   post:
 *     tags: [Auth]
 *     summary: 인증 메일 재발송
 */
router.post(
  '/resend-verification',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const email =
        typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
      if (!email) {
        throw new AppError(400, '이메일을 입력해 주세요.');
      }

      const result = await query<UserRow>(
        'SELECT id, email, password_hash, name, email_verified_at FROM users WHERE email = $1',
        [email]
      );
      const user = result.rows[0];

      if (user && !user.email_verified_at) {
        assertNotRateLimited(`verify:${email}`);
        const token = await issueEmailToken(user.id, 'verify_email');
        await sendVerificationEmail(user.email, token);
        markSent(`verify:${email}`);
      }

      res.json({
        message: '해당 이메일이 미인증 계정이면 인증 메일을 보냈습니다.',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: 비밀번호 재설정 메일 발송
 */
router.post('/forgot-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email =
      typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!email) {
      throw new AppError(400, '이메일을 입력해 주세요.');
    }

    const result = await query<UserRow>(
      'SELECT id, email, password_hash, name, email_verified_at FROM users WHERE email = $1',
      [email]
    );
    const user = result.rows[0];

    if (user?.email_verified_at) {
      assertNotRateLimited(`reset:${email}`);
      const token = await issueEmailToken(user.id, 'reset_password');
      await sendPasswordResetEmail(user.email, token);
      markSent(`reset:${email}`);
    }

    res.json({
      message: '해당 이메일로 가입된 계정이 있으면 재설정 링크를 보냈습니다.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: 비밀번호 재설정
 */
router.post('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!token || !password) {
      throw new AppError(400, '토큰과 새 비밀번호를 입력해 주세요.');
    }
    if (password.length < 6) {
      throw new AppError(400, '비밀번호는 6자 이상이어야 합니다.');
    }

    const userId = await consumeEmailToken(token, 'reset_password');
    if (!userId) {
      throw new AppError(400, '재설정 링크가 유효하지 않거나 만료되었습니다.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query<UserRow>(
      `UPDATE users
       SET password_hash = $1, updated_at = NOW()
       WHERE id = $2 AND email_verified_at IS NOT NULL
       RETURNING id, email, password_hash, name, email_verified_at`,
      [passwordHash, userId]
    );
    const user = result.rows[0];
    if (!user) {
      throw new AppError(400, '재설정 링크가 유효하지 않거나 만료되었습니다.');
    }

    loginUser(res, user);
    res.json({ user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: 로그인
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: 로그인 성공
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email?.trim() || !password) {
      throw new AppError(400, '이메일과 비밀번호를 입력해 주세요.');
    }

    const result = await query<UserRow>(
      'SELECT id, email, password_hash, name, email_verified_at FROM users WHERE email = $1',
      [email.trim().toLowerCase()]
    );

    const user = result.rows[0];
    if (!user) {
      throw new AppError(401, '이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new AppError(401, '이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    if (!user.email_verified_at) {
      throw new AppError(403, '이메일 인증이 완료되지 않았습니다. 메일함의 인증 링크를 확인해 주세요.');
    }

    loginUser(res, user);

    res.json({
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: 현재 로그인 사용자
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 사용자 정보
 */
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError(401, '로그인이 필요합니다.');
    }

    res.json({
      user: {
        id: req.user.userId,
        email: req.user.email,
        name: req.user.name,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: 로그아웃
 *     responses:
 *       204:
 *         description: 로그아웃 성공
 */
router.post('/logout', (_req: Request, res: Response) => {
  clearAuthCookie(res);
  res.status(204).send();
});

export default router;
