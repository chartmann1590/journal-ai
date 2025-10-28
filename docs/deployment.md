# Deployment Guide

Complete guide for deploying Journal AI to production.

## Pre-Deployment Checklist

- [ ] Domain name registered
- [ ] SSL certificate obtained (Let's Encrypt)
- [ ] Strong encryption keys generated
- [ ] Database credentials secured
- [ ] SMTP configuration ready
- [ ] Ollama installed and configured
- [ ] Server resources allocated
- [ ] Backup strategy planned
- [ ] Monitoring configured
- [ ] Security measures in place

---

## Production Environment Setup

### Server Requirements

**Minimum**:
- CPU: 2 cores
- RAM: 4GB
- Storage: 10GB
- OS: Ubuntu 20.04+ / Debian 11+

**Recommended**:
- CPU: 4+ cores
- RAM: 8GB
- Storage: 50GB SSD
- OS: Ubuntu 22.04 LTS

### Domain and SSL

1. **Point domain** to your server IP
2. **Install Certbot**:

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

3. **Generate SSL certificate**:

```bash
sudo certbot --nginx -d yourdomain.com
```

4. **Auto-renewal** (automatically configured):

```bash
sudo certbot renew --dry-run
```

---

## Docker Deployment

### 1. Install Docker and Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Clone Repository

```bash
git clone https://github.com/your-repo/journal-ai.git
cd journal-ai
```

### 3. Generate SSL Certificates (Production)

```bash
# Use Certbot for production certificates
# Or configure nginx to use Let's Encrypt
```

### 4. Configure Environment Variables

Create `.env` file:

```env
# Database
DATABASE_URL=postgresql://secure_user:secure_password@db:5432/journal_db

# Ollama
OLLAMA_HOST=host.docker.internal:11434

# Encryption (GENERATE STRONG KEY)
ENCRYPTION_KEY=$(openssl rand -base64 32)

# Application
APP_URL=https://yourdomain.com
```

**Important**: Generate a strong encryption key:

```bash
openssl rand -base64 32
```

### 5. Update docker-compose.yml

Modify for production:

```yaml
services:
  nginx:
    volumes:
      - ./nginx/ssl:/etc/nginx/ssl:ro  # Read-only
    restart: always  # Always restart
  
  backend:
    environment:
      - NODE_ENV=production
    restart: always
  
  frontend:
    environment:
      - REACT_APP_API_URL=https://yourdomain.com
    restart: always
  
  db:
    volumes:
      - /var/lib/postgresql/data:/var/lib/postgresql/data  # Persistent storage
    restart: always
    command: postgres -c 'shared_buffers=256MB' -c 'max_connections=100'
```

### 6. Build and Start

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

---

## Ollama Setup

### Installing Ollama

```bash
# Linux
curl https://ollama.ai/install.sh | sh

# macOS
# Download from https://ollama.ai

# Windows
# Download from https://ollama.ai
```

### Running as Service

```bash
# Create systemd service
sudo tee /etc/systemd/system/ollama.service > /dev/null <<EOF
[Unit]
Description=Ollama Service
After=network.target

[Service]
Type=simple
User=ollama
ExecStart=/usr/local/bin/ollama serve
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
sudo systemctl enable ollama
sudo systemctl start ollama
```

### Installing Models

```bash
ollama pull llama2
ollama pull mistral  # Alternative model
```

---

## Nginx Configuration (Production)

Update `nginx/nginx.conf`:

```nginx
# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;

# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req zone=api_limit burst=20 nodelay;

# Enable caching
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=static_cache:10m;
proxy_cache_valid 200 60m;

# SSL Configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
ssl_prefer_server_ciphers on;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;

# Increase timeouts for AI
proxy_read_timeout 120s;
proxy_connect_timeout 75s;
```

---

## Database Configuration

### PostgreSQL Optimizations

Update `docker-compose.yml` database service:

```yaml
db:
  environment:
    - POSTGRES_SHARED_BUFFERS=256MB
    - POSTGRES_MAX_CONNECTIONS=100
    - POSTGRES_WORK_MEM=4MB
  command: postgres
    -c 'shared_buffers=256MB'
    -c 'max_connections=100'
    -c 'effective_cache_size=1GB'
    -c 'maintenance_work_mem=64MB'
```

### Database Backups

**Automatic backups**:

```bash
# Create backup script
cat > /usr/local/bin/backup-journal.sh <<'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
mkdir -p $BACKUP_DIR

docker exec journal-db pg_dump -U journal_user journal_db > $BACKUP_DIR/journal_db_$DATE.sql
gzip $BACKUP_DIR/journal_db_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
EOF

chmod +x /usr/local/bin/backup-journal.sh

# Add to cron (daily at 2 AM)
echo "0 2 * * * /usr/local/bin/backup-journal.sh" | sudo crontab -
```

**Manual backup**:

```bash
docker exec journal-db pg_dump -U journal_user journal_db > backup.sql
gzip backup.sql
```

**Restore backup**:

```bash
gunzip backup.sql.gz
docker exec -i journal-db psql -U journal_user journal_db < backup.sql
```

---

## Security Hardening

### 1. Firewall Configuration

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp     # HTTP (redirect)
sudo ufw allow 443/tcp    # HTTPS
sudo ufw enable
```

### 2. SSH Security

```bash
# Disable root login
sudo nano /etc/ssh/sshd_config
# PermitRootLogin no

# Use key-based authentication
# PasswordAuthentication no

sudo systemctl restart ssh
```

### 3. Update Environment Variables

```bash
# Generate secure passwords
openssl rand -base64 32  # Database password
openssl rand -base64 32  # Encryption key

# Update .env file
nano .env
```

### 4. Docker Security

```bash
# Run containers as non-root
# Update docker-compose.yml user IDs
```

### 5. Regular Updates

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose pull
docker-compose up -d --build
```

---

## Monitoring

### Log Monitoring

```bash
# View logs
docker-compose logs -f backend

# Set up log rotation
cat > /etc/logrotate.d/journal-ai <<EOF
/var/lib/docker/containers/*/*-json.log {
  daily
  rotate 7
  compress
  size 10M
  missingok
  delaycompress
  copytruncate
}
EOF
```

### Health Monitoring

Set up external monitoring:

```bash
# Simple health check script
cat > /usr/local/bin/check-journal-health.sh <<'EOF'
#!/bin/bash
response=$(curl -s -o /dev/null -w "%{http_code}" https://yourdomain.com/health)
if [ $response -ne 200 ]; then
  # Alert: health check failed
  echo "Health check failed" | mail -s "Alert" admin@yourdomain.com
fi
EOF

chmod +x /usr/local/bin/check-journal-health.sh

# Cron: check every 5 minutes
*/5 * * * * /usr/local/bin/check-journal-health.sh
```

### Resource Monitoring

```bash
# Install monitoring tools
sudo apt install htop iotop

# Monitor containers
docker stats
```

---

## Scaling Considerations

### Horizontal Scaling

For multiple instances:

1. **Load Balancer**: Nginx upstream with multiple backend instances
2. **Database**: Consider read replicas for large datasets
3. **Shared Storage**: For persistent data

### Vertical Scaling

Increase resources:
- More CPU cores
- More RAM
- SSD storage

---

## Backup and Recovery

### Full System Backup

```bash
# Backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
BACKUP_DIR="/backups/full"

# Backup database
docker exec journal-db pg_dump -U journal_user journal_db > $BACKUP_DIR/db_$DATE.sql

# Backup Docker volumes
docker run --rm -v journal-db_data:/data -v $BACKUP_DIR:/backup ubuntu tar czf /backup/volumes_$DATE.tar.gz /data

# Backup configuration
tar czf $BACKUP_DIR/config_$DATE.tar.gz docker-compose.yml .env nginx/
```

### Disaster Recovery

```bash
# Restore database
docker exec -i journal-db psql -U journal_user journal_db < db_backup.sql

# Restore volumes
docker run --rm -v journal-db_data:/data -v /backups:/backup ubuntu tar xzf /backup/volumes.tar.gz -C /

# Restart services
docker-compose up -d
```

---

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose logs

# Check containers
docker ps -a

# Restart services
docker-compose restart
```

### Database Issues

```bash
# Check database logs
docker-compose logs db

# Test connection
docker exec -it journal-db psql -U journal_user -d journal_db

# Restart database
docker-compose restart db
```

### SSL Issues

```bash
# Check certificate
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Check nginx config
docker-compose logs nginx
```

---

## Performance Tuning

### Database

```sql
-- Add indexes
CREATE INDEX idx_journal_entries_created_at ON journal_entries(created_at DESC);
CREATE INDEX idx_email_logs_created_at ON email_logs(created_at DESC);

-- Analyze tables
ANALYZE journal_entries;
```

### Nginx

```nginx
# Enable gzip
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;
gzip_comp_level 6;

# Cache static assets
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
  expires 365d;
  add_header Cache-Control "public, immutable";
}
```

---

## Maintenance

### Regular Tasks

**Weekly**:
- Check logs for errors
- Verify backups
- Check disk space

**Monthly**:
- Update dependencies
- Renew SSL certificates
- Review security
- Performance check

**Quarterly**:
- Full system backup
- Review and rotate logs
- Update documentation

---

## Support

If you encounter issues:

1. Check logs: `docker-compose logs`
2. Review this guide's troubleshooting section
3. Check GitHub issues
4. Review backend logs specifically

---

**💙 Remember**: This journal is your safe space. Write freely, reflect honestly, and be kind to yourself.

