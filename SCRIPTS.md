# Frontend Scripts - Clean & Simple

## Available Scripts

### 🔨 Build Scripts
- **`./build-esbuild.sh`** - Main production build menggunakan ESBuild (bypass Qt/OpenGL issues)
  - Creates: `dist/main.js`, `dist/main.css`, `dist/index.html`
  - Environment: Production dengan backend `https://bc.merahputih-id.com`

### 🎨 Fix Scripts  
- **`./fix-css-bener.sh`** - Fix CSS styling untuk Ant Design components
  - Rebuild + create proper CSS file
  - Fix layout, sidebar, menu, form, table styling
  
- **`./nginx-fix.sh`** - Fix nginx configuration untuk static assets
  - Apply nginx config dengan proper MIME types
  - Test CSS/JS file access
  - Reload nginx service

### 🚀 Development
- **`./start-dev.sh`** - Start development server
  - HMR enabled
  - Local backend connection

## NPM Commands

```bash
# Development
npm run dev                # Start Vite dev server
npm run start:dev         # Start dengan custom script

# Production Build  
npm run build:esbuild     # ESBuild production build

# Fixes
npm run fix:css           # Fix CSS styling issues
npm run fix:nginx         # Fix nginx configuration

# Linting
npm run lint              # Check code style
npm run lint:fix          # Auto-fix code style issues
```

## Deployment Flow

1. **Local Build:**
   ```bash
   ./build-esbuild.sh
   ```

2. **Upload to Server:**
   ```bash
   scp -r dist/* user@server:/var/www/customerdb/frontend-mp/dist/
   ```

3. **Server Fix (if needed):**
   ```bash
   # On server:
   ./fix-css-bener.sh
   ./nginx-fix.sh
   ```

4. **Test:**
   - Frontend: https://customer.merahputih-id.com
   - Backend: https://bc.merahputih-id.com

## Removed Scripts (Cleanup)

Deleted redundant/unused scripts:
- ❌ `build-production.sh` (replaced by esbuild)
- ❌ `deploy-*.sh` (manual deployment preferred)
- ❌ `fix-css-comprehensive.sh` (replaced by bener)
- ❌ `quick-*.sh` (redundant)
- ❌ `setup-nginx-production.sh` (one-time setup)

## File Structure

```
frontend/
├── build-esbuild.sh      # Main build script
├── fix-css-bener.sh      # CSS fix script  
├── nginx-fix.sh          # Nginx fix script
├── start-dev.sh          # Dev server script
├── dist/                 # Build output
├── src/                  # Source code
└── package.json          # Dependencies & scripts
```

---
**Total Scripts: 4 (clean & focused)**
