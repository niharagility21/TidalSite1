#!/bin/bash
# ── Tidal VPS Deploy Script ──────────────────────────────────────────
# Usage: bash deploy.sh [PORT]
# Default port: 3001

set -e

VPS_HOST="root@139.59.64.19"
REMOTE_DIR="/root/TidalSite"
PORT="${1:-3001}"
ARCHIVE="/tmp/tidalsite_deploy.tar.gz"

echo "==> Building archive (excluding node_modules, .git, .env)..."
tar \
  --exclude='./node_modules' \
  --exclude='./.git' \
  --exclude='./.env' \
  --exclude='./deploy.sh' \
  -czf "$ARCHIVE" .

echo "==> Creating remote folder $REMOTE_DIR..."
ssh -o StrictHostKeyChecking=no "$VPS_HOST" "mkdir -p $REMOTE_DIR"

echo "==> Uploading archive..."
scp -o StrictHostKeyChecking=no "$ARCHIVE" "$VPS_HOST:$REMOTE_DIR/deploy.tar.gz"

echo "==> Extracting & installing on VPS..."
ssh -o StrictHostKeyChecking=no "$VPS_HOST" bash <<REMOTE
  cd $REMOTE_DIR
  tar -xzf deploy.tar.gz
  rm deploy.tar.gz
  npm install --omit=dev

  # Create .env if it doesn't exist yet
  if [ ! -f .env ]; then
    cat > .env <<ENV
PORT=$PORT
NODE_ENV=production
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
NOTIFY_EMAIL=
ENV
    echo "[!] .env created with PORT=$PORT — fill in SMTP values on the server"
  else
    # Just update the port
    sed -i "s/^PORT=.*/PORT=$PORT/" .env
    echo "[✓] Updated PORT=$PORT in existing .env"
  fi

  # Install PM2 globally if not present
  if ! command -v pm2 &> /dev/null; then
    echo "==> Installing PM2..."
    npm install -g pm2
  fi

  # Stop old instance if running, start fresh
  pm2 delete TidalSite 2>/dev/null || true
  pm2 start server.js --name TidalSite
  pm2 save
  pm2 startup 2>/dev/null || true

  # Open firewall port
  ufw allow $PORT/tcp 2>/dev/null || true

  echo ""
  echo "✅ TidalSite deployed!"
  echo "   Running at http://139.59.64.19:$PORT"
REMOTE

rm -f "$ARCHIVE"
echo ""
echo "✅ Done! Site is live at http://139.59.64.19:$PORT"
