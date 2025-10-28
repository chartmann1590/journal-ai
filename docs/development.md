# Development Guide

Guide for developers contributing to or extending Journal AI.

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Docker Desktop
- Ollama (for AI features)
- Git
- Your favorite code editor

### Initial Setup

1. **Clone the repository**

```bash
git clone https://github.com/your-repo/journal-ai.git
cd journal-ai
```

2. **Install dependencies**

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. **Start services**

```bash
# Terminal 1: Backend (with hot reload)
cd backend
npm run dev

# Terminal 2: Frontend (with hot reload)
cd frontend
npm start

# Terminal 3: Database and Nginx
docker compose up db nginx
```

### Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://journal_user:journal_pass@localhost:5432/journal_db
OLLAMA_HOST=localhost:11434
ENCRYPTION_KEY=dev-secret-key
APP_URL=http://localhost:3000
```

**Note**: For production, use secure keys and proper URLs.

---

## Project Structure

```
journal-ai/
├── backend/
│   ├── server.js              # Express API server
│   ├── services/
│   │   └── emailService.js     # Email sending service
│   ├── utils/
│   │   └── encryption.js       # Password encryption
│   ├── Dockerfile
│   ├── package.json
│   └── .dockerignore
├── frontend/
│   ├── src/
│   │   ├── App.js              # Main app component
│   │   ├── components/
│   │   │   ├── Home.js          # Entry form
│   │   │   ├── History.js       # Entry list
│   │   │   ├── Settings.js      # Settings page
│   │   │   └── Navigation.js    # Nav menu
│   │   ├── index.js             # React entry point
│   │   └── index.css            # Styles
│   ├── public/
│   │   └── index.html
│   ├── Dockerfile
│   ├── package.json
│   └── .dockerignore
├── nginx/
│   ├── nginx.conf               # Nginx configuration
│   ├── Dockerfile
│   └── generate-certs.sh        # SSL certificate generation
├── docs/                        # Documentation
├── docker-compose.yml           # Docker orchestration
└── README.md
```

---

## Backend Development

### Code Structure

**Main Server** (`server.js`):
- Express app setup
- Database initialization
- Route definitions
- Error handling
- Cron jobs

**Services** (`services/emailService.js`):
- Email sending logic
- AI summary generation
- Mood trend analysis
- Email template generation

**Utils** (`utils/encryption.js`):
- AES-256-CBC encryption
- Password encryption/decryption

### Adding New Endpoints

1. **Define the route** in `server.js`:

```javascript
app.get('/api/my-endpoint', async (req, res) => {
  try {
    // Your logic here
    res.json({ success: true });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Failed' });
  }
});
```

2. **Add validation**:

```javascript
const { param1, param2 } = req.body;

if (!param1) {
  return res.status(400).json({ error: 'param1 is required' });
}
```

3. **Handle errors properly**:

```javascript
try {
  // Operation
} catch (err) {
  console.error('Error context:', err.message);
  res.status(500).json({ error: 'User-friendly message' });
}
```

### Database Queries

Always use parameterized queries:

```javascript
// ✅ Good
await pool.query(
  'SELECT * FROM entries WHERE id = $1',
  [entryId]
);

// ❌ Bad (SQL injection risk)
await pool.query(
  `SELECT * FROM entries WHERE id = ${entryId}`
);
```

### Error Handling Pattern

```javascript
app.post('/api/endpoint', async (req, res) => {
  try {
    // Validate input
    const { field } = req.body;
    if (!field) {
      return res.status(400).json({ error: 'Field is required' });
    }
    
    // Database operation
    const result = await pool.query('...', []);
    
    // Success response
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error description:', err);
    res.status(500).json({ 
      error: 'User-friendly error message' 
    });
  }
});
```

### Testing Locally

```bash
# Start backend
npm run dev

# Test endpoint
curl http://localhost:5000/api/entries

# Test with data
curl -X POST http://localhost:5000/api/entries \
  -H "Content-Type: application/json" \
  -d '{"content":"Test entry"}'
```

---

## Frontend Development

### React Architecture

**Components**:
- Functional components with hooks
- Props for parent-child communication
- Local state management
- Axios for API calls

### Adding a New Page

1. **Create component** in `src/components/MyPage.js`:

```javascript
import React from 'react';

const MyPage = () => {
  return (
    <div className="my-page">
      <h1>My New Page</h1>
    </div>
  );
};

export default MyPage;
```

2. **Add route** in `src/App.js`:

```javascript
import MyPage from './components/MyPage';

// In Routes:
<Route path="/my-page" element={<MyPage />} />
```

3. **Add navigation** in `src/components/Navigation.js`:

```javascript
<Link to="/my-page">My Page</Link>
```

### State Management

Use React hooks:

```javascript
const [entries, setEntries] = useState([]);

useEffect(() => {
  loadEntries();
}, []);

const loadEntries = async () => {
  const response = await axios.get(`${API_URL}/api/entries`);
  setEntries(response.data);
};
```

### API Calls

```javascript
import axios from 'axios';
import { toast } from 'react-toastify';

