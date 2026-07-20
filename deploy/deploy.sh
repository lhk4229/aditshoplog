#!/bin/bash
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$APP_DIR"

if [ ! -f ".env" ]; then
  echo "Missing .env file. Copy deploy/.env.production.example to .env first."
  exit 1
fi

"$(dirname "$0")/git-pull.sh"

echo "==> Build and start containers"
docker compose -f docker-compose.prod.yml --env-file .env up -d --build

echo "==> Prune unused images"
docker image prune -f

echo "Deploy complete."
docker compose -f docker-compose.prod.yml ps
