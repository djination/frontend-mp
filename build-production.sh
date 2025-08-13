#!/bin/bash
# Build script untuk server production Ubuntu
# Mengatasi masalah Qt/OpenGL dengan environment yang tepat

set -e

echo "🔨 Building frontend untuk production server..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Set environment variables untuk headless build
export NODE_ENV=production
export CI=true
export DISABLE_OPENCOLLECTIVE=true

# Set Qt environment untuk headless
export QT_QPA_PLATFORM=minimal
export QT_LOGGING_RULES="*=false"
export QTWEBENGINE_DISABLE_SANDBOX=1
export LIBGL_ALWAYS_SOFTWARE=1

# Set build environment
export VITE_ENV=production
export VITE_DEBUG=false

echo -e "${YELLOW}Setting up build environment...${NC}"

# Check dependencies
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm ci --production=false
fi

# Clean previous build
echo -e "${YELLOW}Cleaning previous build...${NC}"
rm -rf dist/
rm -rf node_modules/.vite

# Build dengan config production
echo -e "${YELLOW}Building application...${NC}"

# Try different build methods
BUILD_SUCCESS=false

# Method 1: Build dengan config production
if ! $BUILD_SUCCESS; then
    echo -e "${YELLOW}Trying production config build...${NC}"
    if npm run build:server 2>/dev/null; then
        BUILD_SUCCESS=true
        echo -e "${GREEN}✅ Production config build successful${NC}"
    fi
fi

# Method 2: Build dengan xvfb
if ! $BUILD_SUCCESS; then
    echo -e "${YELLOW}Trying xvfb build...${NC}"
    if command -v xvfb-run &> /dev/null; then
        if xvfb-run -a --server-args="-screen 0 1024x768x24" npm run build:server 2>/dev/null; then
            BUILD_SUCCESS=true
            echo -e "${GREEN}✅ Xvfb build successful${NC}"
        fi
    else
        echo -e "${YELLOW}Installing xvfb...${NC}"
        sudo apt update && sudo apt install -y xvfb
        if xvfb-run -a --server-args="-screen 0 1024x768x24" npm run build:server 2>/dev/null; then
            BUILD_SUCCESS=true
            echo -e "${GREEN}✅ Xvfb build successful${NC}"
        fi
    fi
fi

# Method 3: Build dengan minimal dependencies
if ! $BUILD_SUCCESS; then
    echo -e "${YELLOW}Trying minimal build...${NC}"
    if NODE_OPTIONS="--max-old-space-size=2048" npm run build:server 2>/dev/null; then
        BUILD_SUCCESS=true
        echo -e "${GREEN}✅ Minimal build successful${NC}"
    fi
fi

if ! $BUILD_SUCCESS; then
    echo -e "${RED}❌ All build methods failed${NC}"
    echo -e "${YELLOW}Attempting fallback build with esbuild...${NC}"
    
    # Try with esbuild config first
    if [ -f "esbuild.config.js" ]; then
        if node esbuild.config.js 2>/dev/null; then
            BUILD_SUCCESS=true
            echo -e "${GREEN}✅ ESBuild config build successful${NC}"
        fi
    fi
    
    # Fallback to direct esbuild command
    if ! $BUILD_SUCCESS; then
        # Create dist directory
        mkdir -p dist
        
        # Copy public files first
        if [ -d "public" ]; then
            cp -r public/* dist/ 2>/dev/null || true
        fi
        
        # Create index.html if not exists
        if [ ! -f "dist/index.html" ]; then
            if [ -f "index.template.html" ]; then
                cp index.template.html dist/index.html
            else
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
            fi
        fi
        
        # Fallback: Manual build dengan esbuild
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
            --define:import.meta.env.VITE_API_BASE_URL='"http://localhost:5000/api"' \
            --define:import.meta.env.VITE_BASE_URL='"http://localhost:5000"' \
            --define:import.meta.env.VITE_ENV='"production"' \
            --define:import.meta.env.MODE='"production"' \
            --define:import.meta.env.PROD='true' \
            --define:global=globalThis
        
        if [ -f "dist/main.js" ] && [ -f "dist/index.html" ]; then
            echo -e "${GREEN}✅ Fallback build successful${NC}"
            BUILD_SUCCESS=true
        fi
    fi
fi

if $BUILD_SUCCESS; then
    # Verify build output - check for main.js first, then ensure index.html exists
    if [ -d "dist" ] && [ -f "dist/main.js" ]; then
        
        # Ensure index.html exists
        if [ ! -f "dist/index.html" ]; then
            if [ -f "index.template.html" ]; then
                cp index.template.html dist/index.html
            else
                cat > dist/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MerahPutih Business Center</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/main.js"></script>
  </body>
</html>
EOF
            fi
        fi
        
        echo -e "${GREEN}✅ Build completed successfully${NC}"
        
        # Set proper permissions
        chmod -R 755 dist/
        
        # Show build info
        echo -e "${YELLOW}Build summary:${NC}"
        ls -lah dist/
        echo ""
        echo -e "${YELLOW}Build size:${NC}"
        du -sh dist/
        
        # Optional: Setup nginx static config
        if [ -f "nginx-static-production.conf" ]; then
            echo -e "${YELLOW}Nginx static config available. To apply:${NC}"
            echo "sudo cp nginx-static-production.conf /etc/nginx/sites-available/frontend.conf"
            echo "sudo nginx -t && sudo systemctl reload nginx"
        fi
        
    else
        echo -e "${RED}❌ Build verification failed - missing dist/main.js${NC}"
        echo -e "${YELLOW}Checking dist contents:${NC}"
        ls -la dist/ 2>/dev/null || echo "No dist directory found"
        exit 1
    fi
else
    echo -e "${RED}❌ All build attempts failed${NC}"
    echo -e "${YELLOW}Consider building on local machine and uploading dist/${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Frontend build completed for production!${NC}"
