# 🌐 Domain & URL Configuration Summary

## Domain Setup yang Benar

### Frontend (Customer Portal)
- **Domain**: `customer.merahputih-id.com`
- **Purpose**: Customer-facing React application
- **Files**: Static files (HTML, JS, CSS)
- **Location**: `/var/www/customerdb/frontend-mp/dist/`

### Backend (API Server)
- **Domain**: `localhost:3000` (Development)
- **Purpose**: NestJS API server (be-nest-mp)
- **Files**: NestJS application
- **Location**: `../be-nest-mp/`

## URL Structure

### Frontend URLs
```
https://customer.merahputih-id.com/           # Landing page
https://customer.merahputih-id.com/login      # Login page
https://customer.merahputih-id.com/dashboard  # Customer dashboard
https://customer.merahputih-id.com/account    # Account management
```

### Backend APIs
```
http://localhost:3000/api/auth/login   # Authentication
http://localhost:3000/api/account      # Account APIs
http://localhost:3000/api/user         # User APIs
http://localhost:3000/api/health       # Health check
http://localhost:3000/api             # Swagger Documentation
```

## Environment Configuration

### Frontend (.env.production)
```bash
# API calls ke backend lokal
VITE_BASE_URL=http://localhost:3000
VITE_API_BASE_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000
```

### Nginx Configuration
```nginx
# Frontend server
server_name customer.merahputih-id.com;
root /var/www/customerdb/frontend-mp/dist;

# API proxy ke backend lokal
location /api/ {
    proxy_pass http://localhost:3000/;
    proxy_set_header Host $host;
}
```

## Deployment Commands (Corrected)

### Test Frontend
```bash
curl -I https://customer.merahputih-id.com
```

### Test Backend API
```bash
curl -I http://localhost:3000/api
curl http://localhost:3000/api # Swagger docs
```

### Full Test Flow
```bash
# 1. Frontend loads
curl https://customer.merahputih-id.com

# 2. API call from frontend
curl https://customer.merahputih-id.com/api/account
# (This proxies to bc.merahputih-id.com/api/account)

# 3. Direct API call
curl http://localhost:3000/api
```

## Development Workflow

### Start Both Services
```bash
# From frontend directory
./start-dev.sh
```

This will:
1. Start NestJS backend (be-nest-mp) at http://localhost:3000
2. Build frontend with correct API URLs
3. Deploy frontend to nginx
4. Setup proxy from frontend to backend

## SSL Certificates Needed

1. **customer.merahputih-id.com** - Frontend SSL only

## Summary
- ✅ **Frontend**: `customer.merahputih-id.com` (serves React app)
- ✅ **Backend**: `localhost:3000` (serves NestJS API from be-nest-mp)
- ✅ **API Calls**: Frontend calls `/api/*` → proxied to localhost:3000
- ✅ **Environment**: Production config updated for local backend
- ✅ **Nginx**: Configured for localhost backend proxy
