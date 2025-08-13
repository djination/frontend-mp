#!/bin/bash
# Start script untuk development/testing backend + frontend

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting Backend & Frontend Services...${NC}"

# Check if we're in the right directory structure
if [ ! -d "../be-nest-mp" ]; then
    echo -e "${YELLOW}⚠️ Backend folder not found at ../be-nest-mp${NC}"
    echo "Make sure you're running this from the frontend directory"
    exit 1
fi

# Start backend in background
echo -e "${YELLOW}Step 1: Starting NestJS Backend (be-nest-mp)...${NC}"
cd ../be-nest-mp

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    npm install
fi

# Start backend in background
echo -e "${YELLOW}Starting backend at http://localhost:5000${NC}"
npm run start:dev &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 5

# Go back to frontend
cd ../frontend

# Build and deploy frontend
echo -e "${YELLOW}Step 2: Building Frontend...${NC}"
./build-esbuild.sh

echo -e "${YELLOW}Step 3: Deploying Frontend...${NC}"
./deploy-server.sh

echo -e "${GREEN}✅ Services Started Successfully!${NC}"
echo ""
echo -e "${BLUE}Service URLs:${NC}"
echo "- Backend API: http://localhost:5000"
echo "- Backend Swagger: http://localhost:5000/api"
echo "- Frontend: https://customer.merahputih-id.com"
echo ""
echo -e "${YELLOW}To stop backend: kill $BACKEND_PID${NC}"
echo -e "${YELLOW}To view backend logs: tail -f ../be-nest-mp/logs/* ${NC}"

# Keep script running
echo -e "${YELLOW}Press Ctrl+C to stop all services...${NC}"
wait $BACKEND_PID
