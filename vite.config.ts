import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/luna-health/',  // 👈 add this
  plugins: [react()],
})
