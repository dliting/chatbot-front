import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

/** happy-dom's localStorage rejects method assignment — stub the whole object */
function stubLocalStorage() {
  const store = new Map<string, string>()
  const getItem = vi.fn((key: string) => store.get(key) ?? null)
  const setItem = vi.fn((key: string, value: string) => { store.set(key, value) })
  const removeItem = vi.fn((key: string) => { store.delete(key) })
  vi.stubGlobal('localStorage', { getItem, setItem, removeItem })
  return { getItem, setItem, removeItem, store }
}

describe('useSettings', () => {
  let getItem: ReturnType<typeof stubLocalStorage>['getItem']
  let setItem: ReturnType<typeof stubLocalStorage>['setItem']
  let removeItem: ReturnType<typeof stubLocalStorage>['removeItem']

  beforeEach(() => {
    const stub = stubLocalStorage()
    getItem = stub.getItem
    setItem = stub.setItem
    removeItem = stub.removeItem
    // Reset module cache so singleton re-initializes with fresh localStorage
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  async function getUseSettings() {
    return (await import('../useSettings')).useSettings()
  }

  it('should return default settings when localStorage is empty', async () => {
    const { settings } = await getUseSettings()
    expect(settings.backendMode).toBe('mock')
    expect(settings.theme).toBe('light')
    expect(settings.apiTimeout).toBe(30000)
    expect(settings.showThinkingToggle).toBe(true)
    expect(settings.thinkingDefaultEnabled).toBe(true)
    expect(settings.thinkingAutoCollapse).toBe(true)
    expect(settings.enableVoiceInput).toBe(true)
  })

  it('should load saved settings from localStorage', async () => {
    getItem.mockReturnValue(JSON.stringify({
      backendMode: 'real',
      theme: 'dark',
      apiTimeout: 60000,
    }))
    const { settings } = await getUseSettings()
    expect(settings.backendMode).toBe('real')
    expect(settings.theme).toBe('dark')
    expect(settings.apiTimeout).toBe(60000)
    expect(settings.showThinkingToggle).toBe(true)
    expect(settings.thinkingDefaultEnabled).toBe(true)
    expect(settings.thinkingAutoCollapse).toBe(true)
    expect(settings.enableVoiceInput).toBe(true)
  })

  it('should persist settings via saveSettings', async () => {
    const { settings, saveSettings } = await getUseSettings()
    settings.backendMode = 'real'
    settings.theme = 'dark'
    settings.apiTimeout = 10000
    saveSettings()

    expect(setItem).toHaveBeenCalledWith('chatapp-settings', JSON.stringify({
      backendMode: 'real',
      theme: 'dark',
      apiTimeout: 10000,
      showThinkingToggle: true,
      enableVoiceInput: true,
      thinkingDefaultEnabled: true,
      thinkingAutoCollapse: true,
    }))
  })

  it('should reset settings to defaults', async () => {
    const { settings, saveSettings, resetSettings } = await getUseSettings()
    settings.backendMode = 'real'
    settings.theme = 'dark'
    settings.apiTimeout = 99999
    saveSettings()
    resetSettings()

    expect(settings.backendMode).toBe('mock')
    expect(settings.theme).toBe('light')
    expect(settings.apiTimeout).toBe(30000)
    expect(settings.showThinkingToggle).toBe(true)
    expect(settings.thinkingDefaultEnabled).toBe(true)
    expect(settings.thinkingAutoCollapse).toBe(true)
    expect(settings.enableVoiceInput).toBe(true)
    expect(removeItem).toHaveBeenCalledWith('chatapp-settings')
  })

  it('getApiBaseUrl should return correct path based on backendMode', async () => {
    const { settings, getApiBaseUrl } = await getUseSettings()

    settings.backendMode = 'mock'
    expect(getApiBaseUrl()).toBe('/api/mock')

    settings.backendMode = 'real'
    expect(getApiBaseUrl()).toBe('/api/real')
  })

  it('should handle corrupt localStorage data gracefully', async () => {
    getItem.mockReturnValue('not-json')
    const { settings } = await getUseSettings()
    expect(settings.backendMode).toBe('mock')
    expect(settings.theme).toBe('light')
    expect(settings.apiTimeout).toBe(30000)
    expect(settings.showThinkingToggle).toBe(true)
    expect(settings.thinkingDefaultEnabled).toBe(true)
    expect(settings.thinkingAutoCollapse).toBe(true)
    expect(settings.enableVoiceInput).toBe(true)
  })

  it('should merge partial stored settings with defaults', async () => {
    getItem.mockReturnValue(JSON.stringify({
      backendMode: 'real',
    }))
    const { settings } = await getUseSettings()
    expect(settings.backendMode).toBe('real')
    expect(settings.theme).toBe('light')
    expect(settings.apiTimeout).toBe(30000)
    expect(settings.showThinkingToggle).toBe(true)
    expect(settings.thinkingDefaultEnabled).toBe(true)
    expect(settings.thinkingAutoCollapse).toBe(true)
    expect(settings.enableVoiceInput).toBe(true)
  })

  it('should return the same reactive object across calls (singleton)', async () => {
    const mod = await import('../useSettings')
    const { settings: s1 } = mod.useSettings()
    const { settings: s2 } = mod.useSettings()
    expect(s1).toBe(s2)
  })
})
