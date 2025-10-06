# OAuth Proxy Fix untuk Production

## Masalah
OAuth token request mengembalikan HTML (React app) alih-alih JSON response ketika aplikasi berjalan di production domain `customer.merahputih-id.com`.

## Root Cause
Vite proxy configuration hanya bekerja di development mode. Di production, nginx harus menangani proxy untuk external API endpoints.

## Solusi
Update nginx configuration untuk menambahkan proxy untuk:
- `/oauth/` → `http://test-stg01.merahputih-id.tech:9002/`
- `/external-api-crud/` → `http://test-stg01.merahputih-id.tech:5002/api/`
- `/external-api/` → `http://test-stg01.merahputih-id.tech:5002/api/cdt/core/master/`

## Deployment Steps

### 1. Backup Current Configuration
```bash
sudo cp /etc/nginx/sites-available/frontend.conf /etc/nginx/sites-available/frontend.conf.backup
```

### 2. Deploy New Configuration
```bash
# Copy updated configuration
sudo cp nginx-reverse-proxy.conf /etc/nginx/sites-available/frontend.conf

# Test configuration
sudo nginx -t

# Reload nginx if test passes
sudo systemctl reload nginx
```

### 3. Automated Deployment
Atau gunakan script yang sudah disediakan:
```bash
# Make script executable
chmod +x deploy-nginx-oauth.sh

# Run deployment script
./deploy-nginx-oauth.sh
```

### 4. Test OAuth Endpoint
```bash
# Make test script executable
chmod +x test-oauth-endpoint.sh

# Run test script
./test-oauth-endpoint.sh
```

## Manual Testing

### Test OAuth Token Request
```bash
curl -X POST https://customer.merahputih-id.com/oauth/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -H 'Authorization: Basic YW1wLWFkbWluLWNyZWRlbnRpYWwtaWQ6Ym1wLWFkbWluLWNyZWRlbnRpYWwtc2VjcmV0' \
  -d 'grant_type=client_credentials&scope=admin.internal.read admin.internal.create'
```

Expected Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### Test External API
```bash
# Using obtained token
curl -X GET "https://customer.merahputih-id.com/external-api/machine/query?page=1&limit=5" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Troubleshooting

### If OAuth Still Returns HTML
1. Check nginx configuration:
   ```bash
   sudo nginx -t
   ```

2. Check nginx error logs:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

3. Restart nginx (not just reload):
   ```bash
   sudo systemctl restart nginx
   ```

### Check Nginx Status
```bash
sudo systemctl status nginx
```

### Check Current Configuration
```bash
sudo cat /etc/nginx/sites-available/frontend.conf | grep -A 20 "location /oauth"
```

## Files Modified
- `nginx-reverse-proxy.conf` - Updated nginx configuration with OAuth proxy
- `deploy-nginx-oauth.sh` - Deployment script
- `test-oauth-endpoint.sh` - Testing script

## Environment Variables
Pastikan environment variables sudah benar di production:
- `VITE_ENV=server` atau `VITE_ENV=production`
- `NODE_ENV=production`
- `VITE_API_BASE_URL=https://bc.merahputih-id.com`

## Notes
- Nginx proxy configuration akan menangani CORS headers
- Timeout diatur ke 30-60 detik untuk OAuth dan external API
- Basic authentication header untuk OAuth akan di-forward dengan benar
- Authorization header untuk external API akan di-forward dengan benar