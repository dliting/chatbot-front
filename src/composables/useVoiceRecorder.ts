/**
 * Voice recorder state machine: PCM capture via WebAudio ScriptProcessor,
 * WAV encoding via utils/audio. MediaRecorder is intentionally not used —
 * its webm/opus output is not accepted by Ollama input_audio ASR models.
 */
import { ref } from 'vue'
import type { Ref } from 'vue'
import { encodeWav } from '@/utils/audio'

export class VoiceRecorderError extends Error {
  readonly code: 'permission' | 'unsupported'
  constructor(code: 'permission' | 'unsupported', message: string) {
    super(message)
    this.name = 'VoiceRecorderError'
    this.code = code
  }
}

export type VoiceRecorderState = 'idle' | 'recording' | 'transcribing'

export interface UseVoiceRecorderOptions {
  /** Hard stop after this many seconds of recording (default 60) */
  maxDurationSec?: number
}

export interface UseVoiceRecorderReturn {
  state: Ref<VoiceRecorderState>
  isSupported: boolean
  start: () => Promise<void>
  /** Stop capture; resolves with WAV payload as base64, or null when not recording */
  stop: () => Promise<string | null>
}

const DEFAULT_MAX_DURATION_SEC = 60

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

export function useVoiceRecorder(options: UseVoiceRecorderOptions = {}): UseVoiceRecorderReturn {
  const maxDurationMs = (options.maxDurationSec ?? DEFAULT_MAX_DURATION_SEC) * 1000
  const state = ref<VoiceRecorderState>('idle')
  const isSupported =
    typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

  let audioContext: AudioContext | null = null
  let mediaStream: MediaStream | null = null
  let processor: ScriptProcessorNode | null = null
  let sourceNode: MediaStreamAudioSourceNode | null = null
  let chunks: Float32Array[] = []
  let timer: ReturnType<typeof setTimeout> | null = null

  function cleanup() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    processor?.disconnect()
    sourceNode?.disconnect()
    mediaStream?.getTracks().forEach((t) => t.stop())
    audioContext?.close().catch(() => undefined)
    processor = null
    sourceNode = null
    mediaStream = null
    audioContext = null
  }

  async function start(): Promise<void> {
    if (state.value !== 'idle') return
    if (!isSupported) {
      throw new VoiceRecorderError('unsupported', 'MediaDevices API is not available')
    }

    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      throw new VoiceRecorderError('permission', 'Microphone access denied')
    }

    chunks = []
    audioContext = new AudioContext({ sampleRate: 16000 })
    sourceNode = audioContext.createMediaStreamSource(mediaStream)
    // ScriptProcessorNode is deprecated but the only option that keeps the
    // library bundle single-file; AudioWorklet migration is tracked separately.
    processor = audioContext.createScriptProcessor(4096, 1, 1)
    processor.onaudioprocess = (e: AudioProcessingEvent) => {
      chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)))
    }
    sourceNode.connect(processor)
    processor.connect(audioContext.destination)

    state.value = 'recording'
    timer = setTimeout(() => {
      void stop()
    }, maxDurationMs)
  }

  async function stop(): Promise<string | null> {
    if (state.value !== 'recording') return null

    // Observable 'transcribing' phase: yield once before the (synchronous) encode
    state.value = 'transcribing'
    cleanup()
    chunks = await Promise.resolve(chunks)

    const totalLength = chunks.reduce((sum, c) => sum + c.length, 0)
    const merged = new Float32Array(totalLength)
    let offset = 0
    for (const c of chunks) {
      merged.set(c, offset)
      offset += c.length
    }
    chunks = []

    const base64 = arrayBufferToBase64(encodeWav(merged, 16000))
    state.value = 'idle'
    return base64
  }

  return { state, isSupported, start, stop }
}
