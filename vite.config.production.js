// Minimal vite config untuk server production Ubuntu
// Menghindari masalah Qt/OpenGL dengan konfigurasi minimal
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020',
    cssTarget: 'es2020',
    
    // Optimized rollup options
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          antd: ['antd'],
          utils: ['axios', 'moment']
        }
      }
    },
    
    // Disable problematic features for headless server
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1000
  },

  // Server configuration (untuk dev mode)
  server: {
    host: '0.0.0.0',
    port: 5173,
    hmr: false, // Disable HMR untuk production server
    strictPort: false
  },

  // Define global constants
  define: {
    __DEV__: false,
    __PROD__: true,
    'process.env.NODE_ENV': '"production"'
  },

  // Disable problematic optimizations
  optimizeDeps: {
    disabled: true
  },

  // CSS configuration
  css: {
    postcss: './postcss.config.js'
  }
})
