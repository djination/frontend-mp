#!/bin/bash
# Production deployment script untuk PM2 + Nginx setup

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🚀 Production Deployment: PM2 + Nginx Setup${NC}"

# Step 1: Build production
echo -e "${YELLOW}Step 1: Building production bundle...${NC}"
./build-esbuild.sh

# Step 2: Install serve globally if not exists
echo -e "${YELLOW}Step 2: Checking serve package...${NC}"
if ! npm list -g serve > /dev/null 2>&1; then
    echo -e "${YELLOW}Installing serve globally...${NC}"
    npm install -g serve
else
    echo -e "${GREEN}✅ serve already installed${NC}"
fi

# Step 3: Create deployment package
echo -e "${YELLOW}Step 3: Creating deployment package...${NC}"
tar -czf frontend-production.tar.gz dist/ pm2.config.json nginx-frontend-production.conf

echo -e "${GREEN}✅ Production package created: frontend-production.tar.gz${NC}"

# Step 4: Generate deployment commands
echo -e "${YELLOW}Step 4: Generating deployment commands...${NC}"
cat > deploy-commands.sh << 'EOF'
#!/bin/bash
# Commands to run on production server

set -e

echo "🚀 Deploying MerahPutih Frontend Production..."

# Extract files
tar -xzf frontend-production.tar.gz

# Install serve if needed
npm install -g serve

# Stop existing PM2 processes
pm2 stop merahputih-frontend 2>/dev/null || true
pm2 delete merahputih-frontend 2>/dev/null || true

# Start frontend with PM2
pm2 start pm2.config.json --only merahputih-frontend

# Save PM2 configuration
pm2 save

# Setup nginx
sudo cp nginx-frontend-production.conf /etc/nginx/sites-available/customer-frontend.conf
sudo ln -sf /etc/nginx/sites-available/customer-frontend.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Check status
pm2 status
pm2 logs merahputih-frontend --lines 10

echo "✅ Frontend deployed successfully!"
echo "🌐 Access: https://customer.merahputih-id.com"
EOF

chmod +x deploy-commands.sh

echo -e "${GREEN}🎉 Production deployment ready!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Upload frontend-production.tar.gz to server"
echo "2. Run: ./deploy-commands.sh"
echo ""
echo -e "${YELLOW}Server commands:${NC}"
echo "scp frontend-production.tar.gz user@server:/var/www/customerdb/frontend-mp/"
echo "ssh user@server"
echo "cd /var/www/customerdb/frontend-mp"
echo "./deploy-commands.sh"
echo ""
echo -e "${YELLOW}Architecture:${NC}"
echo "┌─ customer.merahputih-id.com (Nginx:443)"
echo "│  ├─ Static files: /var/www/customerdb/frontend-mp/dist"
echo "│  └─ Dynamic: → localhost:3000 (PM2 serve)"
echo "└─ API calls: → https://bc.merahputih-id.com"
