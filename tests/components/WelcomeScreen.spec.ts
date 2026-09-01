import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import WelcomeScreen from '@/components/WelcomeScreen.vue'
import type { QuickAction } from '@/types/config'

const mockQuickActions: QuickAction[] = [
  { id: 'test-1', title: 'Action 1', description: 'Desc 1', prompt: 'Prompt 1', icon: 'write' },
  { id: 'test-2', title: 'Action 2', description: 'Desc 2', prompt: 'Prompt 2', icon: 'analyze' },
  { id: 'test-3', title: 'Action 3', prompt: 'Prompt 3' },
  { id: 'test-4', title: 'Action 4', prompt: 'Prompt 4', icon: '/custom/icon.svg' },
]

describe('WelcomeScreen', () => {
  it('should render quick actions from props', () => {
    const wrapper = mount(WelcomeScreen, {
      props: { quickActions: mockQuickActions, labels: {} },
    })
    expect(wrapper.findAll('.welcome-screen__quick-action')).toHaveLength(4)
  })

  it('should display title and description for each action', () => {
    const wrapper = mount(WelcomeScreen, {
      props: { quickActions: mockQuickActions, labels: {} },
    })
    const actions = wrapper.findAll('.welcome-screen__quick-action')
    expect(actions[0].find('.welcome-screen__quick-action-title').text()).toBe('Action 1')
    expect(actions[0].find('.welcome-screen__quick-action-desc').text()).toBe('Desc 1')
  })

  it('should emit quick-action with full QuickAction object on click', async () => {
    const wrapper = mount(WelcomeScreen, {
      props: { quickActions: mockQuickActions, labels: {} },
    })
    const actions = wrapper.findAll('.welcome-screen__quick-action')
    await actions[0].trigger('click')
    expect(wrapper.emitted('quick-action')).toBeTruthy()
    expect(wrapper.emitted('quick-action')![0][0]).toEqual(mockQuickActions[0])
  })

  it('should not render quick actions section when list is empty', () => {
    const wrapper = mount(WelcomeScreen, {
      props: { quickActions: [], labels: {} },
    })
    expect(wrapper.find('.welcome-screen__quick-actions').exists()).toBe(false)
  })

  it('should render letter fallback when icon is undefined', () => {
    const wrapper = mount(WelcomeScreen, {
      props: { quickActions: mockQuickActions, labels: {} },
    })
    const actions = wrapper.findAll('.welcome-screen__quick-action')
    // Action 3 has no icon, so it should show the letter fallback
    expect(actions[2].find('.welcome-screen__quick-action-letter').exists()).toBe(true)
  })

  it('should render builtin icon as Vue component', () => {
    const wrapper = mount(WelcomeScreen, {
      props: { quickActions: mockQuickActions, labels: {} },
    })
    const actions = wrapper.findAll('.welcome-screen__quick-action')
    // Action 1 has icon: 'write' which is a builtin icon — renders via <component :is>
    const svg = actions[0].find('.welcome-screen__icon-svg')
    expect(svg.exists()).toBe(true)
    // class merges onto the rendered svg root element (inheritAttrs)
    expect(svg.element.tagName.toLowerCase()).toBe('svg')
    expect(svg.find('path').exists()).toBe(true)
  })

  it('should render welcome title and subtitle from labels', () => {
    const wrapper = mount(WelcomeScreen, {
      props: {
        quickActions: [],
        labels: { welcomeTitle: 'Hello', welcomeSubtitle: 'World' },
      },
    })
    expect(wrapper.find('.welcome-screen__title').text()).toBe('Hello')
    expect(wrapper.find('.welcome-screen__subtitle').text()).toBe('World')
  })

  it('should render path icon as img element', () => {
    const wrapper = mount(WelcomeScreen, {
      props: { quickActions: mockQuickActions, labels: {} },
    })
    const actions = wrapper.findAll('.welcome-screen__quick-action')
    // Action 4 has icon: '/custom/icon.svg' which resolves to path type
    const img = actions[3].find('.welcome-screen__icon-img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('/custom/icon.svg')
  })

  it('should not render description element when action has no description', () => {
    const wrapper = mount(WelcomeScreen, {
      props: { quickActions: mockQuickActions, labels: {} },
    })
    const actions = wrapper.findAll('.welcome-screen__quick-action')
    // Action 3 has no description
    expect(actions[2].find('.welcome-screen__quick-action-desc').exists()).toBe(false)
  })

  it('should resolve relative icon paths with iconBase', () => {
    const wrapper = mount(WelcomeScreen, {
      props: {
        quickActions: [{ id: 'rel', title: 'Rel', prompt: 'p', icon: 'icon.svg' }],
        iconBase: '/assets/icons',
        labels: {},
      },
    })
    const img = wrapper.find('.welcome-screen__icon-img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('/assets/icons/icon.svg')
  })
})
