# Mental Health Journal

A beautiful, modern AI-powered mental health journaling platform with React frontend, Express backend, PostgreSQL database, and Ollama AI integration.

## Features

### Core Features
- **Beautiful, Modern UI** - Gradient design, readable calendar, responsive layout
- **Voice-to-Text Journaling** - HTTPS mic input with realtime preview, clean finalized text
- **AI-Powered Insights** - Concise analysis (<120 words) with emotions, pattern, suggestion
- **Auto Tags & Emotions** - On save, AI generates 3 tags and highlights emotions
- **Calendar View** - Clear month/week grid, week numbers, quick month/year jump
- **Search & Filter** - Find entries quickly; filter by text, tags, and emotions
- **Export Functionality** - Export your journal entries as JSON

### Email Features
- **Weekly Email Summaries** - Automatic weekly summaries every Sunday at 6 PM
- **SMTP Configuration** - Easy setup for any SMTP provider (Gmail, SendGrid, etc.)
- **Test Email** - Verify your email configuration with a test email
- **Email Logs** - Track all sent emails and their status

### Security
- **SSL/HTTPS Support** - Self-signed certificates for local development
- **Encrypted Passwords** - SMTP passwords are encrypted at rest
- **Secure Database** - All data stored securely in PostgreSQL

## Tech Stack

- **Frontend**: React 18, React Router, React Toastify
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL
- **AI**: Ollama (llama2 model)
- **Web Server**: Nginx with SSL
- **Deployment**: Docker & Docker Compose

## Prerequisites

- Docker Desktop installed and running
- Ollama installed and running locally
- Ports 443, 3000, 5000, and 5432 available

## Quick Start

### 1. Generate SSL Certificates

First, generate the self-signed SSL certificates for HTTPS:

```bash
# On Mac/Linux
chmod +x nginx/generate-certs.sh
./nginx/generate-certs.sh

# On Windows (PowerShell)
cd nginx
bash generate-certs.sh
```

**Note**: The browser will show a security warning for the self-signed certificate. This is expected and safe for local development. Click "Advanced" and "Proceed to localhost" to continue.

### 2. Start the Application

```bash
docker compose up -d
```

This will start:
- **Nginx** on port 443 (HTTPS)
- **Frontend** on port 3000 (HTTP)
- **Backend** on port 5000 (HTTP)
- **Database** on port 5432

### 3. Access the Application

Open your browser and go to:
```
https://localhost
```

Accept the security warning for the self-signed certificate to continue.

### 4. Configure Email Settings (Optional)

1. Navigate to the Settings page using the navigation menu
2. Enable "Weekly email summaries"
3. Enter your SMTP configuration:
   - **Host**: `smtp.gmail.com` (for Gmail)
   - **Port**: `587`
   - **Username**: Your email address
   - **Password**: Your app password (for Gmail, use an App Password)
   - **From Email**: Your email address
   - **Recipient Email**: Email address to receive summaries
4. Click "Save Settings"
5. Click "Send Test Email" to verify your configuration

## SMTP Configuration Examples

