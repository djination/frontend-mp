import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Auto-detect environment
const isProduction = process.env.NODE_ENV === 'production'
const isDevelopment = process.env.NODE_ENV === 'development'
const isLocal = process.env.VITE_ENV === 'local' || (!process.env.VITE_ENV && !isProduction)

// Smart HMR configuration
const getHMRConfig = () => {
  // Jika explicitly disable HMR
  if (process.env.VITE_DISABLE_HMR === 'true') {
    return { overlay: false, port: false }
  }

  // Untuk local development (localhost)
  if (isLocal) {
    return {
      host: 'localhost',
      clientPort: 5173,
    }
  }

  // Untuk server development dengan custom domain
  return {
    host: process.env.VITE_HMR_HOST || 'customer.merahputih-id.com',
    clientPort: process.env.VITE_HMR_CLIENT_PORT || 5173,
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    // Allow specific hosts
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'customer.merahputih-id.com',
      '.merahputih-id.com', // wildcard untuk subdomain
    ],
    hmr: {
      port: 5173,
      ...getHMRConfig(),
    },
    // CORS untuk development
    cors: true,
    // Allow access dari domain lain
    strictPort: false,
    // Proxy configuration
    proxy: process.env.VITE_API_BASE_URL ? {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    } : undefined,
  },
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: !isProduction,
  },
  // Define globals untuk environment
  define: {
    __DEV__: isDevelopment,
    __PROD__: isProduction,
    __LOCAL__: isLocal,
  },
})