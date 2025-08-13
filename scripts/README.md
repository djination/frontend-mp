# Scripts Directory

Folder ini berisi script-script untuk development dan deployment.

## 🚀 Production Scripts (Yang Aktif Dipakai)

### `server-deploy.sh` 
**Auto deploy script untuk server**
- Jalankan di server setelah `git pull`
- Handle: install dependencies, build, deploy ke nginx, backup
- Command: `npm run deploy:auto`

### `build-esbuild.sh`
**Build production dengan ESBuild**
- Untuk build manual jika diperlukan
- Kompatibel dengan Qt/OpenGL di Ubuntu server
- Command: `npm run build:esbuild`

### `git-deploy-workflow.sh`
**Guide workflow manual**
- Menampilkan step-by-step deployment
- Untuk referensi jika perlu deploy manual
- Command: `./scripts/git-deploy-workflow.sh`

## 🛠️ Development Scripts

### `start-dev.sh`
**Start development server**
- Start Vite dev server dengan hot reload
- Command: `npm run start:dev`

### `nginx-fix.sh`
**Fix nginx configuration**
- Repair nginx config jika ada masalah
- Command: `npm run fix:nginx`

## 📁 Configuration Files

### `nginx-frontend.conf`
**Nginx configuration template**
- Template untuk nginx configuration
- Dipakai oleh deployment scripts

## 🎯 Workflow Utama

**Simple Git Deploy:**
```bash
# Di Local
git push origin main

# Di Server  
git pull origin main
npm run deploy:auto
```

## ⚠️ Scripts yang Dihapus

Script-script berikut sudah tidak diperlukan karena workflow sudah disederhanakan:
- ~~`deploy-static-production.sh`~~ (replaced by server-deploy.sh)
- ~~`deploy-static-frontend.sh`~~ (replaced by server-deploy.sh)

## 📖 Dokumentasi Lengkap

Lihat folder `documentation/` untuk dokumentasi detail:
- `GIT_DEPLOY_SIMPLE.md` - Workflow deployment
- `DEPLOYMENT_INSTRUCTIONS.md` - Instruksi lengkap
- `PROJECT_STRUCTURE.md` - Struktur project
