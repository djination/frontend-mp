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
/* Reset and base styles */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f0f2f5;
}

#root {
  min-height: 100vh;
}

/* Ant Design Layout Styles */
.ant-layout {
  display: flex;
  flex: auto;
  flex-direction: column;
  min-height: 100vh;
  background: #f0f2f5;
}

.ant-layout-has-sider {
  flex-direction: row;
}

.ant-layout-sider {
  position: relative;
  min-width: 0;
  background: #001529;
  transition: all 0.2s;
  flex: 0 0 200px;
  max-width: 200px;
  min-width: 200px;
  width: 200px;
}

.ant-layout-sider-collapsed {
  flex: 0 0 80px;
  max-width: 80px;
  min-width: 80px;
  width: 80px;
}

.ant-layout-header {
  position: relative;
  padding: 0 50px;
  color: rgba(0, 0, 0, 0.85);
  line-height: 64px;
  height: 64px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);
}

.ant-layout-content {
  flex: auto;
  min-height: 0;
  background: #fff;
  padding: 24px;
  margin: 24px;
  border-radius: 6px;
}

/* Ant Design Menu Styles */
.ant-menu {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-size: 14px;
  line-height: 0;
  list-style: none;
  background: #001529;
  outline: none;
  border-right: none;
  transition: background 0.3s, width 0.3s cubic-bezier(0.2, 0, 0, 1) 0s;
}

.ant-menu-dark {
  color: rgba(255, 255, 255, 0.65);
  background: #001529;
}

.ant-menu-dark .ant-menu-item,
.ant-menu-dark .ant-menu-submenu-title {
  color: rgba(255, 255, 255, 0.65);
}

.ant-menu-item {
  position: relative;
  display: block;
  margin: 0;
  padding: 0 24px;
  white-space: nowrap;
  cursor: pointer;
  transition: border-color 0.3s, background 0.3s, padding 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
  border-bottom: none;
  line-height: 40px;
  height: 40px;
  font-size: 14px;
  overflow: hidden;
}

.ant-menu-item-selected {
  color: #1890ff !important;
  background-color: #e6f7ff;
  border-right: 3px solid #1890ff;
}

.ant-menu-dark .ant-menu-item-selected {
  background-color: #1890ff;
  color: #fff !important;
}

.ant-menu-dark .ant-menu-item:hover {
  background-color: transparent;
  color: #1890ff;
}

.ant-menu-submenu-title {
  position: relative;
  display: block;
  padding: 0 24px;
  color: rgba(255, 255, 255, 0.65);
  line-height: 40px;
  height: 40px;
  cursor: pointer;
  transition: border-color 0.3s, background 0.3s, padding 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
}

.ant-menu-submenu-arrow {
  position: absolute;
  top: 50%;
  right: 16px;
  transform: translateY(-50%);
  font-size: 12px;
}

/* Form Styles */
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
  padding: 0 0 0 12px;
  line-height: 32px;
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
  width: 100%;
  min-height: 32px;
}

.ant-input:focus {
  border-color: #40a9ff;
  border-right-width: 1px;
  outline: 0;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

/* Button Styles */
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

.ant-btn:hover {
  color: #40a9ff;
  border-color: #40a9ff;
}

.ant-btn-primary {
  color: #fff;
  background: #1890ff;
  border-color: #1890ff;
  text-shadow: 0 -1px 0 rgba(0, 0, 0, 0.12);
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.045);
}

.ant-btn-primary:hover {
  color: #fff;
  background: #40a9ff;
  border-color: #40a9ff;
}

/* Table Styles */
.ant-table {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  line-height: 1.5715;
  list-style: none;
  position: relative;
  border-radius: 6px;
  background: #fff;
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

.ant-table-tbody > tr:hover > td {
  background: #fafafa;
}

/* Select Styles */
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
  width: 100%;
}

.ant-select-selector {
  position: relative;
  background-color: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
  padding: 4px 11px;
  min-height: 32px;
  display: flex;
  align-items: center;
}

.ant-select:hover .ant-select-selector {
  border-color: #40a9ff;
}

/* Login page specific styles */
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-form {
  background: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 400px;
}

.login-form h1 {
  text-align: center;
  margin-bottom: 24px;
  color: #262626;
  font-size: 24px;
  font-weight: 600;
}

/* Responsive */
@media (max-width: 768px) {
  .ant-layout-sider {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 999;
    transform: translateX(-100%);
    transition: transform 0.3s;
  }
  
  .ant-layout-sider.ant-layout-sider-collapsed {
    transform: translateX(0);
  }
  
  .ant-layout-header {
    padding: 0 16px;
  }
  
  .ant-layout-content {
    margin: 16px;
    padding: 16px;
  }
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
