import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import os from 'node:os'

const userName = os.userInfo().username || process.env.USERNAME || process.env.USER || 'default'
const safeUserName = userName.replace(/[^a-zA-Z0-9_-]/g, '_')
const safeRunId = `${safeUserName}-${process.pid}`

// https://vite.dev/config/
export default defineConfig({
  build: {
    outDir: `.cache/dist-${safeRunId}`,
  },
  cacheDir: `.cache/vite-${safeRunId}`,
  plugins: [react()],
})
