# 📁 Project Structure Overview

This document outlines the organized structure after reorganization.

## 🎯 Directory Structure

```
frontend/
├── scripts/                         # 🔧 Shell Scripts
│   ├── build-esbuild.sh            # Production build with ESBuild
│   ├── deploy-static-production.sh  # Create deployment package
│   ├── deploy-static-frontend.sh    # Deploy to server
│   ├── nginx-frontend.conf          # Nginx configuration
│   ├── nginx-fix.sh                 # Nginx utilities
│   └── start-dev.sh                 # Development server
├── documentation/                   # 📚 Documentation
│   └── DEPLOYMENT_INSTRUCTIONS.md   # Detailed deployment guide
├── src/                            # 💻 Source Code
├── dist/                           # 📦 Build Output (generated)
├── public/                         # 🌐 Static Assets
├── .env*                           # ⚙️ Environment Variables
├── package.json                    # 📋 Dependencies & Scripts
├── README.md                       # 📖 Main Documentation
└── [config files]                 # ⚙️ Various config files
```

## 🚀 Git Workflow Integration

### Local Development
```bash
git pull origin main
npm install
./scripts/start-dev.sh
```

### Production Deployment
```bash
./scripts/deploy-static-production.sh
git add . && git commit -m "Production build ready"
git push origin main
```

### Server Deployment
```bash
# On server
git pull origin main
./scripts/deploy-static-frontend.sh
```

## 🔧 Script Responsibilities

| Script | Purpose | Usage |
|--------|---------|-------|
| `build-esbuild.sh` | Production build | Local/Server |
| `deploy-static-production.sh` | Package for deployment | Local |
| `deploy-static-frontend.sh` | Server deployment | Server |
| `nginx-frontend.conf` | Nginx configuration | Server |
| `nginx-fix.sh` | Nginx troubleshooting | Server |
| `start-dev.sh` | Development server | Local |

## 🌐 Server Configuration

### Existing Server Setup
- **Nginx Config**: `/etc/nginx/sites-available/frontend.conf`
- **Symlink**: `/etc/nginx/sites-enabled/frontend.conf` ✅ Already exists
- **Static Files**: `/var/www/customerdb/frontend-mp/dist/`

### Domain Mapping
- **Frontend**: `customer.merahputih-id.com` → Static files
- **Backend**: `bc.merahputih-id.com` → API server

## 📦 Package.json Scripts

```json
{
  "scripts": {
    "build:esbuild": "./scripts/build-esbuild.sh",
    "deploy:package": "./scripts/deploy-static-production.sh", 
    "deploy:server": "./scripts/deploy-static-frontend.sh",
    "fix:nginx": "./scripts/nginx-fix.sh",
    "start:dev": "./scripts/start-dev.sh"
  }
}
```

## 🎯 Benefits of This Structure

1. **📁 Clean Organization**: Scripts and docs separated
2. **🔄 Git Friendly**: All organized for version control
3. **🚀 Easy Deployment**: Clear workflow with organized scripts
4. **📚 Better Documentation**: Structured documentation
5. **🔧 Maintainable**: Easy to find and update scripts

## 🗑️ Removed Files

**Outdated Scripts:**
- ❌ `deploy-production-pm2.sh` (PM2 approach replaced)
- ❌ `fix-backend-cors.sh` (one-time fix)
- ❌ `fix-cors-css.sh` (redundant)
- ❌ `fix-css-bener.sh` (replaced by static deployment)
- ❌ `fix-css-ultimate.sh` (redundant)
- ❌ `SCRIPTS.md` (replaced by this structure)

**Total Reduction**: From 13 scripts → 5 focused scripts 🎯
