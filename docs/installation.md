# Installation Guide

This guide will walk you through setting up Journal AI on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

1. **Docker Desktop**
   - Download from: https://www.docker.com/products/docker-desktop
   - Version: 4.0 or later
   - Docker Desktop must be running before proceeding

2. **Ollama**
   - Download from: https://ollama.ai
   - Version: Latest
   - Ollama must be running and accessible at `localhost:11434`

3. **Git** (optional, for cloning the repository)
   - Download from: https://git-scm.com

### System Requirements

- **OS**: Windows 10/11, macOS, or Linux
- **RAM**: Minimum 4GB (8GB recommended for AI features)
- **Disk Space**: 2GB free space
- **Ports**: 443, 3000, 5000, 5432 must be available

## Step-by-Step Installation

### Step 1: Clone the Repository

If you haven't already:

```bash
git clone https://github.com/your-repo/journal-ai.git
cd journal-ai
```

### Step 2: Install Ollama and Download Model

1. Download and install Ollama from https://ollama.ai
2. Start the Ollama service
3. Pull the llama2 model:

```bash
ollama pull llama2
```

This may take a few minutes depending on your internet connection.

### Step 3: Generate SSL Certificates

SSL certificates are required for HTTPS access (needed for microphone permissions).

#### On macOS/Linux:

```bash
chmod +x nginx/generate-certs.sh
./nginx/generate-certs.sh
```

#### On Windows (PowerShell):

```powershell
cd nginx
bash generate-certs.sh
```

Or manually create certificates using OpenSSL:

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

### Step 4: Configure Environment Variables (Optional)

Create a `.env` file in the project root:

```env
# Database Connection
DATABASE_URL=postgresql://journal_user:journal_pass@db:5432/journal_db?sslmode=disable

# Ollama Configuration
OLLAMA_HOST=host.docker.internal:11434

# Encryption Key (change in production!)
ENCRYPTION_KEY=your-secret-encryption-key-change-in-production

# Application URL
APP_URL=https://localhost
```

### Step 5: Start the Application

Start all services with Docker Compose:

```bash
docker-compose up -d
```

This command will:
- Build Docker images for frontend, backend, and nginx
- Pull the PostgreSQL image
- Create and start all containers
- Initialize the database schema

### Step 6: Access the Application

Open your browser and navigate to:

```
https://localhost
```

**Security Warning**: Your browser will show a warning about the self-signed certificate. This is expected for local development.

To proceed:
1. Click "Advanced" or "Advanced Options"
2. Click "Proceed to localhost (unsafe)" or "Proceed anyway"
3. The application will load

### Step 7: Verify Installation

1. **Check AI Status**: You should see a green "🟢 AI Connected" indicator in the header
2. **Test Journal Creation**: Try creating a new entry
3. **Test Voice Input**: Click the microphone icon (grants microphone permission)
4. **Check History**: Navigate to History to see your entries

## Verification Commands

### Check Running Containers

```bash
docker-compose ps
```

You should see 4 containers running:
- `journal-nginx`
- `journal-frontend`
- `journal-backend`
- `journal-db`

### Check Container Logs

```bash
# All logs
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx
```

### Check Database

```bash
docker exec -it journal-db psql -U journal_user -d journal_db
```

Once in PostgreSQL:

```sql
-- List tables
\dt

-- Check entries
SELECT * FROM journal_entries;

-- Check settings
SELECT * FROM user_settings;

-- Exit
\q
```

### Check API Health

```bash
# Using curl
curl https://localhost/health

# Using browser
# Visit https://localhost/health
```

### Check AI Status

```bash
curl https://localhost/api/ai/status
```

## Optional: Email Configuration

If you want to enable weekly email summaries:

1. Navigate to Settings page
2. Enable "Weekly email summaries"
3. Configure SMTP settings (see [SMTP Configuration Examples](#smtp-configuration-examples))
4. Click "Save Settings"
5. Click "Send Test Email" to verify

### SMTP Configuration Examples

#### Gmail

```
Host: smtp.gmail.com
Port: 587
Username: your-email@gmail.com
Password: [App Password - see below]
From Email: your-email@gmail.com
```

**Getting Gmail App Password:**
1. Go to https://myaccount.google.com/apppasswords
2. Create an app password for "Mail"
3. Use that password (not your regular Gmail password)

#### SendGrid

```
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: [Your SendGrid API Key]
From Email: verified-sender@yourdomain.com
```

#### Outlook/Hotmail

```
Host: smtp.office365.com
Port: 587
Username: your-email@outlook.com
Password: [Your Outlook password]
From Email: your-email@outlook.com
```

## Troubleshooting

### Containers Won't Start

**Issue**: Docker containers fail to start

**Solutions**:
- Ensure Docker Desktop is running
- Check if ports 443, 3000, 5000, 5432 are available
- Review logs: `docker-compose logs`
- Try rebuilding: `docker-compose up -d --build`

### SSL Certificate Errors

**Issue**: Certificate generation fails

**Solutions**:
- Ensure `nginx/ssl/` directory exists
- Check file permissions (should be readable)
- Manually create certificates using OpenSSL
- On Windows, ensure bash is available

### Ollama Connection Failed

**Issue**: AI status shows "Offline"

**Solutions**:
- Verify Ollama is running: `ollama list`
- Check if llama2 is installed: `ollama list`
- Install model: `ollama pull llama2`
- Verify Ollama host in `.env` file
- Check backend logs: `docker-compose logs backend`

### Microphone Not Working

**Issue**: Voice input doesn't work

**Solutions**:
- Ensure you're using HTTPS (https://localhost, not http://)
- Grant microphone permissions when prompted
- Check browser console for errors (F12)
- Verify browser supports speech recognition API

### Email Not Sending

**Issue**: Test email fails

**Solutions**:
- Verify SMTP credentials
- Check email logs: View logs in Settings page
- Try different SMTP provider
- Check backend logs: `docker-compose logs backend`
- Verify network firewall allows SMTP ports

### Database Connection Issues

**Issue**: Database errors in logs

**Solutions**:
- Wait for database to be healthy: `docker-compose ps`
- Check database logs: `docker-compose logs db`
- Reset database: `docker-compose down -v` (WARNING: Deletes all data)
- Verify DATABASE_URL in environment

## Development Mode

To develop with auto-reload:

```bash
# Terminal 1: Start backend with nodemon
cd backend
npm install
npm run dev

# Terminal 2: Start frontend with hot reload
cd frontend
npm install
npm start

# Terminal 3: Start database and nginx
docker-compose up db nginx
```

## Next Steps

- Read the [User Guide](user-guide.md) to learn how to use the application
- Review the [Architecture Documentation](architecture.md)
- Check out [API Reference](api-reference.md)
- Learn about [Development Guidelines](development.md)

---

**💙 Remember**: This journal is your safe space. Write freely, reflect honestly, and be kind to yourself.

