# Deployment Update untuk HMR WebSocket Fix

## Problem yang diperbaiki:
- WebSocket connection masih mencoba connect ke `localhost:5173` instead of `customer.merahputih-id.com`
- Error: `WebSocket connection to 'wss://localhost:5173/?token=...' failed`

## Files yang diperbaiki:

### 1. nginx-hmr.conf (Copy ke server)
File: `frontend/nginx-hmr.conf` 
Target: `/etc/nginx/sites-available/customer.merahputih-id.com`

Key changes:
- Added WebSocket upgrade map directive
- Simplified proxy configuration
- Full proxy ke Vite dev server dengan WebSocket support

### 2. vite.config.js (Sudah diupdate)
File: `frontend/vite.config.js`

Key changes:
- Simplified HMR configuration
- Conditional logic untuk development vs local
- Force clientPort 443 dan host customer.merahputih-id.com untuk development

### 3. .env.development (Already correct)
Environment variables sudah benar:
- VITE_ENV=development
- VITE_HMR_HOST=customer.merahputih-id.com
- VITE_HMR_CLIENT_PORT=443

## Server deployment steps:

1. Copy nginx config ke server:
```bash
sudo cp frontend/nginx-hmr.conf /etc/nginx/sites-available/customer.merahputih-id.com
```

2. Test nginx config:
```bash
sudo nginx -t
```

3. Reload nginx:
```bash
sudo systemctl reload nginx
```

4. Restart PM2 frontend:
```bash
pm2 restart frontend
```

## Expected result:
- HMR WebSocket akan connect ke `wss://customer.merahputih-id.com` bukan localhost
- Hot reload akan berfungsi dengan SSL proxy
- Browser console tidak akan show WebSocket connection errors
