import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TopicManager from '@/components/TopicManager.vue'

describe('TopicManager Title Edit', () => {
  const topics = [
    {
      topicId: '1',
      title: 'Topic 1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messageCount: 5,
      unreadCount: 0
    }
  ]

  it('should start editing on title double click', async () => {
    const wrapper = mount(TopicManager, {
      props: { topics, currentTopicId: '1' },
      global: {
        stubs: {
          TopicSearch: true,
          TopicActionMenu: {
            template: '<div><slot /></div>'
          },
          ConfirmDialog: true
        }
      }
    })

    // Find topic title and double click
    await wrapper.find('.chatbot-topics__item-title').trigger('dblclick')

    // Should show input
    expect(wrapper.find('.chatbot-topics__item-title-input').exists()).toBe(true)
  })

  it('should emit update-topic-title on blur', async () => {
    const wrapper = mount(TopicManager, {
      props: { topics, currentTopicId: '1' },
      global: {
        stubs: {
          TopicSearch: true,
          TopicActionMenu: {
            template: '<div><slot /></div>'
          },
          ConfirmDialog: true
        }
      }
    })

    // Start editing
    await wrapper.find('.chatbot-topics__item-title').trigger('dblclick')

    // Modify and blur
    const input = wrapper.find('.chatbot-topics__item-title-input')
    await input.setValue('New Title')
    await input.trigger('blur')

    expect(wrapper.emitted('update-topic-title')).toBeTruthy()
  })

  it('should emit update-topic-title on Enter key', async () => {
    const wrapper = mount(TopicManager, {
      props: { topics, currentTopicId: '1' },
      global: {
        stubs: {
          TopicSearch: true,
          TopicActionMenu: {
            template: '<div><slot /></div>'
          },
          ConfirmDialog: true
        }
      }
    })

    // Start editing
    await wrapper.find('.chatbot-topics__item-title').trigger('dblclick')

    // Modify and press Enter
    const input = wrapper.find('.chatbot-topics__item-title-input')
    await input.setValue('New Title')
    await input.trigger('keyup.enter')

    expect(wrapper.emitted('update-topic-title')).toBeTruthy()
  })

  it('should cancel editing on Escape key', async () => {
    const wrapper = mount(TopicManager, {
      props: { topics, currentTopicId: '1' },
      global: {
        stubs: {
          TopicSearch: true,
          TopicActionMenu: {
            template: '<div><slot /></div>'
          },
          ConfirmDialog: true
        }
      }
    })

    // Start editing
    await wrapper.find('.chatbot-topics__item-title').trigger('dblclick')
    const input = wrapper.find('.chatbot-topics__item-title-input')
    await input.setValue('New Title')
    await input.trigger('keyup.escape')

    // Input should be gone
    expect(wrapper.find('.chatbot-topics__item-title-input').exists()).toBe(false)
    // Title should remain unchanged
    expect(wrapper.find('.chatbot-topics__item-title').text()).toBe('Topic 1')
  })

  it('should not emit update-topic-title if title is empty', async () => {
    const wrapper = mount(TopicManager, {
      props: { topics, currentTopicId: '1' },
      global: {
        stubs: {
          TopicSearch: true,
          TopicActionMenu: {
            template: '<div><slot /></div>'
          },
          ConfirmDialog: true
        }
      }
    })

    // Start editing
    await wrapper.find('.chatbot-topics__item-title').trigger('dblclick')

    // Clear title and blur
    const input = wrapper.find('.chatbot-topics__item-title-input')
    await input.setValue('')
    await input.trigger('blur')

    // Should not emit
    expect(wrapper.emitted('update-topic-title')).toBeFalsy()
  })
})