### Gmail
- Host: `smtp.gmail.com`
- Port: `587`
- Username: Your Gmail address
- Password: Use an [App Password](https://myaccount.google.com/apppasswords) (not your regular password)
- From Email: Your Gmail address

### SendGrid
- Host: `smtp.sendgrid.net`
- Port: `587`
- Username: `apikey`
- Password: Your SendGrid API key
- From Email: Your verified sender email

### Outlook/Hotmail
- Host: `smtp.office365.com`
- Port: `587`
- Username: Your Outlook email
- Password: Your Outlook password
- From Email: Your Outlook email

## Usage

### Creating Journal Entries

1. Use the "New Entry" page to write your thoughts
2. Click the microphone icon to use voice-to-text
3. Add a title (optional) and write your content
4. Click "Save Entry"

### Viewing History

1. Navigate to "History" from the top menu
2. Use the search box to find specific entries
3. Filter and sort entries as needed
4. Use tag and emotion filters (comma‑separated)
5. Click an entry to open the detail page
6. Click "Export JSON" to download all entries

### Entry Detail

- Full content, tags, emotions, and AI insight
- Edit title/content, Save or Save + Reanalyze All
- Reanalyze buttons for AI insight or tags/emotions only

### Calendar View

- Readable calendar with week numbers and clear highlights
- Click dates to filter entries; has‑entry days show a blue dot
- Month/year dropdowns on Calendar page for quick navigation

### AI Features

- Concise analysis (<120 words) with key emotions and a suggestion
- Auto tags/emotions on save; reanalyze from Entry Detail anytime

## Weekly Email Summaries

### What You Get

Every Sunday at 6 PM (if enabled), you'll receive an email with:
- Total number of entries for the week
- Mood trend analysis
- AI-generated summary of the week's themes and patterns
- Encouraging, personalized messages
- Recent entries preview

### Schedule

- **Frequency**: Weekly
- **Day**: Sunday
- **Time**: 6:00 PM
- **Trigger**: Automatically sends if you've created entries during the week

### Manual Send

You can manually trigger a weekly summary from the Settings page using the "Send Weekly Summary Now" button.

## Development

### Project Structure

```
journal-ai/
├── backend/
│   ├── server.js          # Express API server
│   ├── services/
│   │   └── emailService.js # Email sending service
│   └── utils/
│       └── encryption.js   # Password encryption
├── frontend/
│   └── src/
│       ├── App.js         # Main app with routing
│       ├── components/
│       │   ├── Home.js    # Home page with entry form
│       │   ├── History.js # History page
│       │   ├── Settings.js # Settings page
│       │   └── Navigation.js # Navigation menu
│       └── index.css      # Styles
├── nginx/
│   ├── nginx.conf         # Nginx configuration
│   ├── Dockerfile         # Nginx container
│   └── generate-certs.sh  # SSL certificate generation
└── docker-compose.yml     # Docker orchestration
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL=postgresql://journal_user:journal_pass@db:5432/journal_db

# Ollama
OLLAMA_HOST=host.docker.internal:11434

# Encryption
ENCRYPTION_KEY=your-secret-encryption-key-change-in-production

# Application
APP_URL=https://localhost
```

### Rebuilding Containers

```bash
# Rebuild and restart all containers
docker compose up -d --build

# Rebuild specific service
docker compose up -d --build frontend
docker compose up -d --build backend
```

### Viewing Logs

```bash
# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f nginx
```

### Database Access

```bash
# Connect to PostgreSQL
docker exec -it journal-db psql -U journal_user -d journal_db

# Run queries
SELECT * FROM journal_entries;
SELECT * FROM user_settings;
SELECT * FROM email_logs;
```

## Troubleshooting

### Microphone Not Working

- Ensure HTTPS (https://localhost) and grant microphone permissions
- On iOS Safari/Chrome, use the keyboard mic (Web Speech not supported)
- Realtime preview shows interim; textarea commits finalized phrases only
- Check browser console for errors

### Email Not Sending

1. Check SMTP configuration in Settings
2. Click "Send Test Email" to verify connection
3. Check email logs in backend logs
4. Verify SMTP provider settings
5. Check spam/junk folder

### AI Not Connected

1. Ensure Ollama is running locally
2. Check Ollama host configuration
3. Verify llama2 model is installed: `ollama pull llama2`
4. Check backend logs for connection errors

### SSL Certificate Warnings

- This is expected for self-signed certificates
- Click "Advanced" → "Proceed to localhost"
- Browsers trust only CA-signed certificates
- For production, use Let's Encrypt

## API Endpoints

### Entries
- `GET /api/entries` - Get all entries
- `POST /api/entries` - Create new entry
- `GET /api/entries/:id` - Get single entry
- `PUT /api/entries/:id` - Update entry
- `DELETE /api/entries/:id` - Delete entry

Metadata & Analysis:
- `POST /api/entries/:id/metadata` - Recompute tags/emotions/keywords
- `POST /api/entries/:id/analyze` - Recompute concise AI insight

### AI
- `POST /api/ai/analyze` - Analyze entry with AI (concise by default)
- `GET /api/ai/status` - Check AI connection status
- `POST /api/ai/chat` - Chat with AI

### Settings
- `GET /api/settings` - Get settings
- `POST /api/settings` - Update settings
- `POST /api/settings/test-email` - Send test email
- `POST /api/settings/send-summary` - Manually trigger weekly summary
- `GET /api/email-logs` - Get email logs

## Security Notes

- Self-signed certificates are for development only
- Use Let's Encrypt for production
- SMTP passwords are encrypted using AES-256-CBC
- Database uses parameterized queries to prevent SQL injection
- All API requests use HTTPS in production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for your personal journal.

## Support

For issues or questions:
- Check the troubleshooting section
- Review backend logs: `docker compose logs backend`
- Review frontend logs: `docker compose logs frontend`

---

**💙 Remember**: This journal is your safe space. Write freely, reflect honestly, and be kind to yourself.
