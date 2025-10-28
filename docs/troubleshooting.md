# Troubleshooting Guide

Common issues and their solutions for Journal AI.

## Quick Diagnosis

### Check Service Status

```bash
# Check all containers
docker compose ps

# Check specific service
docker compose ps backend
```

### View Logs

```bash
# All logs
docker compose logs -f

# Backend logs
docker compose logs -f backend

# Frontend logs
docker compose logs -f frontend

# Nginx logs
docker compose logs -f nginx

# Database logs
docker compose logs -f db
```

---

## Common Issues

### 1. Containers Won't Start

**Symptoms**:
- Containers exit immediately
- Status shows "Exited (1)"

**Solutions**:

```bash
# Check logs
docker compose logs backend

# Rebuild containers
docker compose down
docker compose up -d --build

# Check port availability
netstat -an | grep 443
netstat -an | grep 3000
netstat -an | grep 5000
netstat -an | grep 5432

# Free up ports if needed
# Windows
taskkill /F /PID <pid>

# Linux/macOS
kill -9 <pid>
```

**Common causes**:
- Port already in use
- Missing environment variables
- Docker not running
- Insufficient resources

---

### 2. SSL Certificate Issues

**Symptoms**:
- Browser security warnings
- "ERR_SSL_PROTOCOL_ERROR"
- Certificate not found errors

**Solutions**:

**Development**:
```bash
# Regenerate certificates
cd nginx
bash generate-certs.sh

# Windows PowerShell
cd nginx
bash generate-certs.sh

# Or manually create
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Restart nginx
docker compose restart nginx
```

**Production**:
```bash
# Use Let's Encrypt
sudo certbot --nginx -d yourdomain.com

# Check certificate
sudo certbot certificates

# Auto-renewal
sudo certbot renew --dry-run
```

**Accept self-signed certificate**:
1. Click "Advanced" or "Show Details"
2. Click "Proceed to localhost (unsafe)"
3. Trust certificate if prompted

---

### 3. Database Connection Issues

**Symptoms**:
- "Connection refused" errors
- Database query fails
- Backend can't start

**Solutions**:

```bash
# Check database is running
docker compose ps db

# Restart database
docker compose restart db

# Check database logs
docker compose logs db

# Test connection
docker exec -it journal-db psql -U journal_user -d journal_db

# Reset database (WARNING: Deletes all data)
docker compose down -v
docker compose up -d

# Check connection string in .env
cat .env | grep DATABASE_URL
```

**Connection string format**:
```
postgresql://username:password@host:port/database
```

---

### 4. AI Not Connected

**Symptoms**:
- AI status shows "🔴 AI Offline"
- "Failed to analyze entry" errors
- Timeout errors

**Solutions**:

```bash
# Check Ollama is running
ollama list

# Start Ollama (Linux/macOS)
ollama serve

# Windows: Use Ollama application

# Verify llama2 is installed
ollama list
# Should show llama2 model

# Install model if missing
ollama pull llama2

# Test Ollama API
curl http://localhost:11434/api/tags

# Check Ollama host in .env
cat .env | grep OLLAMA_HOST

# Update OLLAMA_HOST if needed
# For Docker: host.docker.internal:11434
# For local: localhost:11434
```

**Common causes**:
- Ollama not installed or running
- llama2 model not installed
- Wrong host configuration
- Network/firewall blocking port 11434

---

### 5. Microphone Not Working

**Symptoms**:
- Microphone icon doesn't respond
- "Permission denied" errors
- No transcription appears

**Solutions**:

1. **Use HTTPS**:
   - Must use `https://localhost` not `http://`
   - HTTPS is required for microphone access

2. **Grant permissions**:
   - Browser will prompt for microphone permission
   - Click "Allow" or "Grant"
   - Check browser settings if no prompt appears

3. **Check browser support**:
   - Chrome/Edge (Chromium): ✅ Supported
   - Firefox: ✅ Supported
   - Safari: ✅ Supported
   - Old browsers: May not work

4. **Check system settings**:
   - Ensure microphone is not muted
   - Check system privacy settings
   - Allow browser to access microphone

5. **Try different browser**:
   - Some browsers have better support

6. **Check console for errors**:
   ```javascript
   // F12 → Console tab
   // Look for microphone-related errors
   ```

---

### 6. Email Not Sending

**Symptoms**:
- Test email fails
- "SMTP connection failed" error
- Weekly emails not arriving

**Solutions**:

1. **Verify SMTP settings**:
   - Check Settings page for all fields
   - Ensure password is correct (App Password for Gmail)
   - Verify port (587 for TLS, 465 for SSL)

