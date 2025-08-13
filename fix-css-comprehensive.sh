#!/bin/bash
# Comprehensive CSS fix dengan full Ant Design styles

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🎨 Creating comprehensive CSS with full Ant Design styles...${NC}"

# Create comprehensive CSS file
cat > dist/main.css << 'EOF'
/* Reset and Base Styles */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
  font-size: 14px;
  line-height: 1.5715;
  color: rgba(0, 0, 0, 0.85);
  background-color: #fff;
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

/* Ant Design Layout */
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
  width: 200px;
  min-height: 100vh;
  flex: 0 0 200px;
}

.ant-layout-sider-children {
  height: 100%;
  margin-top: -0.1px;
  padding-top: 0.1px;
  overflow: hidden;
}

.ant-layout-sider-trigger {
  position: fixed;
  bottom: 0;
  z-index: 1;
  height: 48px;
  color: #fff;
  line-height: 48px;
  text-align: center;
  background: #002140;
  cursor: pointer;
  transition: all 0.2s;
  width: 200px;
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
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02);
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
  transition: background 0.3s, width 0.3s cubic-bezier(0.2, 0, 0, 1) 0s;
  border-right: none;
}

.ant-menu-dark {
  color: rgba(255, 255, 255, 0.65);
  background: #001529;
}

.ant-menu-dark .ant-menu-sub {
  color: rgba(255, 255, 255, 0.65);
  background: #000c17;
}

.ant-menu-item {
  position: relative;
  display: block;
  margin: 0;
  padding: 0 24px;
  white-space: nowrap;
  cursor: pointer;
  transition: border-color 0.3s, background 0.3s, padding 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
  border-right: 3px solid transparent;
  height: 40px;
  line-height: 40px;
  margin-top: 4px;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ant-menu-item:hover {
  color: #1890ff;
}

.ant-menu-dark .ant-menu-item:hover {
  background-color: transparent;
  color: #1890ff;
}

.ant-menu-item-selected {
  color: #1890ff;
  background-color: #e6f7ff;
  border-right-color: #1890ff;
}

.ant-menu-dark .ant-menu-item-selected {
  background-color: #1890ff;
  color: #fff;
  border-right-color: #1890ff;
}

.ant-menu-item-icon {
  width: 14px;
  height: 14px;
  margin-right: 10px;
  font-size: 14px;
  transition: font-size 0.15s cubic-bezier(0.215, 0.61, 0.355, 1), margin 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
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
  line-height: 32px;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.85);
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

/* Input Styles */
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
  display: inline-block;
  position: relative;
}

.ant-input:focus {
  border-color: #40a9ff;
  border-right-width: 1px;
  outline: 0;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.ant-input:hover {
  border-color: #40a9ff;
  border-right-width: 1px;
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
  background: #fff;
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

.ant-table-wrapper {
  border-radius: 6px;
}

.ant-table-container {
  position: relative;
  border-radius: 6px 6px 0 0;
}

.ant-table-header {
  overflow: hidden;
  background: #fafafa;
  border-radius: 6px 6px 0 0;
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
  overflow-wrap: break-word;
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
  height: 32px;
  display: flex;
  align-items: center;
}

.ant-select-selector:hover {
  border-color: #40a9ff;
}

.ant-select-focused .ant-select-selector {
  border-color: #40a9ff;
  border-right-width: 1px;
  outline: 0;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.ant-select-selection-search {
  position: relative;
  max-width: 100%;
  margin-inline-start: 0;
}

.ant-select-selection-placeholder {
  flex: 1;
  color: #bfbfbf;
  pointer-events: none;
}

/* Card Styles */
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
  border-radius: 6px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02);
}

.ant-card-head {
  min-height: 56px;
  margin-bottom: -1px;
  padding: 0 24px;
  color: rgba(0, 0, 0, 0.85);
  font-weight: 500;
  font-size: 16px;
  background: transparent;
  border-bottom: 1px solid #f0f0f0;
  border-radius: 6px 6px 0 0;
  display: flex;
  align-items: center;
}

.ant-card-body {
  padding: 24px;
}

/* Space between elements */
.ant-space {
  display: inline-flex;
}

.ant-space-item {
  margin-right: 8px;
}

.ant-space-item:last-child {
  margin-right: 0;
}

/* Typography */
.ant-typography {
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  line-height: 1.5715;
  margin: 0;
}

.ant-typography h1,
.ant-typography h2,
.ant-typography h3,
.ant-typography h4,
.ant-typography h5 {
  margin-bottom: 0.5em;
  color: rgba(0, 0, 0, 0.85);
  font-weight: 600;
}

/* Page Header */
.ant-page-header {
  position: relative;
  padding: 16px 24px;
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.ant-page-header-heading {
  display: flex;
  align-items: center;
}

.ant-page-header-heading-title {
  margin-right: 12px;
  margin-bottom: 0;
  color: rgba(0, 0, 0, 0.85);
  font-weight: 600;
  font-size: 20px;
  line-height: 32px;
}
EOF

echo -e "${GREEN}✅ Comprehensive CSS created!${NC}"

# Update HTML to include proper meta tags
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
      /* Critical above-the-fold styles */
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        font-size: 14px;
        line-height: 1.5715;
        color: rgba(0, 0, 0, 0.85);
        background-color: #f0f2f5;
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
        background: #f0f2f5;
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

echo -e "${GREEN}✅ HTML updated with better structure!${NC}"

# Set permissions
chmod 644 dist/main.css dist/index.html

echo -e "${YELLOW}Files created:${NC}"
ls -la dist/main.css dist/index.html

echo -e "${YELLOW}CSS file size: $(du -sh dist/main.css | cut -f1)${NC}"
echo -e "${GREEN}🎉 Comprehensive CSS fix completed!${NC}"
