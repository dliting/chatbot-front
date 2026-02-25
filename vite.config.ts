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
        additionalData: `
          @use "@/styles/base/variables.scss" as *;
        `,
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
      // Library build options
      external: ['vue', 'element-plus'],
      output: {
        globals: {
          vue: 'Vue',
          'element-plus': 'ElementPlus',
        },
        assetFileNames: 'ai-chatbot.[ext]',
      },
    },
    // Library build configuration
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'AIChatbot',
      fileName: 'ai-chatbot',
      formats: ['es', 'umd'],
    },
    cssCodeSplit: false,
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
  },
})
