# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered mental health journaling platform with voice-to-text capabilities, Ollama AI integration, and automated email summaries. Privacy-first design - all data stays local.

**Stack:** React 18 (frontend), Express.js (backend), PostgreSQL (database), Ollama (local LLM), Nginx (HTTPS), Docker Compose

## Development Commands

### Starting the Application

```bash
# Generate SSL certificates (first time only)
cd nginx && bash generate-certs.sh

# Start all services (frontend, backend, database, nginx)
docker-compose up -d

# Rebuild and start after code changes
docker-compose up -d --build

# Rebuild specific service
docker-compose up -d --build backend
docker-compose up -d --build frontend
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx
```

### Database Operations

```bash
# Connect to PostgreSQL
docker exec -it journal-db psql -U journal_user -d journal_db

# Common queries
SELECT * FROM journal_entries ORDER BY created_at DESC;
SELECT * FROM user_settings;
SELECT * FROM email_logs;
```

### Local Development (without Docker)

**Backend:**
```bash
cd backend
npm install
npm start        # Production
npm run dev      # Development with nodemon
```

**Frontend:**
```bash
cd frontend
npm install
npm start        # Development server (port 3000)
npm run build    # Production build
```

### Testing Ollama

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Pull llama2 model
ollama pull llama2
```

## Architecture

### System Design

**Three-tier architecture:** React Frontend → Express API → PostgreSQL + Ollama

- **Nginx** (port 443): HTTPS termination with self-signed SSL certificates
- **Frontend** (port 3000): React SPA with Web Speech API for voice input
- **Backend** (port 5000): Express REST API handling CRUD, AI, and email scheduling
- **Database** (port 5432): PostgreSQL with three tables (journal_entries, user_settings, email_logs)
- **Ollama** (port 11434): Runs on host machine (not containerized), accessed via host.docker.internal

### Key Design Patterns

**Monolithic Structure:**
- Backend: Single `server.js` file contains all routes and business logic
- Frontend: `App.js` contains routing, with separate components in `components/` folder
- No separate route files, controllers, or complex service layers

**Docker Networking:**
- Backend accesses Ollama via `host.docker.internal:11434` (configured in `extra_hosts`)
- Frontend makes API calls to `https://localhost` (proxied through Nginx)
- Services communicate using container names (e.g., `db`, `backend`)

**Email System:**
- Cron job scheduled for Sundays at 6 PM (configurable in backend/server.js)
- SMTP passwords encrypted using AES-256-CBC (see backend/utils/encryption.js)
- Email service separated into backend/services/emailService.js
- Email logs stored in database for tracking

**Voice Input Flow:**
- Uses `webkitSpeechRecognition` API (Chromium browsers only)
- Continuous recognition with interim results
- Transcript appended to content in real-time
- Requires HTTPS (works on localhost or with SSL)

**AI Analysis Flow:**
- User saves entry → clicks "Get AI Insights" → backend sends to Ollama
- AI response cached in `ai_response` column
- Compassionate mental health prompt built-in
- Frontend shows AI status indicator based on `/api/ai/status` endpoint

### Database Schema

**journal_entries:**
- id (SERIAL PRIMARY KEY)
- title (VARCHAR(255))
- content (TEXT NOT NULL)
- ai_response (TEXT)
- mood (VARCHAR(50))
- created_at, updated_at (TIMESTAMP)

**user_settings:**
- id (SERIAL PRIMARY KEY)
- smtp_host, smtp_port, smtp_username, smtp_password (encrypted)
- smtp_from_email, recipient_email
- email_enabled (BOOLEAN)
- email_schedule (VARCHAR(50), default: 'sunday_6pm')
- created_at, updated_at (TIMESTAMP)

**email_logs:**
- id (SERIAL PRIMARY KEY)
- email_type (VARCHAR(50))
- recipient (VARCHAR(255))
- status (VARCHAR(50))
- error_message (TEXT)
- sent_at (TIMESTAMP)

## API Endpoints

### Journal Entries
- `GET /api/entries` - All entries (DESC by created_at)
- `GET /api/entries/:id` - Single entry
- `POST /api/entries` - Create (requires: content, optional: title, mood)
- `PUT /api/entries/:id` - Update entry
- `DELETE /api/entries/:id` - Delete entry

### AI Integration
- `POST /api/ai/analyze` - Analyze entry (requires: content, optional: prompt)
- `POST /api/ai/chat` - Interactive chat (requires: message, optional: context)
- `GET /api/ai/status` - Check Ollama connection and list models

### Settings & Email
- `GET /api/settings` - Get SMTP settings (password decrypted)
- `POST /api/settings` - Update settings (password encrypted)
- `POST /api/settings/test-email` - Send test email
- `POST /api/settings/send-summary` - Manually trigger weekly summary
- `GET /api/email-logs` - Get email log history

