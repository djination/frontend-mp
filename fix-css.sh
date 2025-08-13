#!/bin/bash
# Quick fix untuk CSS extraction dari existing build

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🎨 Quick CSS Fix untuk ESBuild...${NC}"

# Step 1: Pastikan main.css ada
if [ ! -f "dist/main.css" ]; then
    echo -e "${YELLOW}Creating basic CSS file...${NC}"
    
    # Extract Ant Design CSS dan custom CSS dari main.js
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

/* Custom App Styles */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#root {
  min-height: 100vh;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 18px;
  color: #666;
}

/* Fix untuk layout issues */
.ant-layout {
  min-height: 100vh;
}

.ant-layout-sider-children {
  height: 100%;
  margin-top: -0.1px;
  padding-top: 0.1px;
}

.ant-menu-dark .ant-menu-item:hover {
  background-color: transparent;
  color: #1890ff;
}

.ant-menu-dark .ant-menu-item-selected {
  background-color: #1890ff;
  color: #fff;
}
EOF

    echo -e "${GREEN}✅ Basic CSS file created${NC}"
fi

# Step 2: Update index.html untuk include CSS
echo -e "${YELLOW}Updating index.html...${NC}"
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

echo -e "${GREEN}✅ HTML updated with CSS link${NC}"

# Step 3: Set permissions
chmod 644 dist/main.css
chmod 644 dist/index.html

echo -e "${GREEN}🎉 CSS fix completed!${NC}"
echo -e "${YELLOW}Files updated:${NC}"
ls -la dist/main.css dist/index.html

echo -e "${YELLOW}Next: Upload to server and reload nginx${NC}"
