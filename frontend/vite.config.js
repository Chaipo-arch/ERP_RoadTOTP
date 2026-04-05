import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['erp-nginx'],
    proxy: {
      // Proxy toutes les requêtes /api -> nginx container (erp-nginx dans docker-compose)
      '/api': {
        target: 'http://erp-nginx',
        changeOrigin: true,
        secure: false,
      },
      // Proxy sanctum cookie route aussi
      '/sanctum': {
        target: 'http://erp-nginx',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})

