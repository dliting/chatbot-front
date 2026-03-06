import type { ChatMessage } from '../types'

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3.5:9b'
const OLLAMA_THINKING_ENABLED = process.env.OLLAMA_THINKING_ENABLED !== 'false'

export interface OllamaMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  images?: string[]
}

export async function* streamChat(
  messages: OllamaMessage[]
): AsyncGenerator<ChatMessage, void, unknown> {
  const url = `${OLLAMA_BASE_URL}/api/chat`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      stream: true,
      think: OLLAMA_THINKING_ENABLED
    })
  })

  if (!response.ok) {
    throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`)
  }

  if (!response.body) {
    throw new Error('No response body from Ollama')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  const messageId = ''

  yield { type: 'start', messageId }

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const data = JSON.parse(line)
          if (data.message?.content) {
            yield { type: 'token', content: data.message.content }
          }
          if (data.done) {
            yield { type: 'end', fullContent: '' }
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

export async function chat(messages: OllamaMessage[]): Promise<string> {
  const url = `${OLLAMA_BASE_URL}/api/chat`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      stream: false,
      think: OLLAMA_THINKING_ENABLED
    })
  })

  if (!response.ok) {
    throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`)
  }

  const data = await response.json() as { message?: { content?: string } }
  return data.message?.content || ''
}
