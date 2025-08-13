#!/bin/bash
# Fix CORS + CSS untuk production yang PERFECT

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🔧 Fixing CORS + CSS untuk Production Perfect Match${NC}"

echo -e "${YELLOW}Step 1: Update backend CORS configuration...${NC}"
echo -e "${YELLOW}Backend perlu di-update untuk allow origin: https://customer.merahputih-id.com${NC}"

# Create script for backend CORS fix
cat > ../backend-cors-fix.md << 'EOF'
# Backend CORS Fix Required

Backend NestJS perlu update CORS configuration:

## File: src/main.ts

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS with specific origins
  app.enableCors({
    origin: [
      'https://customer.merahputih-id.com',
      'http://localhost:5173',
      'http://localhost:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  });

  await app.listen(5000);
}
```

## Commands for backend:
```bash
cd be-nest-mp/
npm run build
pm2 restart backend
```
EOF

echo -e "${GREEN}✅ Backend CORS fix instructions created${NC}"

echo -e "${YELLOW}Step 2: Build dengan environment yang benar...${NC}"
./build-esbuild.sh

echo -e "${YELLOW}Step 3: Create CSS yang PERSIS seperti localhost...${NC}"
cat > dist/main.css << 'EOF'
/* EXACT LOCALHOST MATCH CSS */
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.5715;color:rgba(0,0,0,.85);background:#f0f2f5}
#root{height:100vh;overflow:hidden}

/* Layout yang PERSIS localhost */
.ant-layout{display:flex;flex-direction:row;height:100vh;background:#f0f2f5;overflow:hidden}
.ant-layout-has-sider{flex-direction:row}

/* Sidebar - EXACT positioning */
.ant-layout-sider{position:fixed;top:0;left:0;height:100vh;width:200px;background:#001529;z-index:100;overflow-y:auto}
.ant-layout-sider-children{height:100%;background:#001529}

/* Header - EXACT positioning seperti localhost */
.ant-layout-header{position:fixed;top:0;left:200px;right:0;height:64px;padding:0 24px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.15);z-index:99;display:flex;align-items:center;justify-content:space-between}

/* Content - EXACT margin seperti localhost */
.ant-layout-content{margin-left:200px;margin-top:64px;padding:24px;background:#f0f2f5;min-height:calc(100vh - 64px);overflow-y:auto}

/* Menu styling - EXACT localhost */
.ant-menu{background:#001529;border:none;color:rgba(255,255,255,.65)}
.ant-menu-dark{background:#001529;color:rgba(255,255,255,.65)}
.ant-menu-item{height:48px;line-height:48px;padding:0 24px;margin:0;color:rgba(255,255,255,.65);cursor:pointer;transition:all .3s;display:flex;align-items:center}
.ant-menu-item:hover{background-color:#1890ff;color:#fff}
.ant-menu-item-selected{background-color:#1890ff;color:#fff}
.ant-menu-item .anticon{margin-right:12px;font-size:16px}

/* Content areas - Clean white backgrounds */
.user-profile-section,.page-content,.ant-card{background:#fff;padding:24px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,.12);margin-bottom:24px}

/* Avatar styling */
.ant-avatar{width:80px;height:80px;border-radius:50%;background:#ccc;color:#fff;display:flex;align-items:center;justify-content:center;font-size:32px;margin:0 auto 16px}

/* Profile name */
.profile-name{text-align:center;font-size:18px;font-weight:600;color:rgba(0,0,0,.85);margin-bottom:24px}

/* Tabs - Clean styling */
.ant-tabs-tab{padding:12px 0;margin-right:32px;color:rgba(0,0,0,.65);cursor:pointer;transition:color .3s}
.ant-tabs-tab-active{color:#1890ff;font-weight:500}

/* Form styling - EXACT localhost */
.ant-form{background:transparent}
.ant-form-item{margin-bottom:24px}
.ant-form-item-label{text-align:left;padding-bottom:8px}
.ant-form-item-label>label{color:rgba(0,0,0,.85);font-size:14px;font-weight:500}

/* Input fields - EXACT localhost */
.ant-input{height:40px;padding:8px 12px;border:1px solid #d9d9d9;border-radius:6px;font-size:14px;transition:all .3s;width:100%;background:#fff;color:rgba(0,0,0,.85)}
.ant-input:focus{border-color:#40a9ff;box-shadow:0 0 0 2px rgba(24,144,255,.2);outline:0}

/* Buttons - EXACT localhost */
.ant-btn{height:40px;padding:8px 16px;border-radius:6px;font-size:14px;border:1px solid #d9d9d9;background:#fff;color:rgba(0,0,0,.85);cursor:pointer;transition:all .3s;display:inline-flex;align-items:center;justify-content:center}
.ant-btn-primary{background:#1890ff;border-color:#1890ff;color:#fff}
.ant-btn-primary:hover{background:#40a9ff;border-color:#40a9ff}

/* Grid system */
.ant-row{display:flex;flex-wrap:wrap;margin-left:-12px;margin-right:-12px}
.ant-col{padding-left:12px;padding-right:12px;flex:1;min-width:0}

/* Loading state */
.loading{display:flex;justify-content:center;align-items:center;height:100vh;font-size:18px;color:#666}

/* Login page specific */
.login-container{display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f0f2f5;padding:24px}
.login-form{background:#fff;padding:48px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.15);width:100%;max-width:400px}
.login-title{text-align:center;font-size:24px;font-weight:600;color:rgba(0,0,0,.85);margin-bottom:32px}
EOF

echo -e "${GREEN}✅ CSS localhost match created!${NC}"

# Update HTML
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

chmod 644 dist/main.css dist/index.html

echo -e "${GREEN}🎉 CSS + HTML Fix completed!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Upload files ke server"
echo "2. Fix backend CORS (see ../backend-cors-fix.md)"
echo "3. Restart backend: pm2 restart backend"
echo "4. Test: https://customer.merahputih-id.com"

echo -e "${YELLOW}Files ready:${NC}"
ls -la dist/
