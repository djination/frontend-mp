// Smart vite config that reads from .env files
// Automatically adapts to environment configuration

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
    // Smart HMR configuration dari .env
    hmr: {
      // Use environment variables or fallback to defaults
      port: parseInt(process.env.VITE_HMR_PORT) || 5173,
      host: process.env.VITE_HMR_HOST || 'customer.merahputih-id.com',
      clientPort: parseInt(process.env.VITE_HMR_CLIENT_PORT) || 5173,
    },
    // Proxy configuration untuk API sesuai .env
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      }
    },
    // Tambahkan cors
    cors: true,
    // Tambahkan strictPort
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
  },
}

export default config