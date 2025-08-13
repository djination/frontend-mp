#!/bin/bash
# Deploy comprehensive CSS fix ke server

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🚀 Deploying Comprehensive CSS Fix...${NC}"

# Step 1: Build dengan comprehensive CSS
echo -e "${YELLOW}Step 1: Creating comprehensive CSS...${NC}"
chmod +x fix-css-comprehensive.sh
./fix-css-comprehensive.sh

# Step 2: Verify files
echo -e "${YELLOW}Step 2: Verifying build files...${NC}"
if [ ! -f "dist/main.css" ] || [ ! -f "dist/main.js" ] || [ ! -f "dist/index.html" ]; then
    echo -e "${RED}❌ Missing required files${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All files ready!${NC}"
echo -e "${YELLOW}File sizes:${NC}"
echo "  CSS: $(du -sh dist/main.css | cut -f1)"
echo "  JS:  $(du -sh dist/main.js | cut -f1)"
echo "  HTML: $(du -sh dist/index.html | cut -f1)"

echo -e "${YELLOW}Step 3: Files ready for server upload${NC}"
echo ""
echo -e "${YELLOW}🔧 Server Commands:${NC}"
echo "# Upload files:"
echo "scp dist/main.css user@server:/var/www/customerdb/frontend-mp/dist/"
echo "scp dist/index.html user@server:/var/www/customerdb/frontend-mp/dist/"
echo ""
echo "# On server, reload nginx:"
echo "sudo systemctl reload nginx"
echo "sudo systemctl status nginx"
echo ""
echo "# Test CSS loading:"
echo "curl -I https://customer.merahputih-id.com/main.css"
echo ""
echo -e "${YELLOW}🌐 Test URLs:${NC}"
echo "Frontend: https://customer.merahputih-id.com"
echo "Backend:  https://bc.merahputih-id.com"

echo -e "${GREEN}🎉 Ready for deployment!${NC}"
