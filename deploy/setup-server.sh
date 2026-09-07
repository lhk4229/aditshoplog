#!/bin/bash
set -euo pipefail

echo "==> Aditshoplog AWS server setup (Ubuntu)"

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

# 비공개 저장소를 git fetch 하려면 이 서버의 키가 GitHub Deploy keys에 등록되어 있어야 한다.
mkdir -p ~/.ssh
chmod 700 ~/.ssh
if [ ! -f ~/.ssh/id_ed25519 ]; then
  ssh-keygen -t ed25519 -N "" -C "aditshoplog-deploy@$(hostname)" -f ~/.ssh/id_ed25519
fi
ssh-keyscan -t ed25519,rsa github.com >> ~/.ssh/known_hosts 2>/dev/null || true

if [ ! -d "$APP_DIR/.git" ]; then
  echo "Clone your repository into $APP_DIR before first deploy."
fi

if [ ! -f "$APP_DIR/.env" ] && [ -f "$APP_DIR/deploy/.env.production.example" ]; then
  cp "$APP_DIR/deploy/.env.production.example" "$APP_DIR/.env"
  echo "Created $APP_DIR/.env — edit passwords and APP_URL before deploy."
fi

echo
echo "==> Register this key at GitHub → Settings → Deploy keys (read access is enough)"
cat ~/.ssh/id_ed25519.pub
echo
echo "Setup complete."
echo "Next: edit .env, then run ./deploy/deploy.sh"
