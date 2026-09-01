import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
  },
  build: {
    rollupOptions: {
      // Single dev/E2E entry; the library build uses vite.config.lib.ts,
      // the full-stack example lives in examples/chatapp with its own tooling
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
    cssCodeSplit: false,
    sourcemap: true,
  },
})
