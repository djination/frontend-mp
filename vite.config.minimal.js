// Temporary vite config that works without local vite installation
// This is a fallback configuration for deployment

const config = {
  plugins: [],
  server: {
    host: '0.0.0.0',
    port: 5173,
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
    __DEV__: false,
    __PROD__: true,
    __LOCAL__: false,
  },
}

export default config
