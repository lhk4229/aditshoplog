#!/bin/bash
set -euo pipefail

echo "==> AditShopLog AWS server setup (Ubuntu)"

sudo apt-get update
sudo apt-get install -y ca-certificates curl git

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "$USER"
  echo "Docker installed. Re-login may be required for group changes."
fi

if ! docker compose version >/dev/null 2>&1; then
  sudo apt-get install -y docker-compose-plugin
fi

APP_DIR="${APP_DIR:-$HOME/aditshoplog}"

if [ ! -d "$APP_DIR/.git" ]; then
  echo "Clone your repository into $APP_DIR before first deploy."
fi

if [ ! -f "$APP_DIR/.env" ]; then
  cp "$APP_DIR/deploy/.env.production.example" "$APP_DIR/.env"
  echo "Created $APP_DIR/.env — edit passwords and APP_URL before deploy."
fi

echo "Setup complete."
echo "Next: edit .env, then run ./deploy/deploy.sh"
