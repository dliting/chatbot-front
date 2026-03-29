import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TopicManager from '@/components/TopicManager.vue'

describe('TopicManager Unread Badge', () => {
  it('should show unread badge when unreadCount > 0', () => {
    const topics = [
      {
        id: '1',
        title: 'Topic 1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messageCount: 5,
        unreadCount: 3
      }
    ]

    const wrapper = mount(TopicManager, {
      props: { topics, currentTopicId: '1' }
    })

    expect(wrapper.find('.chatbot-topics__item-badge').exists()).toBe(true)
    expect(wrapper.find('.chatbot-topics__item-badge').text()).toBe('3')
  })

  it('should show 99+ when unreadCount > 99', () => {
    const topics = [
      {
        id: '1',
        title: 'Topic 1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messageCount: 150,
        unreadCount: 150
      }
    ]

    const wrapper = mount(TopicManager, {
      props: { topics, currentTopicId: '1' }
    })

    expect(wrapper.find('.chatbot-topics__item-badge').text()).toBe('99+')
  })

  it('should NOT show badge when unreadCount = 0', () => {
    const topics = [
      {
        id: '1',
        title: 'Topic 1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messageCount: 5,
        unreadCount: 0
      }
    ]

    const wrapper = mount(TopicManager, {
      props: { topics, currentTopicId: '1' }
    })

    expect(wrapper.find('.chatbot-topics__item-badge').exists()).toBe(false)
  })
})
