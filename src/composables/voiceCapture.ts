/**
 * Voice capture backends (Strategy pattern).
 *
 * The default backend captures PCM via WebAudio ScriptProcessor and encodes
 * 16-bit WAV (the format Ollama input_audio ASR models accept). Alternative
 * backends — AudioWorklet, native bridges — implement the same interface and
 * plug into useVoiceRecorder via its `backend` option.
 *
 * Policy (recording duration limits, auto-stop delivery, error toasts) lives
 * in the composable; this module is mechanics only.
 */
import { encodeWav } from '@/utils/audio'

export class VoiceRecorderError extends Error {
  readonly code: 'permission' | 'unsupported'
  constructor(code: 'permission' | 'unsupported', message: string) {
    super(message)
    this.name = 'VoiceRecorderError'
    this.code = code
  }
}

export interface VoiceCaptureBackend {
  /** Whether this environment supports capture at all */
  readonly isSupported: boolean
  /** Request the microphone and begin PCM collection; throws VoiceRecorderError */
  start(): Promise<void>
  /** Stop collection; resolves with WAV base64, or null when not recording */
  stop(): Promise<string | null>
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

export function createWebAudioCaptureBackend(): VoiceCaptureBackend {
  const isSupported =
    typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

  let audioContext: AudioContext | null = null
  let mediaStream: MediaStream | null = null
  let processor: ScriptProcessorNode | null = null
  let sourceNode: MediaStreamAudioSourceNode | null = null
  let chunks: Float32Array[] = []
  let sampleRate = 16000
  let recording = false

  function cleanup() {
    processor?.disconnect()
    sourceNode?.disconnect()
    mediaStream?.getTracks().forEach((t) => t.stop())
    audioContext?.close().catch(() => undefined)
    processor = null
    sourceNode = null
    mediaStream = null
    audioContext = null
  }

  return {
    isSupported,

    async start() {
      if (recording) return
      if (!isSupported) {
        throw new VoiceRecorderError('unsupported', 'MediaDevices API is not available')
      }

      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      } catch {
        throw new VoiceRecorderError('permission', 'Microphone access denied')
      }

      // Everything after getUserMedia must clean the stream on failure,
      // otherwise the microphone stays open at the OS level
      try {
        chunks = []
        audioContext = new AudioContext({ sampleRate: 16000 })
        // "sampleRate" is a request — the browser may ignore it; the WAV header
        // must declare the rate the data was actually captured at
        sampleRate = audioContext.sampleRate
        sourceNode = audioContext.createMediaStreamSource(mediaStream)
        // ScriptProcessorNode is deprecated but the only option that keeps the
        // library bundle single-file; AudioWorklet backend is tracked separately.
        processor = audioContext.createScriptProcessor(4096, 1, 1)
        processor.onaudioprocess = (e: AudioProcessingEvent) => {
          chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)))
        }
        sourceNode.connect(processor)
        processor.connect(audioContext.destination)
        recording = true
      } catch (error) {
        cleanup()
        throw error
      }
    },

    async stop() {
      if (!recording) return null
      recording = false
      cleanup()

      const totalLength = chunks.reduce((sum, c) => sum + c.length, 0)
      const merged = new Float32Array(totalLength)
      let offset = 0
      for (const c of chunks) {
        merged.set(c, offset)
        offset += c.length
      }
      chunks = []

      return arrayBufferToBase64(encodeWav(merged, sampleRate))
    },
  }
}
