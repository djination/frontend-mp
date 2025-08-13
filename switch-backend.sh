#!/bin/bash
# Switch between local and remote backend configuration

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

if [ "$1" = "remote" ]; then
    echo -e "${YELLOW}🔄 Switching to REMOTE backend (bc.merahputih-id.com)...${NC}"
    
    # Update .env.production
    cp .env.production.remote .env.production
    
    # Update nginx config for remote backend
    sed -i 's|proxy_pass http://localhost:5000/;|proxy_pass https://bc.merahputih-id.com/;|g' nginx-static-production.conf
    sed -i 's|proxy_set_header Host $host;|proxy_set_header Host bc.merahputih-id.com;|g' nginx-static-production.conf
    
    # Update build configs
    sed -i 's|localhost:5000|bc.merahputih-id.com|g' build-esbuild.sh
    sed -i 's|localhost:5000|bc.merahputih-id.com|g' build-production.sh
    sed -i 's|localhost:5000|bc.merahputih-id.com|g' esbuild.config.js
    
    echo -e "${GREEN}✅ Switched to REMOTE backend${NC}"
    echo -e "${YELLOW}Backend: https://bc.merahputih-id.com/api${NC}"
    
elif [ "$1" = "local" ]; then
    echo -e "${YELLOW}🔄 Switching to LOCAL backend (localhost:5000)...${NC}"
    
    # Update nginx config for local backend
    sed -i 's|proxy_pass https://bc.merahputih-id.com/;|proxy_pass http://localhost:5000/;|g' nginx-static-production.conf
    sed -i 's|proxy_set_header Host bc.merahputih-id.com;|proxy_set_header Host $host;|g' nginx-static-production.conf
    
    # Update build configs
    sed -i 's|bc.merahputih-id.com|localhost:5000|g' build-esbuild.sh
    sed -i 's|bc.merahputih-id.com|localhost:5000|g' build-production.sh
    sed -i 's|bc.merahputih-id.com|localhost:5000|g' esbuild.config.js
    
    # Update .env.production for local
    cat > .env.production << 'EOF'
# Production environment configuration
VITE_ENV=production
NODE_ENV=production

# API Configuration untuk production
VITE_BASE_URL=http://localhost:5000
VITE_API_BASE_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000

# HMR Configuration untuk production (disable karena tidak diperlukan)
VITE_DISABLE_HMR=true
VITE_HMR_HOST=127.0.0.1
VITE_HMR_PORT=5174
VITE_HMR_CLIENT_PORT=443

# Debug configuration
VITE_DEBUG=false
EOF
    
    echo -e "${GREEN}✅ Switched to LOCAL backend${NC}"
    echo -e "${YELLOW}Backend: http://localhost:5000/api${NC}"
    
else
    echo -e "${BLUE}🔧 Backend Configuration Switcher${NC}"
    echo ""
    echo "Usage: $0 [local|remote]"
    echo ""
    echo "Commands:"
    echo "  local   - Use local backend (localhost:5000)"
    echo "  remote  - Use remote backend (bc.merahputih-id.com)"
    echo ""
    echo "Current configuration:"
    echo "- Env file: $(grep VITE_API_BASE_URL .env.production)"
    echo "- Nginx: $(grep proxy_pass nginx-static-production.conf | head -1)"
    exit 1
fi

echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Rebuild frontend: ./build-esbuild.sh"
echo "2. Deploy: ./deploy-server.sh"
