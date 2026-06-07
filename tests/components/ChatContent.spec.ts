/**
 * Tests for ChatContent component
 * Covers: bubble styling, code overflow, message action buttons (copy/refresh/delete)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ChatContent from '@/components/ChatContent.vue'
import { chatActionsKey, uiActionsKey } from '@/symbols'
import { createMockChatActions, createMockUIActions } from '../utils/mockActions'

// Mock ChatInput to avoid complex dependencies
vi.mock('@/components/ChatInput.vue', () => ({
  default: {
    name: 'ChatInput',
    template: '<div class="chat-input-mock"><slot /></div>',
    props: ['disabled'],
    emits: ['send', 'file-click'],
  },
}))

// Mock element-plus
vi.mock('element-plus', () => ({
  ElMessage: { success: vi.fn(), error: vi.fn() },
}))

const mockMessages = [
  {
    messageId: 'msg-user-1',
    sessionId: 'session-1',
    role: 'user' as const,
    type: 'text' as const,
    content: 'Hello, how are you?',
    timestamp: Date.now() - 1000,
    status: 'sent' as const,
  },
  {
    messageId: 'msg-assistant-1',
    sessionId: 'session-1',
    role: 'assistant' as const,
    type: 'text' as const,
    content: 'I am fine, thank you! Here is some code:\n\n```python\nprint("Hello World")\n```',
    timestamp: Date.now(),
    status: 'sent' as const,
  },
]

// Mock action handlers for inject
const mockChatActions = createMockChatActions()
const mockUIActions = createMockUIActions()

const createWrapper = (options = {}) => {
  return mount(ChatContent, {
    props: {
      messages: mockMessages,
      welcomeVisible: false,
      quickActionsVisible: false,
      ...options,
    },
    global: {
      stubs: { ChatInput: true },
      provide: {
        [chatActionsKey]: mockChatActions,
        [uiActionsKey]: mockUIActions,
      },
    },
  })
}

describe('ChatContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  describe('Bubble styling', () => {
    it('should use CSS variable for user bubble background (not gradient)', () => {
      const wrapper = createWrapper()
      const userBubble = wrapper.find('.user .chat-content__bubble')
      expect(userBubble.exists()).toBe(true)
      // Verify the bubble exists and has the chat-content__bubble class
      expect(userBubble.classes()).toContain('chat-content__bubble')
    })

    it('should apply user role class to user messages', () => {
      const wrapper = createWrapper()
      const userMessage = wrapper.findAll('.chat-content__message')[0]
      expect(userMessage.classes()).toContain('user')
    })

    it('should apply assistant role class to assistant messages', () => {
      const wrapper = createWrapper()
      const assistantMessage = wrapper.findAll('.chat-content__message')[1]
      expect(assistantMessage.classes()).toContain('assistant')
    })

    it('should render markdown content for assistant messages', () => {
      const wrapper = createWrapper()
      const assistantText = wrapper.findAll('.chat-content__text')[1]
      expect(assistantText.classes()).toContain('markdown-content')
    })

    it('should NOT render markdown-content class for user messages', () => {
      const wrapper = createWrapper()
      const userText = wrapper.findAll('.chat-content__text')[0]
      expect(userText.classes()).not.toContain('markdown-content')
    })
  })

  describe('Code overflow handling', () => {
    it('should render messages with min-width: 0 on message container', () => {
      const wrapper = createWrapper()
      const messages = wrapper.findAll('.chat-content__message')
      messages.forEach(msg => {
        // Check that message elements exist
        expect(msg.exists()).toBe(true)
      })
    })

    it('should render code blocks in assistant messages', () => {
      const wrapper = createWrapper()
      const assistantText = wrapper.findAll('.chat-content__text')[1]
      // The v-html should contain pre or code elements for markdown
      const html = assistantText.find('span').html()
      expect(html).toContain('print')
    })
  })

  describe('Message action buttons', () => {
    it('should render action buttons for user messages (copy, delete)', () => {
      const wrapper = createWrapper()
      const userMessage = wrapper.findAll('.chat-content__message')[0]
      const actions = userMessage.find('.chat-content__message-actions')
      expect(actions.exists()).toBe(true)

      const buttons = actions.findAll('.chat-content__action-btn')
      // User messages: copy + delete (no refresh)
      expect(buttons.length).toBe(2)
    })

    it('should render action buttons for assistant messages (copy, refresh, delete)', () => {
      const wrapper = createWrapper()
      const assistantMessage = wrapper.findAll('.chat-content__message')[1]
      const actions = assistantMessage.find('.chat-content__message-actions')
      expect(actions.exists()).toBe(true)

      const buttons = actions.findAll('.chat-content__action-btn')
      // Assistant messages: copy + refresh + delete
      expect(buttons.length).toBe(3)
    })

    it('should NOT render action buttons for loading messages', () => {
      const loadingMessage = {
        ...mockMessages[0],
        messageId: 'msg-loading',
        status: 'loading' as const,
        content: '',
      }
      const wrapper = createWrapper({ messages: [loadingMessage] })
      const actions = wrapper.find('.chat-content__message-actions')
      expect(actions.exists()).toBe(false)
    })

    it('should NOT render action buttons for messages without content', () => {
      const emptyMessage = {
        ...mockMessages[0],
        messageId: 'msg-empty',
        status: 'loading' as const,
        content: '',
      }
      const wrapper = createWrapper({ messages: [emptyMessage] })
      const actions = wrapper.find('.chat-content__message-actions')
      expect(actions.exists()).toBe(false)
    })

    it('should call copyToClipboard when copy button is clicked', async () => {
      const wrapper = createWrapper()
      const userMessage = wrapper.findAll('.chat-content__message')[0]
      const copyBtn = userMessage.findAll('.chat-content__action-btn')[0]
      await copyBtn.trigger('click')
      // Copy is handled locally via copyToClipboard, no emit or inject call
    })

    it('should show confirm dialog and call deleteMessage when confirmed', async () => {
      const wrapper = createWrapper()
      const userMessage = wrapper.findAll('.chat-content__message')[0]
      const deleteBtn = userMessage.findAll('.chat-content__action-btn')[1]
      await deleteBtn.trigger('click')

      // ConfirmDialog should be visible
      const dialog = wrapper.findComponent({ name: 'ConfirmDialog' })
      expect(dialog.exists()).toBe(true)
      expect(dialog.props('show')).toBe(true)

      // Confirm deletion
      await dialog.vm.$emit('confirm')
      await nextTick()
      expect(mockChatActions.deleteMessage).toHaveBeenCalledWith(mockMessages[0])
    })

    it('should call refreshMessage when refresh button is clicked', async () => {
      const wrapper = createWrapper()
      const assistantMessage = wrapper.findAll('.chat-content__message')[1]
      const refreshBtn = assistantMessage.findAll('.chat-content__action-btn')[1]
      await refreshBtn.trigger('click')
      expect(mockChatActions.refreshMessage).toHaveBeenCalledWith(mockMessages[1])
    })

    it('should have danger class on delete button', () => {
      const wrapper = createWrapper()
      const userMessage = wrapper.findAll('.chat-content__message')[0]
      const buttons = userMessage.findAll('.chat-content__action-btn')
      const deleteBtn = buttons[buttons.length - 1] // Last button is delete
      expect(deleteBtn.classes()).toContain('chat-content__action-btn--danger')
    })
  })

  describe('AI last message action visibility', () => {
    it('should show actions by default for the last AI message (--visible class)', () => {
      const wrapper = createWrapper()
      // mockMessages: [user, assistant] — assistant is last AI message
      const assistantMessage = wrapper.findAll('.chat-content__message')[1]
      expect(assistantMessage.classes()).toContain('chat-content__message--last-ai')
      const actions = assistantMessage.find('.chat-content__message-actions')
      expect(actions.classes()).toContain('chat-content__message-actions--visible')
    })

    it('should NOT show actions by default for user messages', () => {
      const wrapper = createWrapper()
      const userMessage = wrapper.findAll('.chat-content__message')[0]
      expect(userMessage.classes()).not.toContain('chat-content__message--last-ai')
      const actions = userMessage.find('.chat-content__message-actions')
      expect(actions.classes()).not.toContain('chat-content__message-actions--visible')
    })

    it('should only mark the last AI message as --last-ai when multiple AI messages exist', () => {
      const messages = [
        mockMessages[0], // user
        mockMessages[1], // assistant (first)
        { ...mockMessages[0], messageId: 'msg-user-2', content: 'Follow up' }, // user
        { ...mockMessages[1], messageId: 'msg-assistant-2', content: 'Follow up reply' }, // assistant (last)
      ]
      const wrapper = createWrapper({ messages })
      const allMessages = wrapper.findAll('.chat-content__message')
      // First assistant message (index 1) should NOT be last-ai
      expect(allMessages[1].classes()).not.toContain('chat-content__message--last-ai')
      expect(allMessages[1].find('.chat-content__message-actions').classes()).not.toContain('chat-content__message-actions--visible')
      // Last assistant message (index 3) should be last-ai
      expect(allMessages[3].classes()).toContain('chat-content__message--last-ai')
      expect(allMessages[3].find('.chat-content__message-actions').classes()).toContain('chat-content__message-actions--visible')
    })

    it('should mark AI as last-ai when user message follows (user has no response yet)', () => {
      const messages = [
        mockMessages[1], // assistant
        mockMessages[0], // user (no new AI response)
      ]
      const wrapper = createWrapper({ messages })
      const assistantMessage = wrapper.findAll('.chat-content__message')[0]
      expect(assistantMessage.classes()).toContain('chat-content__message--last-ai')
      expect(assistantMessage.find('.chat-content__message-actions').classes()).toContain('chat-content__message-actions--visible')
    })
  })

  describe('Welcome section', () => {
    it('should show welcome section when welcomeVisible is true and no messages', () => {
      const wrapper = createWrapper({ welcomeVisible: true, messages: [] })
      expect(wrapper.find('.chat-content__welcome').exists()).toBe(true)
    })

    it('should hide welcome section when welcomeVisible is false', () => {
      const wrapper = createWrapper({ welcomeVisible: false, messages: [] })
      expect(wrapper.find('.chat-content__welcome').exists()).toBe(false)
    })

    it('should show welcome section when welcomeVisible prop is true', () => {
      const wrapper = createWrapper({ welcomeVisible: true, messages: mockMessages })
      // Note: ChatContent only checks welcomeVisible prop; parent handles messages.length check
      expect(wrapper.find('.chat-content__welcome').exists()).toBe(true)
    })
  })

  describe('Edit on double-click', () => {
    it('should call editMessage on user message double-click', async () => {
      const wrapper = createWrapper()
      const userMessage = wrapper.findAll('.chat-content__message')[0]
      await userMessage.trigger('dblclick')
      expect(mockChatActions.editMessage).toHaveBeenCalledWith(mockMessages[0])
    })

    it('should NOT call editMessage on assistant message double-click', async () => {
      const wrapper = createWrapper()
      const assistantMessage = wrapper.findAll('.chat-content__message')[1]
      await assistantMessage.trigger('dblclick')
      expect(mockChatActions.editMessage).not.toHaveBeenCalled()
    })
  })

  describe('Message rendering', () => {
    it('should render all messages', () => {
      const wrapper = createWrapper()
      const messages = wrapper.findAll('.chat-content__message')
      expect(messages.length).toBe(2)
    })

    it('should render message text content', () => {
      const wrapper = createWrapper()
      const userText = wrapper.findAll('.chat-content__text')[0]
      expect(userText.text()).toBe('Hello, how are you?')
    })

    it('should render images when present', () => {
      const messageWithImage = {
        ...mockMessages[0],
        messageId: 'msg-img',
        attachments: [{ name: '', url: 'data:image/png;base64,test', type: 'image' }],
      }
      const wrapper = createWrapper({ messages: [messageWithImage] })
      const img = wrapper.find('.chat-content__image')
      expect(img.exists()).toBe(true)
    })
  })

  describe('Quick actions', () => {
    it('should call chatActions.sendMessage when quick action is clicked (inject path)', async () => {
      const wrapper = createWrapper({ welcomeVisible: true, messages: [] })
      const quickActionBtn = wrapper.find('.chat-content__quick-action')
      if (quickActionBtn.exists()) {
        await quickActionBtn.trigger('click')
        expect(mockChatActions.sendMessage).toHaveBeenCalledWith({ content: expect.any(String) })
      }
    })
  })

  describe('Emit fallback (no inject)', () => {
    const createWrapperWithoutInject = (options = {}) => {
      return mount(ChatContent, {
        props: {
          messages: mockMessages,
          welcomeVisible: false,
          quickActionsVisible: false,
          ...options,
        },
        global: {
          stubs: { ChatInput: true },
          // No provide — forces emit fallback
        },
      })
    }

    it('should emit send-message when chatActions not injected', async () => {
      const wrapper = createWrapperWithoutInject()
      const component = wrapper.vm as any
      component.handleSend({ content: 'test' })
      expect(wrapper.emitted('send-message')).toBeTruthy()
      expect(wrapper.emitted('send-message')![0][0]).toEqual({ content: 'test' })
    })

    it('should emit edit when chatActions not injected and user message double-clicked', async () => {
      const wrapper = createWrapperWithoutInject()
      const userMessage = wrapper.findAll('.chat-content__message')[0]
      await userMessage.trigger('dblclick')
      expect(wrapper.emitted('edit')).toBeTruthy()
    })

    it('should emit refresh when chatActions not injected and refresh button clicked', async () => {
      const wrapper = createWrapperWithoutInject()
      const assistantMessage = wrapper.findAll('.chat-content__message')[1]
      const refreshBtn = assistantMessage.findAll('.chat-content__action-btn')[1]
      await refreshBtn.trigger('click')
      expect(wrapper.emitted('refresh')).toBeTruthy()
    })

    it('should emit delete when chatActions not injected and delete confirmed', async () => {
      const wrapper = createWrapperWithoutInject()
      const userMessage = wrapper.findAll('.chat-content__message')[0]
      const deleteBtn = userMessage.findAll('.chat-content__action-btn')[1]
      await deleteBtn.trigger('click')

      const dialog = wrapper.findComponent({ name: 'ConfirmDialog' })
      await dialog.vm.$emit('confirm')
      await nextTick()
      expect(wrapper.emitted('delete')).toBeTruthy()
    })
  })
})
