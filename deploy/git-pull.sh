#!/bin/bash
set -euo pipefail

mkdir -p ~/.ssh
chmod 700 ~/.ssh
ssh-keyscan -t ed25519,rsa github.com >> ~/.ssh/known_hosts 2>/dev/null || true

origin_url="$(git remote get-url origin)"
if [[ "$origin_url" == https://github.com/* ]]; then
  repo_path="${origin_url#https://github.com/}"
  repo_path="${repo_path%.git}"
  echo "==> Converting HTTPS remote to SSH"
  git remote set-url origin "git@github.com:${repo_path}.git"
fi

echo "==> Pull latest code"
if ! git fetch origin main; then
  echo "ERROR: git fetch failed."
  echo "Add this server's SSH public key to GitHub Deploy keys:"
  echo "  cat ~/.ssh/id_ed25519.pub"
  exit 1
fi

git reset --hard origin/main
