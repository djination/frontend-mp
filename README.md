# MerahPutih Business Center - Frontend

React application dengan static files deployment untuk customer management system.

## 🚀 Quick Start

### Development
```bash
npm install
npm run dev              # Start dev server (localhost:5173)
# atau
./scripts/start-dev.sh   # Start dengan custom script
```

### Production Build & Deploy
```bash
./scripts/deploy-static-production.sh    # Create deployment package
# Upload ke server dan run:
./scripts/deploy-static-frontend.sh     # Deploy on server
```

## 📁 Project Structure

```
frontend/
├── scripts/                     # Shell scripts
│   ├── build-esbuild.sh        # Production build
│   ├── deploy-static-production.sh  # Create deployment package
│   ├── deploy-static-frontend.sh    # Server deployment
│   ├── nginx-frontend.conf     # Nginx configuration
│   └── start-dev.sh           # Development server
├── documentation/              # Documentation
│   └── DEPLOYMENT_INSTRUCTIONS.md
├── src/                       # Source code
├── dist/                      # Build output
└── README.md                  # This file
```

## 🏗️ Production Architecture

```
Internet → Nginx (443/SSL) → Static Files (/var/www/customerdb/frontend-mp/dist/)
                                    ↓
                              API calls → https://bc.merahputih-id.com
```

### Deployment Details:
- **Frontend**: `customer.merahputih-id.com` (Static files)
- **Backend**: `bc.merahputih-id.com` (API server)
- **Nginx Config**: `/etc/nginx/sites-available/frontend.conf`
- **Symlink**: `/etc/nginx/sites-enabled/frontend.conf` (already exists)

## 🛠️ Tech Stack

- **React 19.1.0** - Frontend framework
- **Vite 5.4.10** - Development server  
- **ESBuild** - Production build (Qt/OpenGL compatible)
- **Ant Design** - UI component library
- **Axios** - HTTP client

## 📚 Documentation

See [documentation/DEPLOYMENT_INSTRUCTIONS.md](./documentation/DEPLOYMENT_INSTRUCTIONS.md) for detailed deployment guide.

## 🔧 Available Scripts

| Script | Description | Command |
|--------|-------------|---------|
| `server-deploy.sh` | 🚀 Auto deploy di server | `npm run deploy:auto` |
| `build-esbuild.sh` | 🏗️ Build production | `npm run build:esbuild` |
| `git-deploy-workflow.sh` | 📖 Guide workflow | `./scripts/git-deploy-workflow.sh` |
| `start-dev.sh` | 💻 Start development | `npm run start:dev` |
| `nginx-fix.sh` | 🔧 Fix nginx config | `npm run fix:nginx` |

## 🌐 URLs

- **Frontend**: https://customer.merahputih-id.com
- **Backend API**: https://bc.merahputih-id.com

## 🚀 Git Workflow - Simple Version

```bash
# 🖥️ Local Development
git add .
git commit -m "Update fitur baru"
git push origin main

# 🌐 Server Deployment  
cd /path/to/frontend
git pull origin main
npm run deploy:auto
```

**That's it!** Super simple workflow - cuma 2 step! 🎉

## 🎯 Key Features

- ✅ **No PM2 required** - Pure static files
- ✅ **No port 3000** - Direct nginx serving  
- ✅ **Super simple** - Just git push + auto deploy
- ✅ **Clean git** - No build files in repository
- ✅ **Auto backup** - Safe deployment with rollback
- ✅ **Fast deployment** - Build directly on server

## 📖 Full Documentation

- [Git Deploy Simple](./documentation/GIT_DEPLOY_SIMPLE.md) - Simple workflow guide
- [Deployment Instructions](./documentation/DEPLOYMENT_INSTRUCTIONS.md) - Detailed setup
- [Project Structure](./documentation/PROJECT_STRUCTURE.md) - Architecture overview
- [Scripts README](./scripts/README.md) - Available scripts guide
