# Project Overview

## What is Journal AI?

Journal AI is an AI-powered mental health journaling platform designed to help users reflect on their thoughts, track their emotions, and receive personalized insights using artificial intelligence. It combines modern web technologies with Ollama AI integration to provide a compassionate, supportive journaling experience.

## Key Features

### Core Functionality

- **Voice-to-Text Journaling**: Use your microphone to speak your thoughts naturally (requires HTTPS)
- **AI-Powered Insights**: Get personalized analysis and supportive feedback on your journal entries
- **Auto Tags & Emotions**: AI generates 3 tags and detects emotions on save
- **Beautiful Modern UI**: Gradient design with smooth animations and responsive layout
- **Calendar View**: Visualize your journaling patterns and see which days you wrote entries
- **Search & Filter**: Find entries quickly with powerful search functionality
- **Export Functionality**: Export your journal entries as JSON for backup

### Email Features

- **Weekly Email Summaries**: Automatic weekly summaries every Sunday at 6 PM
- **SMTP Configuration**: Support for any SMTP provider (Gmail, SendGrid, Outlook, etc.)
- **Test Email**: Verify your email configuration with a test email
- **Email Logs**: Track all sent emails and their status
- **AI-Powered Summaries**: Weekly summaries include AI-generated insights and mood trend analysis

### Security Features

- **SSL/HTTPS Support**: Self-signed certificates for local development
- **Encrypted Passwords**: SMTP passwords are encrypted at rest using AES-256-CBC
- **Secure Database**: PostgreSQL with parameterized queries to prevent SQL injection
- **Environment Variables**: Secure configuration management

## Technology Stack

### Frontend
- **React 18**: Modern React with functional components and hooks
- **React Router 7**: Client-side routing
- **React Toastify**: User notifications
- **Axios**: HTTP client for API calls
- **Date-fns**: Date manipulation and formatting
- **React Calendar**: Calendar widget for date selection

### Backend
- **Express.js**: RESTful API server
- **Node.js**: Runtime environment
- **PostgreSQL**: Relational database
- **Axios**: HTTP client for Ollama communication
- **Nodemailer**: Email sending service
- **Node-cron**: Scheduled tasks (weekly emails)
- **Crypto**: Password encryption

### AI Integration
- **Ollama**: Local AI server
- **llama2 Model**: Language model for insights and analysis

### Infrastructure
- **Docker & Docker Compose**: Containerization and orchestration
- **Nginx**: Reverse proxy and SSL termination
- **PostgreSQL**: Database storage

## Use Cases

### Personal Journaling
Track daily thoughts, emotions, and experiences with the support of AI-powered insights.

### Mental Health Monitoring
Identify patterns in mood and emotional state through AI analysis and trend tracking.

### Habit Building
Maintain consistent journaling habits with weekly email reminders and summaries.

### Reflection & Growth
Receive supportive AI feedback to facilitate personal growth and self-awareness.

### Data Export
Export your journal entries for backup, analysis, or migration to other platforms.

## Architecture Overview

```
┌─────────────────┐
│     Nginx       │  Port 443 (HTTPS)
│  (SSL/TLS)     │
└────────┬────────┘
         │
    ┌────┴─────┐
    │          │
    ▼          ▼
┌────────┐  ┌────────┐
│Frontend│  │ Backend│
│React   │  │Express │
│Port 3000│  │Port 5000│
└────────┘  └────┬───┘
                │
                ▼
           ┌──────────┐
           │PostgreSQL│
           │Port 5432 │
           └──────────┘
                │
                ▼
           ┌──────────┐
           │  Ollama  │
           │Port 11434│
           └──────────┘
```

## Database Structure

- **journal_entries**: Stores journal entries with content, AI responses, and timestamps
- **user_settings**: Stores SMTP configuration and email preferences
- **email_logs**: Tracks email delivery status and history

## Security Considerations

- All passwords are encrypted before storage
- Database uses parameterized queries to prevent SQL injection
- HTTPS required for microphone access in browsers
- Self-signed certificates for development; Let's Encrypt recommended for production
- Environment variables for sensitive configuration

## Development Philosophy

- **User Privacy**: All data stored locally; AI runs locally via Ollama
- **Compassionate Design**: UI and AI interactions focus on supportive, encouraging messages
- **Accessibility**: Responsive design that works on all devices
- **Simplicity**: Clean interface that encourages regular journaling

## Who Can Use This?

This project is suitable for:
- Individuals seeking a personal journaling tool
- Developers interested in AI integration
- Students learning full-stack development
- Mental health practitioners exploring digital tools
- Anyone building a journaling application

## What Makes This Different?

1. **Local AI Processing**: No data sent to external AI services
2. **Complete Self-Hosting**: Everything runs on your local machine
3. **Privacy-First**: Your journal entries never leave your infrastructure
4. **Free & Open Source**: No subscriptions or hidden costs
5. **AI-Powered Insights**: Get supportive feedback on your entries
6. **Email Summaries**: Weekly automated summaries with trend analysis

## Next Steps

- Read the [Installation Guide](installation.md) to get started
- Check out the [User Guide](user-guide.md) to learn how to use the app
- Review [Architecture](architecture.md) for technical details
- See [Contributing Guide](contributing.md) to contribute to the project

---

**💙 Remember**: This journal is your safe space. Write freely, reflect honestly, and be kind to yourself.

