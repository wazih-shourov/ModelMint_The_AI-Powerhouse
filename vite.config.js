import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      // Ignore python-server directory to prevent file watcher limit errors
      ignored: [
        '**/python-server/**',
        '**/.venv/**',
        '**/node_modules/**',
        '**/.git/**'
      ]
    }
  }
})
