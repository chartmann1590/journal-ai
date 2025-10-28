# System Architecture

This document provides a detailed overview of the Journal AI architecture, design decisions, and system components.

## System Overview

Journal AI is a microservices-based application composed of four main components:

1. **Nginx** - Reverse proxy and SSL termination
2. **Frontend** - React SPA
3. **Backend** - Express.js API server
4. **Database** - PostgreSQL data store

With external dependencies:
- **Ollama** - Local AI server

## Architecture Diagram

```
                    ┌─────────────────┐
                    │   User Browser  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │     Nginx        │
                    │   (Port 443)     │
                    │  SSL/TLS Proxy   │
                    └────────┬────────┘
                             │
                ┌────────────┼────────────┐
                │            │            │
                ▼            ▼            ▼
         ┌─────────┐  ┌──────────┐  ┌──────────┐
         │Frontend │  │ Backend  │  │ Database │
         │  React  │  │ Express  │  │PostgreSQL│
         │Port 3000│  │Port 5000 │  │Port 5432 │
         └─────────┘  └─────┬────┘  └──────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │   Ollama     │
                    │Port 11434    │
                    │  (External)  │
                    └──────────────┘
```

## Component Details

### 1. Nginx (Reverse Proxy)

**Purpose**: SSL termination, load balancing, and request routing

**Configuration**: `nginx/nginx.conf`

**Responsibilities**:
- Handle HTTPS (port 443)
- Route frontend requests to React app
- Route `/api/*` requests to backend
- SSL/TLS encryption
- Gzip compression

**Key Features**:
- Automatic HTTP to HTTPS redirect
- SSL certificate management
- Proxy caching
- Connection timeouts configured for AI requests

### 2. Frontend (React)

**Purpose**: User interface for journaling

**Technology**: React 18 with functional components and hooks

**Key Components**:
- `Home.js` - Journal entry form with voice input
- `History.js` - Entry list with search and filters
- `Settings.js` - Email configuration
- `Navigation.js` - Top navigation menu

**Features**:
- Speech recognition API for voice-to-text
- Calendar widget for date visualization
- Toast notifications for user feedback
- Responsive gradient design
- Real-time AI status indicator

**State Management**:
- Local state with `useState` and `useEffect`
- Props for parent-child communication
- No external state management library

### 3. Backend (Express.js)

**Purpose**: RESTful API server and business logic

**Main Routes**:

#### Journal Entries
- `GET /api/entries` - List all entries
- `POST /api/entries` - Create entry
- `GET /api/entries/:id` - Get single entry
- `PUT /api/entries/:id` - Update entry
- `DELETE /api/entries/:id` - Delete entry

#### AI Integration
- `POST /api/ai/analyze` - Analyze journal entry
- `POST /api/ai/chat` - Interactive AI chat
- `GET /api/ai/status` - Check Ollama connection

#### Settings
- `GET /api/settings` - Get user settings
- `POST /api/settings` - Update settings
- `POST /api/settings/test-email` - Send test email
- `POST /api/settings/send-summary` - Manual weekly summary
- `GET /api/email-logs` - Get email logs

**Services**:
- `emailService.js` - Email sending with Nodemailer
- `encryption.js` - AES-256-CBC password encryption

**Scheduled Tasks**:
- Cron job for weekly emails (Sundays at 6 PM)

### 4. Database (PostgreSQL)

**Purpose**: Persistent data storage

**Schema**:

#### journal_entries
```sql
id              SERIAL PRIMARY KEY
title           VARCHAR(255)
content         TEXT NOT NULL
ai_response     TEXT
mood            VARCHAR(50)
tags            TEXT[]
emotions        TEXT[]
emotion_keywords TEXT[]
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

#### user_settings
```sql
id              SERIAL PRIMARY KEY
smtp_host       VARCHAR(255)
smtp_port       INTEGER
smtp_username    VARCHAR(255)
smtp_password   TEXT (encrypted)
smtp_from_email VARCHAR(255)
recipient_email VARCHAR(255)
email_enabled   BOOLEAN
email_schedule  VARCHAR(50)
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

#### email_logs
```sql
id              SERIAL PRIMARY KEY
email_type      VARCHAR(50)
recipient       VARCHAR(255)
status          VARCHAR(50)
message_id      VARCHAR(255)
entries_count   INTEGER
error_message   TEXT
created_at      TIMESTAMP
```

**Connection**:
- Connection pool managed by `pg` library
- Health checks configured in docker compose
- Persistent storage in `data/postgres`

### 5. Ollama (External)

**Purpose**: Local AI processing

**Model**: llama2

**Endpoints Used**:
- `/api/generate` - Generate AI responses
- `/api/tags` - Check available models

**Configuration**:
- Host: `host.docker.internal:11434` (from Docker)
- Model: llama2
- Timeout: 30 seconds for long responses

**Why Local**:
- Privacy: Data never leaves your machine
- No external API keys required
- Fast response times
- Full control over AI behavior

## Data Flow

### Creating a Journal Entry

```
User → Frontend → Nginx → Backend → Database
                           ↓
                       Ollama (for AI insights)
                           ↓
                       Database (store AI response)
                           ↓
                    Frontend (display entry)
```

### Sending Weekly Email

