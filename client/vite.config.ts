import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub Pages serves this as a project site at /tavern-tales-rpg/, not
  // the domain root — only applies to production builds, not local dev.
  base: command === 'build' ? '/tavern-tales-rpg/' : '/',
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
}))
