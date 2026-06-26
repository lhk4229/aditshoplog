import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../db/pool';
import { AppError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

interface RemarkRow {
  id: number;
  ticket_id: number;
  author_id: number;
  author_name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

function mapRemark(row: RemarkRow) {
  return {
    id: row.id,
    ticket_id: row.ticket_id,
    author_id: row.author_id,
    author_name: row.author_name,
    content: row.content,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * @openapi
 * /api/tickets/{ticketId}/remarks:
 *   get:
 *     tags: [Remarks]
 *     summary: 리마크 목록
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 리마크 목록
 */
router.get(
  '/tickets/:ticketId/remarks',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ticketId = Number(req.params.ticketId);
      if (Number.isNaN(ticketId)) throw new AppError(400, 'Invalid ticket id');

      const ticket = await query('SELECT id FROM tickets WHERE id = $1', [ticketId]);
      if (ticket.rows.length === 0) {
        throw new AppError(404, 'Ticket not found');
      }

      const result = await query<RemarkRow>(
        `SELECT r.*, u.name AS author_name
         FROM remarks r
         JOIN users u ON u.id = r.author_id
         WHERE r.ticket_id = $1
         ORDER BY r.created_at ASC`,
        [ticketId]
      );

      res.json({ data: result.rows.map(mapRemark) });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/tickets/{ticketId}/remarks:
 *   post:
 *     tags: [Remarks]
 *     summary: 리마크 작성
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       201:
 *         description: 작성 성공
 */
router.post(
  '/tickets/:ticketId/remarks',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, 'Authentication required');

      const ticketId = Number(req.params.ticketId);
      if (Number.isNaN(ticketId)) throw new AppError(400, 'Invalid ticket id');

      const { content } = req.body as { content?: string };
      if (!content?.trim()) {
        throw new AppError(400, 'content is required');
      }

      const ticket = await query('SELECT id FROM tickets WHERE id = $1', [ticketId]);
      if (ticket.rows.length === 0) {
        throw new AppError(404, 'Ticket not found');
      }

      const result = await query<RemarkRow>(
        `WITH inserted AS (
           INSERT INTO remarks (ticket_id, author_id, content)
           VALUES ($1, $2, $3)
           RETURNING *
         )
         SELECT i.*, u.name AS author_name
         FROM inserted i
         JOIN users u ON u.id = i.author_id`,
        [ticketId, req.user.userId, content.trim()]
      );

      res.status(201).json(mapRemark(result.rows[0]));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/remarks/{id}:
 *   patch:
 *     tags: [Remarks]
 *     summary: 리마크 수정 (본인만)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 수정 성공
 */
router.patch('/remarks/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');

    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw new AppError(400, 'Invalid remark id');

    const { content } = req.body as { content?: string };
    if (!content?.trim()) {
      throw new AppError(400, 'content is required');
    }

    const existing = await query<{ author_id: number }>(
      'SELECT author_id FROM remarks WHERE id = $1',
      [id]
    );

    if (existing.rows.length === 0) {
      throw new AppError(404, 'Remark not found');
    }

    if (existing.rows[0].author_id !== req.user.userId) {
      throw new AppError(403, 'You can only edit your own remarks');
    }

    const result = await query<RemarkRow>(
      `WITH updated AS (
         UPDATE remarks
         SET content = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING *
       )
       SELECT u.*, usr.name AS author_name
       FROM updated u
       JOIN users usr ON usr.id = u.author_id`,
      [content.trim(), id]
    );

    res.json(mapRemark(result.rows[0]));
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/remarks/{id}:
 *   delete:
 *     tags: [Remarks]
 *     summary: 리마크 삭제 (본인만)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204:
 *         description: 삭제 성공
 */
router.delete('/remarks/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');

    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw new AppError(400, 'Invalid remark id');

    const existing = await query<{ author_id: number }>(
      'SELECT author_id FROM remarks WHERE id = $1',
      [id]
    );

    if (existing.rows.length === 0) {
      throw new AppError(404, 'Remark not found');
    }

    if (existing.rows[0].author_id !== req.user.userId) {
      throw new AppError(403, 'You can only delete your own remarks');
    }

    await query('DELETE FROM remarks WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
