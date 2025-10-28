# Repository Guidelines

## Project Structure & Module Organization
- `backend/` — Express API (`server.js`, `services/`, `utils/`), env via `backend/.env` (see `.env.example`).
- `frontend/` — React app (`src/`, `public/`).
- `nginx/` — reverse proxy + TLS (`nginx.conf`, `ssl/`, `generate-certs.sh`).
- `data/` — Postgres volume; `docs/` — architecture, development, deployment guides.

## Build, Test, and Development Commands
- Stack (Docker): `docker-compose up --build` — builds/starts `frontend`, `backend`, `nginx`, `db`.
- Backend dev: `cd backend && npm install && npm run dev` — nodemon on port `5000`.
- Frontend dev: `cd frontend && npm install && npm start` — CRA dev server on `3000`.
- Frontend tests: `cd frontend && npm test` — Jest (watch mode).

## Coding Style & Naming Conventions
- JavaScript with 2-space indent; include semicolons; prefer ES modules and `async/await`.
- React components: `PascalCase.js` (e.g., `CalendarView.js`); utilities/helpers: `camelCase.js`.
- Keep pure helpers in `backend/utils/`; external I/O in `backend/services/`.
- Frontend ESLint: CRA defaults (`react-app`). Resolve warnings before merge.

## Testing Guidelines
- Frontend: colocate tests as `*.test.js` under `src/` (components, hooks, utils). Add integration tests for routing/forms.
- Backend: no suite yet; when adding, use Jest + supertest under `backend/tests/`, mock external APIs and DB.
- Only merge with all relevant tests passing locally/CI.

## Commit & Pull Request Guidelines
- Current history is informal; adopt Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`.
  - Example: `feat(api): add entries export endpoint`.
- PRs must include: clear description (what/why), screenshots for UI, validation steps, and linked issues. Keep scope focused.

## Security & Configuration Tips
- Do not commit secrets. Create `backend/.env` from `.env.example`.
- Key vars: `ENCRYPTION_KEY`, `APP_URL`, `OLLAMA_HOST`, `DATABASE_URL` (Docker supplies DB defaults).
- For local HTTPS, use `nginx/generate-certs.sh` and visit `https://localhost`.
