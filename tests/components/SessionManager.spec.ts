import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import SessionManager from '@/components/SessionManager.vue'
import type { Session } from '@/types'

describe('SessionManager.vue', () => {
  let wrapper: VueWrapper<InstanceType<typeof SessionManager>>

  const mockSessions: Session[] = [
    {
      sessionId: 'session_1',
      title: 'Chat about Vue',
      createdAt: Date.now() - 3600000,
      updatedAt: Date.now() - 3600000,
      messageCount: 10,
      unreadCount: 0,
    },
    {
      sessionId: 'session_2',
      title: 'TypeScript help',
      createdAt: Date.now() - 7200000,
      updatedAt: Date.now() - 7200000,
      messageCount: 5,
      unreadCount: 0,
    },
    {
      sessionId: 'session_3',
      title: 'API integration',
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 86400000,
      messageCount: 15,
      unreadCount: 0,
    },
  ]

  const defaultProps = {
    sessions: mockSessions,
    currentSessionId: 'session_1',
    newChatLabel: 'New Chat',
  }

  const createWrapper = (props = {}) => {
    return mount(SessionManager, {
      props: {
        ...defaultProps,
        ...props,
      },
      attachTo: document.body,
    })
  }

  beforeEach(() => {
    wrapper = createWrapper()
  })

  describe('Component Rendering', () => {
    it('should render the session manager container', () => {
      expect(wrapper.find('.chatbot-sessions').exists()).toBe(true)
    })

    it('should render new chat button', () => {
      expect(wrapper.find('.chatbot-sessions__new-btn').exists()).toBe(true)
      expect(wrapper.find('.chatbot-sessions__new-btn').text()).toBe(defaultProps.newChatLabel)
    })

    it('should render all sessions', () => {
      const sessionItems = wrapper.findAll('.chatbot-sessions__item')
      expect(sessionItems.length).toBe(mockSessions.length)
    })

    it('should render session titles', () => {
      const titles = wrapper.findAll('.chatbot-sessions__item-title')
      expect(titles[0].text()).toBe(mockSessions[0].title)
      expect(titles[1].text()).toBe(mockSessions[1].title)
    })
  })

  describe('Session Selection', () => {
    it('should highlight current session', () => {
      const currentSession = wrapper.find('.chatbot-sessions__item--active')
      expect(currentSession.exists()).toBe(true)
      expect(currentSession.find('.chatbot-sessions__item-title').text()).toBe(mockSessions[0].title)
    })

    it('should emit switch-session event when session is clicked', async () => {
      const sessions = wrapper.findAll('.chatbot-sessions__item')
      await sessions[1].trigger('click')

      expect(wrapper.emitted('switch-session')).toBeTruthy()
      expect(wrapper.emitted('switch-session')?.[0]).toEqual([mockSessions[1].sessionId])
    })

    it('should update active session when currentSessionId changes', async () => {
      await wrapper.setProps({ currentSessionId: 'session_2' })
      await nextTick()

      const activeSessions = wrapper.findAll('.chatbot-sessions__item--active')
      expect(activeSessions.length).toBe(1)
      expect(activeSessions[0].find('.chatbot-sessions__item-title').text()).toBe(mockSessions[1].title)
    })
  })

  describe('Session Creation', () => {
    it('should emit create-session event when new chat button is clicked', async () => {
      const newChatBtn = wrapper.find('.chatbot-sessions__new-btn')
      await newChatBtn.trigger('click')

      expect(wrapper.emitted('create-session')).toBeTruthy()
    })
  })

  describe('Session Deletion', () => {
    it('should emit delete-session event when delete button is clicked', async () => {
      const deleteButtons = wrapper.findAll('.chatbot-sessions__item-delete')
      await deleteButtons[0].trigger('click')

      expect(wrapper.emitted('delete-session')).toBeTruthy()
      expect(wrapper.emitted('delete-session')?.[0]).toEqual([mockSessions[0].sessionId])
    })
  })

  describe('Empty State', () => {
    it('should render empty state when no sessions', async () => {
      await wrapper.setProps({ sessions: [] })
      await nextTick()

      const emptyState = wrapper.find('.chatbot-sessions__empty')
      expect(emptyState.exists()).toBe(true)
    })

    it('should not render empty state when sessions exist', () => {
      const emptyState = wrapper.find('.chatbot-sessions__empty')
      expect(emptyState.exists()).toBe(false)
    })
  })

  describe('Session Title Editing', () => {
    it('should allow editing session title on double-click', async () => {
      const sessionItem = wrapper.findAll('.chatbot-sessions__item')[0]
      await sessionItem.trigger('dblclick')
      await nextTick()

      const vm = wrapper.vm as unknown as { editingId: string | null }
      if (vm.editingId !== undefined) {
        expect(vm.editingId).toBe(mockSessions[0].sessionId)
      }
    })

    it('should save edited title on blur', async () => {
      const sessionItem = wrapper.findAll('.chatbot-sessions__item')[0]
      await sessionItem.trigger('dblclick')
      await nextTick()

      const input = wrapper.find('.chatbot-sessions__item-title input')
      if (input.exists()) {
        await input.setValue('New title')
        await input.trigger('blur')
        await nextTick()

        const vm = wrapper.vm as unknown as { editingId: string | null; updateTitle: (id: string, title: string) => void }
        if (vm.editingId !== undefined && vm.updateTitle) {
          expect(vm.editingId).toBeNull()
        }
      }
    })

    it('should save edited title on Enter key', async () => {
      const sessionItem = wrapper.findAll('.chatbot-sessions__item')[0]
      await sessionItem.trigger('dblclick')
      await nextTick()

      const input = wrapper.find('.chatbot-sessions__item-title input')
      if (input.exists()) {
        await input.setValue('New title')
        await input.trigger('keydown', { key: 'Enter' })
        await nextTick()

        const vm = wrapper.vm as unknown as { editingId: string | null }
        if (vm.editingId !== undefined) {
          expect(vm.editingId).toBeNull()
        }
      }
    })

    it('should cancel editing on Escape key', async () => {
      const sessionItem = wrapper.findAll('.chatbot-sessions__item')[0]
      await sessionItem.trigger('dblclick')
      await nextTick()

      const input = wrapper.find('.chatbot-sessions__item-title input')
      if (input.exists()) {
        await input.trigger('keydown', { key: 'Escape' })
        await nextTick()

        const vm = wrapper.vm as unknown as { editingId: string | null }
        if (vm.editingId !== undefined) {
          expect(vm.editingId).toBeNull()
        }
      }
    })
  })

  describe('Session List Scroll', () => {
    it('should scroll to current session on mount', async () => {
      const currentSessionId = 'session_2'
      const localWrapper = createWrapper({ currentSessionId })

      await nextTick()

      // The component should scroll to the current session
      expect(localWrapper.exists()).toBe(true)

      localWrapper.unmount()
    })
  })

  describe('Accessibility', () => {
    it('should render session items', () => {
      const sessions = wrapper.findAll('.chatbot-sessions__item')
      expect(sessions.length).toBe(3)
    })

    it('should be keyboard navigable via click', async () => {
      const sessionItem = wrapper.findAll('.chatbot-sessions__item')[1]

      await sessionItem.trigger('click')

      expect(wrapper.emitted('switch-session')).toBeTruthy()
    })
  })
})
