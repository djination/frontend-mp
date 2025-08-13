#!/bin/bash

# Quick deployment script
# File: quick-deploy.sh

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Use Node.js 20
nvm use 20

# Build and start
npm run build:prod && pm2 restart femp || pm2 start ecosystem.config.js
