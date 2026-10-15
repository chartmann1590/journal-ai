#!/usr/bin/env bash
set -euo pipefail

echo "[redeploy] Stopping containers..."
docker compose down

echo "[redeploy] Building frontend (production, PWA)..."
docker compose build frontend

echo "[redeploy] Starting stack..."
docker compose up -d

echo "[redeploy] Done. Visit https://localhost"

