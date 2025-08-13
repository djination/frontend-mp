# 🚀 Static Frontend Deployment Instructions

## 📋 What We Built

- **Frontend**: Static files served by Nginx
- **No PM2**: No Node.js server needed
- **No Port 3000**: Direct file serving
- **Fast**: No JavaScript server overhead

## 🏗️ Architecture

```
Internet → Nginx (443/SSL) → Static Files (/var/www/customerdb/frontend-mp/dist/)
                                    ↓
                              API calls → https://bc.merahputih-id.com
```

## 📦 Upload to Server

```bash
# From your local machine
scp frontend-static-production.tar.gz user@server:/var/www/customerdb/frontend-mp/
scp deploy-static-frontend.sh user@server:/var/www/customerdb/frontend-mp/
```

## 🖥️ Deploy on Server

```bash
# SSH to server
ssh user@server

# Navigate to project directory
cd /var/www/customerdb/frontend-mp

# Run deployment
chmod +x deploy-static-frontend.sh
./deploy-static-frontend.sh
```

## ✅ Verification

After deployment, test:

1. **Frontend**: https://customer.merahputih-id.com
2. **CSS Loading**: https://customer.merahputih-id.com/main.css
3. **JS Loading**: https://customer.merahputih-id.com/main.js
4. **API Calls**: Should work to https://bc.merahputih-id.com

## 🔧 Troubleshooting

### CSS/JS Not Loading
```bash
# Check file permissions
ls -la /var/www/customerdb/frontend-mp/dist/

# Check nginx error log
tail -f /var/log/nginx/error.log

# Test nginx config
nginx -t
```

### CORS Issues
- Backend needs to allow origin: `https://customer.merahputih-id.com`
- Check backend CORS configuration

### SSL Issues
```bash
# Check SSL certificates
certbot certificates

# Renew if needed
certbot renew
```

## 📊 Monitoring

```bash
# Check nginx status
systemctl status nginx

# Monitor access logs
tail -f /var/log/nginx/access.log

# Monitor error logs
tail -f /var/log/nginx/error.log

# Check disk space
df -h /var/www/customerdb/frontend-mp/
```

## 🔄 Updates

For future updates, just run:
```bash
# Local: rebuild and repackage
./deploy-static-production.sh

# Server: redeploy
./deploy-static-frontend.sh
```

## 🚫 What We DON'T Need

- ❌ PM2 process
- ❌ Node.js server
- ❌ Port 3000
- ❌ `serve` package
- ❌ Process monitoring for frontend

Static files = Simple & Fast! 🚀
