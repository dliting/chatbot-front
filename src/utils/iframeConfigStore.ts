/**
 * Reactive config store for the iframe entry.
 *
 * host:setConfig patches must be reactive — a plain Object.assign on a
 * module-level object never reaches Vue's computed config chain.
 */
import { reactive, computed } from 'vue'
import type { ComputedRef } from 'vue'
import type { ChatbotConfig } from '@/types/config'
import { defaultChatbotConfig } from '@/constants/config'

/** Defaults the iframe entry always applies on top of the host config */
const IFRAME_DEFAULTS = {
  position: 'bottom-right',
  panelWidth: 400,
  theme: 'light',
  enableImageUpload: true,
} satisfies Partial<ChatbotConfig>

export interface IframeConfigStore {
  /** Reactive host config (patched at runtime via host:setConfig) */
  config: ChatbotConfig
  /** IFRAME_DEFAULTS merged over the reactive host config */
  mergedConfig: ComputedRef<Required<ChatbotConfig>>
  /** Shallow-merge a partial config, silently ignoring unknown keys */
  patch: (partial: Partial<ChatbotConfig>) => void
}

export function createIframeConfigStore(initial: ChatbotConfig): IframeConfigStore {
  const config = reactive<ChatbotConfig>({ ...initial }) as ChatbotConfig

  const mergedConfig = computed(
    () => ({ ...IFRAME_DEFAULTS, ...config }) as Required<ChatbotConfig>
  )

  const knownKeys = new Set(Object.keys(defaultChatbotConfig))

  const patch = (partial: Partial<ChatbotConfig>) => {
    if (!partial || typeof partial !== 'object') return
    for (const [key, value] of Object.entries(partial)) {
      if (knownKeys.has(key)) {
        ;(config as Record<string, unknown>)[key] = value
      }
    }
  }

  return { config, mergedConfig, patch }
}
