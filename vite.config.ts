import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Do not let the Python backend and virtualenv trigger hot reloads.
    // Without this, Vite watches .venv/Lib/site-packages and the SQLite file,
    // which produces hundreds of pointless reloads.
    watch: {
      ignored: ['**/.venv/**', '**/ai/**', '**/node_modules/**', '**/*.db'],
    },
    proxy: {
      // The Python AI backend (ai/app/server.py) runs on port 8000.
      // Proxying keeps the browser on a single origin, so no CORS issues.
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
