import { reactive } from 'vue'

export type BackendMode = 'mock' | 'real'
export type ThemeMode = 'light' | 'dark'

export interface ChatAppSettings {
  backendMode: BackendMode
  theme: ThemeMode
  apiTimeout: number
  showThinkingToggle: boolean
  thinkingDefaultEnabled: boolean
  thinkingAutoCollapse: boolean
  enableVoiceInput: boolean
}

const STORAGE_KEY = 'chatapp-settings'

const DEFAULTS: ChatAppSettings = {
  backendMode: 'mock',
  theme: 'light',
  apiTimeout: 30000,
  showThinkingToggle: true,
  thinkingDefaultEnabled: true,
  thinkingAutoCollapse: true,
  enableVoiceInput: true,
}

function loadSettings(): ChatAppSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<ChatAppSettings>
      return { ...DEFAULTS, ...parsed }
    }
  } catch {
    // Ignore parse errors, use defaults
  }
  return { ...DEFAULTS }
}

// Module-level singleton: all consumers share the same reactive state
const settings = reactive<ChatAppSettings>(loadSettings())

export function useSettings() {
  function saveSettings(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...settings }))
  }

  function resetSettings(): void {
    localStorage.removeItem(STORAGE_KEY)
    Object.assign(settings, { ...DEFAULTS })
  }

  function getApiBaseUrl(): string {
    return `/api/${settings.backendMode}`
  }

  return {
    settings,
    saveSettings,
    resetSettings,
    getApiBaseUrl,
  }
}
