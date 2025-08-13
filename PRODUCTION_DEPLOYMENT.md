# Production Deployment Guide

## 📦 Files yang diperlukan untuk Production:

1. **`nginx-simple.conf`** - Main nginx configuration
2. **`websocket-upgrade.conf`** - WebSocket upgrade mapping
3. **`setup-nginx-production.sh`** - Automated setup script
4. **`.env.server`** - Production environment variables

## 🚀 Deployment Steps di Ubuntu Server:

### 1. Upload files ke server
```bash
# Upload ke server (dari local machine)
scp nginx-simple.conf websocket-upgrade.conf setup-nginx-production.sh .env.server user@your-server:/var/www/customerdb/frontend-mp/
```

### 2. Setup Nginx Configuration
```bash
# Masuk ke server
ssh user@your-server

# Navigate ke project directory
cd /var/www/customerdb/frontend-mp

# Make setup script executable
chmod +x setup-nginx-production.sh

# Run setup script as root
sudo bash setup-nginx-production.sh
```

### 3. Start Frontend Application
```bash
# Install dependencies (jika belum)
npm install

# Start dengan production environment
npm run dev:server

# Atau gunakan PM2 untuk production daemon
npm install -g pm2
pm2 start npm --name "frontend" -- run dev:server
pm2 save
pm2 startup
```

## 🔧 Production Features yang sudah dikonfigurasi:

### Security Headers
- ✅ X-Frame-Options: SAMEORIGIN
- ✅ X-Content-Type-Options: nosniff
- ✅ X-XSS-Protection: 1; mode=block
- ✅ Content-Security-Policy
- ✅ Referrer-Policy

### Performance Optimizations
- ✅ Gzip compression
- ✅ Static file caching (1 year)
- ✅ Proper cache headers
- ✅ HTTP/2 support

### WebSocket Support
- ✅ Conditional WebSocket upgrade
- ✅ Separate /ws endpoint
- ✅ Proper timeout settings

### API Proxy
- ✅ Proxy ke backend production (bc.merahputih-id.com)
- ✅ Proper headers forwarding
- ✅ Timeout configurations

### Monitoring
- ✅ Access & Error logs
- ✅ Health check endpoint (/health)
- ✅ Cache status headers

## 🔍 Troubleshooting:

### Check Nginx Status
```bash
sudo systemctl status nginx
sudo nginx -t
```

### Check Logs
```bash
# Nginx logs
tail -f /var/log/nginx/customer.merahputih-id.com.error.log
tail -f /var/log/nginx/customer.merahputih-id.com.access.log

# Application logs (jika pakai PM2)
pm2 logs frontend
```

### Test Endpoints
```bash
# Health check
curl https://customer.merahputih-id.com/health

# Main site
curl -I https://customer.merahputih-id.com

# API proxy
curl -I https://customer.merahputih-id.com/api/health
```

## 🔄 Updates & Maintenance:

### Update Configuration
```bash
# Test configuration before applying
sudo nginx -t

# Reload if test passes
sudo systemctl reload nginx
```

### Update Application
```bash
# Pull latest code
git pull

# Install new dependencies
npm install

# Restart application
pm2 restart frontend
```

## 🚨 Important Notes:

1. **SSL Certificates**: Make sure Let's Encrypt certificates are valid
2. **Firewall**: Ensure ports 80, 443 are open
3. **DNS**: Verify customer.merahputih-id.com points to correct server
4. **Backend**: Ensure bc.merahputih-id.com is accessible
5. **Monitoring**: Set up log rotation and monitoring alerts

## 📊 Performance Monitoring:

```bash
# Check SSL certificate expiry
openssl x509 -in /etc/letsencrypt/live/customer.merahputih-id.com/fullchain.pem -text -noout | grep "Not After"

# Monitor resource usage
htop
iotop
netstat -tulpn | grep :443
```
