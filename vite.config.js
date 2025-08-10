import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
      // Handle both localhost dan custom domain
      host: process.env.VITE_HMR_HOST || 'localhost',
      clientPort: process.env.VITE_HMR_CLIENT_PORT || 5173,
    },
    // CORS untuk development
    cors: true,
    // Allow access dari domain lain
    strictPort: false,
  },
})