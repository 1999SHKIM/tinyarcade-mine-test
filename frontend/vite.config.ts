import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // 개발 중 /api 요청을 Spring Boot(8080)로 전달
    proxy: { '/api': 'http://localhost:8080' },
  },
})
