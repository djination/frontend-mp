#!/bin/bash
# Quick rebuild and redeploy with fixed environment variables

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🔧 Quick Fix: Rebuilding with proper environment variables...${NC}"

# Step 1: Clean build
echo -e "${YELLOW}Step 1: Cleaning previous build...${NC}"
rm -rf dist/

# Step 2: Rebuild with fixed env vars
echo -e "${YELLOW}Step 2: Rebuilding with backend: https://bc.merahputih-id.com/api${NC}"
./build-esbuild.sh

# Step 3: Test if build contains correct URLs
echo -e "${YELLOW}Step 3: Verifying build contains correct URLs...${NC}"
if grep -q "bc.merahputih-id.com" dist/main.js; then
    echo -e "${GREEN}✅ Build contains correct backend URL${NC}"
else
    echo -e "${RED}❌ Build still contains wrong URL, checking...${NC}"
    echo "URLs found in build:"
    grep -o "localhost:[0-9]*\|[a-zA-Z.-]*merahputih[a-zA-Z.-]*" dist/main.js | head -5
fi

# Step 4: Files already in correct location
echo -e "${YELLOW}Step 4: Files already in correct location${NC}"
ls -la dist/

# Step 5: Reload nginx to clear cache
echo -e "${YELLOW}Step 5: Reloading nginx...${NC}"
sudo systemctl reload nginx

echo -e "${GREEN}🎉 Quick fix completed!${NC}"
echo -e "${YELLOW}Test URLs:${NC}"
echo "- Frontend: https://customer.merahputih-id.com"
echo "- Backend API: https://bc.merahputih-id.com/api"
echo ""
echo -e "${YELLOW}Check browser console for any remaining errors${NC}"
