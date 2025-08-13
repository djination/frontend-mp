# 🚀 Panduan Deploy Frontend di Server Production

## Situasi Saat Ini
✅ Build berhasil dengan ESBuild  
✅ File `dist/` sudah tersedia  
✅ Size: 14MB (2.7MB main.js + 11MB sourcemap)

## Step-by-Step Deployment

### 1. Jalankan Script Deploy Otomatis
```bash
# Di server, di folder frontend-mp
chmod +x deploy-server.sh
./deploy-server.sh
```

**Script ini akan otomatis:**
- ✅ Copy nginx config
- ✅ Enable nginx site
- ✅ Test nginx config
- ✅ Create web directory
- ✅ Copy build files
- ✅ Set permissions
- ✅ Reload nginx
- ✅ Verify deployment
- ✅ Check backend status

### 2. Manual Steps (jika script gagal)

#### A. Setup Nginx
```bash
# Copy config
sudo cp nginx-static-production.conf /etc/nginx/sites-available/frontend.conf

# Enable site
sudo ln -sf /etc/nginx/sites-available/frontend.conf /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

#### B. Deploy Files
```bash
# Create directory (if needed)
sudo mkdir -p /var/www/customerdb/frontend-mp/dist

# Copy files
sudo cp -r dist/* /var/www/customerdb/frontend-mp/dist/

# Set permissions
sudo chown -R www-data:www-data /var/www/customerdb/frontend-mp/dist
sudo chmod -R 755 /var/www/customerdb/frontend-mp/dist
sudo find /var/www/customerdb/frontend-mp/dist -type f -exec chmod 644 {} \;
```

#### C. Start Backend (jika belum running)
```bash
# Check status
pm2 status

# Start backend jika perlu
cd /var/www/customerdb/backend
pm2 start pm2.config.json
```

### 3. Verification Commands

#### Test Frontend
```bash
# Test local
curl -I http://localhost

# Test domain
curl -I https://customer.merahputih-id.com

# Check files
ls -la /var/www/customerdb/frontend-mp/dist/
```

#### Check Logs
```bash
# Nginx error log
sudo tail -f /var/log/nginx/error.log

# Nginx access log
sudo tail -f /var/log/nginx/access.log

# Backend logs
pm2 logs
```

### 4. Troubleshooting

#### If 502 Bad Gateway
```bash
# Check backend
pm2 status
pm2 restart all

# Check nginx config
sudo nginx -t
sudo systemctl status nginx
```

#### If 404 Not Found
```bash
# Check files exist
ls -la /var/www/html/frontend/

# Check nginx config path
grep -n "root" /etc/nginx/sites-enabled/frontend.conf
```

#### If Permission Denied
```bash
# Fix permissions
sudo chown -R www-data:www-data /var/www/customerdb/frontend-mp/dist
sudo chmod -R 755 /var/www/customerdb/frontend-mp/dist
```

## Quick Commands Summary

```bash
# 1. Deploy (after successful build)
./deploy-server.sh

# 2. Test website
curl -I https://customer.merahputih-id.com

# 3. Check logs if issues
sudo tail -f /var/log/nginx/error.log

# 4. Restart services if needed
sudo systemctl reload nginx
pm2 restart all
```

## Expected Result
- ✅ Website accessible: https://customer.merahputih-id.com
- ✅ API working: https://bc.merahputih-id.com/api/health
- ✅ Frontend loads React app
- ✅ No 404/502 errors

## File Locations After Deploy
- Frontend files: `/var/www/customerdb/frontend-mp/dist/`
- Nginx config: `/etc/nginx/sites-enabled/frontend.conf`
- Backend: `/var/www/customerdb/backend/` (PM2)
- Logs: `/var/log/nginx/`