const createEntry = async (title, content) => {
  try {
    const response = await axios.post(`${API_URL}/api/entries`, {
      title,
      content
    });
    toast.success('Entry created!');
    return response.data;
  } catch (err) {
    toast.error('Failed to create entry');
    console.error(err);
  }
};
```

### Styling

Use the existing CSS classes and patterns:

```css
/* Global styles in index.css */
.my-component {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  border-radius: 12px;
}

.my-button {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
}
```

---

## Docker Development

### Running in Docker

```bash
# Build and start
docker compose up -d

# Rebuild after changes
docker compose up -d --build

# View logs
docker compose logs -f backend
```

### Development with Docker

For development, mount your source code:

```yaml
volumes:
  - ./backend:/app
  - /app/node_modules  # Prevent overwriting node_modules
```

### Debugging Docker

```bash
# Enter container
docker exec -it journal-backend sh

# View logs
docker logs journal-backend

# Restart service
docker compose restart backend
```

---

## Testing

### Manual Testing

1. **Test API endpoints**:

```bash
# Health check
curl http://localhost:5000/health

# Create entry
curl -X POST http://localhost:5000/api/entries \
  -H "Content-Type: application/json" \
  -d '{"content":"Test"}'

# Get entries
curl http://localhost:5000/api/entries
```

2. **Test UI interactions**:
- Create/edit/delete entries
- Test voice input
- Test AI insights
- Test email settings

### Database Testing

```bash
# Connect to database
docker exec -it journal-db psql -U journal_user -d journal_db

# Run queries
SELECT COUNT(*) FROM journal_entries;

# Exit
\q
```

---

## Debugging

### Backend Debugging

```javascript
// Add console logs
console.log('Debug info:', variable);

// Use debugger in VS Code
debugger;

// Check logs
docker compose logs -f backend
```

### Frontend Debugging

```javascript
// Console logs
console.log('State:', state);

// React DevTools extension
// Breakpoints in VS Code

// Browser console
// F12 → Console tab
```

### Common Issues

**Port already in use**:
```bash
# Kill process on port
lsof -ti:5000 | xargs kill -9
```

**Database connection failed**:
```bash
# Check if database is running
docker compose ps

# Restart database
docker compose restart db
```

**Module not found**:
```bash
# Reinstall dependencies
cd backend && npm install
cd ../frontend && npm install
```

---

## Code Style

### JavaScript/Node.js

```javascript
// Use ES6+ syntax
const myFunction = async () => {
  try {
    const result = await doSomething();
    return result;
  } catch (err) {
    console.error('Error:', err.message);
    throw err;
  }
};

// Use descriptive names
const entryContent = req.body.content;

// Add comments for complex logic
// Calculate mood trend based on positive/negative keywords
const moodTrend = analyzeMood(entries);
```

### React

```javascript
// Use functional components
const MyComponent = ({ prop1, prop2 }) => {
  const [state, setState] = useState(initialState);
  
  useEffect(() => {
    // Side effect
  }, [dependency]);
  
  return (
    <div className="my-component">
      {/* JSX */}
    </div>
  );
};

// Destructure props
const { title, content } = entry;
```

---

## Git Workflow

### Branch Naming

- `feature/feature-name`: New features
- `bugfix/bug-name`: Bug fixes
- `docs/documentation`: Documentation updates

### Commits

```bash
# Good commit messages
git commit -m "Add voice-to-text functionality"
git commit -m "Fix email sending bug"
git commit -m "Update API documentation"

# Include scope
git commit -m "backend: Add new validation endpoint"
git commit -m "frontend: Fix calendar date selection"
```

### Pull Requests

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request with description

---

## Adding Features

### Example: Adding Entry Tags

1. **Update database schema**:

```sql
ALTER TABLE journal_entries ADD COLUMN tags VARCHAR(255);
```

2. **Update backend API**:

```javascript
app.post('/api/entries', async (req, res) => {
  const { title, content, tags } = req.body;
  // ... save tags
});
```

3. **Update frontend UI**:

```javascript
const [tags, setTags] = useState('');
// ... render tag input
```

4. **Test thoroughly**

---

## Performance Optimization

### Backend

- Use connection pooling
- Add database indexes for large tables
- Cache AI responses
- Implement pagination

### Frontend

- Use React.memo for expensive components
- Lazy load routes
- Optimize images
- Debounce search

---

## Security Best Practices

1. **Never commit secrets**: Use `.env` files
2. **Validate input**: Check all user input
3. **Use parameterized queries**: Prevent SQL injection
4. **Encrypt sensitive data**: Passwords, tokens
5. **HTTPS only**: For production

---

## Deployment Preparation

Before deploying:

1. Update environment variables
2. Change encryption key
3. Use production database
4. Set up proper SSL certificates
5. Configure firewall rules
6. Enable database backups
7. Set up monitoring
8. Test all features

---

## Resources

- [Express.js Documentation](https://expressjs.com)
- [React Documentation](https://react.dev)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [Docker Documentation](https://docs.docker.com)
- [Ollama Documentation](https://ollama.ai)

---

**💙 Remember**: This journal is your safe space. Write freely, reflect honestly, and be kind to yourself.

