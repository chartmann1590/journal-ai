# Journal AI

AI-assisted journaling with a modern React frontend, Express/Postgres backend, and optional mobile app. Includes an installable PWA with offline shell, an animated splash, and end‑to‑end tests.

## Highlights
- AI insights, tags, and emotions on save
- Voice‑to‑text journaling over HTTPS
- Calendar, history, search, and export
- PWA: install button in menu, maskable icons, offline shell, 5s animated splash with progress bar, no auto‑prompt when already installed
- Dockerized stack: Nginx (TLS), Backend (Express), Frontend (SPA), Postgres

## Quick Start (Docker)
- Generate local certs: `bash nginx/generate-certs.sh` (Windows: run from Git Bash)
- Launch: `docker compose up -d`
- Open: `https://localhost` (accept the self‑signed cert warning)

## Development
- Backend dev: `cd backend && npm install && npm run dev`
- Frontend dev: `cd frontend && npm install && npm start`
- Stack (Docker): `docker compose up --build`

## Testing
- E2E (Playwright):
  - Install browsers once: `cd frontend && npx playwright install`
  - Run: `cd frontend && npm run test:e2e`

## Configuration
- Env vars (see `backend/.env.example`):
  - `DATABASE_URL` provided by Docker by default
  - `OLLAMA_HOST` (e.g., `host.docker.internal:11434`)
  - `ENCRYPTION_KEY` (change in production)
  - `APP_URL` (e.g., `https://localhost`)

## Structure
- `backend/` Express API, services, utils
- `frontend/` React app (PWA assets in `public/`)
- `nginx/` Reverse proxy with TLS and local certs
- `data/` Postgres volume; `docs/` guides

## Troubleshooting
- Logs: `docker compose logs backend|frontend|nginx|db`
- HTTPS required for mic permissions and PWA install prompts
- Ollama: ensure it’s running and reachable via `OLLAMA_HOST`

## More Docs
- Docs index: `docs/README.md`
- Architecture: `docs/architecture.md`
- API: `docs/api-reference.md`
- Installation: `docs/installation.md`
- Development: `docs/development.md`

## License
MIT

