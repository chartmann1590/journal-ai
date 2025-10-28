# API Reference

Complete API documentation for Journal AI backend endpoints.

## Base URL

**Dev via Nginx**: `https://localhost/api`  
**Direct Backend**: `http://localhost:5000/api`

## Authentication

Currently, there is no authentication system. All endpoints are publicly accessible. For production deployments, consider implementing authentication.

## Endpoints

### Health Check

#### GET /health

Check API health status.

**Response**:
```json
{
  "status": "ok",
  "message": "Journal API is running"
}
```

---

### Journal Entries

#### GET /api/entries

Get all journal entries, sorted by creation date (newest first).

**Response**:
```json
[
  {
    "id": 1,
    "title": "My First Entry",
    "content": "Today was a great day...",
    "ai_response": "It's wonderful to hear...",
    "mood": null,
    "tags": ["gratitude","work","wins"],
    "emotions": ["joy","calm"],
    "emotion_keywords": ["thankful","relieved","proud"],
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
]
```

#### GET /api/entries/:id

Get a single journal entry by ID.

**Parameters**:
- `id` (integer, required): Entry ID

**Response**:
```json
{
  "id": 1,
  "title": "My First Entry",
  "content": "Today was a great day...",
  "ai_response": null,
  "mood": null,
  "tags": ["..."],
  "emotions": ["..."],
  "emotion_keywords": ["..."]
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

**Error Response** (404):
```json
{
  "error": "Entry not found"
}
```

#### POST /api/entries

Create a new journal entry.

**Request Body**:
```json
{
  "title": "My New Entry" (optional),
  "content": "Entry content here" (required)
}
```

On success, metadata (3 tags, emotions, emotion_keywords) is generated automatically.

**Response** (201):
```json
{
  "id": 2,
  "title": "My New Entry",
  "content": "Entry content here",
  "ai_response": null,
  "mood": null,
  "tags": ["..."],
  "emotions": ["..."],
  "emotion_keywords": ["..."],
  "created_at": "2024-01-16T14:20:00.000Z",
  "updated_at": "2024-01-16T14:20:00.000Z"
}
```

**Error Response** (400):
```json
{
  "error": "Content is required"
}
```

#### PUT /api/entries/:id

Update an existing journal entry.

**Parameters**:
- `id` (integer, required): Entry ID

**Request Body**:
```json
{
  "title": "Updated Title",
  "content": "Updated content",
  "ai_response": "AI-generated response"
}
```

**Response**:
```json
{
  "id": 1,
  "title": "Updated Title",
  "content": "Updated content",
  "ai_response": "AI-generated response",
  "mood": null,
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-16T15:45:00.000Z"
}
```

**Error Response** (404):
```json
{
  "error": "Entry not found"
}
```

#### DELETE /api/entries/:id

Delete a journal entry.

**Parameters**:
- `id` (integer, required): Entry ID

**Response**:
```json
{
  "message": "Entry deleted successfully"
}
```

**Error Response** (404):
```json
{
  "error": "Entry not found"
}
```

---

### AI Integration

#### POST /api/ai/analyze

Analyze a journal entry with AI and get insights.

**Request Body**:
```json
{
  "content": "Journal entry content" (required),
  "prompt": "Custom system prompt" (optional)
}
```

**Default Prompt** (concise):
"Provide a concise, supportive analysis (under 120 words).\n- Identify key emotions (2-4).\n- Note one helpful pattern.\n- Give one practical, gentle suggestion.\nAvoid repetition and avoid disclaimers."

**Response**:
```json
{
  "response": "Your entry shows thoughtful reflection...",
  "model": "llama2"
}
```

**Error Response** (400):
```json
{
  "error": "Content is required"
}
```

**Error Response** (500):
```json
{
  "error": "Failed to analyze entry with AI",
  "details": "Connection timeout"
}
```

#### POST /api/ai/chat

Interactive conversation with AI.

**Request Body**:
```json
{
  "message": "How can I improve my mental health?" (required),
  "context": "Previous context" (optional)
}
```

**Response**:
```json
{
  "response": "Taking care of your mental health involves...",
  "model": "llama2"
}
```

**Error Response** (400):
```json
{
  "error": "Message is required"
}
```

#### GET /api/ai/status

Check Ollama connection status.

**Response** (200):
```json
{
  "status": "connected",
  "models": [
    {
      "name": "llama2",
      "size": 3825819519,
      "modified_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Response** (500):
```json
{
  "status": "disconnected",
  "error": "Connection refused"
}
```

---

### Settings

#### GET /api/settings

Get user settings (SMTP configuration, email preferences).

**Response**:
```json
{
  "id": 1,
  "smtp_host": "smtp.gmail.com",
  "smtp_port": 587,
  "smtp_username": "user@gmail.com",
  "smtp_password": "********",
  "smtp_from_email": "user@gmail.com",
  "recipient_email": "recipient@gmail.com",
  "email_enabled": true,
  "email_schedule": "sunday_6pm",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-15T12:00:00.000Z"
}
```

**Note**: Password is masked with `********` for security.

#### POST /api/settings

Update user settings.

**Request Body**:
```json
{
  "smtp_host": "smtp.gmail.com" (required if email_enabled),
  "smtp_port": 587 (required if email_enabled),
  "smtp_username": "user@gmail.com" (required if email_enabled),
  "smtp_password": "new-password" (required if email_enabled),
  "smtp_from_email": "user@gmail.com" (required if email_enabled),
  "recipient_email": "recipient@gmail.com",
  "email_enabled": true,
  "email_schedule": "sunday_6pm"
}
```

**Password Handling**:
- If `smtp_password` is `********`, existing password is preserved
- If new password is provided, it's encrypted and stored
- Password is encrypted using AES-256-CBC

**Response** (200):
```json
{
  "success": true,
  "settings": {
    "id": 1,
    "smtp_host": "smtp.gmail.com",
    "smtp_port": 587,
    "smtp_username": "user@gmail.com",
    "smtp_password": "********",
    "smtp_from_email": "user@gmail.com",
    "recipient_email": "recipient@gmail.com",
    "email_enabled": true,
    "email_schedule": "sunday_6pm",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-15T12:00:00.000Z"
  }
}
```

**Error Response** (400):
```json
{
  "error": "All SMTP fields are required when email is enabled"
}
```

#### POST /api/settings/test-email

Send a test email to verify SMTP configuration.

**No Request Body Required**

**Response**:
```json
{
  "success": true,
  "message": "Test email sent successfully!"
}
```

**Error Response** (400):
```json
{
  "error": "No settings configured"
}
```

**Error Response** (500):
```json
{
  "error": "Failed to send test email: SMTP connection failed"
}
```

#### POST /api/settings/send-summary

Manually trigger a weekly summary email.

**No Request Body Required**

**Response**:
```json
{
  "success": true,
  "messageId": "1234567890@mail.gmail.com",
  "entriesCount": 5
}
```

**Error Response** (400):
```json
{
  "error": "No settings configured"
}
```

**Error Response** (400):
```json
{
  "success": false,
  "message": "Weekly emails are disabled"
}
```

#### GET /api/email-logs

Get email sending history.

**Response**:
```json
[
  {
    "id": 1,
    "email_type": "weekly_summary",
    "recipient": "user@gmail.com",
    "status": "sent",
    "message_id": "1234567890@mail.gmail.com",
    "entries_count": 5,
    "error_message": null,
    "created_at": "2024-01-14T18:00:00.000Z"
  },
  {
    "id": 2,
    "email_type": "test_email",
    "recipient": "user@gmail.com",
    "status": "sent",
    "message_id": "9876543210@mail.gmail.com",
    "entries_count": null,
    "error_message": null,
    "created_at": "2024-01-15T12:30:00.000Z"
  },
  {
    "id": 3,
    "email_type": "weekly_summary",
    "recipient": "user@gmail.com",
    "status": "failed",
    "message_id": null,
    "entries_count": null,
    "error_message": "SMTP connection timeout",
    "created_at": "2024-01-07T18:00:00.000Z"
  }
]
```

Returns the last 50 email logs, sorted by creation date (newest first).

---

## Error Codes

### HTTP Status Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request parameters
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

### Error Response Format

All errors follow this format:

```json
{
  "error": "Error message"
}
```

Additional fields may be included:
```json
{
  "error": "Failed to analyze entry with AI",
  "details": "Connection timeout"
}
```

---

## Rate Limiting

Currently, there is no rate limiting implemented. For production deployments, consider:
- Request rate limiting per IP
- Account-based rate limiting
- API key authentication

---

## CORS

CORS is enabled for all origins. For production, restrict to specific domains:

```javascript
app.use(cors({
  origin: 'https://yourdomain.com'
}));
```

---

## Content Types

### Request

All POST/PUT requests must use `Content-Type: application/json`.

### Response

All responses use `Content-Type: application/json`.

---

## Pagination

Currently, all endpoints return complete datasets. For large datasets, implement pagination:

```
GET /api/entries?page=1&limit=20
```

---

## Best Practices

### Creating Entries

1. Always include `content` field
2. Title is optional but recommended
3. Keep content under 10MB (configured limit)

### AI Analysis

1. Ensure Ollama is running before making requests
2. Check `/api/ai/status` before AI operations
3. Handle timeouts (AI responses can take 10-30 seconds)
4. Cache AI responses if possible

### Email Configuration

1. Test configuration with test email before enabling
2. Use encrypted passwords (stored securely)
3. Check email logs for delivery issues
4. Verify SMTP provider settings

---

## Example Requests

### Using cURL

#### Create Entry
```bash
curl -X POST https://localhost/api/entries \
  -H "Content-Type: application/json" \
  -d '{"title":"My Entry","content":"Entry content"}'
```

#### Get AI Insights
```bash
curl -X POST https://localhost/api/ai/analyze \
  -H "Content-Type: application/json" \
  -d '{"content":"I felt anxious today"}'
```

### Using JavaScript (axios)

```javascript
// Create entry
const response = await axios.post('https://localhost/api/entries', {
  title: 'My Entry',
  content: 'Entry content'
});

// Get AI insights
const aiResponse = await axios.post('https://localhost/api/ai/analyze', {
  content: 'I felt anxious today'
});
```

---

**💙 Remember**: This journal is your safe space. Write freely, reflect honestly, and be kind to yourself.

### Entry Metadata & Analysis (per-entry)

#### POST /api/entries/:id/metadata

Recompute tags, emotions, and emotion_keywords for an entry and update the record.

**Response** (200): Entry object with updated metadata.

#### POST /api/entries/:id/analyze

Generate a concise AI analysis for an entry and update `ai_response`.

**Response** (200): Entry object with updated `ai_response`.

---

### AI Integration
