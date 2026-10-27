import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/beyond-the-surface/',
  build: {
    outDir: 'dist',
  },
})