# 🌟 Mental Health Journal Platform

An AI-powered online journaling platform designed for mental health and personal reflection. Features voice-to-text capabilities and AI insights powered by local Ollama models.

## Features

- ✍️ **Rich Text Journaling** - Write your thoughts and feelings in a clean, intuitive interface
- 🎤 **Voice Input** - Speak your journal entries using voice-to-text (Web Speech API)
- 🤖 **AI Insights** - Get compassionate, supportive insights from local AI models via Ollama
- 💾 **Persistent Storage** - All entries stored securely in PostgreSQL database
- 🐳 **Dockerized** - Easy deployment with Docker and Docker Compose
- 🔒 **Privacy First** - All data stays local, AI runs on your machine via Ollama

## Architecture

```
┌─────────────────┐
│   Frontend      │ (React, Port 3000)
│   - Journal UI  │
│   - Voice Input │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Backend       │ (Node.js/Express, Port 5000)
│   - REST API    │
│   - DB Handler  │
└────────┬────────┘
         │
         ├──────────────────┐
         ▼                  ▼
┌─────────────────┐  ┌─────────────────┐
│   PostgreSQL    │  │   Ollama        │
│   (Docker)      │  │   (Host)        │
│   Port 5432     │  │   Port 11434    │
└─────────────────┘  └─────────────────┘
```

## Prerequisites

- **Docker Desktop** - Already installed on your system
- **Ollama** - Already installed and running on host machine
- **Git** - For version control
- **Node.js** (optional) - Only needed if running outside Docker

## Quick Start

### 1. Verify Ollama is Running

First, make sure Ollama is running on your host machine:

```powershell
# Check if Ollama is running
curl http://localhost:11434/api/tags
```

If you need to pull a model (e.g., llama2):

```powershell
ollama pull llama2
```

### 2. Start the Application

Navigate to the project directory and start all services:

```powershell
cd H:\journal-ai
docker-compose up --build
```

This will:
- Build the frontend and backend Docker images
- Start PostgreSQL database
- Start the backend API server (port 5000)
- Start the frontend web server (port 3000)

### 3. Access the Application

Open your browser and navigate to:

```
http://localhost:3000
```

The backend API will be available at:

```
http://localhost:5000
```

## Usage

### Writing a Journal Entry

1. **Type** your thoughts in the text area
2. **Or** click the 🎤 Voice Input button to speak your entry
3. Add an optional title
4. Click **Save Entry**

### Getting AI Insights

1. After saving an entry, click **Get AI Insights** button
2. The AI will analyze your entry and provide supportive feedback
3. Insights appear below each entry in a blue card

### Voice Recording

- Click the green **Voice Input** button to start recording
- Speak clearly into your microphone
- Click **Stop Recording** when finished
- The transcribed text will appear in the text area
- You can edit the transcribed text before saving

## Configuration

### Environment Variables

Backend configuration can be modified in `docker-compose.yml` or create a `.env` file:

```env
PORT=5000
DATABASE_URL=postgresql://journal_user:journal_pass@db:5432/journal_db
OLLAMA_HOST=host.docker.internal:11434
```

### Changing the AI Model

Edit `backend/server.js` and modify the model name in the Ollama API calls:

```javascript
const response = await axios.post(OLLAMA_URL, {
  model: 'llama2',  // Change to your preferred model
  prompt: fullPrompt,
  stream: false,
});
```

Available models depend on what you have pulled in Ollama. Common options:
- `llama2` - General purpose model
- `mistral` - Fast and capable
- `neural-chat` - Optimized for conversations
- `openchat` - Good for empathetic responses

## API Endpoints

### Journal Entries

- `GET /api/entries` - Get all journal entries
- `GET /api/entries/:id` - Get specific entry
- `POST /api/entries` - Create new entry
- `PUT /api/entries/:id` - Update entry
- `DELETE /api/entries/:id` - Delete entry

### AI Integration

- `POST /api/ai/analyze` - Analyze journal entry
- `POST /api/ai/chat` - Interactive AI conversation
- `GET /api/ai/status` - Check Ollama connection status

### Health Check

- `GET /health` - Check API status

## Development

### Running Locally (Without Docker)

#### Backend

```powershell
cd backend
npm install
npm start
```

#### Frontend

```powershell
cd frontend
npm install
npm start
```

### Stopping the Application

```powershell
docker-compose down
```

To remove volumes (deletes all data):

```powershell
docker-compose down -v
```

## Troubleshooting

### Ollama Connection Issues

If the AI status shows "Disconnected":

1. Verify Ollama is running: `curl http://localhost:11434/api/tags`
2. Check if you have models installed: `ollama list`
3. Ensure Docker can reach host: The `extra_hosts` configuration should allow `host.docker.internal`

### Voice Input Not Working

- Voice input requires a Chromium-based browser (Chrome, Edge, Brave)
- Ensure microphone permissions are granted
- HTTPS is required for production (works on localhost)

### Database Issues

Reset the database:

```powershell
docker-compose down -v
docker-compose up -d db
```

### Port Conflicts

If ports 3000, 5000, or 5432 are already in use, modify the port mappings in `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"  # Change host port (left side)
```

## Data Storage

- **Journal Entries**: Stored in PostgreSQL database
- **Database Files**: Persisted in `./data/postgres` directory
- **Backups**: You can backup the `./data` directory

## Security Considerations

- This is designed for local/personal use
- For production deployment, add:
  - User authentication
  - HTTPS/TLS encryption
  - Environment variable management
  - Database password rotation
  - Rate limiting
  - Input sanitization

## Future Enhancements

- [ ] User authentication and multi-user support
- [ ] Export entries to PDF/Markdown
- [ ] Mood tracking and analytics
- [ ] Calendar view of entries
- [ ] Tags and categories
- [ ] Search functionality
- [ ] Theme customization
- [ ] Mobile app version

## Tech Stack

- **Frontend**: React 18, Web Speech API, Axios
- **Backend**: Node.js, Express, PostgreSQL
- **AI**: Ollama (local LLM)
- **Database**: PostgreSQL 15
- **Deployment**: Docker, Docker Compose

## License

This project is open source and available for personal use.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Docker logs: `docker-compose logs`
3. Verify Ollama is running and models are available

---

**Remember**: This journal is your safe space. Write freely, reflect honestly, and be kind to yourself. 💙
