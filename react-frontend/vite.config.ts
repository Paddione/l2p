import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './src'),
      '@/components': path.resolve(process.cwd(), './src/components'),
      '@/hooks': path.resolve(process.cwd(), './src/hooks'),
      '@/services': path.resolve(process.cwd(), './src/services'),
      '@/stores': path.resolve(process.cwd(), './src/stores'),
      '@/types': path.resolve(process.cwd(), './src/types'),
      '@/utils': path.resolve(process.cwd(), './src/utils'),
    },
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://10.0.0.44',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://10.0.0.44',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
  preview: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['styled-components', 'framer-motion'],
          api: ['axios', '@tanstack/react-query'],
          socket: ['socket.io-client'],
        },
      },
    },
  },
})
