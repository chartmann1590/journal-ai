# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

AI-powered mental health journaling platform with voice-to-text capabilities and local AI insights via Ollama. Privacy-first design - all data stays local.

**Key Technologies:** React 18 (frontend), Node.js/Express (backend), PostgreSQL (database), Ollama (local LLM), Docker/Docker Compose

## Development Commands

### Docker (Primary Method)

```powershell
# Start all services (frontend, backend, database)
docker-compose up --build

# Start services in detached mode
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove all data (WARNING: deletes database)
docker-compose down -v

# View logs
docker-compose logs
docker-compose logs backend
docker-compose logs frontend

# Rebuild specific service
docker-compose up --build backend
```

### Local Development (Without Docker)

**Backend:**
```powershell
cd backend
npm install
npm start        # Production mode
npm run dev      # Development mode with nodemon
```

**Frontend:**
```powershell
cd frontend
npm install
npm start        # Development server (port 3000)
npm run build    # Production build
npm test         # Run tests
```

### Testing Ollama Connection

```powershell
# Check if Ollama is running
curl http://localhost:11434/api/tags

# List installed models
ollama list

# Pull a model
ollama pull llama2
```

## Architecture Overview

### Three-Tier Architecture

**Frontend (React)** → **Backend (Express API)** → **Data Layer (PostgreSQL + Ollama)**

- **Frontend** (port 3000): Single-page React app with Web Speech API for voice input
- **Backend** (port 5000): Express REST API handling CRUD operations and AI integration
- **Database** (port 5432): PostgreSQL stores journal entries with timestamps and AI responses
- **Ollama** (port 11434): Runs on host machine (not containerized), provides local LLM inference

### Key Design Patterns

**Docker Networking:**
- Backend uses `host.docker.internal:11434` to reach Ollama on the host machine
- Configured via `extra_hosts` in docker-compose.yml
- Environment variable `OLLAMA_HOST` allows override

**Database Schema:**
```sql
journal_entries (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  content TEXT NOT NULL,
  ai_response TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

**Frontend State Management:**
- Uses React hooks (useState, useEffect)
- No external state management library
- API calls via axios to backend

**Voice Input Flow:**
1. Web Speech API (webkitSpeechRecognition) captures audio
2. Continuous recognition with interim results
3. Transcript appended to content textarea in real-time
4. User can edit before saving

**AI Analysis Flow:**
1. User saves journal entry to database
2. User clicks "Get AI Insights" button
3. Backend sends entry content to Ollama with compassionate prompt
4. AI response stored in `ai_response` column
5. Frontend displays insights below entry

## API Endpoints

**Journal Entries:**
- `GET /api/entries` - List all entries (DESC by created_at)
- `GET /api/entries/:id` - Get single entry
- `POST /api/entries` - Create entry (requires: content, optional: title)
- `PUT /api/entries/:id` - Update entry (can update ai_response)
- `DELETE /api/entries/:id` - Delete entry

**AI Integration:**
- `POST /api/ai/analyze` - Analyze entry content (requires: content, optional: prompt)
- `POST /api/ai/chat` - Interactive chat (requires: message, optional: context)
- `GET /api/ai/status` - Check Ollama connection and list available models

**Health:**
- `GET /health` - API health check

## Important Configuration

### Environment Variables

**Backend** (backend/.env or docker-compose.yml):
```env
PORT=5000
DATABASE_URL=postgresql://journal_user:journal_pass@db:5432/journal_db
OLLAMA_HOST=host.docker.internal:11434
```

**Frontend** (frontend/.env or docker-compose.yml):
```env
REACT_APP_API_URL=http://localhost:5000
```

### Changing AI Model

Edit `backend/server.js`, lines 167 and 202:
```javascript
model: 'llama2',  // Change to: mistral, neural-chat, openchat, etc.
```

Ensure the model is pulled via `ollama pull <model-name>` first.

### Database Persistence

Data persisted in `./data/postgres/` directory. To backup, copy this directory.

## Development Notes

### Windows-Specific Considerations

- Uses PowerShell commands in examples (this is a Windows environment)
- Line endings are CRLF (Windows style)
- Docker Desktop required for containerization

### Voice Input Browser Support

- Requires Chromium-based browser (Chrome, Edge, Brave)
- Does not work in Firefox or Safari
- Requires microphone permissions
- HTTPS required in production (works on localhost)

### Database Initialization

Backend auto-creates `journal_entries` table on startup via `initDB()` function. No manual migration needed.

### CORS Configuration

Backend allows all origins (development setup). For production, restrict in backend/server.js.

### Privacy & Security

This is designed for **local/personal use only**. For production:
- Add user authentication
- Implement HTTPS/TLS
- Secure environment variables
- Add rate limiting
- Implement input sanitization
- Rotate database credentials

## Common Issues

**Ollama Connection Fails:**
- Verify Ollama is running: `curl http://localhost:11434/api/tags`
- Check Docker can reach host via `host.docker.internal`
- Ensure `extra_hosts` configured in docker-compose.yml

**Port Conflicts:**
- Modify port mappings in docker-compose.yml (change left side of port mapping, e.g., `"3001:3000"`)

**Database Resets:**
```powershell
docker-compose down -v
docker-compose up -d db
```

## Project Structure

```
journal-ai/
├── backend/
│   ├── server.js          # Main Express server, all routes and DB logic
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.js         # Main React component with all UI logic
│   │   ├── index.js       # React entry point
│   │   └── index.css      # All styles
│   ├── public/
│   ├── package.json
│   └── Dockerfile
├── data/
│   └── postgres/          # Database persistence (gitignored)
├── docker-compose.yml     # Orchestrates all services
└── README.md              # Comprehensive user documentation
```

### File Organization

- **Monolithic components**: `server.js` contains all backend logic (no separate route files)
- **Single-file frontend**: `App.js` contains all React components and state
- **No separate API client**: Axios calls inline in components
- **Simple structure**: Intentionally kept flat for ease of understanding

## AI Prompt Guidelines

**Default AI Prompt for Analysis:**
> "You are a compassionate mental health assistant. Analyze this journal entry and provide supportive, empathetic insights. Focus on emotional patterns, positive aspects, and gentle suggestions for well-being."

This can be customized via the `prompt` parameter in `POST /api/ai/analyze`.
