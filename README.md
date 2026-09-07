# Aditshoplog

구글시트로 관리하던 업무 티켓 처리 현황을 웹에서 관리하는 서비스입니다.

회원가입·로그인 후 지라번호와 티켓명을 기준으로 티켓을 등록하고, 담당자·배포일·repo별 브랜치·처리현황·dev merge·캡처 업로드 등을 기록합니다. 기존 시트의 리마크는 티켓별 댓글로 분리되어 있습니다.

더 자세한 기획은 [aditshoplog_project_plan.md](./aditshoplog_project_plan.md)를 참고하세요.

## 배포 주소

AWS EC2에 배포되어 있으며, main 브랜치에 푸시하면 GitHub Actions가 자동으로 재배포합니다.

| 서비스 | 주소 |
|--------|------|
| 서비스 | http://15.164.211.3 |
| Swagger | http://15.164.211.3/api-docs |

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | Next.js, React, TypeScript, CSS Modules |
| Backend | Node.js, Express.js |
| Database | PostgreSQL 16 |
| Auth | JWT (httpOnly Cookie), bcryptjs |
| API 문서 | Swagger (`/api-docs`) |
| 로컬/배포 | Docker Compose, nginx, GitHub Actions |

## 요구 사항

- Node.js 22 이상
- npm
- Docker / Docker Compose (PostgreSQL용, 프로덕션 전체 기동용)

## 로컬 실행

1. 저장소를 클론하고 루트에서 의존성을 설치합니다.

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

2. 환경 변수를 준비합니다.

```bash
cp .env.example .env
```

`.env`에서 `JWT_SECRET`, SMTP 계정(`SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`)을 채웁니다. 로컬 기본값은 `.env.example`과 같습니다.

- `DATABASE_URL`: `postgresql://aditshoplog:aditshoplog@localhost:5432/aditshoplog`
- `CORS_ORIGIN` / `APP_URL`: `http://localhost:3000`
- `NEXT_PUBLIC_API_URL`: `http://localhost:4000`

3. PostgreSQL과 Adminer를 띄운 뒤 마이그레이션을 실행합니다.

```bash
npm run db:up
npm run db:migrate
```

4. 백엔드와 프론트엔드를 함께 실행합니다.

```bash
npm run dev
```

또는 따로 실행할 수 있습니다.

```bash
npm run dev:backend
npm run dev:frontend
```

### 로컬 URL

| 서비스 | 주소 |
|--------|------|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:4000 |
| Swagger | http://localhost:4000/api-docs |
| Adminer (DB UI) | http://localhost:8080 |

Adminer 접속 시 서버는 `postgres`, 계정/DB는 `.env`의 `POSTGRES_*` 값을 사용합니다.

회원가입 시 인증 메일이 필요합니다. SMTP가 비어 있으면 메일 발송이 실패하므로 로컬에서도 설정해야 합니다. 메일 링크의 베이스 URL은 `APP_URL`입니다.

발송에는 Gmail SMTP를 사용합니다. 구글 계정에 2단계 인증을 켜고 [앱 비밀번호](https://myaccount.google.com/apppasswords)를 발급받아 `SMTP_PASS`에 넣으세요. `SMTP_USER`와 `MAIL_FROM`은 같은 지메일 주소여야 합니다.

외부 발송 서비스(Brevo, SendGrid 등)로 지메일 주소를 발신자로 쓰면 SPF/DKIM이 정렬되지 않아 회사 메일 서버에서 격리될 수 있습니다. 구글 서버로 직접 보내면 이 문제가 없습니다.

## 주요 npm 스크립트

루트 `package.json` 기준입니다.

| 명령 | 설명 |
|------|------|
| `npm run dev` | backend + frontend 동시 실행 |
| `npm run db:up` | PostgreSQL, Adminer 기동 |
| `npm run db:down` | 로컬 Compose 종료 |
| `npm run db:migrate` | DB 마이그레이션 |
| `npm run prod:up` | 프로덕션 Compose 빌드 후 기동 |
| `npm run prod:down` | 프로덕션 Compose 종료 |
| `npm run prod:logs` | 프로덕션 로그 팔로우 |

## 환경 변수

루트 `.env`를 backend가 읽고, frontend 로컬은 `NEXT_PUBLIC_API_URL`을 사용합니다. 실제 값은 `.env`에만 두고 커밋하지 마세요.

| 변수 | 설명 |
|------|------|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | PostgreSQL 계정 |
| `DATABASE_URL` | 백엔드 DB 접속 문자열 |
| `PORT` | 백엔드 포트 (기본 4000) |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | JWT 서명·만료 |
| `CORS_ORIGIN` | 허용 Origin (콤마 구분 가능) |
| `APP_URL` | 인증·비밀번호 재설정 메일 링크 |
| `SMTP_*` / `MAIL_FROM` | 메일 발송 (Gmail SMTP, `SMTP_PASS`는 앱 비밀번호) |
| `NEXT_PUBLIC_API_URL` | 프론트 API 베이스. 로컬은 `http://localhost:4000`, nginx 동일 origin 배포는 빈 값 |
| `COOKIE_SECURE` | 선택. 미설정 시 `APP_URL`/`CORS_ORIGIN`이 `https://`이면 Secure 쿠키 |

프로덕션 템플릿은 [deploy/.env.production.example](./deploy/.env.production.example)입니다.

## 프로덕션 (Docker Compose)

서버에 `.env`를 두고 루트에서 실행합니다.

```bash
cp deploy/.env.production.example .env
# CORS_ORIGIN, APP_URL, DB 비밀번호, JWT, SMTP 수정

npm run prod:up
```

`docker-compose.prod.yml`이 postgres, backend, frontend, nginx를 올립니다. nginx가 80 포트로 프론트와 `/api`를 프록시합니다.

배포 파이프라인은 `.github/workflows/`의 CI와 AWS SSH 배포 워크플로를 사용합니다. main 브랜치 푸시 시 `ci.yml`이 타입 체크와 도커 빌드를 검증하고, `deploy-aws.yml`이 EC2에 SSH로 접속해 최신 코드를 받아 컨테이너를 다시 빌드·기동합니다.

EC2 초기 설정은 `deploy/setup-server.sh`가 담당합니다. 도커 설치, 배포용 SSH 키 생성, `.env` 템플릿 복사까지 처리하며, 출력된 공개키를 GitHub Deploy keys에 등록해야 서버가 저장소를 받아올 수 있습니다.

## 디렉터리 구조

```
AditShopLog/
├── backend/          # Express API, 마이그레이션, Swagger
├── frontend/         # Next.js 앱
├── deploy/           # nginx, 프로덕션 env 예시
├── docker-compose.yml
├── docker-compose.prod.yml
└── aditshoplog_project_plan.md
```

## 주요 화면

| 경로 | 설명 |
|------|------|
| `/login` | 로그인 |
| `/signup` | 회원가입 |
| `/verify-email` | 이메일 인증 |
| `/forgot-password` | 비밀번호 재설정 요청 |
| `/reset-password` | 새 비밀번호 입력 |
| `/tickets` | 티켓 목록 |
| `/tickets/new` | 티켓 등록 |
| `/tickets/[id]` | 티켓 상세·리마크 |
| `/tickets/[id]/edit` | 티켓 수정 |
