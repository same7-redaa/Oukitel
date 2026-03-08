import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // Admin builds into the main site's public/admin/ folder,
  // so it gets included in the main site's dist/admin/ automatically
  build: {
    outDir: '../oukitel-egypt/public/admin',
    emptyOutDir: true,
  },
  base: '/admin/',
})
