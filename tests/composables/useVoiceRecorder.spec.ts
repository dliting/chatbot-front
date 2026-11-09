import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useVoiceRecorder, VoiceRecorderError } from '@/composables/useVoiceRecorder'

/** ScriptProcessorNode double with a pushable audio frame queue */
function createFakeProcessor() {
  const listeners: Record<string, Array<(e: { inputBuffer: AudioBuffer }) => void>> = {}
  const pending: Float32Array[] = []
  const node = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    addEventListener: vi.fn((type: string, cb: (e: { inputBuffer: AudioBuffer }) => void) => {
      ;(listeners[type] ??= []).push(cb)
    }),
    removeEventListener: vi.fn(),
    /** Test hook: push a frame through the message pipeline */
    pushFrame(samples: number[]) {
      const f32 = new Float32Array(samples)
      pending.push(f32)
      const buffer = {
        getChannelData: () => f32,
      } as unknown as AudioBuffer
      for (const cb of listeners['audioprocess'] ?? []) cb({ inputBuffer: buffer })
    },
    onaudioprocess: null as null | ((e: { inputBuffer: AudioBuffer }) => void),
  }
  return { node, pushFrame: (s: number[]) => node.pushFrame(s) }
}

/** Install globals: getUserMedia + AudioContext whose script processor is the fake */
function installFakeAudioApi(processor: ReturnType<typeof createFakeProcessor>) {
  const stopTrack = vi.fn()
  const fakeStream = { getTracks: () => [{ stop: stopTrack }] } as unknown as MediaStream
  ;(globalThis.navigator as unknown as { mediaDevices: unknown }).mediaDevices = {
    getUserMedia: vi.fn().mockResolvedValue(fakeStream),
  } as unknown as MediaDevices

  const FakeAudioContext = class {
    sampleRate = 16000
    state = 'running'
    destination = {}
    createScriptProcessor() {
      return processor.node as unknown as ScriptProcessorNode
    }
    createMediaStreamSource() {
      return { connect: vi.fn(), disconnect: vi.fn() } as unknown as MediaStreamAudioSourceNode
    }
    connect() {}
    close() {
      return Promise.resolve()
    }
    resume() {
      return Promise.resolve()
    }
  }
  ;(globalThis as unknown as { AudioContext: unknown }).AudioContext = FakeAudioContext
  return fakeStream
}

