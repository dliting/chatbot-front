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
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'AIChatbot',
      formats: ['es', 'umd'],
      fileName: (format) => `ai-chatbot.${format}.js`,
    },
    rollupOptions: {
      external: ['vue', 'element-plus', '@vue-office/docx', '@vue-office/excel', '@vue-office/pdf'],
      output: {
        globals: {
          vue: 'Vue',
          'element-plus': 'ElementPlus',
        },
        assetFileNames: 'style.[ext]',
      },
    },
  },
})
