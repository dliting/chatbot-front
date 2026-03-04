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
      // Multi-entry for development/examples
      input: {
        main: resolve(__dirname, 'index.html'),
        extended: resolve(__dirname, 'examples/extended.html'),
        compact: resolve(__dirname, 'examples/compact.html'),
        fullscreen: resolve(__dirname, 'examples/fullscreen.html'),
        floating: resolve(__dirname, 'examples/floating.html'),
        sidebar: resolve(__dirname, 'examples/sidebar.html'),
      },
    },
    cssCodeSplit: false,
    sourcemap: true,
  },
})
