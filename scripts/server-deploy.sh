#!/bin/bash

# Auto Deploy Script untuk Server
# Jalankan script ini di server setelah git pull

set -e  # Exit jika ada error

PROJECT_NAME="Frontend MerahPutih"
NGINX_WEB_ROOT="/var/www/customerdb/frontend-mp/dist"
BACKUP_DIR="/var/backups/frontend"

echo "=== $PROJECT_NAME - Auto Deploy Script ==="
echo "Tanggal: $(date)"
echo

# Function untuk log dengan timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Step 1: Backup existing deployment
log "Creating backup of current deployment..."
if [ -d "$NGINX_WEB_ROOT" ]; then
    sudo mkdir -p "$BACKUP_DIR"
    sudo cp -r "$NGINX_WEB_ROOT" "$BACKUP_DIR/frontend-backup-$(date +%Y%m%d-%H%M%S)" || true
    log "Backup created successfully"
else
    log "No existing deployment found, skipping backup"
fi

# Step 2: Install/update dependencies
log "Installing dependencies..."
npm install
log "Dependencies installed"

# Step 3: Build production
log "Building production files..."
npm run build:esbuild
if [ ! -d "dist" ]; then
    log "ERROR: Build failed - dist directory not found"
    exit 1
fi
log "Build completed successfully"

# Step 4: Deploy to nginx
log "Deploying to nginx web root..."
sudo mkdir -p "$NGINX_WEB_ROOT"
sudo rm -rf "$NGINX_WEB_ROOT"/*
sudo cp -r dist/. "$NGINX_WEB_ROOT/"
sudo chown -R www-data:www-data "$NGINX_WEB_ROOT"
sudo chmod -R 755 "$NGINX_WEB_ROOT"
log "Files deployed to $NGINX_WEB_ROOT"

# Step 5: Reload nginx
log "Reloading nginx..."
sudo nginx -t
if [ $? -eq 0 ]; then
    sudo systemctl reload nginx
    log "Nginx reloaded successfully"
else
    log "ERROR: Nginx configuration test failed"
    exit 1
fi

# Step 6: Verification
log "Verifying deployment..."
if [ -f "$NGINX_WEB_ROOT/index.html" ]; then
    log "✓ index.html found"
else
    log "✗ index.html not found"
fi

if [ -f "$NGINX_WEB_ROOT/main.js" ]; then
    log "✓ main.js found"
else
    log "✗ main.js not found"
fi

if [ -f "$NGINX_WEB_ROOT/main.css" ]; then
    log "✓ main.css found"
else
    log "✗ main.css not found"
fi

if [ -f "$NGINX_WEB_ROOT/vite.svg" ]; then
    log "✓ vite.svg found"
else
    log "✗ vite.svg not found"
fi

echo
log "=== Deployment Completed Successfully ==="
echo "🌐 Website: https://customer.merahputih-id.com"
echo "📁 Files: $NGINX_WEB_ROOT"
echo "🔄 Backup: $BACKUP_DIR"
echo
log "Deployment finished at $(date)"
