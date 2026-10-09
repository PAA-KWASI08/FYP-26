import { env } from 'node:process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: env.GITHUB_PAGES === 'true' ? '/FYP-26/' : '/',
  plugins: [react(), tailwindcss()],
})