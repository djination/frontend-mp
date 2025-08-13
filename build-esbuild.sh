#!/bin/bash
# Simple ESBuild script untuk server production
# Bypass Qt/OpenGL issues sepenuhnya

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🔨 Building with ESBuild (Qt/OpenGL free)...${NC}"

# Set environment
export NODE_ENV=production
export CI=true

# Clean and create dist
rm -rf dist/
mkdir -p dist

# Copy public files
if [ -d "public" ]; then
    echo -e "${YELLOW}Copying public files...${NC}"
    cp -r public/* dist/ 2>/dev/null || true
fi

# Build with esbuild
echo -e "${YELLOW}Building JavaScript bundle...${NC}"
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
    --loader:.gif=file \
    --loader:.webp=file \
    --define:process.env.NODE_ENV='"production"' \
    --define:global=globalThis \
    --jsx-factory=React.createElement \
    --jsx-fragment=React.Fragment

# Create index.html
echo -e "${YELLOW}Creating index.html...${NC}"
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

# Set permissions
chmod -R 755 dist/

# Verify build
if [ -f "dist/main.js" ] && [ -f "dist/index.html" ]; then
    echo -e "${GREEN}✅ ESBuild completed successfully!${NC}"
    
    # Show build info
    echo -e "${YELLOW}Build summary:${NC}"
    ls -lah dist/
    echo ""
    echo -e "${YELLOW}Build size:${NC}"
    du -sh dist/
    
    echo -e "${GREEN}🎉 Build ready for deployment!${NC}"
else
    echo -e "${RED}❌ Build verification failed${NC}"
    exit 1
fi
