import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('useApiClient - deleteMessage', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should call DELETE /messages/:id', async () => {
    const { useApiClient } = await import('@/composables/useApiClient')
    const client = useApiClient({ baseUrl: 'http://localhost:3001' })

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ code: 0, message: 'success' }),
    })

    await client.deleteMessage('msg_123')
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3001/messages/msg_123',
      { method: 'DELETE' }
    )
  })

  it('should throw on non-ok response', async () => {
    const { useApiClient } = await import('@/composables/useApiClient')
    const client = useApiClient({ baseUrl: 'http://localhost:3001' })

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 404,
    })

    await expect(client.deleteMessage('msg_999')).rejects.toThrow('API error: 404')
  })

  it('should set isLoading during request', async () => {
    const { useApiClient } = await import('@/composables/useApiClient')
    const client = useApiClient({ baseUrl: 'http://localhost:3001' })

    let resolveFetch: (value: any) => void
    const fetchPromise = new Promise((resolve) => { resolveFetch = resolve })
    ;(global.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(fetchPromise)

    const deletePromise = client.deleteMessage('msg_123')

    // isLoading should be true while request is in flight
    expect(client.isLoading.value).toBe(true)

    resolveFetch!({ ok: true })
    await deletePromise

    expect(client.isLoading.value).toBe(false)
  })

  it('should reset isLoading on error', async () => {
    const { useApiClient } = await import('@/composables/useApiClient')
    const client = useApiClient({ baseUrl: 'http://localhost:3001' })

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    await expect(client.deleteMessage('msg_123')).rejects.toThrow('API error: 500')
    expect(client.isLoading.value).toBe(false)
  })
})
