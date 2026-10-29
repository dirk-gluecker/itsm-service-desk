import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../../packages/shared'),
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    allowedHosts: ['frontend-w2eq0fwfa.gobrev.dev', 'localhost'],
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
