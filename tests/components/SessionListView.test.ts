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

    it('should emit delete-session when delete button is clicked', async () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
      })
      const deleteBtn = wrapper.find('.session-list-view__item-delete')

      await deleteBtn.trigger('click')

      expect(wrapper.emitted('delete-session')).toBeTruthy()
    })
  })
})
