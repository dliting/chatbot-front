import type { ChatMessage } from '../types'

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3.5:9b'
const OLLAMA_THINKING_ENABLED = process.env.OLLAMA_THINKING_ENABLED !== 'false'
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''

export interface OllamaMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  images?: string[]
  videos?: string[]  // 新增
  audios?: string[]  // 新增
}

// Convert OllamaMessage format to OpenAI format
export function convertToOpenAIMessage(message: OllamaMessage): {
  role: string
  content: string | Array<{
    type: string
    text?: string
    image_url?: { url: string }
    video_url?: { url: string }
    audio_url?: { url: string }
  }>
} {
  const hasMedia = (message.images?.length) || (message.videos?.length) || (message.audios?.length)

  if (!hasMedia) {
    return {
      role: message.role,
      content: message.content
    }
  }

  const content: Array<{
    type: string
    text?: string
    image_url?: { url: string }
    video_url?: { url: string }
    audio_url?: { url: string }
  }> = []

  // 添加文本
  if (message.content) {
    content.push({ type: 'text', text: message.content })
  }

  // 添加图片
  if (message.images?.length) {
    for (const img of message.images) {
      const dataUrl = img.startsWith('data:') ? img : `data:image/png;base64,${img}`
      content.push({
        type: 'image_url',
        image_url: { url: dataUrl }
      })
    }
  }

  // 添加视频
  if (message.videos?.length) {
    for (const video of message.videos) {
      const dataUrl = video.startsWith('data:') ? video : `data:video/mp4;base64,${video}`
      content.push({
        type: 'video_url',
        video_url: { url: dataUrl }
      })
    }
  }

  // 添加音频
  if (message.audios?.length) {
    for (const audio of message.audios) {
      const dataUrl = audio.startsWith('data:') ? audio : `data:audio/mp3;base64,${audio}`
      content.push({
        type: 'audio_url',
        audio_url: { url: dataUrl }
      })
    }
  }

  return {
    role: message.role,
    content
  }
}

export interface OllamaChatOptions {
  thinking?: { enabled?: boolean }
}

// Build the chat completions URL, detecting whether OLLAMA_BASE_URL
// already includes a version path (e.g., /v1, /v2)
export function buildChatUrl(baseUrl: string = OLLAMA_BASE_URL): string {
  const trimmed = baseUrl.replace(/\/+$/, '')
  const apiPath = /\/v\d+$/.test(trimmed) ? '/chat/completions' : '/v1/chat/completions'
  return `${trimmed}${apiPath}`
}

// Build request headers with optional authorization
function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (OPENAI_API_KEY) {
    headers['Authorization'] = `Bearer ${OPENAI_API_KEY}`
  }
  return headers
}

export async function* streamChat(
  messages: OllamaMessage[],
  options?: OllamaChatOptions
): AsyncGenerator<ChatMessage, void, unknown> {
  const url = buildChatUrl()

  // Convert messages to OpenAI format
  const openAIMessages = messages.map(convertToOpenAIMessage)

  const requestBody: Record<string, unknown> = {
    model: OLLAMA_MODEL,
    messages: openAIMessages,
    stream: true,
  }
  // Explicitly set enable_thinking: Ollama models may default to producing
  // reasoning content when the parameter is omitted
  requestBody.enable_thinking = options?.thinking?.enabled !== false && OLLAMA_THINKING_ENABLED

  const response = await fetch(url, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(requestBody)
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
          const reasoning = data.choices?.[0]?.delta?.reasoning ?? data.choices?.[0]?.delta?.reasoning_content
          if (reasoning) {
            yield { type: 'reasoning', reasoningContent: reasoning }
          }
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
  const url = buildChatUrl()

  // Convert messages to OpenAI format
  const openAIMessages = messages.map(convertToOpenAIMessage)

  const response = await fetch(url, {
    method: 'POST',
    headers: buildHeaders(),
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
