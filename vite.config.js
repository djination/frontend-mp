// Smart vite config that reads from .env files
// Automatically adapts to environment configuration

// NOTE: Ada 2 jenis WebSocket:
// 1. Vite HMR WebSocket (untuk development hot reload) - ini yang kita config di sini
// 2. Application WebSocket (untuk komunikasi dengan backend) - ini di VITE_WS_URL

const config = {
  plugins: [],
  server: {
    host: '0.0.0.0',
    port: 5173,
    // Tambahkan allowedHosts
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'customer.merahputih-id.com',
      '.merahputih-id.com', // wildcard untuk subdomain
      'all' // allow all hosts untuk development
    ],
    // HMR WebSocket config untuk nginx dengan subdomain
    hmr: process.env.VITE_DISABLE_HMR === 'true' ? false : {
      // Server HMR menggunakan port yang sama dengan main server
      port: parseInt(process.env.VITE_HMR_PORT) || 5173,
      host: 'localhost', // Bind ke localhost saja
      // Client akan connect melalui nginx proxy
      clientPort: parseInt(process.env.VITE_HMR_CLIENT_PORT) || 443,
      overlay: true, // Enable overlay untuk error HMR
      // Gunakan WSS untuk HTTPS sites (client-side)
      protocol: 'wss',
    },
    // Proxy configuration untuk API calls ke backend
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // Proxy untuk application WebSocket ke backend
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
    // Pass environment variables to client
    'process.env.VITE_ENV': JSON.stringify(process.env.VITE_ENV || 'development'),
    'process.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL || 'http://localhost:5000'),
    'process.env.VITE_DEBUG': JSON.stringify(process.env.VITE_DEBUG || 'true'),
  }
}

export default config