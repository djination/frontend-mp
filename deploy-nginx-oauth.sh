#!/bin/bash

# Script untuk update nginx configuration untuk OAuth proxy
# Setelah update nginx-reverse-proxy.conf

echo "🔧 Updating nginx configuration for OAuth proxy..."

# Backup current config
sudo cp /etc/nginx/sites-available/frontend.conf /etc/nginx/sites-available/frontend.conf.backup.$(date +%Y%m%d_%H%M%S)

# Copy new config
sudo cp nginx-reverse-proxy.conf /etc/nginx/sites-available/frontend.conf

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration test passed"
    
    # Reload nginx
    echo "🔄 Reloading nginx..."
    sudo systemctl reload nginx
    
    if [ $? -eq 0 ]; then
        echo "✅ Nginx reloaded successfully"
        echo "🎉 OAuth proxy configuration deployed!"
        
        # Show status
        echo "📊 Nginx status:"
        sudo systemctl status nginx --no-pager -l
        
        echo ""
        echo "🔗 Test OAuth endpoint:"
        echo "curl -X POST https://customer.merahputih-id.com/oauth/token \\"
        echo "  -H 'Content-Type: application/x-www-form-urlencoded' \\"
        echo "  -H 'Authorization: Basic $(echo -n bmp-admin-credential-id:bmp-admin-credential-secret | base64)' \\"
        echo "  -d 'grant_type=client_credentials&scope=admin.internal.read admin.internal.create'"
        
    else
        echo "❌ Failed to reload nginx"
        exit 1
    fi
else
    echo "❌ Nginx configuration test failed"
    echo "Please check the configuration file"
    exit 1
fi