#!/bin/bash
# Deploy script untuk setup frontend di server production
# Jalankan setelah build berhasil

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Deploying Frontend ke Production Server...${NC}"

# Check if build exists
if [ ! -d "dist" ] || [ ! -f "dist/main.js" ]; then
    echo -e "${RED}❌ Build tidak ditemukan. Jalankan build dulu:${NC}"
    echo "./build-esbuild.sh"
    exit 1
fi

echo -e "${YELLOW}Step 1: Setup Nginx Configuration...${NC}"
if [ -f "nginx-static-production.conf" ]; then
    sudo cp nginx-static-production.conf /etc/nginx/sites-available/frontend.conf
    echo -e "${GREEN}✅ Nginx config copied${NC}"
else
    echo -e "${RED}❌ nginx-static-production.conf tidak ditemukan${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 2: Enable Nginx Site...${NC}"
sudo ln -sf /etc/nginx/sites-available/frontend.conf /etc/nginx/sites-enabled/
echo -e "${GREEN}✅ Site enabled${NC}"

echo -e "${YELLOW}Step 3: Test Nginx Configuration...${NC}"
if sudo nginx -t; then
    echo -e "${GREEN}✅ Nginx config valid${NC}"
else
    echo -e "${RED}❌ Nginx config error${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 4: Create Web Directory...${NC}"
sudo mkdir -p /var/www/customerdb/frontend-mp/dist
echo -e "${GREEN}✅ Directory created${NC}"

echo -e "${YELLOW}Step 5: Copy Build Files...${NC}"
sudo cp -r dist/* /var/www/customerdb/frontend-mp/dist/
echo -e "${GREEN}✅ Files copied${NC}"

echo -e "${YELLOW}Step 6: Set Permissions...${NC}"
sudo chown -R www-data:www-data /var/www/customerdb/frontend-mp/dist
sudo chmod -R 755 /var/www/customerdb/frontend-mp/dist
sudo find /var/www/customerdb/frontend-mp/dist -type f -exec chmod 644 {} \;
echo -e "${GREEN}✅ Permissions set${NC}"

echo -e "${YELLOW}Step 7: Reload Nginx...${NC}"
sudo systemctl reload nginx
echo -e "${GREEN}✅ Nginx reloaded${NC}"

echo -e "${YELLOW}Step 8: Verify Deployment...${NC}"
if [ -f "/var/www/customerdb/frontend-mp/dist/index.html" ] && [ -f "/var/www/customerdb/frontend-mp/dist/main.js" ]; then
    echo -e "${GREEN}✅ Files deployed successfully${NC}"
    
    # Show deployed files
    echo -e "${YELLOW}Deployed files:${NC}"
    ls -la /var/www/customerdb/frontend-mp/dist/
    
    echo ""
    echo -e "${YELLOW}Directory size:${NC}"
    du -sh /var/www/customerdb/frontend-mp/dist/
    
else
    echo -e "${RED}❌ Deployment verification failed${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 9: Test Frontend Access...${NC}"
if curl -s -I http://localhost | head -1 | grep -q "200"; then
    echo -e "${GREEN}✅ Frontend accessible locally${NC}"
else
    echo -e "${YELLOW}⚠️ Local test failed, checking nginx status...${NC}"
    sudo systemctl status nginx --no-pager -l
fi

echo -e "${YELLOW}Step 10: Check Backend Status...${NC}"
if command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}PM2 Status:${NC}"
    pm2 status
    
    if ! pm2 list | grep -q "online"; then
        echo -e "${YELLOW}Starting backend...${NC}"
        if [ -f "/var/www/customerdb/backend/pm2.config.json" ]; then
            cd /var/www/customerdb/backend
            pm2 start pm2.config.json
        fi
    fi
else
    echo -e "${YELLOW}PM2 not found, check backend manually${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Frontend Deployment Completed!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Test website: https://customer.merahputih-id.com"
echo "2. Check nginx logs: sudo tail -f /var/log/nginx/error.log"
echo "3. Check access logs: sudo tail -f /var/log/nginx/access.log"
echo ""
echo -e "${BLUE}Deployment Summary:${NC}"
echo "- Frontend: /var/www/customerdb/frontend-mp/dist/"
echo "- Nginx config: /etc/nginx/sites-enabled/frontend.conf"
echo "- Build size: $(du -sh /var/www/customerdb/frontend-mp/dist/ | cut -f1)"
echo "- Frontend URL: https://customer.merahputih-id.com"
echo "- Backend API: https://bc.merahputih-id.com"
