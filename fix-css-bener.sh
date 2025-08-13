#!/bin/bash
# CSS Fix yang BENER banget kali ini!

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🔥 CSS Fix yang BENER banget!${NC}"

# Rebuild with proper CSS
echo -e "${YELLOW}Step 1: Building with ESBuild + proper CSS...${NC}"
./build-esbuild.sh

# Create PROPER CSS that actually works
echo -e "${YELLOW}Step 2: Creating CSS yang BENER...${NC}"
cat > dist/main.css << 'EOF'
/* Reset dan Base */
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:14px;line-height:1.5715;color:rgba(0,0,0,.85);background:#f0f2f5}
#root{min-height:100vh;display:flex;flex-direction:column}

/* Layout FIXED */
.ant-layout{display:flex;flex-direction:row;min-height:100vh;background:#f0f2f5}
.ant-layout-has-sider{flex-direction:row}
.ant-layout-sider{position:fixed;top:0;left:0;height:100vh;width:200px;background:#001529;z-index:100;overflow-y:auto}
.ant-layout-sider-children{height:100%;background:#001529}
.ant-layout-header{position:fixed;top:0;left:200px;right:0;height:64px;padding:0 24px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.09);z-index:99;display:flex;align-items:center;justify-content:space-between}
.ant-layout-content{margin-left:200px;margin-top:64px;padding:24px;background:#f0f2f5;min-height:calc(100vh - 64px)}

/* Menu FIXED */
.ant-menu{background:#001529;border:none;color:rgba(255,255,255,.65);height:100vh;overflow-y:auto}
.ant-menu-dark{background:#001529;color:rgba(255,255,255,.65)}
.ant-menu-item{height:48px;line-height:48px;padding:0 20px;margin:0;color:rgba(255,255,255,.65);cursor:pointer;transition:all .3s;border-radius:0;display:flex;align-items:center}
.ant-menu-item:hover{background-color:rgba(24,144,255,.2);color:#fff}
.ant-menu-item-selected{background-color:#1890ff!important;color:#fff!important}
.ant-menu-item .anticon{margin-right:10px;font-size:16px}

/* Content */
.page-content{background:#fff;padding:24px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,.12);margin-bottom:24px}

/* Form */
.ant-form{max-width:600px}
.ant-form-item{margin-bottom:24px}
.ant-form-item-label{text-align:left;padding-right:8px}
.ant-form-item-label>label{color:rgba(0,0,0,.85);font-size:14px;font-weight:500}
.ant-input{height:32px;padding:4px 11px;border:1px solid #d9d9d9;border-radius:6px;font-size:14px;transition:all .3s}
.ant-input:focus{border-color:#40a9ff;box-shadow:0 0 0 2px rgba(24,144,255,.2);outline:0}

/* Button */
.ant-btn{height:32px;padding:4px 15px;border-radius:6px;font-size:14px;border:1px solid #d9d9d9;background:#fff;color:rgba(0,0,0,.85);cursor:pointer;transition:all .3s;display:inline-flex;align-items:center;justify-content:center}
.ant-btn-primary{background:#1890ff;border-color:#1890ff;color:#fff}
.ant-btn-primary:hover{background:#40a9ff;border-color:#40a9ff}

/* Table */
.ant-table{background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.12)}
.ant-table-thead>tr>th{background:#fafafa;border-bottom:1px solid #f0f0f0;padding:16px;font-weight:500;color:rgba(0,0,0,.85)}
.ant-table-tbody>tr>td{padding:16px;border-bottom:1px solid #f0f0f0}
.ant-table-tbody>tr:hover>td{background:#fafafa}

/* Select */
.ant-select{width:100%}
.ant-select-selector{height:32px;padding:4px 11px;border:1px solid #d9d9d9;border-radius:6px;display:flex;align-items:center}

/* Avatar */
.ant-avatar{width:32px;height:32px;border-radius:50%;background:#1890ff;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:14px}

/* Card */
.ant-card{background:#fff;border:1px solid #f0f0f0;border-radius:8px;overflow:hidden}
.ant-card-body{padding:24px}

/* Tabs */
.ant-tabs-tab{padding:12px 0;margin-right:32px;color:rgba(0,0,0,.65);cursor:pointer;transition:color .3s}
.ant-tabs-tab-active{color:#1890ff;font-weight:500}

/* Loading */
.loading{display:flex;justify-content:center;align-items:center;height:100vh;font-size:18px;color:#666}

/* Responsive */
@media (max-width:768px){
.ant-layout-sider{transform:translateX(-100%)}
.ant-layout-header,.ant-layout-content{margin-left:0}
}

/* IMPORTANT: Override inline styles */
.ant-layout-sider-children *{box-sizing:border-box}
.ant-menu-dark .ant-menu-item-selected{background-color:#1890ff!important}
.ant-form-horizontal .ant-form-item-label{text-align:left;flex:0 0 auto}
.ant-form-horizontal .ant-form-item-control{flex:1 1 auto}
EOF

echo -e "${GREEN}✅ CSS yang BENER udah dibuat!${NC}"

# Update HTML
echo -e "${YELLOW}Step 3: Update HTML...${NC}"
cat > dist/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<link rel="icon" type="image/svg+xml" href="/vite.svg"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>MerahPutih Business Center</title>
<link rel="stylesheet" href="/main.css"/>
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

# Set permissions
chmod 644 dist/main.css dist/index.html

# Show summary
echo -e "${GREEN}🎉 CSS Fix BERES!${NC}"
echo -e "${YELLOW}Files ready:${NC}"
ls -la dist/
echo ""
echo -e "${YELLOW}CSS file size: $(du -sh dist/main.css | cut -f1)${NC}"
echo -e "${YELLOW}Ready untuk deploy ke server!${NC}"
