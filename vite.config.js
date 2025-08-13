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