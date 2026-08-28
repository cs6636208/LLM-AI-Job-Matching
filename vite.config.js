import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // In development, forward /api requests to the backend
      // This allows the frontend to use relative URLs like "/api/auth/login"
      // instead of the full http://localhost:5000/api/...
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