```
Cron (Sunday 6 PM) → Backend → Database (get entries)
                                      ↓
                           Ollama (generate summary)
                                      ↓
                          emailService (send email)
                                      ↓
                      Database (log email)
```

### Voice Input Processing

```
Microphone → Browser Speech API → Frontend
                                        ↓
                                   Entry saved
                                        ↓
                                      AI analyze
```

## Security Architecture

### Encryption

**SMTP Passwords**:
- Encrypted at rest using AES-256-CBC
- Initialization vector (IV) stored with encrypted data
- Decrypted only when sending emails
- Encryption key in environment variable

**Implementation**: `backend/utils/encryption.js`

### Database Security

**Parameterized Queries**:
- All SQL queries use parameterized statements
- Prevents SQL injection attacks
- Example: `SELECT * FROM entries WHERE id = $1`

**Connection Security**:
- PostgreSQL authentication enabled
- Credentials from environment variables
- Network isolation within Docker

### HTTPS/SSL

**SSL Configuration**:
- Self-signed certificates for development
- Let's Encrypt recommended for production
- TLS 1.2 and 1.3 support
- Certificate chain validation

**Why Required**:
- Microphone access requires HTTPS
- Secure API communication
- Prevents MITM attacks

## API Design Principles

### RESTful Conventions

- Use HTTP methods correctly (GET, POST, PUT, DELETE)
- Resources follow `/api/resource` pattern
- Status codes: 200 (success), 201 (created), 400 (bad request), 404 (not found), 500 (error)
- JSON request/response format

### Error Handling

```javascript
try {
  // Operation
  res.json({ success: true, data });
} catch (err) {
  console.error('Error:', err);
  res.status(500).json({ error: 'Failed to process' });
}
```

### Request Validation

- Required fields checked
- Input sanitization
- Database constraints enforced

## Database Design

### Relationships

- `journal_entries`: Independent entity
- `user_settings`: Singleton (single row)
- `email_logs`: Logging table, no foreign keys

### Indexes

- Primary keys on all tables (automatic)
- No additional indexes (can be added if needed for large datasets)

### Migrations

- Schema creation on startup
- `CREATE TABLE IF NOT EXISTS` for idempotency
- No migration tool (simple schema)

## Email Service Architecture

### SMTP Configuration

- Support for multiple SMTP providers
- TLS/SSL encryption for secure transmission
- Password encryption at rest
- Test email functionality

### Weekly Summary Flow

1. Cron job triggers on Sunday at 6 PM
2. Check if email enabled in settings
3. Query entries from past 7 days
4. Generate AI summary
5. Analyze mood trends
6. Send HTML email
7. Log email status

### Email Template

- Responsive HTML design
- Gradient styling matching frontend
- Statistics display
- AI insights section
- Recent entries preview
- CTA button to open journal

## Scalability Considerations

### Current Design

**Single User**: Designed for personal use

**Limitations**:
- No user authentication
- No multi-tenancy
- Local AI processing limits

### Future Enhancements

**Authentication**:
- Add user registration/login
- JWT-based authentication
- Role-based access control

**Multi-tenancy**:
- Add user_id to all tables
- Row-level security
- User isolation

**Performance**:
- Add database indexes
- Implement caching layer
- Add pagination for large datasets

## Deployment Architecture

### Docker Compose

**Services**:
- `nginx`: Web server and reverse proxy
- `frontend`: React application
- `backend`: Express API server
- `db`: PostgreSQL database

**Network**: Internal Docker network

**Volumes**:
- PostgreSQL data persisted
- Source code mounted for development

**Environment Variables**: Centralized configuration

### Health Checks

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U journal_user -d journal_db"]
  interval: 5s
  timeout: 5s
  retries: 5
```

## Technology Choices

### Why React?

- Component-based architecture
- Large ecosystem
- Hot reload for development
- Easy to learn and maintain

### Why Express?

- Minimal framework
- Middleware support
- Large community
- Easy to extend

### Why PostgreSQL?

- ACID compliance
- Strong data integrity
- JSON support
- Reliable and proven

### Why Ollama?

- Privacy (local processing)
- No API costs
- Open source
- Easy to run locally

### Why Docker?

- Consistent environments
- Easy deployment
- Service isolation
- Development/production parity

## Configuration Management

### Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `OLLAMA_HOST`: Ollama server address
- `ENCRYPTION_KEY`: Key for password encryption
- `APP_URL`: Application base URL

### Configuration Files

- `docker-compose.yml`: Service orchestration
- `nginx/nginx.conf`: Reverse proxy config
- `backend/.dockerignore`: Build exclusions
- `frontend/.dockerignore`: Build exclusions

## Monitoring and Logging

### Logging Strategy

**Backend**:
- Console.log for errors
- Structured error logging
- Email log table for tracking

**Frontend**:
- Browser console errors
- User-facing toasts

**Nginx**:
- Access logs
- Error logs

### Health Endpoints

- `/health`: API health check
- `/api/ai/status`: AI connectivity

## Future Architecture Considerations

### Microservices

Current architecture can be split:
- Auth service
- Entry service
- AI service
- Email service

### Message Queue

For async processing:
- RabbitMQ or Redis
- Email sending queue
- AI processing queue

### Caching Layer

For performance:
- Redis for session management
- Cache AI responses
- Cache frequently accessed data

---

**💙 Remember**: This journal is your safe space. Write freely, reflect honestly, and be kind to yourself.

