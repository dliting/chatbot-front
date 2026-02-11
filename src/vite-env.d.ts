/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module '@element-plus/icons-vue' {
  export const install: (app: any) => void
}

declare global {
  interface Window {
    AIChatbot?: {
      toggle: (open?: boolean) => void
      setTheme: (theme: 'light' | 'dark') => void
    }
  }
}

export {}
