#!/bin/bash
# Deploy script untuk frontend ke server production
# Upload build hasil local ke server

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Server configuration
SERVER_USER="root"
SERVER_HOST="bc.merahputih-id.com"
SERVER_PATH="/var/www/html/frontend"

echo -e "${YELLOW}🚀 Deploying frontend ke production server...${NC}"

# Check if dist folder exists
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Folder dist tidak ditemukan. Jalankan build dulu:${NC}"
    echo "npm run build"
    exit 1
fi

# Backup current deployment
echo -e "${YELLOW}Backing up current deployment...${NC}"
ssh $SERVER_USER@$SERVER_HOST "
    if [ -d '$SERVER_PATH' ]; then
        sudo cp -r $SERVER_PATH ${SERVER_PATH}.backup.\$(date +%Y%m%d_%H%M%S)
    fi
"

# Create directory if not exists
echo -e "${YELLOW}Creating deployment directory...${NC}"
ssh $SERVER_USER@$SERVER_HOST "
    sudo mkdir -p $SERVER_PATH
    sudo chown -R www-data:www-data $SERVER_PATH
    sudo chmod -R 755 $SERVER_PATH
"

# Upload build files
echo -e "${YELLOW}Uploading build files...${NC}"
rsync -avz --delete \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='*.log' \
    dist/ $SERVER_USER@$SERVER_HOST:$SERVER_PATH/

# Set proper permissions
echo -e "${YELLOW}Setting permissions...${NC}"
ssh $SERVER_USER@$SERVER_HOST "
    sudo chown -R www-data:www-data $SERVER_PATH
    sudo chmod -R 755 $SERVER_PATH
    sudo find $SERVER_PATH -type f -exec chmod 644 {} \;
"

# Deploy nginx config if available
if [ -f "nginx-static-production.conf" ]; then
    echo -e "${YELLOW}Deploying nginx configuration...${NC}"
    scp nginx-static-production.conf $SERVER_USER@$SERVER_HOST:/tmp/
    ssh $SERVER_USER@$SERVER_HOST "
        sudo cp /tmp/nginx-static-production.conf /etc/nginx/sites-available/frontend.conf
        sudo ln -sf /etc/nginx/sites-available/frontend.conf /etc/nginx/sites-enabled/
        sudo nginx -t && sudo systemctl reload nginx
    "
fi

# Verify deployment
echo -e "${YELLOW}Verifying deployment...${NC}"
RESPONSE=\$(curl -s -o /dev/null -w "%{http_code}" https://bc.merahputih-id.com)
if [ "\$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Deployment successful! Site is accessible${NC}"
else
    echo -e "${RED}⚠️  Site returned HTTP \$RESPONSE${NC}"
fi

echo -e "${GREEN}🎉 Frontend deployment completed!${NC}"
echo -e "${YELLOW}URL: https://bc.merahputih-id.com${NC}"
