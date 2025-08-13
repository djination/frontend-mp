#!/bin/bash
# Ultimate CSS fix untuk matching localhost appearance

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🎯 Ultimate CSS Fix - Matching Localhost Appearance${NC}"

# Build first
echo -e "${YELLOW}Step 1: Rebuild with corrected env...${NC}"
./build-esbuild.sh

# Create ENHANCED CSS that matches localhost exactly
echo -e "${YELLOW}Step 2: Creating CSS yang PERSIS seperti localhost...${NC}"
cat > dist/main.css << 'EOF'
/* Ultimate Reset */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.5715;color:rgba(0,0,0,.85);background:#f0f2f5;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
#root{height:100vh;display:flex;flex-direction:column;overflow:hidden}

/* LAYOUT - Exact match localhost */
.ant-layout{display:flex!important;flex-direction:row!important;height:100vh!important;background:#f0f2f5!important;overflow:hidden!important}
.ant-layout-has-sider{flex-direction:row!important}

/* SIDEBAR - Fixed positioning like localhost */
.ant-layout-sider{position:fixed!important;top:0!important;left:0!important;height:100vh!important;width:200px!important;background:#001529!important;z-index:100!important;overflow-y:auto!important;border-right:none!important}
.ant-layout-sider-children{height:100%!important;background:#001529!important;overflow-y:auto!important}

/* HEADER - Fixed like localhost */
.ant-layout-header{position:fixed!important;top:0!important;left:200px!important;right:0!important;height:64px!important;padding:0 24px!important;background:#fff!important;box-shadow:0 2px 8px rgba(0,0,0,.15)!important;z-index:99!important;display:flex!important;align-items:center!important;justify-content:space-between!important;border-bottom:1px solid #f0f0f0!important}

/* CONTENT - Proper margin like localhost */
.ant-layout-content{margin-left:200px!important;margin-top:64px!important;padding:24px!important;background:#f0f2f5!important;min-height:calc(100vh - 64px)!important;overflow-y:auto!important;overflow-x:hidden!important}

/* MENU - Exact localhost styling */
.ant-menu{background:#001529!important;border:none!important;color:rgba(255,255,255,.65)!important;width:100%!important;height:100%!important}
.ant-menu-dark{background:#001529!important;color:rgba(255,255,255,.65)!important}
.ant-menu-root{background:#001529!important}

/* MENU ITEMS - Perfect match localhost */
.ant-menu-item{height:48px!important;line-height:48px!important;padding:0 24px!important;margin:0!important;color:rgba(255,255,255,.65)!important;cursor:pointer!important;transition:all .3s ease!important;border-radius:0!important;display:flex!important;align-items:center!important;background:transparent!important}
.ant-menu-item:hover{background-color:#1890ff!important;color:#fff!important}
.ant-menu-item-selected{background-color:#1890ff!important;color:#fff!important}
.ant-menu-item .anticon{margin-right:12px!important;font-size:16px!important;color:inherit!important}
.ant-menu-item span{color:inherit!important}

/* MENU SUBMENU */
.ant-menu-submenu{background:#001529!important}
.ant-menu-submenu-title{height:48px!important;line-height:48px!important;padding:0 24px!important;color:rgba(255,255,255,.65)!important}
.ant-menu-submenu-title:hover{background-color:#1890ff!important;color:#fff!important}
.ant-menu-submenu-open>.ant-menu-submenu-title{background-color:#1890ff!important;color:#fff!important}

/* PAGE CONTENT - Clean white area like localhost */
.page-content,.ant-card{background:#fff!important;padding:24px!important;border-radius:8px!important;box-shadow:0 1px 3px rgba(0,0,0,.12)!important;margin-bottom:24px!important;border:1px solid #f0f0f0!important}

/* USER PROFILE SECTION - Exact localhost match */
.user-profile-section{background:#fff!important;padding:24px!important;border-radius:8px!important;box-shadow:0 1px 3px rgba(0,0,0,.12)!important}

/* AVATAR - Clean like localhost */
.ant-avatar{width:80px!important;height:80px!important;border-radius:50%!important;background:#ccc!important;color:#fff!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:32px!important;margin:0 auto 16px!important}

/* PROFILE NAME */
.profile-name{text-align:center!important;font-size:18px!important;font-weight:600!important;color:rgba(0,0,0,.85)!important;margin-bottom:24px!important}

/* TABS - Clean like localhost */
.ant-tabs{background:transparent!important}
.ant-tabs-tab{padding:12px 0!important;margin-right:32px!important;color:rgba(0,0,0,.65)!important;cursor:pointer!important;transition:color .3s!important;border-bottom:2px solid transparent!important}
.ant-tabs-tab-active{color:#1890ff!important;font-weight:500!important;border-bottom-color:#1890ff!important}
.ant-tabs-content-holder{background:transparent!important;padding-top:24px!important}

/* FORM - Perfect localhost styling */
.ant-form{max-width:none!important;background:transparent!important}
.ant-form-item{margin-bottom:24px!important;display:flex!important;flex-direction:column!important}
.ant-form-item-label{text-align:left!important;padding-bottom:8px!important;flex:none!important}
.ant-form-item-label>label{color:rgba(0,0,0,.85)!important;font-size:14px!important;font-weight:500!important}
.ant-form-item-control{flex:1!important;width:100%!important}
.ant-form-item-control-input{width:100%!important}

/* FORM ROW */
.ant-row{display:flex!important;flex-wrap:wrap!important;margin-left:-12px!important;margin-right:-12px!important}
.ant-col{padding-left:12px!important;padding-right:12px!important;flex:1!important;min-width:0!important}

/* INPUT - Exact localhost appearance */
.ant-input{height:40px!important;padding:8px 12px!important;border:1px solid #d9d9d9!important;border-radius:6px!important;font-size:14px!important;transition:all .3s!important;width:100%!important;background:#fff!important;color:rgba(0,0,0,.85)!important}
.ant-input:focus,.ant-input-focused{border-color:#40a9ff!important;box-shadow:0 0 0 2px rgba(24,144,255,.2)!important;outline:0!important}

/* BUTTON - Exact localhost styling */
.ant-btn{height:40px!important;padding:8px 16px!important;border-radius:6px!important;font-size:14px!important;border:1px solid #d9d9d9!important;background:#fff!important;color:rgba(0,0,0,.85)!important;cursor:pointer!important;transition:all .3s!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;font-weight:400!important}
.ant-btn-primary{background:#1890ff!important;border-color:#1890ff!important;color:#fff!important}
.ant-btn-primary:hover{background:#40a9ff!important;border-color:#40a9ff!important}
.ant-btn:hover{border-color:#40a9ff!important;color:#40a9ff!important}

/* TEXT STYLING */
h1,h2,h3,h4,h5,h6{color:rgba(0,0,0,.85)!important;font-weight:600!important;margin:0 0 16px 0!important}
p{color:rgba(0,0,0,.65)!important;margin:0 0 16px 0!important}

/* LOADING */
.loading{display:flex!important;justify-content:center!important;align-items:center!important;height:100vh!important;font-size:18px!important;color:#666!important}

/* RESPONSIVE - Maintain localhost behavior */
@media (max-width:768px){
.ant-layout-sider{transform:translateX(-100%)!important}
.ant-layout-header,.ant-layout-content{margin-left:0!important}
}

/* ANTI-OVERRIDE - Force all styles */
[class*="ant-"]{box-sizing:border-box!important}
.ant-layout-sider [class*="ant-"]{background:inherit!important}
.ant-menu-dark [class*="ant-menu-item"]{background:transparent!important}
.ant-menu-dark .ant-menu-item-selected{background:#1890ff!important}
EOF

echo -e "${GREEN}✅ Ultimate CSS created!${NC}"

# Update HTML with enhanced loading
cat > dist/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<link rel="icon" type="image/svg+xml" href="/vite.svg"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>MerahPutih Business Center</title>
<link rel="stylesheet" href="/main.css"/>
<style>
body{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f0f2f5}
#root{min-height:100vh}
.loading{display:flex;justify-content:center;align-items:center;height:100vh;font-size:18px;color:#666}
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

chmod 644 dist/main.css dist/index.html

echo -e "${GREEN}🎯 Ultimate Fix COMPLETED!${NC}"
echo -e "${YELLOW}CSS size: $(du -sh dist/main.css | cut -f1)${NC}"
echo -e "${YELLOW}Deploy files ke server sekarang!${NC}"
