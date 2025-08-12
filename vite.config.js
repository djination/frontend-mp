// Temporary vite config that works without local vite installation
// This is a fallback configuration for deployment

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
    // Disable HMR untuk menghindari WebSocket issues
    hmr: false,
    // Tambahkan cors
    cors: true,
    // Tambahkan strictPort
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
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
    __DEV__: true, // Change to true for development
    __PROD__: false, // Change to false for development
    __LOCAL__: false,
  },
}

export default config