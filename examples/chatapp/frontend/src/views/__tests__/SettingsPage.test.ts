import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SettingsPage from '../SettingsPage.vue'

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

describe('SettingsPage', () => {
  let getItemSpy: ReturnType<typeof vi.fn>
  let setItemSpy: ReturnType<typeof vi.fn>
  let removeItemSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    getItemSpy = vi.fn().mockReturnValue(null)
    setItemSpy = vi.fn()
    removeItemSpy = vi.fn()
    localStorage.getItem = getItemSpy
    localStorage.setItem = setItemSpy
    localStorage.removeItem = removeItemSpy
  })

  it('should render the settings form with all sections', () => {
    const wrapper = mount(SettingsPage)
    expect(wrapper.text()).toContain('后端模式')
    expect(wrapper.text()).toContain('模拟模式')
    expect(wrapper.text()).toContain('真实模式')
    expect(wrapper.text()).toContain('UI 风格')
    expect(wrapper.text()).toContain('亮色')
    expect(wrapper.text()).toContain('暗色')
    expect(wrapper.text()).toContain('后端超时')
    expect(wrapper.text()).toContain('思考设置')
    expect(wrapper.text()).toContain('显示思考开关')
    expect(wrapper.text()).toContain('思考默认开启')
    expect(wrapper.text()).toContain('自动折叠思考内容')
    expect(wrapper.text()).toContain('语音输入')
    expect(wrapper.text()).toContain('允许语音输入')
  })

  it('should have mock and real backend radio options', () => {
    const wrapper = mount(SettingsPage)
    const radios = wrapper.findAll('input[type="radio"]')
    const values = radios.map(r => (r.element as HTMLInputElement).value)
    expect(values).toContain('mock')
    expect(values).toContain('real')
  })

  it('should call saveSettings when clicking save', async () => {
    const wrapper = mount(SettingsPage)
    const saveBtn = wrapper.findAll('button').find(b => b.text().includes('保存设置'))
    await saveBtn?.trigger('click')

    expect(setItemSpy).toHaveBeenCalledWith(
      'chatapp-settings',
      JSON.stringify({
        backendMode: 'mock',
        theme: 'light',
        apiTimeout: 30000,
        showThinkingToggle: true,
        thinkingDefaultEnabled: true,
        thinkingAutoCollapse: true,
        enableVoiceInput: true,
      }),
    )
  })

  it('should call removeItem when clicking reset', async () => {
    const wrapper = mount(SettingsPage)
    const resetBtn = wrapper.findAll('button').find(b => b.text().includes('恢复默认'))
    await resetBtn?.trigger('click')

    expect(removeItemSpy).toHaveBeenCalledWith('chatapp-settings')
  })

  it('should show back button', () => {
    const wrapper = mount(SettingsPage)
    const backBtn = wrapper.findAll('button').find(b => b.text().includes('返回'))
    expect(backBtn?.exists()).toBe(true)
  })

  it('should show timeout input', () => {
    const wrapper = mount(SettingsPage)
    const input = wrapper.find('input[type="number"]')
    expect(input.exists()).toBe(true)
  })

  it('should have three timeout preset buttons', () => {
    const wrapper = mount(SettingsPage)
    const presets = wrapper.findAll('.preset-btn')
    expect(presets.length).toBe(3)
    expect(presets[0].text()).toBe('10s')
    expect(presets[1].text()).toBe('30s')
    expect(presets[2].text()).toBe('60s')
  })
})
