#!/bin/bash
# Quick deploy dengan CSS fix

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🚀 Quick Deploy dengan CSS Fix...${NC}"

# Step 1: Build
echo -e "${YELLOW}Step 1: Building dengan ESBuild...${NC}"
./build-esbuild.sh

# Step 2: Verify CSS exists
if [ ! -f "dist/main.css" ]; then
    echo -e "${RED}❌ CSS file missing after build${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed dengan CSS!${NC}"
echo -e "${YELLOW}Files ready:${NC}"
ls -la dist/

echo -e "${YELLOW}Upload files berikut ke server:${NC}"
echo "  - dist/main.js"
echo "  - dist/main.css" 
echo "  - dist/index.html"
echo "  - dist/vite.svg"

echo -e "${YELLOW}Commands untuk server:${NC}"
echo "1. Upload: scp -r dist/* user@server:/var/www/customerdb/frontend-mp/dist/"
echo "2. Reload: sudo systemctl reload nginx"
echo "3. Test: curl -I https://customer.merahputih-id.com/main.css"

echo -e "${GREEN}🎉 Ready for deployment!${NC}"
