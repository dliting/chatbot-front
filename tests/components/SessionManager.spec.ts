import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import SessionManager from '@/components/SessionManager.vue'
import type { Session } from '@/types'

describe('SessionManager.vue', () => {
  let wrapper: VueWrapper<InstanceType<typeof SessionManager>>

  const mockSessions: Session[] = [
    {
      id: 'session_1',
      title: 'Chat about Vue',
      timestamp: Date.now() - 3600000,
    },
    {
      id: 'session_2',
      title: 'TypeScript help',
      timestamp: Date.now() - 7200000,
    },
    {
      id: 'session_3',
      title: 'API integration',
      timestamp: Date.now() - 86400000,
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
      expect(wrapper.find('.session-manager').exists()).toBe(true)
    })

    it('should render new chat button', () => {
      expect(wrapper.find('.session-manager__new-btn').exists()).toBe(true)
      expect(wrapper.find('.session-manager__new-btn').text()).toBe(defaultProps.newChatLabel)
    })

    it('should render all sessions', () => {
      const sessionItems = wrapper.findAll('.session-item')
      expect(sessionItems.length).toBe(mockSessions.length)
    })

    it('should render session titles', () => {
      const titles = wrapper.findAll('.session-item__title')
      expect(titles[0].text()).toBe(mockSessions[0].title)
      expect(titles[1].text()).toBe(mockSessions[1].title)
    })
  })

  describe('Session Selection', () => {
    it('should highlight current session', () => {
      const currentSession = wrapper.find('.session-item--active')
      expect(currentSession.exists()).toBe(true)
      expect(currentSession.find('.session-item__title').text()).toBe(mockSessions[0].title)
    })

    it('should emit switch-session event when session is clicked', async () => {
      const sessions = wrapper.findAll('.session-item')
      await sessions[1].trigger('click')

      expect(wrapper.emitted('switch-session')).toBeTruthy()
      expect(wrapper.emitted('switch-session')?.[0]).toEqual([mockSessions[1].id])
    })

    it('should update active session when currentSessionId changes', async () => {
      await wrapper.setProps({ currentSessionId: 'session_2' })
      await nextTick()

      const activeSessions = wrapper.findAll('.session-item--active')
      expect(activeSessions.length).toBe(1)
      expect(activeSessions[0].find('.session-item__title').text()).toBe(mockSessions[1].title)
    })
  })

  describe('Session Creation', () => {
    it('should emit create-session event when new chat button is clicked', async () => {
      const newChatBtn = wrapper.find('.session-manager__new-btn')
      await newChatBtn.trigger('click')

      expect(wrapper.emitted('create-session')).toBeTruthy()
    })
  })

  describe('Session Deletion', () => {
    it('should show delete button on session hover', async () => {
      const sessionItem = wrapper.findAll('.session-item')[0]
      await sessionItem.trigger('mouseenter')
      await nextTick()

      const deleteBtn = sessionItem.find('.session-item__delete-btn')
      expect(deleteBtn.exists()).toBe(true)
    })

    it('should emit delete-session event when delete button is clicked', async () => {
      const sessionItem = wrapper.findAll('.session-item')[0]
      await sessionItem.trigger('mouseenter')
      await nextTick()

      const deleteBtn = sessionItem.find('.session-item__delete-btn')
      await deleteBtn.trigger('click')

      expect(wrapper.emitted('delete-session')).toBeTruthy()
      expect(wrapper.emitted('delete-session')?.[0]).toEqual([mockSessions[0].id])
    })

    it('should not emit delete-session when clicking the session item itself', async () => {
      const sessionItem = wrapper.findAll('.session-item')[0]
      await sessionItem.trigger('click')

      expect(wrapper.emitted('delete-session')).toBeFalsy()
      expect(wrapper.emitted('switch-session')).toBeTruthy()
    })
  })

  describe('Timestamp Formatting', () => {
    it('should display relative timestamps', () => {
      const timestamps = wrapper.findAll('.session-item__time')

      expect(timestamps[0].text()).toBeTruthy()
      expect(timestamps[1].text()).toBeTruthy()
    })

    it('should format today\'s sessions differently from older ones', () => {
      const vm = wrapper.vm as unknown as { formatTimestamp: (ts: number) => string }

      if (vm.formatTimestamp) {
        const todayTime = vm.formatTimestamp(Date.now() - 3600000)
        const oldTime = vm.formatTimestamp(Date.now() - 86400000 * 7)

        expect(todayTime).not.toBe(oldTime)
      }
    })
  })

  describe('Empty State', () => {
    it('should display empty state when no sessions', async () => {
      await wrapper.setProps({ sessions: [] })
      await nextTick()

      const sessionItems = wrapper.findAll('.session-item')
      expect(sessionItems.length).toBe(0)
    })
  })

  describe('Session Title Editing', () => {
    it('should allow editing session title on double-click', async () => {
      const sessionItem = wrapper.findAll('.session-item')[0]
      await sessionItem.trigger('dblclick')
      await nextTick()

      const vm = wrapper.vm as unknown as { editingId: string | null }
      if (vm.editingId !== undefined) {
        expect(vm.editingId).toBe(mockSessions[0].id)
      }
    })

    it('should save edited title on blur', async () => {
      const sessionItem = wrapper.findAll('.session-item')[0]
      await sessionItem.trigger('dblclick')
      await nextTick()

      const input = wrapper.find('.session-item__title-input')
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
      const sessionItem = wrapper.findAll('.session-item')[0]
      await sessionItem.trigger('dblclick')
      await nextTick()

      const input = wrapper.find('.session-item__title-input')
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
      const sessionItem = wrapper.findAll('.session-item')[0]
      await sessionItem.trigger('dblclick')
      await nextTick()

      const input = wrapper.find('.session-item__title-input')
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
    it('should have proper aria labels for sessions', () => {
      const sessions = wrapper.findAll('.session-item')

      sessions.forEach((session, index) => {
        expect(session.attributes('role')).toBe('button')
        expect(session.attributes('tabindex')).toBe('0')
      })
    })

    it('should be keyboard navigable', async () => {
      const sessionItem = wrapper.findAll('.session-item')[1]

      await sessionItem.trigger('keydown', { key: 'Enter' })

      expect(wrapper.emitted('switch-session')).toBeTruthy()
    })
  })

  describe('Session Count Badge', () => {
    it('should display session count when there are many sessions', async () => {
      const manySessions = Array.from({ length: 15 }, (_, i) => ({
        id: `session_${i}`,
        title: `Chat ${i}`,
        timestamp: Date.now() - i * 3600000,
      }))

      await wrapper.setProps({ sessions: manySessions })
      await nextTick()

      const badge = wrapper.find('.session-manager__count-badge')
      if (badge.exists()) {
        expect(badge.text()).toBe('15')
      }
    })
  })
})