2. **Check email logs**:
   - Go to Settings page
   - Scroll to Email Logs
   - Check error messages

3. **Test SMTP configuration**:
   ```bash
   # Using telnet (test connection)
   telnet smtp.gmail.com 587
   
   # Using curl
   curl -v smtp://smtp.gmail.com:587
   ```

4. **Gmail specific**:
   - Use App Password, not regular password
   - Get App Password: https://myaccount.google.com/apppasswords
   - Enable "Less secure app access" (not recommended)

5. **Check backend logs**:
   ```bash
   docker-compose logs backend | grep -i email
   ```

6. **Common SMTP issues**:
   - Wrong credentials
   - Firewall blocking port 587
   - Need to enable "Allow less secure apps" (Gmail)
   - Need to use App Password (Gmail)
   - SMTP provider blocking connection

---

### 7. Entries Not Saving

**Symptoms**:
- Save button doesn't respond
- "Failed to create entry" error
- Entries disappear

**Solutions**:

1. **Check backend is running**:
   ```bash
   docker-compose ps backend
   docker-compose logs backend
   ```

2. **Check browser console**:
   - F12 → Console tab
   - Look for API errors

3. **Verify content is not empty**:
   - Content field is required
   - Title is optional

4. **Check database**:
   ```bash
   docker exec -it journal-db psql -U journal_user -d journal_db
   SELECT * FROM journal_entries;
   ```

5. **Try refreshing page**:
   - Sometimes browser cache issues

---

### 8. Search Not Working

**Symptoms**:
- Search box doesn't filter entries
- All entries disappear
- No results found

**Solutions**:

1. **Check browser console for errors**:
   ```javascript
   F12 → Console tab
   ```

2. **Try clearing search**:
   - Click the X in search box
   - Or delete all text

3. **Check entry count**:
   - Ensure you have entries saved
   - Check History page loads entries

4. **Refresh page**:
   - Sometimes state issues

---

### 9. CORS Errors

**Symptoms**:
- "CORS policy" errors in console
- API requests fail
- "Access-Control-Allow-Origin" errors

**Solutions**:

```javascript
// Already configured in backend/server.js
app.use(cors());

// For specific domain (production)
app.use(cors({
  origin: 'https://yourdomain.com'
}));
```

**Check API URL**:
```javascript
// In frontend, verify API_URL
console.log(process.env.REACT_APP_API_URL);
```

---

### 10. Port Conflicts

**Symptoms**:
- "Port already in use" errors
- Services fail to start

**Solutions**:

**Windows**:
```powershell
# Find process using port
netstat -ano | findstr :5000

# Kill process
taskkill /PID <pid> /F
```

**Linux/macOS**:
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <pid>
```

**Change ports in docker-compose.yml**:
```yaml
services:
  backend:
    ports:
      - "5001:5000"  # Change host port
```

---

## Performance Issues

### Slow AI Responses

**Solutions**:
- AI responses take 10-30 seconds (normal)
- Check Ollama resources allocated
- Close other heavy applications
- Consider using GPU if available

### Slow Database Queries

**Solutions**:
```bash
# Check query performance
EXPLAIN ANALYZE SELECT * FROM journal_entries;

# Add indexes
CREATE INDEX idx_journal_entries_created_at ON journal_entries(created_at DESC);
```

### High Memory Usage

**Solutions**:
```bash
# Check container resources
docker stats

# Limit resources in docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 2G
```

---

## Getting Help

### Before Asking

1. Check logs: `docker-compose logs -f`
2. Search existing issues
3. Review this troubleshooting guide
4. Check documentation

### Useful Commands

```bash
# Full system status
docker-compose ps
docker stats
df -h

# Check all services
curl http://localhost:5000/health
curl https://localhost/api/ai/status
docker exec journal-db pg_isready

# View all logs
docker-compose logs > logs.txt
```

### Debug Mode

Enable debug logging:

```bash
# Backend debug
DEBUG=* docker-compose up backend

# Frontend debug
REACT_APP_DEBUG=true npm start
```

---

## Recovery Procedures

### Complete Reset

**WARNING**: This deletes all data!

```bash
# Stop all services
docker-compose down

# Remove all volumes (deletes data)
docker-compose down -v

# Remove images
docker-compose rm -f

# Start fresh
docker-compose up -d --build
```

### Restore from Backup

```bash
# Restore database
docker exec -i journal-db psql -U journal_user journal_db < backup.sql

# Restart services
docker-compose restart
```

---

**💙 Remember**: When in doubt, check the logs first! Most issues are visible in the logs.

