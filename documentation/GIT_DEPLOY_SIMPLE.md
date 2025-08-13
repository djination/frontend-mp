# Git Deploy Workflow - Simple Version

Workflow simple untuk deploy frontend dengan build di server. Tidak perlu commit file build ke git.

## Cara Kerja

```
[Local Development] → [Git Push] → [Server Pull + Build] → [Deploy]
```

## Step by Step

### 1. Di Local (Development)

```bash
# Setelah coding selesai
git add .
git commit -m "Update feature ABC"
git push origin main
```

### 2. Di Server (Production)

```bash
# Masuk ke folder project
cd /path/to/frontend

# Pull perubahan terbaru
git pull origin main

# Auto deploy (install, build, deploy)
npm run deploy:auto
```

### 3. Verifikasi

- Buka: https://customer.merahputih-id.com
- Cek CSS loading dengan F12
- Test fitur baru

## Script yang Tersedia

| Script | Kegunaan |
|--------|----------|
| `npm run deploy:auto` | Auto deploy lengkap (install + build + deploy) |
| `npm run build` | Build saja |
| `./scripts/git-deploy-workflow.sh` | Lihat step-by-step manual |

## Keuntungan Workflow Ini

✅ **Simple**: Cuma git push dan npm run deploy:auto  
✅ **Clean**: Tidak ada file build di git  
✅ **Auto**: Script otomatis handle semua  
✅ **Safe**: Ada backup otomatis  
✅ **Fast**: Build langsung di server  

## Troubleshooting

### Jika npm run deploy:auto error:

```bash
# Cek log error
tail -n 50 /var/log/nginx/error.log

# Manual deploy
npm install
npm run build
sudo cp -r dist/* /var/www/frontend/
sudo systemctl reload nginx
```

### Jika CSS tidak load:

```bash
# Cek file permissions
ls -la /var/www/frontend/

# Fix permissions
sudo chown -R www-data:www-data /var/www/frontend/
sudo chmod -R 755 /var/www/frontend/
```

## File Structure

```
frontend/
├── scripts/
│   ├── git-deploy-workflow.sh    # Manual workflow guide
│   └── server-deploy.sh          # Auto deploy script
├── src/                          # Source code (masuk git)
├── dist/                        # Build result (tidak masuk git)
└── package.json                 # Updated scripts
```

## Git Ignore

Pastikan `.gitignore` sudah ignore folder build:

```gitignore
dist/
node_modules/
.env.local
.env.production
```

Dengan workflow ini, git repository tetap clean dan deployment jadi sangat simple!
