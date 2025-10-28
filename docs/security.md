# Security Guide

Comprehensive security documentation for Journal AI.

## Security Overview

Journal AI is designed with security and privacy in mind. This guide covers security measures, best practices, and recommendations.

## Core Security Features

### 1. Data Encryption

**SMTP Passwords**:
- Encrypted at rest using AES-256-CBC
- Initialization Vector (IV) stored with encrypted data
- Decrypted only when sending emails
- Master key stored in environment variables

**Implementation**: `backend/utils/encryption.js`

```javascript
// Encryption
const encrypted = encrypt(plainPassword);
// Format: "iv:encrypted_data"

// Decryption (only for email sending)
const decrypted = decrypt(encrypted);
```

### 2. Database Security

**Parameterized Queries**:
All database queries use parameterized statements to prevent SQL injection.

```javascript
// ✅ Safe
await pool.query('SELECT * FROM entries WHERE id = $1', [id]);

// ❌ Vulnerable to SQL injection
await pool.query(`SELECT * FROM entries WHERE id = ${id}`);
```

**Database Authentication**:
- Username/password authentication required
- Credentials stored in environment variables
- No default/weak credentials

### 3. HTTPS/SSL

**SSL/TLS Configuration**:
- Production: Let's Encrypt certificates
- Development: Self-signed certificates
- TLS 1.2 and 1.3 supported
- HTTPS required for microphone access

**Security Headers**:
```nginx
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
```

### 4. Local Processing

**Privacy-First Design**:
- All data stored locally
- AI processing happens on your machine (Ollama)
- No data sent to external cloud services
- No third-party analytics
- No tracking

---

## Security Best Practices

### Production Deployment

#### 1. Strong Credentials

**Generate secure passwords**:

```bash
# Database password
openssl rand -base64 32

# Encryption key
openssl rand -base64 32

# SMTP password
# Use App Password (Gmail) or API Key (SendGrid)
```

**Never use default credentials** in production!

#### 2. Environment Variables

**Secure .env file**:

```env
# Strong passwords (32+ characters)
DATABASE_URL=postgresql://secure_user:strong_password@db:5432/journal_db

# Secure encryption key (32+ characters)
ENCRYPTION_KEY=$(openssl rand -base64 32)

# Production URL
APP_URL=https://yourdomain.com

# Secure Ollama host
OLLAMA_HOST=your-ollama-host:11434
```

**Protect .env file**:

```bash
chmod 600 .env
# Add to .gitignore
echo ".env" >> .gitignore
```

#### 3. SSL Certificates

**Use Let's Encrypt** for production:

```bash
sudo certbot --nginx -d yourdomain.com
```

**Auto-renewal**:

```bash
sudo certbot renew --dry-run
```

#### 4. Database Security

**Change default credentials**:

```yaml
# In docker-compose.yml
db:
  environment:
    - POSTGRES_USER=secure_user_name
    - POSTGRES_PASSWORD=strong_secure_password
    - POSTGRES_DB=journal_db
```

**Enable SSL for database**:

```env
DATABASE_URL=postgresql://user:pass@db:5432/journal_db?sslmode=require
```

**Connection limits**:

```yaml
command: postgres -c 'max_connections=100'
```

#### 5. Firewall Configuration

```bash
# Allow only necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (redirect)
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Deny all other ports
sudo ufw default deny incoming
sudo ufw default allow outgoing
```

#### 6. Container Security

**Run as non-root user** (recommended):

```yaml
services:
  backend:
    user: "1000:1000"  # Non-root user
```

**Limit container resources**:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

---

## Input Validation

### Backend Validation

**Always validate user input**:

```javascript
app.post('/api/entries', async (req, res) => {
  const { title, content } = req.body;
  
  // Validate required fields
  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }
  
  // Sanitize input
  const sanitizedContent = sanitize(content);
  
  // Check length limits
  if (content.length > 10000000) {  // 10MB
    return res.status(400).json({ error: 'Content too large' });
  }
  
  // Save to database
});
```

### Frontend Validation

**Client-side validation**:

```javascript
const handleSubmit = async (title, content) => {
  if (!content.trim()) {
    toast.error('Content cannot be empty');
    return;
  }
  
  if (content.length > 10000000) {
    toast.error('Content too large');
    return;
  }
  
  // Submit
};
```

---

## Rate Limiting

### Implement Rate Limiting

**Nginx rate limiting**:

```nginx
# In nginx.conf
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

location /api {
    limit_req zone=api_limit burst=20 nodelay;
    proxy_pass http://backend;
}
```

