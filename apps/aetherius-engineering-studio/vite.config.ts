import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.json'],
  },
  build: {
    rollupOptions: {
      external: ['node:fs', 'node:path', 'node:child_process', 'node:net'],
    },
  },
  server: {
    port: 5174,
    host: true,
  },
  preview: {
    port: 4174,
    host: true,
  },
})
