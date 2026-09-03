import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db/pool';
import { AppError } from '../middleware/errorHandler';
import { authenticate, signToken } from '../middleware/auth';
import { clearAuthCookie, setAuthCookie } from '../lib/cookie';

const router = Router();

interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  name: string;
}

/**
 * @openapi
 * /api/auth/signup:
 *   post:
 *     tags: [Auth]
 *     summary: 회원가입
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
 *         description: 가입 성공
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

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await query<UserRow>(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name`,
      [email.trim().toLowerCase(), passwordHash, name.trim()]
    );

    const user = result.rows[0];
    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    setAuthCookie(res, token);

    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name },
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
      'SELECT id, email, password_hash, name FROM users WHERE email = $1',
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

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    setAuthCookie(res, token);

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