**Express rate limiting** (add to backend):

```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100  // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

## Authentication (Future Feature)

Currently, there is no authentication. For production, consider:

### JWT Authentication

```javascript
// Add authentication middleware
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Protect routes
app.get('/api/entries', authenticateToken, async (req, res) => {
  // Only return entries for authenticated user
});
```

### Multi-User Support

Add user table and relationships:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE journal_entries ADD COLUMN user_id INTEGER REFERENCES users(id);
```

---

## Backup Security

### Encrypted Backups

**Create encrypted backups**:

```bash
# Backup database
docker exec journal-db pg_dump -U journal_user journal_db | gzip > backup.sql.gz

# Encrypt backup
openssl enc -aes-256-cbc -salt -in backup.sql.gz -out backup.sql.gz.enc

# Remove unencrypted backup
rm backup.sql.gz
```

**Decrypt and restore**:

```bash
# Decrypt
openssl enc -d -aes-256-cbc -in backup.sql.gz.enc -out backup.sql.gz

# Decompress and restore
gunzip -c backup.sql.gz | docker exec -i journal-db psql -U journal_user journal_db
```

### Secure Backup Storage

- Store backups in secure location
- Use encrypted storage (AWS S3 with encryption)
- Rotate backup keys regularly
- Test restores periodically

---

## Monitoring and Logging

### Security Event Logging

**Log security-relevant events**:

```javascript
// Log login attempts
console.log('Security: Failed login attempt from', req.ip);

// Log data access
console.log('Security: User accessed entry', entryId);

// Log email sent
console.log('Security: Email sent to', recipient);
```

### Intrusion Detection

**Monitor suspicious activity**:

```bash
# Monitor failed login attempts
grep "Failed login" /var/log/backend.log | wc -l

# Monitor API errors
grep "500" /var/log/nginx/access.log

# Set up alerts for suspicious patterns
```

### Regular Security Audits

**Monthly checks**:
- Review logs for anomalies
- Check for unauthorized access
- Verify backup integrity
- Update dependencies
- Review SSL certificates
- Check firewall rules

---

## Secure Development Practices

### Code Security

**Never commit secrets**:

```bash
# Add to .gitignore
.env
*.key
*.pem
secrets/

# Check git history
git log --all --full-history -- .env
```

**Use .gitignore**:

```
.env
data/
*.log
node_modules/
.DS_Store
*.pem
*.key
```

### Dependency Security

**Regular updates**:

```bash
npm audit
npm audit fix
```

**Use specific versions**:

```json
{
  "dependencies": {
    "express": "4.18.2"  // Pin to specific version
  }
}
```

---

## Privacy Considerations

### Data Minimization

- Store only necessary data
- Don't collect unnecessary information
- Anonymize data when possible

### User Rights

**Data export**: Users can export their data (JSON export)

**Data deletion**: Users can delete entries

**Future features**:
- Right to be forgotten
- Data portability
- Opt-out features

### Compliance

**GDPR Considerations**:
- Right to access data
- Right to deletion
- Data portability
- Privacy by design

**HIPAA Considerations** (if handling medical data):
- Implement proper encryption
- Audit trails
- Access controls
- Business Associate Agreements

---

## Incident Response

### Security Breach Procedures

1. **Identify**: Determine scope of breach
2. **Contain**: Isolate affected systems
3. **Investigate**: Analyze logs and data
4. **Recover**: Restore from backups
5. **Notify**: Inform affected users (if applicable)
6. **Document**: Record incident details

### Backup and Recovery

**Maintain regular backups**:
- Daily automated backups
- Store off-site copies
- Test restore procedures

---

## Security Checklist

### Pre-Production

- [ ] Strong passwords for all services
- [ ] SSL certificates installed
- [ ] Firewall configured
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] Error handling without info leakage
- [ ] Database connections secured
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] Log rotation enabled
- [ ] Dependencies updated
- [ ] Security headers configured
- [ ] .env excluded from git
- [ ] Non-root user for containers
- [ ] Health checks configured

### Ongoing

- [ ] Regular security audits
- [ ] Monitor logs daily
- [ ] Update dependencies weekly
- [ ] Review access logs monthly
- [ ] Test backups monthly
- [ ] Renew SSL certificates
- [ ] Review firewall rules
- [ ] Security patches applied
- [ ] User data audited
- [ ] Incident response plan updated

---

## Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [Docker Security Best Practices](https://docs.docker.com/engine/security)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)
- [Node.js Security](https://nodejs.org/en/docs/guides/security)

---

**💙 Remember**: Security is not a one-time task but an ongoing process.

