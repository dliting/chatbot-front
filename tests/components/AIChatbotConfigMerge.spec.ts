/**
 * Unit tests for AIChatbot config merge branches:
 * locale-aware label/quick-action defaults, fontScale clamping,
 * and primaryColor validation fallbacks.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AIChatbot from '@/components/AIChatbot.vue'

vi.mock('@/composables/useApiClient', () => ({
  useApiClient: () => ({
    streamChat: vi.fn().mockImplementation(async function* () {
      yield { type: 'end' }
    }),
  }),
}))

const mountBot = (config: Record<string, unknown>) =>
  mount(AIChatbot, {
    props: { config: { mode: 'extended', defaultExpanded: true, apiBaseUrl: '/api', ...config } },
    global: {
      stubs: {
        SuspendedBall: true,
        DraggableWindow: true,
        FilePreviewModal: true,
      },
    },
  })

describe('AIChatbot config merge branches', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('uses locale-aware default labels when labels are omitted', () => {
    const wrapper = mountBot({})
    // zh-CN locale default renders in the header title
    expect(wrapper.text()).toContain('AI 助手')
  })

  it('uses locale-aware default labels when labels are an empty object', () => {
    const wrapper = mountBot({ labels: {} })
    expect(wrapper.text()).toContain('AI 助手')
  })

  it('keeps host-provided labels and quick actions untouched', () => {
    const quickActions = [{ id: 'x', title: '主机动作', prompt: 'x' }]
    const wrapper = mountBot({
      labels: { title: 'Host 标题' },
      quickActions,
    })
    // Host override must win over the locale default
    expect(wrapper.text()).toContain('Host 标题')
    expect(wrapper.text()).not.toContain('AI 助手')
    // Host quick actions replace the built-in zh defaults
    expect(wrapper.text()).toContain('主机动作')
    expect(wrapper.text()).not.toContain('写邮件')
  })

  it('injects locale-aware default quick actions when omitted', () => {
    const wrapper = mountBot({})
    // Built-in zh-CN quick action renders on the welcome screen
    expect(wrapper.text()).toContain('写邮件')
  })

  it('clamps out-of-range fontScale with a console warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mountBot({ fontScale: 2 })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('fontScale'))
  })

  it('accepts an in-range fontScale without warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mountBot({ fontScale: 0.8 })
    expect(warn).not.toHaveBeenCalled()
  })

  it('warns and falls back on an invalid primaryColor', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mountBot({ primaryColor: 'not-a-color' })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('primaryColor'))
  })

  it('derives theme variants for a valid primaryColor', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mountBot({ primaryColor: '#ff0000' })
    expect(warn).not.toHaveBeenCalled()
  })
})
