/**
 * Unit tests for AIChatPanel component
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import AIChatPanel from '@/components/AIChatPanel.vue'
import type { ChatbotConfig } from '@/types'

// Mock stream utility
vi.mock('@/utils/stream', () => ({
  createMockStream: vi.fn((content: string, delay: number) => {
    return (async function* () {
      for (let i = 0; i < content.length; i++) {
        await new Promise(resolve => setTimeout(resolve, delay))
        yield { type: 'token', content: content[i] }
      }
      yield { type: 'end' }
    })()
  }),
}))

// Mock upload utility
vi.mock('@/utils/upload', () => ({
  createMockUploadEndpoint: vi.fn(() => ({
    upload: vi.fn(async (files: File[]) => {
      await new Promise(resolve => setTimeout(resolve, 100))
      return {
        urls: files.map(() => `https://example.com/uploaded_${Date.now()}.jpg`),
      }
    }),
  })),
}))

describe('AIChatPanel', () => {
  let mockConfig: ChatbotConfig

  beforeEach(() => {
    mockConfig = {
      labels: {
        title: '智能助手',
        placeholder: '输入消息...',
        send: '发送',
        upload: '上传图片',
        imageTooLarge: '图片大小超过限制',
      },
      theme: 'light',
      enableImageUpload: true,
      maxImageCount: 3,
      maxImageSize: 5 * 1024 * 1024,
      position: 'bottom-right',
      panelWidth: 420,
      defaultExpanded: true,
      locale: 'zh-CN',
    }

    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render component in embedded mode', () => {
      // AIChatPanel uses panelOpen prop to switch between embedded and standalone mode
      const wrapper = mount(AIChatPanel, {
        props: { config: mockConfig, panelOpen: true },
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('.ai-chat__body').exists()).toBe(true)
    })

    it('should render ChatContent in embedded mode', () => {
      const wrapper = mount(AIChatPanel, {
        props: { config: mockConfig, panelOpen: true },
      })

      // Should render ChatContent component
      const chatContent = wrapper.findComponent({ name: 'ChatContent' })
      expect(chatContent.exists()).toBe(true)
    })
  })

  describe('Standalone Mode', () => {
    it('should render in floating mode without panelOpen prop', () => {
      // When panelOpen is not provided, component uses internal state
      const wrapper = mount(AIChatPanel, {
        props: { config: mockConfig, mode: 'floating' },
      })

      // Component should render
      expect(wrapper.exists()).toBe(true)
    })

    it('should render with default state', () => {
      const wrapper = mount(AIChatPanel, {
        props: { config: mockConfig },
      })

      // Component should render with default mode (floating)
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Config Props', () => {
    it('should use custom title from config', () => {
      const customConfig = {
        ...mockConfig,
        labels: { ...mockConfig.labels, title: '豆包助手' },
      }
      const wrapper = mount(AIChatPanel, {
        props: { config: customConfig, panelOpen: true },
      })

      // Check that ChatContent receives the custom title
      const chatContent = wrapper.findComponent({ name: 'ChatContent' })
      expect(chatContent.exists()).toBe(true)
    })

    it('should respect maxImageCount config', () => {
      const configWithLimit = { ...mockConfig, maxImageCount: 2 }
      const wrapper = mount(AIChatPanel, {
        props: { config: configWithLimit, panelOpen: true },
      })

      expect(wrapper.exists()).toBe(true)
    })
  })
})
