import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true, // Разрешаем доступ с любых хостов
    port: 5173,
    strictPort: false,
    // Разрешаем все хосты (для туннелей ngrok, cloudflare и т.д.)
    allowedHosts: [
      '.ngrok.io',
      '.ngrok-free.app',
      '.trycloudflare.com',
      '.loca.lt',
      'localhost',
      '127.0.0.1',
    ],
  },
})