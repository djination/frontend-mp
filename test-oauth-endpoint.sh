#!/bin/bash

# Script untuk test OAuth endpoint setelah nginx configuration update

echo "🧪 Testing OAuth endpoint after nginx configuration update..."

# Test OAuth token request
echo "1. Testing OAuth token request..."
OAUTH_RESPONSE=$(curl -s -X POST https://customer.merahputih-id.com/oauth/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -H 'Authorization: Basic YW1wLWFkbWluLWNyZWRlbnRpYWwtaWQ6Ym1wLWFkbWluLWNyZWRlbnRpYWwtc2VjcmV0' \
  -d 'grant_type=client_credentials&scope=admin.internal.read admin.internal.create')

echo "OAuth Response:"
echo "$OAUTH_RESPONSE" | jq . 2>/dev/null || echo "$OAUTH_RESPONSE"

# Check if we got a valid token response
if echo "$OAUTH_RESPONSE" | grep -q "access_token"; then
    echo "✅ OAuth token endpoint working correctly!"
    
    # Extract token for further testing
    ACCESS_TOKEN=$(echo "$OAUTH_RESPONSE" | jq -r '.access_token' 2>/dev/null)
    
    if [ "$ACCESS_TOKEN" != "null" ] && [ -n "$ACCESS_TOKEN" ]; then
        echo "🔑 Access token obtained: ${ACCESS_TOKEN:0:20}..."
        
        # Test external API with token
        echo ""
        echo "2. Testing external API with obtained token..."
        API_RESPONSE=$(curl -s -X GET "https://customer.merahputih-id.com/external-api/machine/query?page=1&limit=5" \
          -H "Authorization: Bearer $ACCESS_TOKEN")
        
        echo "External API Response:"
        echo "$API_RESPONSE" | jq . 2>/dev/null || echo "$API_RESPONSE"
        
        if echo "$API_RESPONSE" | grep -q "data"; then
            echo "✅ External API working correctly!"
        else
            echo "⚠️ External API response might have issues"
        fi
    else
        echo "⚠️ Could not extract access token from response"
    fi
    
else
    echo "❌ OAuth token endpoint not working correctly"
    echo "Response contains HTML instead of JSON - proxy might not be configured correctly"
    
    # Check if response contains HTML
    if echo "$OAUTH_RESPONSE" | grep -q "<html>"; then
        echo "🔍 Detected HTML response - nginx proxy not working"
        echo "Please check nginx configuration and restart nginx"
    fi
fi

echo ""
echo "🔍 Additional debugging info:"
echo "- Current domain: https://customer.merahputih-id.com"
echo "- OAuth endpoint: /oauth/token"
echo "- External API endpoint: /external-api/machine/query"
echo "- Check nginx logs: sudo tail -f /var/log/nginx/error.log"