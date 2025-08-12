// Smart vite config that reads from .env files
// Automatically adapts to environment configuration

const config = {
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
    // HMR Configuration yang smart berdasarkan environment
    hmr: process.env.VITE_DISABLE_HMR === 'true' ? false : {
      port: parseInt(process.env.VITE_HMR_PORT) || 5173,
      host: process.env.VITE_HMR_HOST || 'localhost',
      clientPort: parseInt(process.env.VITE_HMR_CLIENT_PORT) || 5173,
      // Auto-detect protocol berdasarkan environment
      ...(process.env.VITE_ENV === 'development' && {
        // Untuk server development dengan nginx + SSL
        host: 'customer.merahputih-id.com',
        clientPort: 443,
      }),
      overlay: true,
    },
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/ws': {
        target: process.env.VITE_WS_URL || 'ws://localhost:5000',
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
    sourcemap: process.env.VITE_DEBUG === 'true',
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
    __DEV__: process.env.NODE_ENV === 'development',
    __PROD__: process.env.NODE_ENV === 'production',
    __LOCAL__: process.env.VITE_ENV === 'local',
    'process.env.VITE_ENV': JSON.stringify(process.env.VITE_ENV || 'development'),
    'process.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL || 'http://localhost:5000'),
    'process.env.VITE_DEBUG': JSON.stringify(process.env.VITE_DEBUG || 'true'),
  }
}

export default config