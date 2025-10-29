# Improvement Plan and Feature Ideas

This document outlines pragmatic improvements and new features across the product. It’s grouped so you can prioritize by impact and effort.

## Product & UX

- Onboarding
  - First‑run “Connect to Server” wizard with auto‑discovery hints and connectivity tests.
  - Guided tour for core features: entries, history, calendar, notifications.
- Journaling experience
  - Templates library (gratitude, CBT thought record, daily reflection) with favorites.
  - Mood slider + quick tags at save time; optionally ask a single reflective question.
  - Streaks, gentle nudges, and a “daily goal” (e.g., 1 entry/day) for motivation.
- Notifications
  - Smart reminders: catch‑up if a day was missed; adjust time based on behavior.
  - Weekly goals + progress notifications; opt‑in for AI “weekly theme” notification.

## Mobile App (Flutter)

- Platform
  - iOS support (BGTaskScheduler/background fetch; APNs for push).
  - PWA install hint in web for non‑Android devices as a fallback.
- Features
  - Offline drafts with conflict resolution; sync entries when back online.
  - Attachments: photos, voice notes (with on‑device transcription), PDFs.
  - Secure app lock (biometric or PIN), optional per‑open auth; encrypted local cache.
  - In‑app search for titles/content/tags with highlight; saved searches/filters.
- Notifications
  - Optional FCM push: server triggers background fetch + local notification; better Doze behavior.
  - In‑app “delivery status” banner if a scheduled reminder couldn’t run.
- UI/UX
  - Dynamic color (Material 3), adaptive layout for tablets, richer calendar day details.
  - Accessibility: large text mode, high contrast, screen reader labels, focus order review.
- Quality
  - Crash/error reporting (Sentry) and performance tracing.
  - Integration tests for core flows (connect → entry → history → detail → delete/undo).
  - Feature flags for experimental features (new AI modes).

## Backend & API

- Foundation
  - Migrate to TypeScript; input validation (Zod/Valibot) on all endpoints.
  - Standardized error schema; API versioning (/v1), request IDs/correlation IDs.
  - OpenAPI/Swagger docs; generate typed clients for Flutter/React.
- Data schema
  - Normalize tags/emotions into join tables; add created_at/updated_at indexes.
  - Full‑text search (Postgres tsvector or trigram) with ranking and highlights.
  - Migrations (Prisma/MikroORM/Knex) and seed data.
- AI
  - Prompt library and templates; multi‑model support; configurable per‑user/model fallback.
  - Caching for frequent prompts (e.g., motivate) with TTL to reduce latency.
  - Async job queue for heavy tasks (BullMQ/Cloud Tasks).
- Security
  - Optional multi‑user auth: sessions/JWT, password reset, roles (user/admin).
  - Rate limiting, CSRF protection, security headers (Helmet), strict CORS.
  - Secrets management (12‑factor), env var validation (envalid).

## Frontend (React)

- UX
  - Consistent design system (typography, spacing, colors); responsive polish.
  - Calendar: month header, quick “today/this week”, side panel with entries for day.
  - History: virtualized list, preview pane, multi‑select bulk actions, better filters.
- PWA
  - Install prompts, offline shell for read‑only history, add‑to‑home on Android/iOS.
- Accessibility
  - Keyboard nav everywhere; ARIA labels/roles, focus trap in modals, contrast audit.
- Quality
  - E2E tests (Playwright/Cypress) for entry CRUD, search, settings.

## Data & Search

- Full‑text search
  - Weighted fields (title > content > tags), highlight snippets, typo tolerance.
  - Saved filters, recent searches, “smart filters” (e.g., last week, by mood).
- Analytics
  - Personal insights: writing frequency, streaks, mood trends, word counts, topic clusters.
  - Export: JSON/CSV/PDF per range; scheduled export (email or downloadable).

## Security & Privacy

- Data governance
  - E2EE option for private entries (client‑side encryption; document tradeoffs).
  - Right to export/delete on multi‑user.
- Email & SMTP
  - Provider‑agnostic config; test status; redact secrets in logs by default.
- Auditability
  - Selective audit logs for admin: settings changes, email sends, AI errors.

## Reliability & DevOps

- Build & Release
  - CI/CD pipelines (GitHub/Gitea Actions): lint, test, build Docker images, publish APK, tag releases.
  - Automated semantic versioning + CHANGELOG updates.
- Infra
  - Docker multi‑stage builds and slimmer images; optional Helm chart for K8s.
  - Database backups + restore scripts; retention policy; smoke tests after deploy.
- Observability
  - Structured logs (pino/winston) with centralized collection.
  - Metrics: request latency, error rates, AI call durations, queue sizes (Prometheus).
  - Tracing (OpenTelemetry) across backend and jobs.

## Testing & Quality

- Coverage goals: >80% backend unit/integration, >60% frontend E2E on critical paths.
- Contract tests for APIs; snapshot tests for UI states; smoke tests in staging env.
- Load testing (k6) for spikes (saves, AI calls, search).

## Documentation

- API: OpenAPI spec with examples and curl snippets.
- Architecture: updated diagrams, data flow, deployment topologies (Docker/K8s).
- Mobile: add “Widgets” gotchas per OEM; enrich troubleshooting.
- Operations: backup/restore, upgrade/migration playbooks, runbooks.

## Roadmap Features

- Templates marketplace or community‑contributed prompts (curated).
- Journal sharing (private links or export bundles); multi‑device sync and conflict resolution.
- Tag manager: merge, rename, color tags; auto‑tag learning from behavior.
- “Capture” channels: Android Share intent, iOS Share extension, email‑to‑entry ingestion.
- Multilingual UI + AI prompts; locale‑aware scheduling for reminders.
- Optional monetization: premium templates, analytics pack, encrypted storage upgrade.

## High‑Impact First Steps (Low Effort → High Value)

- Backend TS + validation + OpenAPI (safer, clearer integration).
- Postgres FTS + highlights; saved searches.
- Mobile offline drafts + secure local storage; app lock.
- CI pipeline (lint/test/build) + release tagging.
- Observability starter: structured logs, basic metrics, Sentry for mobile.

