#!/bin/bash

# PM2 Deployment Script for Frontend
# File: deploy-frontend-pm2.sh

set -e  # Exit on any error

echo "🚀 Starting frontend deployment with PM2..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Change to project directory
PROJECT_DIR="/var/www/customerdb/frontend-mp"
print_status "Changing to project directory: $PROJECT_DIR"
cd "$PROJECT_DIR"

# Load NVM and use Node.js 20
print_status "Loading NVM and switching to Node.js 20..."
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Use Node.js 20
nvm use 20
print_success "Node.js version: $(node --version)"
print_success "NPM version: $(npm --version)"

# Stop existing PM2 process if running
print_status "Stopping existing PM2 processes..."
pm2 stop femp 2>/dev/null || print_warning "No existing femp process found"
pm2 delete femp 2>/dev/null || print_warning "No existing femp process to delete"

# Install dependencies (if needed)
print_status "Installing/updating dependencies..."
npm install

# Build for production
print_status "Building application for production..."
npm run build:prod

# Verify build output
if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
    print_error "Build failed! dist directory or index.html not found"
    exit 1
fi

print_success "Build completed successfully!"
print_status "Build output:"
ls -la dist/

# Start with PM2
print_status "Starting application with PM2..."
pm2 start npm --name "femp" -- start

# Save PM2 configuration
print_status "Saving PM2 configuration..."
pm2 save

# Show PM2 status
print_status "PM2 Status:"
pm2 list

# Show logs for a few seconds
print_status "Showing application logs (5 seconds)..."
timeout 5 pm2 logs femp || true

print_success "🎉 Frontend deployment completed successfully!"
print_status "Application is running at: http://localhost:3000"
print_status "You can check logs with: pm2 logs femp"
print_status "You can monitor with: pm2 monit"

echo ""
print_status "Useful PM2 commands:"
echo "  pm2 restart femp  # Restart the app"
echo "  pm2 stop femp     # Stop the app"
echo "  pm2 logs femp     # View logs"
echo "  pm2 monit                # Monitor all processes"
