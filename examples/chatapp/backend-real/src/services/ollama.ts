import type { ChatMessage } from '../types'

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3.5:9b'
const OLLAMA_THINKING_ENABLED = process.env.OLLAMA_THINKING_ENABLED !== 'false'

export interface OllamaMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  images?: string[]
}

// Convert OllamaMessage format to OpenAI format
export function convertToOpenAIMessage(message: OllamaMessage): { role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> } {
  if (!message.images || message.images.length === 0) {
    return {
      role: message.role,
      content: message.content
    }
  }

  // Convert to OpenAI multimodal format
  const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
    { type: 'text', text: message.content }
  ]

  for (const img of message.images) {
    // Check if already has data URI prefix
    const dataUrl = img.startsWith('data:') ? img : `data:image/png;base64,${img}`
    content.push({
      type: 'image_url',
      image_url: { url: dataUrl }
    })
  }

  return {
    role: message.role,
    content
  }
}

export async function* streamChat(
  messages: OllamaMessage[]
): AsyncGenerator<ChatMessage, void, unknown> {
  const url = `${OLLAMA_BASE_URL}/v1/chat/completions`

  // Convert messages to OpenAI format
  const openAIMessages = messages.map(convertToOpenAIMessage)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: openAIMessages,
      stream: true
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
        if (!line.trim() || !line.startsWith('data: ')) continue
        try {
          const jsonStr = line.replace(/^data: /, '').trim()
          if (jsonStr === '[DONE]') continue
          const data = JSON.parse(jsonStr)
          if (data.choices?.[0]?.delta?.content) {
            yield { type: 'token', content: data.choices[0].delta.content }
          }
          if (data.choices?.[0]?.finish_reason) {
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
  const url = `${OLLAMA_BASE_URL}/v1/chat/completions`

  // Convert messages to OpenAI format
  const openAIMessages = messages.map(convertToOpenAIMessage)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: openAIMessages,
      stream: false
    })
  })

  if (!response.ok) {
    throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`)
  }

  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> }
  return data.choices?.[0]?.message?.content || ''
}
