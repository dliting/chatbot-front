/**
 * Mock API for development and testing
 */
import type { Message, Session, StreamEvent, ApiResponse } from '@/types'
import { generateId, sleep } from '@/utils/helpers'

/**
 * Mock chat responses
 */
const mockResponses = [
  "That's an interesting question! Let me think about that for a moment.",
  "I understand what you're asking. Here's what I can tell you...",
  "Great question! There are several aspects to consider here.",
  "Thanks for reaching out. I'd be happy to help with that.",
  "Let me provide some insights on this topic.",
]

/**
 * Get a random mock response
 */
function getMockResponse(input: string): string {
  const baseResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)]

  return `${baseResponse}

Based on your message "${input || 'your question'}", here are some additional thoughts:

1. **First point**: This is a simulated response that demonstrates the chatbot's formatting capabilities.

2. **Second point**: In a real implementation, this would connect to an actual AI backend like Claude, GPT-4, or another LLM service.

3. **Code example**:
   \`\`\`javascript
   const response = await ai.chat(message);
   console.log(response);
   \`\`\`

Feel free to ask more questions! This is all simulated content for demonstration purposes.`
}

/**
 * Mock API client
 */
export const mockAPI = {
  /**
   * Send message and get streaming response
   */
  async *sendMessageStream(content: string): AsyncGenerator<StreamEvent, void, unknown> {
    const messageId = generateId('msg')

    // Start event
    await sleep(100)
    yield { type: 'start', messageId }

    // Stream tokens
    const response = getMockResponse(content)
    const tokens = response.split('')

    for (const token of tokens) {
      await sleep(20 + Math.random() * 30)
      yield { type: 'token', content: token }
    }

    // End event
    yield { type: 'end', fullContent: response }
  },

  /**
   * Send message (non-streaming)
   */
  async sendMessage(content: string): Promise<ApiResponse<Message>> {
    await sleep(500)

    return {
      code: 0,
      message: 'success',
      data: {
        id: generateId('msg'),
        sessionId: generateId('session'),
        role: 'assistant',
        type: 'text',
        content: getMockResponse(content),
        timestamp: Date.now(),
        status: 'sent',
      },
    }
  },

  /**
   * Upload images (mock)
   */
  async uploadImages(files: File[]): Promise<ApiResponse<{ urls: string[] }>> {
    await sleep(1000)

    // Create blob URLs for preview
    const urls = files.map(file => URL.createObjectURL(file))

    return {
      code: 0,
      message: 'success',
      data: { urls },
    }
  },

  /**
   * Get session list (mock)
   */
  async getSessions(): Promise<ApiResponse<Session[]>> {
    await sleep(200)

    const sessions: Session[] = [
      {
        id: generateId('session'),
        title: 'How to use the chatbot',
        createdAt: Date.now() - 3600000,
        updatedAt: Date.now() - 3600000,
        messageCount: 4,
        unreadCount: 0,
      },
      {
        id: generateId('session'),
        title: 'Technical questions',
        createdAt: Date.now() - 86400000,
        updatedAt: Date.now() - 86400000,
        messageCount: 8,
        unreadCount: 0,
      },
    ]

    return {
      code: 0,
      message: 'success',
      data: sessions,
    }
  },

  /**
   * Get session messages (mock)
   */
  async getSessionMessages(sessionId: string): Promise<ApiResponse<Message[]>> {
    await sleep(200)

    const messages: Message[] = [
      {
        id: generateId('msg'),
        sessionId,
        role: 'user',
        type: 'text',
        content: 'Hello! How can I use this chatbot?',
        timestamp: Date.now() - 3600000,
        status: 'sent',
      },
      {
        id: generateId('msg'),
        sessionId,
        role: 'assistant',
        type: 'text',
        content: 'Welcome! Just type your message in the input box and press Enter or click the send button.',
        timestamp: Date.now() - 3590000,
        status: 'sent',
      },
    ]

    return {
      code: 0,
      message: 'success',
      data: messages,
    }
  },

  /**
   * Create session (mock)
   */
  async createSession(): Promise<ApiResponse<Session>> {
    await sleep(100)

    return {
      code: 0,
      message: 'success',
      data: {
        id: generateId('session'),
        title: 'New Chat',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messageCount: 0,
        unreadCount: 0,
      },
    }
  },

  /**
   * Delete session (mock)
   */
  async deleteSession(_sessionId: string): Promise<ApiResponse<void>> {
    await sleep(100)
    return { code: 0, message: 'success' }
  },
}

/**
 * Create a streaming response generator
 */
export function createMockStream(content: string, charDelay = 30): AsyncGenerator<StreamEvent> {
  return (async function* () {
    const messageId = generateId('msg')

    yield { type: 'start', messageId }

    for (const char of content) {
      await sleep(charDelay)
      yield { type: 'token', content: char }
    }

    yield { type: 'end', fullContent: content }
  })()
}
