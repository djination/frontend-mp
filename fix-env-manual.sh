#!/bin/bash
# Manual fix untuk environment variables yang tidak terbaca

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🔧 Manual Fix: Force Environment Variables...${NC}"

# Clean build
rm -rf dist/
mkdir -p dist

# Copy public files
if [ -d "public" ]; then
    cp -r public/* dist/ 2>/dev/null || true
fi

# Build with explicitly defined environment variables
echo -e "${YELLOW}Building with forced environment variables...${NC}"
npx esbuild src/main.jsx \
    --bundle \
    --outfile=dist/main.js \
    --format=esm \
    --target=es2020 \
    --minify \
    --sourcemap \
    --loader:.jsx=jsx \
    --loader:.js=jsx \
    --loader:.css=css \
    --loader:.png=file \
    --loader:.jpg=file \
    --loader:.svg=file \
    --define:process.env.NODE_ENV='"production"' \
    --define:import.meta.env.VITE_API_BASE_URL='"https://bc.merahputih-id.com/api"' \
    --define:import.meta.env.VITE_BASE_URL='"https://bc.merahputih-id.com"' \
    --define:import.meta.env.VITE_ENV='"production"' \
    --define:import.meta.env.MODE='"production"' \
    --define:import.meta.env.PROD='true' \
    --define:global=globalThis

# Create index.html
cat > dist/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MerahPutih Business Center</title>
    <style>
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      }
      #root { min-height: 100vh; }
      .loading {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        font-size: 18px;
        color: #666;
      }
    </style>
  </head>
  <body>
    <div id="root">
      <div class="loading">Loading MerahPutih Business Center...</div>
    </div>
    <script type="module" src="/main.js"></script>
  </body>
</html>
EOF

# Verify URLs in build
echo -e "${YELLOW}Verifying build contains correct URLs...${NC}"
if grep -q "bc.merahputih-id.com" dist/main.js; then
    echo -e "${GREEN}✅ Build contains bc.merahputih-id.com${NC}"
else
    echo -e "${RED}❌ Build missing bc.merahputih-id.com${NC}"
    echo "URLs found:"
    grep -o '"[^"]*merahputih[^"]*"' dist/main.js | head -5
fi

# Set permissions
chmod -R 755 dist/

# Reload nginx
sudo systemctl reload nginx

echo -e "${GREEN}🎉 Manual fix completed!${NC}"
echo -e "${YELLOW}Test: https://customer.merahputih-id.com${NC}"
