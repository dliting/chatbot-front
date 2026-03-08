import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SessionManager from '@/components/SessionManager.vue'

describe('SessionManager Title Edit', () => {
  const sessions = [
    {
      sessionId: '1',
      title: 'Session 1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messageCount: 5,
      unreadCount: 0
    }
  ]

  it('should start editing on title double click', async () => {
    const wrapper = mount(SessionManager, {
      props: { sessions, currentSessionId: '1' },
      global: {
        stubs: {
          SessionSearch: true,
          SessionActionMenu: {
            template: '<div><slot /></div>'
          },
          ConfirmDialog: true
        }
      }
    })

    // Find session title and double click
    await wrapper.find('.chatbot-sessions__item-title').trigger('dblclick')

    // Should show input
    expect(wrapper.find('.chatbot-sessions__item-title-input').exists()).toBe(true)
  })

  it('should emit update-session-title on blur', async () => {
    const wrapper = mount(SessionManager, {
      props: { sessions, currentSessionId: '1' },
      global: {
        stubs: {
          SessionSearch: true,
          SessionActionMenu: {
            template: '<div><slot /></div>'
          },
          ConfirmDialog: true
        }
      }
    })

    // Start editing
    await wrapper.find('.chatbot-sessions__item-title').trigger('dblclick')

    // Modify and blur
    const input = wrapper.find('.chatbot-sessions__item-title-input')
    await input.setValue('New Title')
    await input.trigger('blur')

    expect(wrapper.emitted('update-session-title')).toBeTruthy()
  })

  it('should emit update-session-title on Enter key', async () => {
    const wrapper = mount(SessionManager, {
      props: { sessions, currentSessionId: '1' },
      global: {
        stubs: {
          SessionSearch: true,
          SessionActionMenu: {
            template: '<div><slot /></div>'
          },
          ConfirmDialog: true
        }
      }
    })

    // Start editing
    await wrapper.find('.chatbot-sessions__item-title').trigger('dblclick')

    // Modify and press Enter
    const input = wrapper.find('.chatbot-sessions__item-title-input')
    await input.setValue('New Title')
    await input.trigger('keyup.enter')

    expect(wrapper.emitted('update-session-title')).toBeTruthy()
  })

  it('should cancel editing on Escape key', async () => {
    const wrapper = mount(SessionManager, {
      props: { sessions, currentSessionId: '1' },
      global: {
        stubs: {
          SessionSearch: true,
          SessionActionMenu: {
            template: '<div><slot /></div>'
          },
          ConfirmDialog: true
        }
      }
    })

    // Start editing
    await wrapper.find('.chatbot-sessions__item-title').trigger('dblclick')
    const input = wrapper.find('.chatbot-sessions__item-title-input')
    await input.setValue('New Title')
    await input.trigger('keyup.escape')

    // Input should be gone
    expect(wrapper.find('.chatbot-sessions__item-title-input').exists()).toBe(false)
    // Title should remain unchanged
    expect(wrapper.find('.chatbot-sessions__item-title').text()).toBe('Session 1')
  })

  it('should not emit update-session-title if title is empty', async () => {
    const wrapper = mount(SessionManager, {
      props: { sessions, currentSessionId: '1' },
      global: {
        stubs: {
          SessionSearch: true,
          SessionActionMenu: {
            template: '<div><slot /></div>'
          },
          ConfirmDialog: true
        }
      }
    })

    // Start editing
    await wrapper.find('.chatbot-sessions__item-title').trigger('dblclick')

    // Clear title and blur
    const input = wrapper.find('.chatbot-sessions__item-title-input')
    await input.setValue('')
    await input.trigger('blur')

    // Should not emit
    expect(wrapper.emitted('update-session-title')).toBeFalsy()
  })
})
