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
  const fakeStream = { getTracks: () => [{ stop: vi.fn() }] } as unknown as MediaStream
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
