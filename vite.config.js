// Smart vite config that reads from .env files
// Automatically adapts to environment configuration
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load environment variables based on mode
  const env = loadEnv(mode, process.cwd(), '')
  
  const config = {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      allowedHosts: [
        'localhost',
        '127.0.0.1',
        'customer.merahputih-id.com',
        '.merahputih-id.com',
        'all'
      ],
      // HMR Configuration yang smart berdasarkan environment
      hmr: env.VITE_DISABLE_HMR === 'true' || env.VITE_ENV === 'server' ? false : {
        port: parseInt(env.VITE_HMR_PORT) || 5173,
        host: env.VITE_HMR_HOST || 'localhost',
        clientPort: parseInt(env.VITE_HMR_CLIENT_PORT) || 5173,
        // Auto-detect protocol berdasarkan environment
        ...(env.VITE_ENV === 'development' && {
          // Untuk server development dengan nginx + SSL
          host: 'customer.merahputih-id.com',
          clientPort: 443,
        }),
        overlay: true,
      },
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
        // Backend Extensions Proxy for audit logging
        '/backend-ext': {
          target: env.VITE_API_BASE_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/backend-ext/, '/backend-ext'),
        },
        // Audit Trail Proxy (secured with service token)
        '/audit': {
          target: env.VITE_API_BASE_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/audit/, '/audit'),
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('Audit proxy error:', err);
              if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Audit proxy error', message: err.message }));
              }
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('🔍 Audit proxy request:', req.method, req.url);
              proxyReq.setTimeout(30000);
            });
            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log('🔍 Audit proxy response:', proxyRes.statusCode, 'for', req.url);
            });
          }
        },
        // OAuth Proxy untuk external API
        '/oauth': {
          target: 'https://stg.merahputih-id.tech:9002',
          changeOrigin: true,
          secure: false,
          timeout: 30000,
          agent: false,
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('OAuth proxy error:', err);
              if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'OAuth proxy error', message: err.message }));
              }
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('OAuth proxy request:', req.method, req.url);
              proxyReq.setTimeout(30000);
            });
            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log('OAuth proxy response:', proxyRes.statusCode);
            });
          }
        },
        // External Machine CRUD API Proxy (MUST BE BEFORE /external-api!)
        '/external-api-crud': {
          target: 'https://stg.merahputih-id.tech:5002',
          changeOrigin: true,
          secure: false,
          timeout: 60000,
          agent: false,
          headers: {
            'Connection': 'keep-alive'
          },
          rewrite: (path) => {
            const newPath = path.replace(/^\/external-api-crud/, '/api');
            console.log(`🔄 CRUD Proxy rewrite: ${path} → ${newPath}`);
            return newPath;
          },
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('External CRUD API proxy error:', err);
              if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                  error: 'External CRUD API proxy error', 
                  message: err.message,
                  code: err.code 
                }));
              }
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('External CRUD API proxy request:', req.method, req.url);
              
              // Forward Authorization header if present
              if (req.headers.authorization) {
                proxyReq.setHeader('Authorization', req.headers.authorization);
                console.log('🔑 Authorization header forwarded to external CRUD API');
              } else {
                console.warn('⚠️ No Authorization header in request to external CRUD API');
              }
              
              proxyReq.setTimeout(60000);
            });
            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log('External CRUD API proxy response:', proxyRes.statusCode, 'for', req.url);
            });
          }
        },
        // External Machine API Proxy (Query operations)
        '/external-api': {
          target: 'https://stg.merahputih-id.tech:5002',
          changeOrigin: true,
          secure: false,
          timeout: 60000, // Increased timeout to 60s
          agent: false,
          headers: {
            'Connection': 'keep-alive'
          },
          rewrite: (path) => {
            const newPath = path.replace(/^\/external-api/, '/api/cdt/core/master');
            console.log(`🔄 Standard Proxy rewrite: ${path} → ${newPath}`);
            return newPath;
          },
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('External API proxy error:', err);
              if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                  error: 'External API proxy error', 
                  message: err.message,
                  code: err.code 
                }));
              }
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('External API proxy request:', req.method, req.url);
              
              // Forward Authorization header if present
              if (req.headers.authorization) {
                proxyReq.setHeader('Authorization', req.headers.authorization);
                console.log('🔑 Authorization header forwarded to external API');
              } else {
                console.warn('⚠️ No Authorization header in request to external API');
              }
              
              proxyReq.setTimeout(60000);
              proxyReq.on('timeout', () => {
                console.log('External API proxy request timeout');
                proxyReq.destroy();
              });
            });
            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log('External API proxy response:', proxyRes.statusCode, 'for', req.url);
            });
          }
        },
        '/ws': {
          target: env.VITE_WS_URL || 'ws://localhost:5000',
          ws: true,
          changeOrigin: true,
        }
      },
      cors: true,
      strictPort: false,
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: env.VITE_DEBUG === 'true',
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            antd: ['antd'],
          }
        }
      }
    },
    define: {
      __DEV__: env.NODE_ENV === 'development',
      __PROD__: env.NODE_ENV === 'production',
      __LOCAL__: env.VITE_ENV === 'local',
      'process.env.VITE_ENV': JSON.stringify(env.VITE_ENV || 'development'),
      'process.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL || 'http://localhost:5000'),
      'process.env.VITE_DEBUG': JSON.stringify(env.VITE_DEBUG || 'true'),
    }
  }

  return config
})