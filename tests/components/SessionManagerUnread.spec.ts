import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SessionManager from '@/components/SessionManager.vue'

describe('SessionManager Unread Badge', () => {
  it('should show unread badge when unreadCount > 0', () => {
    const sessions = [
      {
        id: '1',
        title: 'Session 1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messageCount: 5,
        unreadCount: 3
      }
    ]

    const wrapper = mount(SessionManager, {
      props: { sessions, currentSessionId: '1' }
    })

    expect(wrapper.find('.chatbot-sessions__item-badge').exists()).toBe(true)
    expect(wrapper.find('.chatbot-sessions__item-badge').text()).toBe('3')
  })

  it('should show 99+ when unreadCount > 99', () => {
    const sessions = [
      {
        id: '1',
        title: 'Session 1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messageCount: 150,
        unreadCount: 150
      }
    ]

    const wrapper = mount(SessionManager, {
      props: { sessions, currentSessionId: '1' }
    })

    expect(wrapper.find('.chatbot-sessions__item-badge').text()).toBe('99+')
  })

  it('should NOT show badge when unreadCount = 0', () => {
    const sessions = [
      {
        id: '1',
        title: 'Session 1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messageCount: 5,
        unreadCount: 0
      }
    ]

    const wrapper = mount(SessionManager, {
      props: { sessions, currentSessionId: '1' }
    })

    expect(wrapper.find('.chatbot-sessions__item-badge').exists()).toBe(false)
  })
})
