#!/bin/bash
# Setup script untuk production deployment di Ubuntu server
# Run dengan: sudo bash setup-nginx-production.sh

set -e

echo "🚀 Setting up Nginx configuration for production..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root (sudo)${NC}"
    exit 1
fi

# Backup existing configuration
if [ -f "/etc/nginx/sites-available/frontend.conf" ]; then
    echo -e "${YELLOW}Backing up existing configuration...${NC}"
    cp /etc/nginx/sites-available/frontend.conf /etc/nginx/sites-available/frontend.conf.backup.$(date +%Y%m%d_%H%M%S)
fi

# Copy WebSocket upgrade configuration
echo -e "${YELLOW}Setting up WebSocket upgrade configuration...${NC}"
cp websocket-upgrade.conf /etc/nginx/conf.d/websocket-upgrade.conf

# Copy main site configuration
echo -e "${YELLOW}Setting up main site configuration...${NC}"
cp nginx-simple.conf /etc/nginx/sites-available/frontend.conf

# Enable site if not already enabled
if [ ! -L "/etc/nginx/sites-enabled/frontend.conf" ]; then
    echo -e "${YELLOW}Enabling site...${NC}"
    ln -s /etc/nginx/sites-available/frontend.conf /etc/nginx/sites-enabled/frontend.conf
else
    echo -e "${GREEN}✅ Site already enabled${NC}"
fi

# Remove old symbolic link if exists with different name
if [ -L "/etc/nginx/sites-enabled/frontend.conf" ]; then
    echo -e "${YELLOW}Removing old symbolic link...${NC}"
    rm -f /etc/nginx/sites-enabled/frontend.conf
fi

# Test nginx configuration
echo -e "${YELLOW}Testing Nginx configuration...${NC}"
if nginx -t; then
    echo -e "${GREEN}✅ Nginx configuration test passed${NC}"
    
    # Reload nginx
    echo -e "${YELLOW}Reloading Nginx...${NC}"
    systemctl reload nginx
    echo -e "${GREEN}✅ Nginx reloaded successfully${NC}"
    
    # Check nginx status
    if systemctl is-active --quiet nginx; then
        echo -e "${GREEN}✅ Nginx is running${NC}"
    else
        echo -e "${RED}❌ Nginx is not running${NC}"
        systemctl status nginx
    fi
else
    echo -e "${RED}❌ Nginx configuration test failed${NC}"
    nginx -t
    exit 1
fi

# Create log directory if not exists
mkdir -p /var/log/nginx
touch /var/log/nginx/frontend.access.log
touch /var/log/nginx/frontend.error.log

# Set proper permissions
chown www-data:www-data /var/log/nginx/frontend.*

echo -e "${GREEN}🎉 Production Nginx setup completed!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Make sure frontend is running: npm run dev:server"
echo "2. Check logs: tail -f /var/log/nginx/frontend.error.log"
echo "3. Test the site: https://customer.merahputih-id.com"
echo "4. Check health endpoint: https://customer.merahputih-id.com/health"
echo ""
echo -e "${YELLOW}Monitoring commands:${NC}"
echo "• nginx -t                    # Test configuration"
echo "• systemctl status nginx      # Check nginx status"
echo "• systemctl reload nginx      # Reload configuration"
echo "• tail -f /var/log/nginx/frontend.error.log"
