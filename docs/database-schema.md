# Database Schema

Complete database schema documentation for Journal AI.

## Database Configuration

- **Database**: PostgreSQL 15
- **Database Name**: `journal_db`
- **User**: `journal_user`
- **Password**: `journal_pass` (change in production!)
- **Port**: 5432
- **SSL**: Disabled by default (enable for production)

## Tables

### journal_entries

Stores all journal entries created by users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing unique ID |
| `title` | VARCHAR(255) | | Entry title (optional) |
| `content` | TEXT | NOT NULL | Entry content (required) |
| `ai_response` | TEXT | | AI-generated insights (nullable) |
| `mood` | VARCHAR(50) | | Mood label (future feature) |
| `tags` | TEXT[] | | Array of 3 AI‑generated tags |
| `emotions` | TEXT[] | | Array of detected emotions |
| `emotion_keywords` | TEXT[] | | Highlight terms related to emotions |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Notes**:
- `content` is the only required field
- `title` defaults to "Untitled Entry" if not provided
- `tags`, `emotions`, and `emotion_keywords` are generated automatically after create, or via re‑analysis
- `ai_response` is concise, and can be re‑analyzed per entry

### user_settings

Stores user configuration, primarily SMTP settings for email summaries.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing unique ID |
| `smtp_host` | VARCHAR(255) | | SMTP server hostname |
| `smtp_port` | INTEGER | | SMTP server port (587, 465, etc.) |
| `smtp_username` | VARCHAR(255) | | SMTP username |
| `smtp_password` | TEXT | | Encrypted SMTP password |
| `smtp_from_email` | VARCHAR(255) | | Sender email address |
| `recipient_email` | VARCHAR(255) | | Recipient email address |
| `email_enabled` | BOOLEAN | DEFAULT false | Whether emails are enabled |
| `email_schedule` | VARCHAR(50) | DEFAULT 'sunday_6pm' | Email schedule |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Notes**:
- Only one settings row exists (singleton pattern)
- `smtp_password` is encrypted using AES-256-CBC
- `email_enabled` controls whether weekly summaries are sent
- `email_schedule` currently only supports 'sunday_6pm'

### email_logs

Logs all email sending attempts for debugging and monitoring.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing unique ID |
| `email_type` | VARCHAR(50) | | Type: 'weekly_summary' or 'test_email' |
| `recipient` | VARCHAR(255) | | Email recipient address |
| `status` | VARCHAR(50) | | Status: 'sent' or 'failed' |
| `message_id` | VARCHAR(255) | | SMTP message ID (nullable) |
| `entries_count` | INTEGER | | Number of entries in summary (nullable) |
| `error_message` | TEXT | | Error message if failed (nullable) |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Timestamp |

**Notes**:
- Used for debugging email delivery issues
- Last 50 logs are displayed in Settings page
- `entries_count` only populated for weekly summaries
- `error_message` only populated when status is 'failed'

## Relationships

Currently, there are no foreign key relationships between tables. Each table is independent:

- `journal_entries`: Standalone entries
- `user_settings`: Single configuration row
- `email_logs`: Standalone logs

### Future Relationships

For multi-user support in future versions:

```sql
ALTER TABLE journal_entries ADD COLUMN user_id INTEGER REFERENCES users(id);
ALTER TABLE email_logs ADD COLUMN user_id INTEGER REFERENCES users(id);
ALTER TABLE user_settings ADD COLUMN user_id INTEGER REFERENCES users(id);
```

## Indexes

Currently, only primary key indexes exist (auto-created by PostgreSQL).

### Recommended Indexes for Production

```sql
-- Index for frequently queried entries by date
CREATE INDEX idx_journal_entries_created_at ON journal_entries(created_at DESC);

-- Index for weekly summary queries
CREATE INDEX idx_journal_entries_created_at_week ON journal_entries(created_at DESC) 
WHERE created_at >= NOW() - INTERVAL '7 days';

-- Index for email log queries
CREATE INDEX idx_email_logs_created_at ON email_logs(created_at DESC);
```

## Initialization

The database schema is created automatically on backend startup in `backend/server.js`:

```javascript
const initDB = async () => {
  const client = await pool.connect();
  try {
    // Create tables if they don't exist
    await client.query(`CREATE TABLE IF NOT EXISTS journal_entries (...)`);
    await client.query(`CREATE TABLE IF NOT EXISTS user_settings (...)`);
    await client.query(`CREATE TABLE IF NOT EXISTS email_logs (...)`);
    
    // Ensure settings row exists
    const settingsCheck = await client.query('SELECT COUNT(*) FROM user_settings');
    if (parseInt(settingsCheck.rows[0].count) === 0) {
      await client.query('INSERT INTO user_settings (email_enabled) VALUES (false)');
    }
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    client.release();
  }
};
```

## Data Types

### SERIAL
Auto-incrementing integer. Used for primary keys.

### VARCHAR(n)
Variable-length string with maximum length `n`.
- Short strings: names, labels, types
- Standard: 50, 255 characters

### TEXT
Unlimited-length string.
- Used for journal content
- Used for AI responses
- Used for email addresses

### INTEGER
32-bit signed integer.
- Used for IDs, counts, ports
- Range: -2,147,483,648 to 2,147,483,647

### BOOLEAN
True or false value.
- Used for flags (email_enabled)
- Default: false

### TIMESTAMP
Date and time value.
- Automatically set with `DEFAULT CURRENT_TIMESTAMP`
- Stored in UTC
- Used for audit trails

## SQL Queries Reference

### Common Queries

#### Get all entries (newest first)
```sql
SELECT * FROM journal_entries ORDER BY created_at DESC;
```

#### Get entries from the past week
```sql
SELECT * FROM journal_entries 
WHERE created_at >= NOW() - INTERVAL '7 days' 
ORDER BY created_at DESC;
```

#### Search entries by content
```sql
SELECT * FROM journal_entries 
WHERE content ILIKE '%search term%' 
ORDER BY created_at DESC;
```

#### Get latest settings
```sql
SELECT * FROM user_settings ORDER BY id DESC LIMIT 1;
```

#### Get recent email logs
```sql
SELECT * FROM email_logs 
ORDER BY created_at DESC 
LIMIT 50;
```

#### Count entries per day
```sql
SELECT DATE(created_at) as date, COUNT(*) as count 
FROM journal_entries 
GROUP BY DATE(created_at) 
ORDER BY date DESC;
```

#### Get failed email attempts
```sql
SELECT * FROM email_logs 
WHERE status = 'failed' 
ORDER BY created_at DESC;
```

## Database Administration

### Connect to Database

```bash
docker exec -it journal-db psql -U journal_user -d journal_db
```

### Backup Database

```bash
docker exec -it journal-db pg_dump -U journal_user journal_db > backup.sql
```

### Restore Database

```bash
docker exec -i journal-db psql -U journal_user journal_db < backup.sql
```

### Reset Database (WARNING: Deletes all data)

```bash
# Stop containers
docker-compose down

# Remove volumes
docker-compose down -v

# Start fresh
docker-compose up -d
```

### View Database Size

```sql
SELECT pg_size_pretty(pg_database_size('journal_db'));
```

### View Table Sizes

```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Migration Strategy

### Current Approach

Schema is created on startup with `CREATE TABLE IF NOT EXISTS`.

### Recommended for Production

Use a migration tool:
- `node-pg-migrate`
- `knex.js`
- Custom migration scripts

### Example Migration

```javascript
// migrations/001_create_tables.js
async function up(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS journal_entries (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255),
      content TEXT NOT NULL,
      ...
    )
  `);
}

async function down(client) {
  await client.query('DROP TABLE IF EXISTS journal_entries');
}
```

## Security Considerations

### Password Encryption

SMTP passwords are encrypted using AES-256-CBC before storage:

```javascript
const encrypted = encrypt(password);
// Stores: "iv:encrypted_data"
```

### SQL Injection Prevention

All queries use parameterized statements:

```javascript
// ✅ Safe
await pool.query('SELECT * FROM entries WHERE id = $1', [id]);

// ❌ Dangerous
await pool.query(`SELECT * FROM entries WHERE id = ${id}`);
```

### Connection Pooling

Database connections are pooled for efficiency:

```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000
});
```

## Performance Optimization

### Query Optimization

1. Use indexes on frequently filtered columns
2. Limit results when possible
3. Use `SELECT *` only when needed
4. Add `EXPLAIN ANALYZE` to slow queries

### Connection Management

1. Always release connections
2. Use transaction blocks for multiple operations
3. Monitor connection pool usage

### Database Maintenance

1. Regular VACUUM operations
2. Analyze table statistics
3. Monitor database growth

---

**💙 Remember**: This journal is your safe space. Write freely, reflect honestly, and be kind to yourself.

