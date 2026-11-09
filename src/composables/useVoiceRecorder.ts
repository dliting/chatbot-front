/**
 * Voice recorder state machine (Strategy pattern):
 * - mechanics (mic access, PCM capture, WAV encoding) live in a pluggable
 *   VoiceCaptureBackend (default: WebAudio, see voiceCapture.ts)
 * - policy (duration limit, auto-stop delivery, state phases) lives here,
 *   so alternative capture backends inherit identical behavior
 */
import { ref } from 'vue'
import type { Ref } from 'vue'
import { createWebAudioCaptureBackend, VoiceRecorderError } from './voiceCapture'
import type { VoiceCaptureBackend } from './voiceCapture'

export { VoiceRecorderError }
export type VoiceRecorderState = 'idle' | 'recording' | 'transcribing'

export interface UseVoiceRecorderOptions {
  /** Hard stop after this many seconds of recording (default 60) */
  maxDurationSec?: number
  /** Fired when the duration limit auto-stops the recording (not on manual stop) */
  onAutoStop?: (base64Wav: string) => void
  /** Capture backend (Strategy). Defaults to WebAudio ScriptProcessor capture */
  backend?: VoiceCaptureBackend
}

export interface UseVoiceRecorderReturn {
  state: Ref<VoiceRecorderState>
  isSupported: boolean
  start: () => Promise<void>
  /** Stop capture; resolves with WAV payload as base64, or null when not recording */
  stop: () => Promise<string | null>
}

const DEFAULT_MAX_DURATION_SEC = 60

export function useVoiceRecorder(options: UseVoiceRecorderOptions = {}): UseVoiceRecorderReturn {
  const maxDurationMs = (options.maxDurationSec ?? DEFAULT_MAX_DURATION_SEC) * 1000
  const backend: VoiceCaptureBackend = options.backend ?? createWebAudioCaptureBackend()
  const state = ref<VoiceRecorderState>('idle')
  const isSupported = backend.isSupported

  let timer: ReturnType<typeof setTimeout> | null = null
  let starting = false
  let autoStopped = false

  function clearTimer() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  async function start(): Promise<void> {
    // Pending-start guard: a second click while getUserMedia is in flight must
    // not create an orphan capture graph
    if (state.value !== 'idle' || starting) return
    if (!backend.isSupported) {
      throw new VoiceRecorderError('unsupported', 'MediaDevices API is not available')
    }

    starting = true
    try {
      await backend.start()
      state.value = 'recording'
      timer = setTimeout(() => {
        autoStopped = true
        void stop()
      }, maxDurationMs)
    } finally {
      starting = false
    }
  }

  async function stop(): Promise<string | null> {
    if (state.value !== 'recording') return null

    // Observable 'transcribing' phase: yield once before encoding
    state.value = 'transcribing'
    clearTimer()
    const base64 = await Promise.resolve(backend.stop())
    state.value = 'idle'

    // Duration-limit auto-stop: deliver the audio to the host callback
    if (autoStopped) {
      autoStopped = false
      if (base64) options.onAutoStop?.(base64)
    }
    return base64
  }

  return { state, isSupported, start, stop }
}
