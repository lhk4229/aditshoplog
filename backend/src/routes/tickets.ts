import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../db/pool';
import { AppError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

interface TicketRow {
  id: number;
  title: string;
  jira_key: string;
  ticket_name: string;
  writer_id: number;
  writer_name: string;
  assignee: string | null;
  written_date: string | null;
  deploy_date: string | null;
  aditshop_branch_note: string | null;
  newbqr_branch_note: string | null;
  related_links: string | null;
  status: string | null;
  dev_merge_status: string | null;
  capture_upload_status: string | null;
  last_modified_by: number | null;
  last_modified_by_name: string | null;
  last_modified_at: string | null;
  created_at: string;
  updated_at: string;
  latest_remark_content?: string | null;
}

function buildTicketTitle(jiraKey: string, ticketName: string) {
  return `${jiraKey} - ${ticketName}`;
}

function mapTicket(row: TicketRow) {
  return {
    id: row.id,
    title: row.title,
    jira_key: row.jira_key,
    ticket_name: row.ticket_name,
    assignee: row.assignee,
    written_date: row.written_date,
    deploy_date: row.deploy_date,
    aditshop_branch_note: row.aditshop_branch_note,
    newbqr_branch_note: row.newbqr_branch_note,
    related_links: row.related_links,
    status: row.status,
    dev_merge_status: row.dev_merge_status,
    capture_upload_status: row.capture_upload_status,
    writer_id: row.writer_id,
    writer_name: row.writer_name,
    last_modified_by: row.last_modified_by,
    last_modified_by_name: row.last_modified_by_name,
    last_modified_at: row.last_modified_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    latest_remark_content: row.latest_remark_content ?? null,
  };
}

const ticketSelect = `
  SELECT
    t.*,
    w.name AS writer_name,
    lm.name AS last_modified_by_name
  FROM tickets t
  JOIN users w ON w.id = t.writer_id
  LEFT JOIN users lm ON lm.id = t.last_modified_by
`;

/**
 * @openapi
 * /api/tickets:
 *   get:
 *     tags: [Tickets]
 *     summary: 티켓 목록 (페이징·필터)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: jira_key
 *         schema: { type: string }
 *       - in: query
 *         name: ticket_name
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: assignee
 *         schema: { type: string }
 *       - in: query
 *         name: deploy_date
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: 티켓 목록
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: unknown[] = [];

    const filters: Record<string, string | undefined> = {
      jira_key: req.query.jira_key as string | undefined,
      ticket_name: req.query.ticket_name as string | undefined,
      status: req.query.status as string | undefined,
      assignee: req.query.assignee as string | undefined,
      deploy_date: req.query.deploy_date as string | undefined,
    };

    for (const [key, value] of Object.entries(filters)) {
      if (!value?.trim()) continue;

      if (key === 'jira_key' || key === 'ticket_name' || key === 'assignee') {
        params.push(`%${value.trim()}%`);
        conditions.push(`t.${key} ILIKE $${params.length}`);
      } else if (key === 'status') {
        params.push(value.trim());
        conditions.push(`t.status = $${params.length}`);
      } else if (key === 'deploy_date') {
        params.push(value.trim());
        conditions.push(`t.deploy_date = $${params.length}`);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM tickets t ${whereClause}`,
      params
    );

    params.push(limit, offset);
    const listResult = await query<TicketRow>(
      `SELECT
         t.*,
         w.name AS writer_name,
         lm.name AS last_modified_by_name,
         (
           SELECT r.content
           FROM remarks r
           WHERE r.ticket_id = t.id
           ORDER BY r.created_at DESC, r.id DESC
           LIMIT 1
         ) AS latest_remark_content
       FROM tickets t
       JOIN users w ON w.id = t.writer_id
       LEFT JOIN users lm ON lm.id = t.last_modified_by
       ${whereClause}
       ORDER BY t.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const total = Number(countResult.rows[0].count);

    res.json({
      data: listResult.rows.map(mapTicket),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/tickets:
 *   post:
 *     tags: [Tickets]
 *     summary: 티켓 등록
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: 등록 성공
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError(401, '로그인이 필요합니다.');

    const {
      jira_key,
      ticket_name,
      assignee,
      written_date,
      deploy_date,
      aditshop_branch_note,
      newbqr_branch_note,
      related_links,
      status,
      dev_merge_status,
      capture_upload_status,
    } = req.body as Record<string, string | undefined>;

    if (!jira_key?.trim() || !ticket_name?.trim()) {
      throw new AppError(400, 'Jira 키와 티켓명을 입력해 주세요.');
    }

    const title = buildTicketTitle(jira_key.trim(), ticket_name.trim());
    const now = new Date();

    const insertResult = await query<{ id: number }>(
      `INSERT INTO tickets (
         title, jira_key, ticket_name, writer_id, assignee,
         written_date, deploy_date, aditshop_branch_note, newbqr_branch_note,
         related_links, status, dev_merge_status, capture_upload_status,
         last_modified_by, last_modified_at, created_at, updated_at
       ) VALUES (
         $1, $2, $3, $4, $5,
         $6, $7, $8, $9,
         $10, $11, $12, $13,
         $4, $14, $14, $14
       ) RETURNING id`,
      [
        title,
        jira_key.trim(),
        ticket_name.trim(),
        req.user.userId,
        assignee?.trim() || null,
        written_date || null,
        deploy_date || null,
        aditshop_branch_note || null,
        newbqr_branch_note || null,
        related_links || null,
        status || null,
        dev_merge_status || null,
        capture_upload_status || null,
        now,
      ]
    );

    const result = await query<TicketRow>(
      `${ticketSelect} WHERE t.id = $1`,
      [insertResult.rows[0].id]
    );

    res.status(201).json(mapTicket(result.rows[0]));
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/tickets/{id}:
 *   get:
 *     tags: [Tickets]
 *     summary: 티켓 상세
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 티켓 상세
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw new AppError(400, '올바르지 않은 티켓 ID입니다.');

    const result = await query<TicketRow>(
      `${ticketSelect} WHERE t.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError(404, '티켓을 찾을 수 없습니다.');
    }

    res.json(mapTicket(result.rows[0]));
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/tickets/{id}:
 *   patch:
 *     tags: [Tickets]
 *     summary: 티켓 수정
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
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError(401, '로그인이 필요합니다.');

    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw new AppError(400, '올바르지 않은 티켓 ID입니다.');

    const existing = await query<{
      id: number;
      jira_key: string;
      ticket_name: string;
      writer_id: number;
    }>('SELECT id, jira_key, ticket_name, writer_id FROM tickets WHERE id = $1', [id]);

    if (existing.rows.length === 0) {
      throw new AppError(404, '티켓을 찾을 수 없습니다.');
    }

    if (existing.rows[0].writer_id !== req.user.userId) {
      throw new AppError(403, '본인이 작성한 티켓만 수정할 수 있습니다.');
    }

    const allowedFields = [
      'jira_key',
      'ticket_name',
      'assignee',
      'written_date',
      'deploy_date',
      'aditshop_branch_note',
      'newbqr_branch_note',
      'related_links',
      'status',
      'dev_merge_status',
      'capture_upload_status',
    ] as const;

    const updates: string[] = [];
    const params: unknown[] = [];
    const body = req.body as Record<string, string | undefined>;

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        params.push(body[field] === '' ? null : body[field]);
        updates.push(`${field} = $${params.length}`);
      }
    }

    const jiraKey = body.jira_key?.trim() ?? existing.rows[0].jira_key;
    const ticketName = body.ticket_name?.trim() ?? existing.rows[0].ticket_name;

    if (body.jira_key !== undefined || body.ticket_name !== undefined) {
      params.push(buildTicketTitle(jiraKey, ticketName));
      updates.push(`title = $${params.length}`);
    }

    if (updates.length === 0) {
      throw new AppError(400, '수정할 항목이 없습니다.');
    }

    const now = new Date();
    params.push(req.user.userId, now, now, id);

    await query(
      `UPDATE tickets SET
         ${updates.join(', ')},
         last_modified_by = $${params.length - 3},
         last_modified_at = $${params.length - 2},
         updated_at = $${params.length - 1}
       WHERE id = $${params.length}`,
      params
    );

    const result = await query<TicketRow>(
      `${ticketSelect} WHERE t.id = $1`,
      [id]
    );

    res.json(mapTicket(result.rows[0]));
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/tickets/{id}:
 *   delete:
 *     tags: [Tickets]
 *     summary: 티켓 삭제 (작성자만)
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
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError(401, '로그인이 필요합니다.');

    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw new AppError(400, '올바르지 않은 티켓 ID입니다.');

    const existing = await query<{ id: number; writer_id: number }>(
      'SELECT id, writer_id FROM tickets WHERE id = $1',
      [id]
    );

    if (existing.rows.length === 0) {
      throw new AppError(404, '티켓을 찾을 수 없습니다.');
    }

    if (existing.rows[0].writer_id !== req.user.userId) {
      throw new AppError(403, '본인이 작성한 티켓만 삭제할 수 있습니다.');
    }

    await query('DELETE FROM tickets WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
