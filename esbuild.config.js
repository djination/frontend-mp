// ESBuild configuration for production fallback
import { build } from 'esbuild';
import { promises as fs } from 'fs';
import path from 'path';

const buildConfig = {
  entryPoints: ['src/main.jsx'],
  bundle: true,
  outfile: 'dist/main.js',
  format: 'esm',
  target: 'es2020',
  minify: true,
  sourcemap: true,
  splitting: false,
  platform: 'browser',
  define: {
    'process.env.NODE_ENV': '"production"',
    'import.meta.env.VITE_API_BASE_URL': '"http://localhost:5000/api"',
    'import.meta.env.VITE_BASE_URL': '"http://localhost:5000"',
    'import.meta.env.VITE_ENV': '"production"',
    'import.meta.env.MODE': '"production"',
    'import.meta.env.PROD': 'true',
    'global': 'globalThis'
  },
  loader: {
    '.jsx': 'jsx',
    '.js': 'jsx',
    '.css': 'css',
    '.png': 'file',
    '.jpg': 'file',
    '.jpeg': 'file',
    '.svg': 'file',
    '.gif': 'file',
    '.webp': 'file'
  },
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime'
  ],
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment'
};

async function buildApp() {
  try {
    console.log('🔨 Building with ESBuild...');
    
    // Ensure dist directory exists
    await fs.mkdir('dist', { recursive: true });
    
    // Copy public files
    try {
      const publicFiles = await fs.readdir('public');
      for (const file of publicFiles) {
        const srcPath = path.join('public', file);
        const destPath = path.join('dist', file);
        const stat = await fs.stat(srcPath);
        
        if (stat.isFile()) {
          await fs.copyFile(srcPath, destPath);
        }
      }
      console.log('✅ Public files copied');
    } catch (err) {
      console.log('⚠️ No public directory or files to copy');
    }
    
    // Build with ESBuild
    await build(buildConfig);
    
    // Create index.html if it doesn't exist
    const indexPath = 'dist/index.html';
    try {
      await fs.access(indexPath);
    } catch {
      const indexContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MerahPutih Business Center</title>
    <script type="module" crossorigin src="/main.js"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
      await fs.writeFile(indexPath, indexContent);
      console.log('✅ Index.html created');
    }
    
    console.log('🎉 ESBuild completed successfully!');
    
    // Show build summary
    const stats = await fs.stat('dist/main.js');
    console.log(`📦 Bundle size: ${Math.round(stats.size / 1024)}KB`);
    
  } catch (error) {
    console.error('❌ ESBuild failed:', error);
    process.exit(1);
  }
}

buildApp();
