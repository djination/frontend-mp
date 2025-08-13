#!/bin/bash
# Quick rebuild and redeploy script
# Untuk fix environment variables issue

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🔧 Quick Fix: Rebuild & Redeploy...${NC}"

# Step 1: Clean build
echo -e "${YELLOW}Step 1: Cleaning previous build...${NC}"
rm -rf dist/

# Step 2: Rebuild with fixed env vars
echo -e "${YELLOW}Step 2: Rebuilding with proper environment variables...${NC}"
./build-esbuild.sh

# Step 3: Redeploy if build successful
if [ -d "dist" ] && [ -f "dist/main.js" ]; then
    echo -e "${GREEN}✅ Build successful, deploying...${NC}"
    ./deploy-server.sh
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Quick fix completed!${NC}"
echo -e "${YELLOW}Test URL: https://customer.merahputih-id.com${NC}"