### Health
- `GET /health` - API health check

## Important Implementation Details

### SMTP Password Encryption

Passwords are encrypted using AES-256-CBC before storage:
```javascript
// backend/utils/encryption.js
const { encrypt, decrypt } = require('./utils/encryption');
encrypted = encrypt(password, process.env.ENCRYPTION_KEY);
decrypted = decrypt(encrypted, process.env.ENCRYPTION_KEY);
```

Set `ENCRYPTION_KEY` environment variable in docker-compose.yml or .env file.

### Email Scheduling

Weekly summary cron job defined in backend/server.js:
```javascript
cron.schedule('0 18 * * 0', async () => { /* Send weekly summary */ });
```

Schedule: Every Sunday at 6:00 PM. Modify cron expression to change timing.

### Ollama Model Configuration

Default model is `llama2`. To change (backend/server.js):
```javascript
model: 'llama2',  // Change to: mistral, neural-chat, codellama, etc.
```

Ensure model is pulled: `ollama pull <model-name>`

### SSL Certificates

Self-signed certificates generated via nginx/generate-certs.sh:
- Valid for 365 days
- Stored in nginx/ssl/
- Browser will show security warning (expected for self-signed)
- For production, use Let's Encrypt

### React Router Structure

Routes defined in frontend/src/App.js:
- `/` - Home (new entry form with calendar widget)
- `/history` - History (all entries with search/filter)
- `/settings` - Settings (SMTP config and email logs)

Navigation component: frontend/src/components/Navigation.js

### Database Initialization

Tables auto-created on backend startup via `initDB()` function in server.js. No manual migrations needed. Schema changes require updating the `CREATE TABLE IF NOT EXISTS` statements.

### CORS Configuration

Backend allows all origins (development setup). For production, restrict in backend/server.js:
```javascript
app.use(cors()); // Change to: app.use(cors({ origin: 'https://yourdomain.com' }));
```

## Common Development Scenarios

### Adding a New API Endpoint

1. Add route handler in backend/server.js (around line 80-300)
2. Use parameterized queries: `pool.query('SELECT * FROM table WHERE id = $1', [id])`
3. Add error handling with try-catch
4. Return appropriate HTTP status codes

### Adding a New Frontend Component

1. Create component in frontend/src/components/
2. Import in App.js
3. Add route if needed: `<Route path="/new" element={<NewComponent />} />`
4. Update Navigation.js if adding to menu

### Changing Email Schedule

Edit cron expression in backend/server.js:
- `'0 18 * * 0'` = Sunday 6 PM
- `'0 9 * * 1'` = Monday 9 AM
- `'0 20 * * 5'` = Friday 8 PM

Format: `minute hour day-of-month month day-of-week`

### Adding New Database Fields

1. Update CREATE TABLE statement in backend/server.js `initDB()` function
2. Add migration logic if needed (manual ALTER TABLE)
3. Update API endpoints to handle new field
4. Update frontend forms/displays

### Debugging Ollama Connection Issues

1. Verify Ollama running: `curl http://localhost:11434/api/tags`
2. Check `extra_hosts` in docker-compose.yml includes `host.docker.internal:host-gateway`
3. Check OLLAMA_HOST environment variable in backend service
4. View backend logs: `docker-compose logs -f backend`
5. Test status endpoint: `curl https://localhost/api/ai/status`

## Environment Variables

**Backend (.env or docker-compose.yml):**
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 5000)
- `OLLAMA_HOST` - Ollama server host (default: host.docker.internal:11434)
- `ENCRYPTION_KEY` - AES encryption key for SMTP passwords
- `APP_URL` - Application URL for email links (default: https://localhost)

**Frontend (.env or docker-compose.yml):**
- `REACT_APP_API_URL` - Backend API URL (default: https://localhost)

## Security Notes

- This is designed for **local/personal use only**
- Self-signed SSL certificates are for development
- SMTP passwords encrypted at rest using AES-256-CBC
- All database queries use parameterized statements
- No user authentication system (single-user application)
- For multi-user production deployment, add authentication, rate limiting, and input validation

## Windows Development Environment

This project is developed on Windows 10:
- Use PowerShell or Git Bash for running scripts
- Docker Desktop required
- Line endings are CRLF (Windows style)
- nginx/generate-certs.sh requires bash (use Git Bash or WSL)

## Browser Compatibility

Voice input (Web Speech API) requires:
- Chrome, Edge, or Brave (Chromium-based browsers)
- Does NOT work in Firefox or Safari
- Requires microphone permissions
- HTTPS required (localhost works without SSL)
