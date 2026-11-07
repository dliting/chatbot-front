import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useFileSelection } from '@/composables/useFileSelection'

/** Minimal FileReader mock: instances record onload/onerror for manual trigger */
function createMockFileReaderClass() {
  const instances: Array<{ result: string | null; onload: (() => void) | null; onerror: (() => void) | null }> = []
  const Cls = class {
    result: string | null = null
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    constructor() {
      instances.push(this)
    }
    readAsDataURL() {}
  }
  return { Cls, instances }
}

function mkFile(name: string, size: number, type: string): File {
  const f = new File([name], name, { type })
  Object.defineProperty(f, 'size', { value: size })
  return f
}

describe('useFileSelection', () => {
  let originalFileReader: typeof FileReader
  let filePayload = 'data:image/png;base64,QUJD'

  beforeEach(() => {
    originalFileReader = globalThis.FileReader
    filePayload = 'data:image/png;base64,QUJD'
    vi.stubGlobal('FileReader', class {
      result: string | null = null
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      readAsDataURL() {
        this.result = filePayload
        queueMicrotask(() => this.onload?.())
      }
    })
  })

  afterEach(() => {
    vi.stubGlobal('FileReader', originalFileReader)
    vi.restoreAllMocks()
  })

  it('accepts valid files and exposes them as selectedFiles', async () => {
    const { selectedFiles, handleFileSelect } = useFileSelection({})
    const event = { target: { files: [mkFile('a.png', 100, 'image/png')], value: 'x' } }

    const promise = handleFileSelect(event as unknown as Event)
    await promise

    expect(selectedFiles.value).toHaveLength(1)
    expect(selectedFiles.value[0]).toMatchObject({ name: 'a.png', type: 'image', data: 'QUJD' })
    expect(selectedFiles.value[0].error).toBeUndefined()
  })

  it('rejects oversize files with toast and without adding entries', async () => {
    const alertMock = vi.fn()
    vi.stubGlobal('alert', alertMock)
    const { selectedFiles, handleFileSelect } = useFileSelection({ maxImageSize: 50 })
    const event = { target: { files: [mkFile('big.png', 100, 'image/png')], value: 'x' } }

    await handleFileSelect(event as unknown as Event)

    expect(selectedFiles.value).toHaveLength(0)
    expect(alertMock).toHaveBeenCalledWith(expect.stringContaining('big.png'))
    vi.unstubAllGlobals()
  })

  it('rejects files beyond maxCount, keeping the first N', async () => {
    const alertMock = vi.fn()
    vi.stubGlobal('alert', alertMock)
    const { selectedFiles, handleFileSelect } = useFileSelection({ maxCount: 1 })
    const event = {
      target: { files: [mkFile('a.png', 1, 'image/png'), mkFile('b.png', 1, 'image/png')], value: 'x' },
    }

    const promise = handleFileSelect(event as unknown as Event)
    await promise

    expect(selectedFiles.value).toHaveLength(1)
    expect(selectedFiles.value[0].name).toBe('a.png')
    expect(alertMock).toHaveBeenCalledTimes(1)
    vi.unstubAllGlobals()
  })

  it('removeFile splices by index', async () => {
    const { selectedFiles, handleFileSelect, removeFile } = useFileSelection({})
    const event = {
      target: { files: [mkFile('a.png', 1, 'image/png'), mkFile('b.png', 1, 'image/png')], value: 'x' },
    }
    const promise = handleFileSelect(event as unknown as Event)
    await promise

    removeFile(0)
    expect(selectedFiles.value.map((f) => f.name)).toEqual(['b.png'])
  })

  it('clearFiles empties the selection (send reset path)', async () => {
    const { selectedFiles, handleFileSelect, clearFiles, hasValidFiles } = useFileSelection({})
    const event = { target: { files: [mkFile('a.png', 1, 'image/png')], value: 'x' } }
    const promise = handleFileSelect(event as unknown as Event)
    await promise
    expect(hasValidFiles.value).toBe(true)

    clearFiles()
    expect(selectedFiles.value).toHaveLength(0)
    expect(hasValidFiles.value).toBe(false)
  })

  it('converts base64 payloads (data URL prefix stripped)', async () => {
    filePayload = 'data:application/pdf;base64,URBG'
    const { selectedFiles, handleFileSelect } = useFileSelection({})
    const event = { target: { files: [mkFile('doc.pdf', 10, 'application/pdf')], value: 'x' } }
    const promise = handleFileSelect(event as unknown as Event)
    await promise

    expect(selectedFiles.value[0].type).toBe('document')
    expect(selectedFiles.value[0].data).toBe('URBG')
    expect(selectedFiles.value[0].preview).toContain('application/pdf')
  })
})

describe('useFileSelection FileReader error path', () => {
  it('surfaces reader errors via toast without adding entries', async () => {
    vi.stubGlobal('FileReader', class {
      result: string | null = null
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      readAsDataURL() {
        queueMicrotask(() => this.onerror?.())
      }
    })
    const alertMock = vi.fn()
    vi.stubGlobal('alert', alertMock)

    const { selectedFiles, handleFileSelect } = useFileSelection({})
    const event = { target: { files: [mkFile('broken.png', 10, 'image/png')], value: 'x' } }
    await handleFileSelect(event as unknown as Event)

    expect(selectedFiles.value).toHaveLength(0)
    expect(alertMock).toHaveBeenCalledWith('Failed to process files. Please try again.')
    vi.unstubAllGlobals()
  })
})
