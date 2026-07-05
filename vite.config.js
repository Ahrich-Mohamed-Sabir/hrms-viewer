import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],

  // BASE_URL pour GitHub Pages : /nom-du-repo/
  // En local (server.js) : '/'  |  Sur GitHub Pages : '/hrms-viewer/'
  base: process.env.VITE_BASE || '/',

  server: {
    port: 5200,
    host: true,
    proxy: { '/api': 'http://localhost:3030' }
  }
})
