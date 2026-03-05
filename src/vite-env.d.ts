/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/ban-types
  const component: DefineComponent<object, object, unknown>
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