describe('useVoiceRecorder', () => {
  let processor: ReturnType<typeof createFakeProcessor>

  beforeEach(() => {
    processor = createFakeProcessor()
    installFakeAudioApi(processor)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('transitions idle → recording → transcribing → idle and returns WAV base64', async () => {
    const recorder = useVoiceRecorder()
    expect(recorder.state.value).toBe('idle')

    await recorder.start()
    expect(recorder.state.value).toBe('recording')

    processor.pushFrame([0.5, -0.5, 1])
    processor.pushFrame([-1, 0, 0.25])

    const stopPromise = recorder.stop()
    expect(recorder.state.value).toBe('transcribing')
    const base64 = await stopPromise

    expect(recorder.state.value).toBe('idle')
    expect(base64).toBeTruthy()
    // decoded payload must start with RIFF
    const bin = atob(base64 as string)
    expect(bin.slice(0, 4)).toBe('RIFF')
    expect(bin.slice(8, 12)).toBe('WAVE')
  })

  it('rejects with VoiceRecorderError(permission) and resets state when getUserMedia fails', async () => {
    ;(globalThis.navigator as unknown as { mediaDevices: { getUserMedia: unknown } }).mediaDevices = {
      getUserMedia: vi.fn().mockRejectedValue(new Error('denied')),
    }

    const recorder = useVoiceRecorder()
    await expect(recorder.start()).rejects.toMatchObject({ code: 'permission' })
    expect(recorder.state.value).toBe('idle')
  })

  it('reports unsupported when mediaDevices is missing', () => {
    ;(globalThis.navigator as unknown as Record<string, unknown>).mediaDevices = undefined
    const recorder = useVoiceRecorder()
    expect(recorder.isSupported).toBe(false)
    void VoiceRecorderError
  })

  it('auto-stops at maxDurationSec and resets to idle', async () => {
    const recorder = useVoiceRecorder({ maxDurationSec: 1 })
    await recorder.start()

    processor.pushFrame([0.1, 0.2])
    vi.advanceTimersByTime(1000)
    // timer fired stop() → transcribing → idle
    await vi.waitFor(() => expect(recorder.state.value).toBe('idle'))
    expect(await recorder.stop()).toBeNull()
  })

  it('returns null when stop is called while idle', async () => {
    const recorder = useVoiceRecorder()
    expect(await recorder.stop()).toBeNull()
  })
})

describe('useVoiceRecorder unsupported environment', () => {
  it('start throws VoiceRecorderError(unsupported) without mediaDevices', async () => {
    ;(globalThis.navigator as unknown as Record<string, unknown>).mediaDevices = undefined
    const recorder = useVoiceRecorder()
    await expect(recorder.start()).rejects.toMatchObject({ code: 'unsupported' })
    expect(recorder.state.value).toBe('idle')
  })
})

describe('useVoiceRecorder races, leaks and auto-stop delivery', () => {
  const stopTrack = vi.fn()
  const fakeStream = { getTracks: () => [{ stop: stopTrack }] } as unknown as MediaStream

  function installThrowingContext() {
    ;(globalThis.navigator as unknown as { mediaDevices: { getUserMedia: unknown } }).mediaDevices = {
      getUserMedia: vi.fn().mockResolvedValue(fakeStream),
    }
    ;(globalThis as unknown as { AudioContext: unknown }).AudioContext = class {
      constructor() {
        throw new Error('sampleRate unsupported')
      }
    }
  }

  function installCountingContext(contexts: unknown[]) {
    ;(globalThis.navigator as unknown as { mediaDevices: { getUserMedia: unknown } }).mediaDevices = {
      getUserMedia: vi.fn().mockResolvedValue(fakeStream),
    }
    ;(globalThis as unknown as { AudioContext: unknown }).AudioContext = class {
      sampleRate = 48000
      destination = {}
      constructor() { contexts.push(this) }
      createMediaStreamSource() { return { connect: vi.fn(), disconnect: vi.fn() } }
      createScriptProcessor() { return { connect: vi.fn(), disconnect: vi.fn(), addEventListener: vi.fn(), onaudioprocess: null } }
      close() { return Promise.resolve() }
    }
  }

  it('creates exactly one AudioContext for concurrent start calls (no orphan graph)', async () => {
    const contexts: unknown[] = []
    installCountingContext(contexts)
    const recorder = useVoiceRecorder()

    await Promise.all([recorder.start(), recorder.start()])
    expect(contexts).toHaveLength(1)
    expect(recorder.state.value).toBe('recording')
    await recorder.stop()
  })

  it('cleans up the mic stream when graph construction throws after getUserMedia', async () => {
    installThrowingContext()
    const recorder = useVoiceRecorder()

    await expect(recorder.start()).rejects.toThrow('sampleRate unsupported')
    expect(stopTrack).toHaveBeenCalled() // mic released — no half-open state
    expect(recorder.state.value).toBe('idle')
  })

  it('delivers auto-stop audio via onAutoStop', async () => {
    vi.useFakeTimers()
    const processor = createFakeProcessor()
    installFakeAudioApi(processor)
    const onAutoStop = vi.fn()
    const recorder = useVoiceRecorder({ maxDurationSec: 1, onAutoStop })

    await recorder.start()
    processor.pushFrame([0.1, 0.2])
    vi.advanceTimersByTime(1000)
    await vi.waitFor(() => expect(onAutoStop).toHaveBeenCalledTimes(1))
    expect(onAutoStop.mock.calls[0][0]).toMatch(/^UklGRi/) // base64 RIFF
    expect(recorder.state.value).toBe('idle')
    vi.useRealTimers()
  })

  it('encodes WAV with the AudioContext actual sample rate', async () => {
    const contexts: Array<{ sampleRate: number }> = []
    installCountingContext(contexts)
    const recorder = useVoiceRecorder()
    await recorder.start()
    expect(recorder.state.value).toBe('recording')
    expect(contexts).toHaveLength(1)
    const base64 = await recorder.stop()

    const bin = atob(base64 as string)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    expect(new DataView(bytes.buffer).getUint32(24, true)).toBe(contexts[0].sampleRate)
  })
})

describe('useVoiceRecorder capture-backend strategy seam', () => {
  /** Minimal fake backend — proves the state machine is backend-agnostic */
  function createFakeBackend() {
    const calls = { start: 0, stop: 0 }
    let stopValue: string | null = 'QUJD'
    let startError: Error | null = null
    const backend = {
      isSupported: true,
      start: vi.fn(async () => {
        calls.start++
        if (startError) throw startError
      }),
      stop: vi.fn(async () => {
        calls.stop++
        return stopValue
      }),
    }
    return { backend, calls, setStopValue: (v: string | null) => { stopValue = v }, setStartError: (e: Error | null) => { startError = e } }
  }

  it('delegates start/stop to the injected backend', async () => {
    const fake = createFakeBackend()
    const recorder = useVoiceRecorder({ backend: fake.backend })

    await recorder.start()
    expect(fake.calls.start).toBe(1)
    expect(recorder.state.value).toBe('recording')

    const result = await recorder.stop()
    expect(fake.calls.stop).toBe(1)
    expect(result).toBe('QUJD')
    expect(recorder.state.value).toBe('idle')
  })

  it('propagates backend errors without wrapping', async () => {
    const fake = createFakeBackend()
    fake.setStartError(new Error('native bridge missing'))
    const recorder = useVoiceRecorder({ backend: fake.backend })

    await expect(recorder.start()).rejects.toThrow('native bridge missing')
    expect(recorder.state.value).toBe('idle')
  })

  it('auto-stop delivers backend audio through onAutoStop', async () => {
    vi.useFakeTimers()
    const fake = createFakeBackend()
    const onAutoStop = vi.fn()
    const recorder = useVoiceRecorder({ maxDurationSec: 1, onAutoStop, backend: fake.backend })

    await recorder.start()
    vi.advanceTimersByTime(1000)
    await vi.waitFor(() => expect(onAutoStop).toHaveBeenCalledTimes(1))
    expect(onAutoStop).toHaveBeenCalledWith('QUJD')
    expect(recorder.state.value).toBe('idle')
    vi.useRealTimers()
  })

  it('never touches WebAudio globals when a backend is injected', async () => {
    const fake = createFakeBackend()
    ;(globalThis.navigator as unknown as { mediaDevices: undefined }).mediaDevices = undefined

    const recorder = useVoiceRecorder({ backend: fake.backend })
    expect(recorder.isSupported).toBe(true) // from the backend, not globals
    await recorder.start()
    await recorder.stop()
    expect(fake.calls.start).toBe(1)
  })
})
