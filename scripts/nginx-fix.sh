#!/bin/bash
# Fix nginx configuration untuk CSS dan static assets

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🔧 Fixing Nginx Configuration untuk CSS/Static Assets...${NC}"

# Step 1: Update nginx config
echo -e "${YELLOW}Step 1: Applying nginx configuration...${NC}"
sudo cp nginx-frontend.conf /etc/nginx/sites-available/frontend.conf

# Step 2: Test nginx config
echo -e "${YELLOW}Step 2: Testing nginx configuration...${NC}"
if sudo nginx -t; then
    echo -e "${GREEN}✅ Nginx config valid${NC}"
else
    echo -e "${RED}❌ Nginx config error${NC}"
    exit 1
fi

# Step 3: Reload nginx
echo -e "${YELLOW}Step 3: Reloading nginx...${NC}"
sudo systemctl reload nginx

# Step 4: Clear any cache
echo -e "${YELLOW}Step 4: Clearing nginx cache (if any)...${NC}"
sudo rm -rf /var/cache/nginx/* 2>/dev/null || true

# Step 5: Check static files
echo -e "${YELLOW}Step 5: Checking static files...${NC}"
if [ -f "/var/www/customerdb/frontend-mp/dist/main.css" ]; then
    echo -e "${GREEN}✅ CSS file exists${NC}"
    echo "CSS file size: $(du -sh /var/www/customerdb/frontend-mp/dist/main.css)"
else
    echo -e "${RED}❌ CSS file missing${NC}"
fi

if [ -f "/var/www/customerdb/frontend-mp/dist/main.js" ]; then
    echo -e "${GREEN}✅ JS file exists${NC}"
    echo "JS file size: $(du -sh /var/www/customerdb/frontend-mp/dist/main.js)"
else
    echo -e "${RED}❌ JS file missing${NC}"
fi

# Step 6: Test file access
echo -e "${YELLOW}Step 6: Testing file access...${NC}"
echo "Testing CSS access:"
curl -I https://customer.merahputih-id.com/main.css

echo ""
echo "Testing JS access:"
curl -I https://customer.merahputih-id.com/main.js

echo ""
echo -e "${GREEN}🎉 Nginx configuration fixed!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Hard refresh browser (Ctrl+Shift+R)"
echo "2. Clear browser cache"
echo "3. Check Developer Tools for any remaining errors"
echo ""
echo -e "${YELLOW}Test URL: https://customer.merahputih-id.com${NC}"
