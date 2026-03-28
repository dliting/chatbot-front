import { describe, it, expect } from 'vitest'
import { defaultChatbotConfig, defaultChatbotLabels } from '@/types/config'
import type { ChatbotConfig, ChatbotLabels } from '@/types/config'

describe('Thinking config extensions', () => {
  it('ChatbotConfig should accept thinking fields', () => {
    const config: ChatbotConfig = { enableThinking: true, thinkingDefaultEnabled: false, thinkingAutoCollapse: false }
    expect(config.enableThinking).toBe(true)
  })

  it('ChatbotLabels should accept thinking labels', () => {
    const labels: Partial<ChatbotLabels> = {
      thinking: { toggle: 'Think', thinking: 'Thinking...', deeplyThought: 'Thought {seconds}s', showThinking: 'Show', hideThinking: 'Hide' },
    }
    expect(labels.thinking?.toggle).toBe('Think')
  })

  it('defaultChatbotConfig should have thinking defaults', () => {
    expect(defaultChatbotConfig.enableThinking).toBe(false)
    expect(defaultChatbotConfig.thinkingDefaultEnabled).toBe(true)
    expect(defaultChatbotConfig.thinkingAutoCollapse).toBe(true)
  })

  it('defaultChatbotLabels should have thinking labels', () => {
    expect(defaultChatbotLabels.thinking).toBeDefined()
    expect(defaultChatbotLabels.thinking?.toggle).toBe('思考')
  })
})
