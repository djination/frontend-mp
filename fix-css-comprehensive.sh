#!/bin/bash
# Comprehensive CSS fix untuk Ant Design styling

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🎨 Comprehensive CSS Fix untuk Ant Design...${NC}"

# Create a complete Ant Design CSS file
echo -e "${YELLOW}Creating comprehensive Ant Design CSS...${NC}"
cat > dist/main.css << 'EOF'
/* Reset and Base Styles */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
  font-size: 14px;
  line-height: 1.5715;
  color: rgba(0, 0, 0, 0.85);
  background-color: #fff;
}

#root {
  min-height: 100vh;
  width: 100%;
}

/* Ant Design Layout Components */
.ant-layout {
  display: flex;
  flex: auto;
  flex-direction: column;
  min-height: 100vh;
  background: #f0f2f5;
}

.ant-layout-has-sider > .ant-layout,
.ant-layout-has-sider > .ant-layout-content {
  overflow-x: hidden;
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

.ant-layout-sider-children {
  height: 100%;
  margin-top: -0.1px;
  padding-top: 0.1px;
  overflow-y: auto;
}

.ant-layout-header {
  position: relative;
  padding: 0 50px;
  color: rgba(0, 0, 0, 0.85);
  line-height: 64px;
  height: 64px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.ant-layout-content {
  flex: auto;
  min-height: 0;
  background: #fff;
  padding: 24px;
  margin: 24px;
  margin-left: 224px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

/* Menu Styles */
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
  color: rgba(255, 255, 255, 0.65);
}

.ant-menu-dark {
  color: rgba(255, 255, 255, 0.65);
  background: #001529;
}

.ant-menu-dark .ant-menu-item,
.ant-menu-dark .ant-menu-item-group-title,
.ant-menu-dark .ant-menu-submenu-title {
  color: rgba(255, 255, 255, 0.65);
}

.ant-menu-item,
.ant-menu-submenu-title {
  position: relative;
  display: block;
  margin: 0;
  padding: 0 20px;
  white-space: nowrap;
  cursor: pointer;
  transition: border-color 0.3s, background 0.3s, padding 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
  line-height: 40px;
  height: 40px;
}

.ant-menu-item-selected {
  color: #1890ff;
  background-color: #e6f7ff;
}

.ant-menu-dark .ant-menu-item:hover {
  background-color: transparent;
  color: #1890ff;
}

.ant-menu-dark .ant-menu-item-selected {
  background-color: #1890ff;
  color: #fff;
}

.ant-menu-item .anticon,
.ant-menu-submenu-title .anticon {
  min-width: 14px;
  margin-right: 10px;
  font-size: 14px;
  transition: font-size 0.15s cubic-bezier(0.215, 0.61, 0.355, 1), margin 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
}

/* Form Components */
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
  line-height: 32px;
}

.ant-form-item-label > label {
  position: relative;
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  height: 32px;
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
}

.ant-form-item-control {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.ant-form-item-control-input {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 32px;
}

/* Input Components */
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
  height: 32px;
  position: relative;
  display: inline-block;
}

.ant-input:focus,
.ant-input-focused {
  border-color: #40a9ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  border-right-width: 1px;
  outline: 0;
}

/* Button Components */
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

.ant-btn-primary:hover {
  color: #fff;
  background: #40a9ff;
  border-color: #40a9ff;
}

/* Table Components */
.ant-table {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  line-height: 1.5715;
  list-style: none;
  position: relative;
  background: #fff;
  border-radius: 6px;
}

.ant-table-container {
  position: relative;
}

.ant-table-content {
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

.ant-table-tbody > tr:hover > td {
  background: #fafafa;
}

/* Select Components */
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
  height: 32px;
  display: flex;
  align-items: center;
}

.ant-select-selection-search-input {
  height: 100%;
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
}

.ant-select-selection-placeholder {
  pointer-events: none;
  color: #bfbfbf;
}

/* Avatar and Profile */
.ant-avatar {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  line-height: 1.5715;
  list-style: none;
  position: relative;
  display: inline-block;
  overflow: hidden;
  color: #fff;
  white-space: nowrap;
  text-align: center;
  vertical-align: middle;
  background: #ccc;
  width: 32px;
  height: 32px;
  line-height: 30px;
  border-radius: 50%;
}

.ant-avatar-lg {
  width: 40px;
  height: 40px;
  line-height: 38px;
  font-size: 18px;
}

/* Card Components */
.ant-card {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  line-height: 1.5715;
  list-style: none;
  position: relative;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

.ant-card-body {
  padding: 24px;
}

/* Tabs */
.ant-tabs {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  line-height: 1.5715;
  list-style: none;
  position: relative;
  overflow: hidden;
}

.ant-tabs-tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 12px 0;
  font-size: 14px;
  background: transparent;
  border: 0;
  outline: none;
  cursor: pointer;
  color: rgba(0, 0, 0, 0.65);
  margin: 0 32px 0 0;
}

.ant-tabs-tab-active {
  color: #1890ff;
  font-weight: 500;
}

/* Loading States */
.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 18px;
  color: #666;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .ant-layout-sider {
    position: fixed;
    height: 100vh;
    z-index: 100;
  }
  
  .ant-layout-content {
    margin-left: 0;
    margin: 16px;
    padding: 16px;
  }
}

/* Custom fixes for better appearance */
.ant-layout-sider-children {
  background: #001529;
}

.ant-menu-dark .ant-menu-item {
  border-radius: 0;
}

.ant-layout {
  background: #f0f2f5;
}

/* Fix form layout */
.ant-form-horizontal .ant-form-item-label {
  text-align: left;
}

.ant-form-item-label {
  flex: 0 0 auto;
  padding-right: 8px;
}

.ant-form-item-control {
  flex: 1 1 auto;
  min-width: 0;
}
EOF

echo -e "${GREEN}✅ Comprehensive CSS created!${NC}"

# Update HTML to ensure CSS loads properly
echo -e "${YELLOW}Updating HTML with proper CSS link...${NC}"
cat > dist/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MerahPutih Business Center</title>
    <link rel="stylesheet" href="/main.css" />
  </head>
  <body>
    <div id="root">
      <div class="loading">Loading MerahPutih Business Center...</div>
    </div>
    <script type="module" src="/main.js"></script>
  </body>
</html>
EOF

echo -e "${GREEN}✅ HTML updated!${NC}"

# Set proper permissions
chmod 644 dist/main.css dist/index.html

echo -e "${GREEN}🎉 Comprehensive CSS fix completed!${NC}"
echo -e "${YELLOW}CSS file size: $(du -sh dist/main.css | cut -f1)${NC}"
echo -e "${YELLOW}Ready for deployment to server!${NC}"
