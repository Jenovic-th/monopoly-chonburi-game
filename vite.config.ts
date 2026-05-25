import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const userName = process.env.USERNAME ?? process.env.USER ?? 'default'
const safeUserName = userName.replace(/[^a-zA-Z0-9_-]/g, '_')

// https://vite.dev/config/
export default defineConfig({
  build: {
    outDir: `.cache/dist-${safeUserName}`,
  },
  cacheDir: `.cache/vite-${safeUserName}`,
  plugins: [react()],
})
