import { ref } from 'vue'
import { vi } from 'vitest'
import type { ChatActionHandlers, TopicActionHandlers, UIActionHandlers } from '@/types'

export function createMockChatActions(overrides?: Partial<ChatActionHandlers>): ChatActionHandlers {
  return {
    sendMessage: vi.fn(),
    refreshMessage: vi.fn(),
    deleteMessage: vi.fn(),
    editMessage: vi.fn(),
    stopGenerating: vi.fn(),
    isGenerating: ref(false),
    isThinkingActive: ref(false),
    ...overrides,
  }
}

export function createMockTopicActions(overrides?: Partial<TopicActionHandlers>): TopicActionHandlers {
  return {
    createNewTopic: vi.fn(),
    switchToTopic: vi.fn(),
    removeTopic: vi.fn(),
    removeTopics: vi.fn(),
    renameTopic: vi.fn(),
    ...overrides,
  }
}

export function createMockUIActions(overrides?: Partial<UIActionHandlers>): UIActionHandlers {
  return {
    toggleTheme: vi.fn(),
    setThinkingEnabled: vi.fn(),
    thinkingEnabled: ref(false),
    showChatView: vi.fn(),
    showTopicsView: vi.fn(),
    ...overrides,
  }
}

// Compile-time checks: ensure mocks satisfy interfaces
const _chatCheck: ChatActionHandlers = createMockChatActions()
const _topicCheck: TopicActionHandlers = createMockTopicActions()
const _uiCheck: UIActionHandlers = createMockUIActions()
void _chatCheck
void _topicCheck
void _uiCheck
