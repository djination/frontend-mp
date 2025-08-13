# 🌐 Domain & URL Configuration Summary

## Domain Setup yang Benar

### Frontend (Customer Portal)
- **Domain**: `customer.merahputih-id.com`
- **Purpose**: Customer-facing React application
- **Files**: Static files (HTML, JS, CSS)
- **Location**: `/var/www/customerdb/frontend-mp/dist/`

### Backend (API Server)
- **Domain**: `bc.merahputih-id.com`
- **Purpose**: API server untuk semua services
- **Files**: NestJS application
- **Location**: `/var/www/customerdb/backend/`

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
https://bc.merahputih-id.com/api/auth/login   # Authentication
https://bc.merahputih-id.com/api/account      # Account APIs
https://bc.merahputih-id.com/api/user         # User APIs
https://bc.merahputih-id.com/api/health       # Health check
```

## Environment Configuration

### Frontend (.env.production)
```bash
# API calls ke backend
VITE_BASE_URL=https://bc.merahputih-id.com
VITE_API_BASE_URL=https://bc.merahputih-id.com/api
VITE_WS_URL=wss://bc.merahputih-id.com
```

### Nginx Configuration
```nginx
# Frontend server
server_name customer.merahputih-id.com;
root /var/www/customerdb/frontend-mp/dist;

# API proxy
location /api/ {
    proxy_pass https://bc.merahputih-id.com/;
    proxy_set_header Host bc.merahputih-id.com;
}
```

## Deployment Commands (Corrected)

### Test Frontend
```bash
curl -I https://customer.merahputih-id.com
```

### Test Backend API
```bash
curl -I https://bc.merahputih-id.com/api/health
```

### Full Test Flow
```bash
# 1. Frontend loads
curl https://customer.merahputih-id.com

# 2. API call from frontend
curl https://customer.merahputih-id.com/api/account
# (This proxies to bc.merahputih-id.com/api/account)

# 3. Direct API call
curl https://bc.merahputih-id.com/api/health
```

## SSL Certificates Needed

1. **customer.merahputih-id.com** - Frontend SSL
2. **bc.merahputih-id.com** - Backend SSL

## Summary
- ✅ **Frontend**: `customer.merahputih-id.com` (serves React app)
- ✅ **Backend**: `bc.merahputih-id.com` (serves API)
- ✅ **API Calls**: Frontend calls `/api/*` → proxied to backend
- ✅ **Environment**: Production config updated
- ✅ **Nginx**: Configured for correct domains
