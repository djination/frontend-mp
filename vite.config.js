// Smart vite config that reads from .env files
// Automatically adapts to environment configuration

import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  const isDevelopment = env.VITE_ENV === 'development';

  return {
    plugins: [],
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
      // HMR Configuration untuk development dengan nginx proxy
      hmr: env.VITE_DISABLE_HMR === 'true' ? false : (
        isDevelopment ? {
          // Development dengan nginx SSL proxy
          port: parseInt(env.VITE_HMR_PORT) || 5173,
          clientPort: parseInt(env.VITE_HMR_CLIENT_PORT) || 443,
          host: env.VITE_HMR_HOST || 'customer.merahputih-id.com',
          // Force client to use correct WebSocket URL from env
          client: {
            webSocketURL: env.VITE_HMR_WS_URL || 'wss://customer.merahputih-id.com'
          }
        } : {
          // Local development tanpa nginx
          port: 5173,
          host: 'localhost'
        }
      ),
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
  };
});