import { describe, it, expect } from 'vitest'
import { createIframeConfigStore } from '@/utils/iframeConfigStore'

describe('createIframeConfigStore', () => {
  it('applies iframe defaults to mergedConfig', () => {
    const store = createIframeConfigStore({})
    expect(store.mergedConfig.value.panelWidth).toBe(400)
    expect(store.mergedConfig.value.position).toBe('bottom-right')
  })

  it('patch updates reactive config and mergedConfig', () => {
    const store = createIframeConfigStore({})
    store.patch({ panelWidth: 500 })
    expect(store.config.panelWidth).toBe(500)
    expect(store.mergedConfig.value.panelWidth).toBe(500)
  })

  it('initial config is preserved in mergedConfig', () => {
    const store = createIframeConfigStore({ theme: 'dark', allowedOrigins: ['https://a.com'] })
    expect(store.mergedConfig.value.theme).toBe('dark')
    expect(store.mergedConfig.value.allowedOrigins).toEqual(['https://a.com'])
  })

  it('patch ignores unknown keys', () => {
    const store = createIframeConfigStore({})
    store.patch({ enableTopicManager: true } as never)
    expect((store.config as Record<string, unknown>).enableTopicManager).toBeUndefined()
  })

  it('patch ignores non-object input', () => {
    const store = createIframeConfigStore({ theme: 'light' })
    store.patch(null as never)
    store.patch('oops' as never)
    expect(store.config.theme).toBe('light')
  })
})
