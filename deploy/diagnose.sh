#!/bin/bash
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$APP_DIR"

echo "==> Container status"
docker compose -f docker-compose.prod.yml ps

echo ""
echo "==> Backend logs (last 80 lines)"
docker logs aditshoplog-api --tail 80 2>&1 || true

echo ""
echo "==> Health checks"
echo -n "nginx /health: "
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1/health || echo "failed"
echo -n "backend :4000/health: "
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:4000/health || echo "failed"

echo ""
echo "==> .env checks (values hidden)"
if [ -f .env ]; then
  grep -E '^(POSTGRES_|DATABASE_URL|JWT_SECRET|CORS_ORIGIN|APP_URL)=' .env | sed 's/=.*/=***/'
  db_pass=$(grep '^POSTGRES_PASSWORD=' .env | cut -d= -f2-)
  url_pass=$(grep '^DATABASE_URL=' .env | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
  if [ -n "$db_pass" ] && [ -n "$url_pass" ] && [ "$db_pass" != "$url_pass" ]; then
    echo "WARNING: POSTGRES_PASSWORD and DATABASE_URL password do not match"
  fi
else
  echo "ERROR: .env file missing"
fi
