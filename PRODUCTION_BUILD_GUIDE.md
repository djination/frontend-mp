# Production Build & Deployment Guide

## Masalah Qt/OpenGL pada Server Ubuntu Headless

Server Ubuntu headless tidak memiliki driver grafis yang diperlukan oleh Vite build process. Ini mengakibatkan error:
```
This system has no OpenGL support
Aborted (core dumped)
```

## Solusi: Build Local + Deploy

### 1. Build di Local Machine

```bash
# Di folder frontend (Windows/macOS/Linux with GUI)
npm run build

# Atau dengan config production
npm run build:server
```

### 2. Deploy ke Server

```bash
# Upload hasil build ke server
./deploy-production.sh

# Atau manual upload
scp -r dist/* root@bc.merahputih-id.com:/var/www/html/frontend/
```

## Alternative: Build di Server dengan Script

Jika ingin tetap build di server, gunakan script yang sudah dibuat:

```bash
# Di server Ubuntu
chmod +x build-production.sh
./build-production.sh
```

Script ini akan mencoba beberapa metode:
1. Build dengan config production minimal
2. Build dengan xvfb (virtual display)
3. Build dengan esbuild fallback

## Nginx Configuration

File `nginx-static-production.conf` sudah dioptimasi untuk serving static files dengan:
- Security headers
- CORS support
- File caching
- SPA routing support
- API proxy ke backend

## Deployment Workflow

### Recommended (Local Build):
1. `npm run build` (di local)
2. `./deploy-production.sh` (upload ke server)

### Alternative (Server Build):
1. `./build-production.sh` (di server)
2. Nginx sudah configure untuk serve dari `/var/www/html/frontend`

## Environment Files Priority

1. `.env.server` - Production server
2. `.env.production` - Production build
3. `.env.local` - Local override  
4. `.env` - Default

## Monitoring & Logs

```bash
# Check nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Check build logs
./build-production.sh 2>&1 | tee build.log
```

## Troubleshooting

### Build Fails on Server
- Use local build + deploy method
- Check Qt/OpenGL dependencies
- Verify Node.js version compatibility

### 502 Bad Gateway
- Check backend is running: `pm2 status`
- Verify nginx config: `sudo nginx -t`
- Check API endpoint in proxy_pass

### Static Files Not Loading
- Verify file permissions: `ls -la /var/www/html/frontend`
- Check nginx config syntax
- Restart nginx: `sudo systemctl reload nginx`
