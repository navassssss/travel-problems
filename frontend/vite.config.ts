import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  if (command === 'build') {
    const { VITE_API_URL } = loadEnv(mode, process.cwd())
    const url = URL.parse(VITE_API_URL?.trim() || '')
    if (!url || url.protocol !== 'https:' || !url.hostname.includes('.') ||
        url.hostname.endsWith('.localhost') || /^127\./.test(url.hostname) ||
        url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
      throw new Error('Set VITE_API_URL to the public HTTPS origin of this project’s backend.')
    }
  }
  return { plugins: [react()] }
})
