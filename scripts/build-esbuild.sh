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
    --define:import.meta.env.VITE_API_BASE_URL='"https://bc.merahputih-id.com"' \
    --define:import.meta.env.VITE_BASE_URL='"https://bc.merahputih-id.com"' \
    --define:import.meta.env.VITE_ENV='"production"' \
    --define:import.meta.env.MODE='"production"' \
    --define:import.meta.env.PROD='true' \
    --define:global=globalThis \
    --jsx-factory=React.createElement \
    --jsx-fragment=React.Fragment

# Create a comprehensive CSS file with Ant Design styles
echo -e "${YELLOW}Creating CSS file with Ant Design styles...${NC}"
cat > dist/main.css << 'EOF'
/* Ant Design Base Styles */
.ant-layout {
  display: flex;
  flex: auto;
  flex-direction: column;
  min-height: 0;
  background: #f0f2f5;
}

.ant-layout-sider {
  position: relative;
  min-width: 0;
  background: #001529;
  transition: all 0.2s;
}

.ant-menu {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-size: 14px;
  line-height: 0;
  list-style: none;
  background: #001529;
  outline: none;
  border-right: 1px solid #f0f0f0;
  transition: background 0.3s, width 0.3s cubic-bezier(0.2, 0, 0, 1) 0s;
}

.ant-menu-dark {
  color: rgba(255, 255, 255, 0.65);
  background: #001529;
}

.ant-menu-item {
  position: relative;
  display: block;
  margin: 0;
  padding: 0 20px;
  white-space: nowrap;
  cursor: pointer;
  transition: border-color 0.3s, background 0.3s, padding 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
}

.ant-menu-item-selected {
  color: #1890ff;
  background-color: #e6f7ff;
}

.ant-layout-header {
  position: relative;
  padding: 0 50px;
  color: rgba(0, 0, 0, 0.85);
  line-height: 64px;
  background: #fff;
}

.ant-layout-content {
  flex: auto;
  min-height: 0;
  background: #fff;
  padding: 24px;
}

.ant-form {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  line-height: 1.5715;
  list-style: none;
}

.ant-form-item {
  margin-bottom: 24px;
  vertical-align: top;
}

.ant-form-item-label {
  position: relative;
  display: inline-block;
  overflow: hidden;
  white-space: nowrap;
  text-align: right;
  vertical-align: middle;
}

.ant-input {
  box-sizing: border-box;
  margin: 0;
  padding: 4px 11px;
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  line-height: 1.5715;
  background-color: #fff;
  background-image: none;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  transition: all 0.3s;
}

.ant-btn {
  line-height: 1.5715;
  position: relative;
  display: inline-block;
  font-weight: 400;
  white-space: nowrap;
  text-align: center;
  background-image: none;
  border: 1px solid transparent;
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.015);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
  user-select: none;
  touch-action: manipulation;
  height: 32px;
  padding: 4px 15px;
  font-size: 14px;
  border-radius: 6px;
  color: rgba(0, 0, 0, 0.85);
  background: #fff;
  border-color: #d9d9d9;
}

.ant-btn-primary {
  color: #fff;
  background: #1890ff;
  border-color: #1890ff;
  text-shadow: 0 -1px 0 rgba(0, 0, 0, 0.12);
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.045);
}

.ant-table {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  line-height: 1.5715;
  list-style: none;
  position: relative;
}

.ant-table-thead > tr > th {
  position: relative;
  color: rgba(0, 0, 0, 0.85);
  font-weight: 500;
  text-align: left;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.3s ease;
  padding: 16px;
}

.ant-table-tbody > tr > td {
  padding: 16px;
  overflow-wrap: break-word;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.3s;
}

.ant-select {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  line-height: 1.5715;
  list-style: none;
  position: relative;
  display: inline-block;
  cursor: pointer;
}

.ant-select-selector {
  position: relative;
  background-color: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
  padding: 4px 11px;
}

/* Fix for dark menu */
.ant-menu-dark .ant-menu-item:hover {
  background-color: transparent;
  color: #1890ff;
}

.ant-menu-dark .ant-menu-item-selected {
  background-color: #1890ff;
  color: #fff;
}
EOF

# Create index.html with CSS link
echo -e "${YELLOW}Creating index.html with CSS link...${NC}"
cat > dist/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MerahPutih Business Center</title>
    <link rel="stylesheet" href="/main.css" />
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
if [ -f "dist/main.js" ] && [ -f "dist/index.html" ] && [ -f "dist/main.css" ]; then
    echo -e "${GREEN}✅ ESBuild completed successfully!${NC}"
    
    # Show build info
    echo -e "${YELLOW}Build summary:${NC}"
    ls -lah dist/
    echo ""
    echo -e "${YELLOW}Build size:${NC}"
    du -sh dist/
    
    # Check CSS content
    echo -e "${YELLOW}CSS file size: $(du -sh dist/main.css | cut -f1)${NC}"
    
    echo -e "${GREEN}🎉 Build ready for deployment!${NC}"
else
    echo -e "${RED}❌ Build verification failed${NC}"
    echo "Missing files:"
    [ ! -f "dist/main.js" ] && echo "  - main.js"
    [ ! -f "dist/index.html" ] && echo "  - index.html"
    [ ! -f "dist/main.css" ] && echo "  - main.css"
    exit 1
fi
