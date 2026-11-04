import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function copyHtaccessPlugin() {
  return {
    name: 'copy-htaccess',
    closeBundle() {
      const src = path.resolve(__dirname, 'public/.htaccess')
      const dest = path.resolve(__dirname, 'dist/.htaccess')
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest)
        console.log('✓ Successfully copied .htaccess to dist/.htaccess')
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), copyHtaccessPlugin()],
  server: {
    port: 5174,
  },
})
