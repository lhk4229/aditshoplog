import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './config/env';

const user = {
  type: 'object',
  properties: {
    id: { type: 'integer', example: 1 },
    email: { type: 'string', format: 'email', example: 'user@example.com' },
    name: { type: 'string', example: '홍길동' },
  },
} as const;

const ticketFields = {
  jira_key: { type: 'string', example: 'ADIT-1234' },
  ticket_name: { type: 'string', example: '주문서 쿠폰 적용 오류' },
  assignee: { type: 'string', nullable: true, example: '김담당' },
  written_date: { type: 'string', format: 'date', nullable: true, example: '2026-09-01' },
  deploy_date: { type: 'string', format: 'date', nullable: true, example: '2026-09-10' },
  aditshop_branch_note: { type: 'string', nullable: true, example: 'feature/ADIT-1234' },
  newbqr_branch_note: { type: 'string', nullable: true, example: 'hotfix/ADIT-1234' },
  related_links: { type: 'string', nullable: true, example: 'https://jira.example.com/ADIT-1234' },
  status: { type: 'string', nullable: true, example: '진행중' },
  dev_merge_status: { type: 'string', nullable: true, example: '완료' },
  capture_upload_status: { type: 'string', nullable: true, example: '불필요' },
} as const;

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Aditshoplog API',
      version: '1.0.0',
      description: [
        'Aditshoplog 업무 티켓 관리 API',
        '',
        '로그인(`POST /api/auth/login`)에 성공하면 httpOnly 쿠키 `aditshoplog_token`이 발급되고,',
        '이후 요청은 이 쿠키로 자동 인증됩니다. Swagger UI에서도 로그인 후 바로 다른 API를 호출할 수 있습니다.',
        'API 클라이언트에서 쿠키를 쓸 수 없다면 `Authorization: Bearer <JWT>` 헤더도 지원합니다.',
      ].join('\n'),
    },
    servers: [
      { url: '/', description: '현재 호스트 (nginx 배포 시 동일 origin)' },
      { url: `http://localhost:${env.port}`, description: '로컬 백엔드' },
    ],
    tags: [
      { name: 'Auth', description: '회원가입·이메일 인증·로그인' },
      { name: 'Tickets', description: '티켓(게시글) CRUD' },
      { name: 'Remarks', description: '리마크(댓글) CRUD' },
      { name: 'System', description: '헬스 체크' },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'aditshoplog_token',
          description: '로그인 시 자동 발급되는 httpOnly 쿠키. Swagger UI에서는 별도 입력 없이 사용됩니다.',
        },
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: '쿠키를 쓸 수 없는 클라이언트용 대체 인증 방식.',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string', example: '로그인이 필요합니다.' },
          },
        },
        Message: {
          type: 'object',
          properties: {
            message: { type: 'string', example: '인증 메일을 보냈습니다.' },
          },
        },
        User: user,
        AuthResponse: {
          type: 'object',
          properties: { user },
        },
        SignupRequest: {
          type: 'object',
          required: ['email', 'password', 'name'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', minLength: 6, example: 'password123' },
            name: { type: 'string', example: '홍길동' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', example: 'password123' },
          },
        },
        EmailRequest: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
          },
        },
        VerifyEmailRequest: {
          type: 'object',
          required: ['token'],
          properties: {
            token: { type: 'string', description: '인증 메일 링크의 token 쿼리 값' },
          },
        },
        ResetPasswordRequest: {
          type: 'object',
          required: ['token', 'password'],
          properties: {
            token: { type: 'string', description: '재설정 메일 링크의 token 쿼리 값' },
            password: { type: 'string', minLength: 6, example: 'newpassword123' },
          },
        },
        TicketCreateRequest: {
          type: 'object',
          required: ['jira_key', 'ticket_name'],
          properties: ticketFields,
        },
        TicketUpdateRequest: {
          type: 'object',
          description: '변경할 필드만 보내면 됩니다. 빈 문자열은 null로 저장됩니다.',
          properties: ticketFields,
        },
        Ticket: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            title: { type: 'string', example: 'ADIT-1234 - 주문서 쿠폰 적용 오류' },
            ...ticketFields,
            writer_id: { type: 'integer', example: 1 },
            writer_name: { type: 'string', example: '홍길동' },
            last_modified_by: { type: 'integer', nullable: true, example: 1 },
            last_modified_by_name: { type: 'string', nullable: true, example: '홍길동' },
            last_modified_at: { type: 'string', format: 'date-time', nullable: true },
            latest_remark_content: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            total: { type: 'integer', example: 42 },
            totalPages: { type: 'integer', example: 3 },
          },
        },
        TicketListResponse: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { $ref: '#/components/schemas/Ticket' } },
            pagination: { $ref: '#/components/schemas/Pagination' },
          },
        },
        RemarkRequest: {
          type: 'object',
          required: ['content'],
          properties: {
            content: { type: 'string', example: 'QA 확인 완료했습니다.' },
          },
        },
        Remark: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            ticket_id: { type: 'integer', example: 1 },
            author_id: { type: 'integer', example: 1 },
            author_name: { type: 'string', example: '홍길동' },
            content: { type: 'string', example: 'QA 확인 완료했습니다.' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        RemarkListResponse: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { $ref: '#/components/schemas/Remark' } },
          },
        },
      },
      responses: {
        BadRequest: {
          description: '요청 값이 올바르지 않음',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        Unauthorized: {
          description: '로그인이 필요함',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        Forbidden: {
          description: '권한 없음 (본인이 작성한 항목만 수정·삭제 가능)',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        NotFound: {
          description: '대상을 찾을 수 없음',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        Conflict: {
          description: '이미 존재하는 리소스',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
      },
    },
    paths: {
      '/health': {
        get: {
          tags: ['System'],
          summary: '서버·DB 상태 확인',
          responses: {
            200: {
              description: '정상',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                      database: { type: 'string', example: 'connected' },
                    },
                  },
                },
              },
            },
            503: {
              description: 'DB 연결 실패',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'error' },
                      database: { type: 'string', example: 'disconnected' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
});
