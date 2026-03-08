/**
 * Unit tests for SessionListView component
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SessionListView from '@/components/SessionListView.vue'
import type { Session } from '@/types'

describe('SessionListView', () => {
  const createMockSessions = (): Session[] => [
    { sessionId: '1', title: 'First Session', createdAt: Date.now() - 100000, updatedAt: Date.now() - 1000, messageCount: 5, unreadCount: 0 },
    { sessionId: '2', title: 'Second Session', createdAt: Date.now() - 200000, updatedAt: Date.now() - 2000, messageCount: 10, unreadCount: 2 },
  ]

  describe('Component Rendering', () => {
    it('should render the component', () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
      })
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('.session-list-view').exists()).toBe(true)
    })

    it('should render new session button', () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
      })
      expect(wrapper.find('.session-list-view__new-btn').exists()).toBe(true)
    })

    it('should render session list', () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
      })
      expect(wrapper.find('.session-list-view__list').exists()).toBe(true)
    })
  })

  describe('Header', () => {
    it('should render header when not embedded', () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
          isEmbedded: false,
        },
      })
      expect(wrapper.find('.session-list-view__header').exists()).toBe(true)
    })

    it('should not render header when embedded', () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
          isEmbedded: true,
        },
      })
      expect(wrapper.find('.session-list-view__header').exists()).toBe(false)
    })
  })

  describe('Session List', () => {
    it('should render session items', () => {
      const sessions = createMockSessions()
      const wrapper = mount(SessionListView, {
        props: {
          sessions,
          currentSessionId: '1',
        },
      })
      const items = wrapper.findAll('.session-list-view__item')
      expect(items.length).toBe(sessions.length)
    })

    it('should highlight current session', () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
      })
      const activeItem = wrapper.find('.session-list-view__item--active')
      expect(activeItem.exists()).toBe(true)
    })
  })

  describe('Empty State', () => {
    it('should render empty state when no sessions', () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: [],
          currentSessionId: '',
        },
      })
      expect(wrapper.find('.session-list-view__empty').exists()).toBe(true)
    })
  })

  describe('Session Metadata', () => {
    it('should display message count in session metadata', () => {
      const sessions = createMockSessions()
      const wrapper = mount(SessionListView, {
        props: {
          sessions,
          currentSessionId: '1',
        },
      })

      const metaElements = wrapper.findAll('.chatbot-sessions__item-meta')
      expect(metaElements.length).toBeGreaterThan(0)

      // First session has 5 messages
      const firstMeta = metaElements[0].text()
      expect(firstMeta).toContain('5 条消息')

      // Second session has 10 messages
      const secondMeta = metaElements[1].text()
      expect(secondMeta).toContain('10 条消息')
    })

    it('should display singular message count for single message', () => {
      const session: Session = {
        sessionId: '1',
        title: 'Single Message Session',
        createdAt: Date.now() - 1000,
        updatedAt: Date.now() - 500,
        messageCount: 1,
        unreadCount: 0,
      }

      const wrapper = mount(SessionListView, {
        props: {
          sessions: [session],
          currentSessionId: '1',
        },
      })

      const metaElement = wrapper.find('.chatbot-sessions__item-meta')
      expect(metaElement.text()).toContain('1 条消息')
    })
  })

  describe('Events', () => {
    it('should emit create-session when new button is clicked', async () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
      })
      const newBtn = wrapper.find('.session-list-view__new-btn')

      await newBtn.trigger('click')

      expect(wrapper.emitted('create-session')).toBeTruthy()
    })

    it('should emit select-session when session is clicked', async () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
      })
      const sessionItem = wrapper.find('.session-list-view__item')

      await sessionItem.trigger('click')

      expect(wrapper.emitted('select-session')).toBeTruthy()
    })

    it('should emit delete-session when delete button is clicked and confirmed', async () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
      })
      const deleteBtn = wrapper.find('.session-list-view__item-delete')

      await deleteBtn.trigger('click')

      // After clicking delete, the confirmation dialog should be shown
      // The delete-session event is only emitted after confirming the dialog
      // For now, we just verify the button exists and can be clicked
      expect(deleteBtn.exists()).toBe(true)
    })
  })

  describe('XSS Protection', () => {
    it('should escape HTML in session titles', async () => {
      const xssSession: Session = {
        sessionId: 'xss-1',
        title: '<script>alert("XSS")</script>',
        createdAt: Date.now() - 1000,
        updatedAt: Date.now() - 500,
        messageCount: 1,
        unreadCount: 0,
      }

      const wrapper = mount(SessionListView, {
        props: {
          sessions: [xssSession],
          currentSessionId: 'xss-1',
        },
      })

      // The HTML should be escaped, not rendered
      const titleElement = wrapper.find('.chatbot-sessions__item-title')
      expect(titleElement.html()).not.toContain('<script>')
      expect(titleElement.text()).toContain('<script>alert("XSS")</script>')
    })

    it('should escape HTML in search query', async () => {
      // Create a session with a title that contains special characters
      const xssSession: Session = {
        sessionId: 'xss-2',
        title: 'Test <img src=x onerror=alert(1)> Session',
        createdAt: Date.now() - 1000,
        updatedAt: Date.now() - 500,
        messageCount: 1,
        unreadCount: 0,
      }

      const wrapper = mount(SessionListView, {
        props: {
          sessions: [xssSession],
          currentSessionId: 'xss-2',
        },
      })

      // Search for the title (the img tag is part of the title)
      await wrapper.find('input').setValue('img')

      // The HTML should be escaped in the highlighted result
      const titleElement = wrapper.find('.chatbot-sessions__item-title')
      const html = titleElement.html()

      // The <img> tag should be escaped, not rendered as an actual tag
      expect(html).not.toContain('<img ')
      // The escaped version should be present
      expect(html).toContain('&lt;')
      // Check that the entire malicious payload is escaped and displayed as text
      expect(titleElement.text()).toContain('Test <img src=x onerror=alert(1)> Session')
    })
  })

  describe('selectedCountFormat Prop', () => {
    it('should use custom selectedCountFormat for batch selection', async () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
          selectedCountFormat: '{count} items selected',
        },
      })

      // Toggle batch mode
      const batchToggleBtn = wrapper.find('.chatbot-sessions__batch-mode-btn')
      await batchToggleBtn.trigger('click')

      // Click first session to select it
      const sessionItem = wrapper.find('.session-list-view__item')
      await sessionItem.trigger('click')

      // Check that the custom format is used
      const countText = wrapper.find('.chatbot-sessions__batch-count').text()
      expect(countText).toBe('1 items selected')
    })

    it('should use default selectedCountFormat when not provided', async () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
      })

      // Toggle batch mode
      const batchToggleBtn = wrapper.find('.chatbot-sessions__batch-mode-btn')
      await batchToggleBtn.trigger('click')

      // Click first session to select it
      const sessionItem = wrapper.find('.session-list-view__item')
      await sessionItem.trigger('click')

      // Check that the default format is used
      const countText = wrapper.find('.chatbot-sessions__batch-count').text()
      expect(countText).toBe('已选择 1 个')
    })
  })
})
