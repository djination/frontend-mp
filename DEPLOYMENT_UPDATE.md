# Deployment Update untuk HMR WebSocket Fix

## Problem yang diperbaiki:
- WebSocket connection masih mencoba connect ke `localhost:5173` instead of `customer.merahputih-id.com`
- Error: `WebSocket connection to 'wss://localhost:5173/?token=...' failed`

## Root Cause:
- Vite HMR config tidak cukup explicit untuk force WebSocket URL
- Environment variables tidak ter-load dengan benar di vite config
- Missing explicit webSocketURL configuration

## Files yang diperbaiki:

### 1. nginx-hmr.conf (Copy ke server)
File: `frontend/nginx-hmr.conf` 
Target: `/etc/nginx/sites-available/customer.merahputih-id.com`

Key changes:
- Added WebSocket upgrade map directive
- Full proxy ke Vite dev server dengan WebSocket support
- Timeout settings untuk WebSocket connections

### 2. vite.config.js (Updated)
File: `frontend/vite.config.js`

Key changes:
- Changed to use `defineConfig` dengan proper env loading
- Added explicit `client.webSocketURL` configuration
- Environment-based HMR configuration using loaded env variables

### 3. .env.development (Updated)
File: `frontend/.env.development`

Added new environment variables:
- `VITE_HMR_PROTOCOL=wss`
- `VITE_HMR_WS_URL=wss://customer.merahputih-id.com`

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

4. Copy .env.development ke server (in frontend directory)

5. Restart PM2 frontend dengan environment reload:
```bash
pm2 restart frontend --update-env
```

## Expected result:
- HMR WebSocket akan connect ke `wss://customer.merahputih-id.com` dengan explicit URL
- Hot reload akan berfungsi dengan SSL proxy melalui nginx
- Browser console tidak akan show WebSocket connection errors
- Console log akan show successful WebSocket connection ke domain yang benar

## Debug verification:
Check browser console untuk memastikan WebSocket connection URL berubah dari:
- ❌ `wss://localhost:5173/?token=...`
- ✅ `wss://customer.merahputih-id.com/?token=...`
