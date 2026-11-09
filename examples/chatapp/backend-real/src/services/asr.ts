/**
 * ASR (voice-to-text) providers — Adapter pattern.
 *
 * The route layer depends only on the AsrProvider interface; concrete adapters
 * wrap vendor SDKs/HTTP APIs. Selection happens in createAsrProvider via the
 * OLLAMA_ASR_PROVIDER env (default 'ollama'). New vendors (OpenAI-compatible
 * cloud ASR, Whisper servers, …) implement the interface and register here.
 */
import { OLLAMA_ASR_MODEL, OLLAMA_BASE_URL, OPENAI_API_KEY } from '../config'

export interface AsrProvider {
  /** Provider identifier (matches OLLAMA_ASR_PROVIDER values) */
  readonly name: string
  /** Transcribe base64-encoded audio into text */
  transcribe(audio: string, format: string): Promise<string>
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (OPENAI_API_KEY && OPENAI_API_KEY !== 'ollama') {
    headers.Authorization = `Bearer ${OPENAI_API_KEY}`
  }
  return headers
}

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, '')}${path}`
}

/** Adapter over an Ollama audio-capable model (/v1/chat/completions, input_audio parts) */
export function createOllamaAsrProvider(options: {
  baseUrl: string
  model: string
  headers: Record<string, string>
}): AsrProvider {
  return {
    name: 'ollama',

    async transcribe(audio: string, format: string): Promise<string> {
      const response = await fetch(joinUrl(options.baseUrl, '/v1/chat/completions'), {
        method: 'POST',
        headers: options.headers,
        body: JSON.stringify({
          model: options.model,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Transcribe the audio exactly.' },
                { type: 'input_audio', input_audio: { data: audio, format } },
              ],
            },
          ],
          stream: false,
        }),
      })

      if (!response.ok) {
        throw new Error(`Ollama transcription failed: ${response.status} ${response.statusText}`)
      }

      const result = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>
      }
      return result.choices?.[0]?.message?.content ?? ''
    },
  }
}

/** Select the ASR adapter from configuration (Strategy entry point) */
export function createAsrProvider(provider: string = 'ollama'): AsrProvider {
  switch (provider) {
    case 'ollama':
      return createOllamaAsrProvider({
        baseUrl: OLLAMA_BASE_URL,
        model: OLLAMA_ASR_MODEL,
        headers: buildHeaders(),
      })
    default:
      throw new Error(
        `Unknown ASR provider: "${provider}". Supported: 'ollama'. Set OLLAMA_ASR_PROVIDER in real.env.`
      )
  }
}
