# Fix untuk Nginx Error: unknown "connection_upgrade" variable

## Problem:
```
nginx: [emerg] unknown "connection_upgrade" variable
nginx: configuration file /etc/nginx/nginx.conf test failed
```

## Root Cause:
Variable `$connection_upgrade` tidak terdefinisi di nginx. Variable ini perlu map directive untuk WebSocket upgrade.

## Solution:

### Option 1: Add map directive ke nginx.conf (Recommended)

Edit `/etc/nginx/nginx.conf` dan tambahkan di dalam http block:

```nginx
http {
    # Existing configuration...
    
    # WebSocket upgrade mapping
    map $http_upgrade $connection_upgrade {
        default upgrade;
        '' close;
    }
    
    # Include sites-enabled files
    include /etc/nginx/sites-enabled/*;
}
```

### Option 2: Use complete site config dengan map directive

Replace `/etc/nginx/sites-available/customer.merahputih-id.com` dengan:

```nginx
# Map for WebSocket upgrade (harus di awal file, sebelum server block)
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

server {
    listen 80;
    server_name customer.merahputih-id.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name customer.merahputih-id.com;
    
    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/customer.merahputih-id.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/customer.merahputih-id.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # Main frontend proxy dengan WebSocket support
    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings untuk WebSocket
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
    
    # API proxy ke backend
    location /api/ {
        proxy_pass https://bc.merahputih-id.com/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Deployment Steps:

1. **Copy complete config:**
```bash
sudo cp frontend/nginx-hmr.conf /etc/nginx/sites-available/customer.merahputih-id.com
```

2. **Test nginx configuration:**
```bash
sudo nginx -t
```

3. **If test passes, reload nginx:**
```bash
sudo systemctl reload nginx
```

4. **If test fails, check for map directive conflicts:**
```bash
# Check if map directive already exists in nginx.conf
sudo grep -n "connection_upgrade" /etc/nginx/nginx.conf

# If exists, remove map directive from site config dan keep only server blocks
```

## Alternative: Simple fix tanpa $connection_upgrade

Jika masih bermasalah, bisa gunakan konfigurasi sederhana:

```nginx
location / {
    proxy_pass http://127.0.0.1:5173;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";  # Hard-coded instead of variable
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_read_timeout 86400;
    proxy_send_timeout 86400;
}
```
