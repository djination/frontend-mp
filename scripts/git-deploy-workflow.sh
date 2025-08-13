#!/bin/bash

# Git Deploy Workflow - Build di Server
# Workflow simple untuk deploy frontend dengan build di server

echo "=== Git Deploy Workflow - Build di Server ==="
echo

# Step 1: Di Local - Push code ke git
echo "STEP 1: Di Local (Windows/Development)"
echo "1. Pastikan semua perubahan sudah di-commit:"
echo "   git add ."
echo "   git commit -m 'Update frontend features'"
echo "   git push origin main"
echo

# Step 2: Di Server - Pull dan build
echo "STEP 2: Di Server (Ubuntu Production)"
echo "1. Masuk ke folder frontend:"
echo "   cd /path/to/frontend"
echo
echo "2. Pull perubahan terbaru:"
echo "   git pull origin main"
echo
echo "3. Install dependencies (jika ada perubahan package.json):"
echo "   npm install"
echo
echo "4. Build production:"
echo "   npm run build"
echo
echo "5. Deploy ke nginx:"
echo "   sudo cp -r dist/* /var/www/frontend/"
echo "   sudo systemctl reload nginx"
echo

# Verification
echo "STEP 3: Verifikasi"
echo "1. Cek website: https://customer.merahputih-id.com"
echo "2. Cek CSS loading dengan F12 Developer Tools"
echo "3. Test fitur yang baru ditambahkan"
echo

echo "=== Workflow Selesai ==="
echo "Note: Workflow ini tidak perlu commit file dist/ ke git"
echo "File build hanya ada di server untuk production"
