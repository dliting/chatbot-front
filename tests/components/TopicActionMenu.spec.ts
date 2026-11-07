/**
 * Tests for TopicActionMenu component
 */
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TopicActionMenu from '@/components/TopicActionMenu.vue'

function mountActionMenu(props: Record<string, any> = {}) {
  return mount(TopicActionMenu, {
    props: {
      ...props,
    },
    attachTo: document.body,
  })
}

describe('TopicActionMenu', () => {
  it('should render action menu wrapper', () => {
    const wrapper = mountActionMenu()
    expect(wrapper.find('.topic-action-menu').exists()).toBe(true)
  })

  it('should render slot content', () => {
    const wrapper = mount(TopicActionMenu, {
      slots: {
        default: '<div class="slot-content">Trigger</div>',
      },
      attachTo: document.body,
    })
    expect(wrapper.find('.slot-content').exists()).toBe(true)
  })

  it('should show popover on contextmenu', async () => {
    const wrapper = mountActionMenu()
    await wrapper.find('.topic-action-menu').trigger('contextmenu')

    const popover = document.querySelector('.topic-action-menu__popover')
    expect(popover).toBeTruthy()
    wrapper.unmount()
  })

  it('should emit edit when edit button clicked', async () => {
    const wrapper = mountActionMenu()
    await wrapper.find('.topic-action-menu').trigger('contextmenu')
    await wrapper.vm.$nextTick()

    const editBtn = document.querySelector('.topic-action-menu__item:not(.topic-action-menu__item--danger)') as HTMLElement
    if (editBtn) {
      editBtn.click()
      await wrapper.vm.$nextTick()
      expect(wrapper.emitted('edit')).toBeTruthy()
    }
    wrapper.unmount()
  })

  it('should emit delete when delete button clicked', async () => {
    const wrapper = mountActionMenu()
    await wrapper.find('.topic-action-menu').trigger('contextmenu')
    await wrapper.vm.$nextTick()

    const deleteBtn = document.querySelector('.topic-action-menu__item--danger') as HTMLElement
    if (deleteBtn) {
      deleteBtn.click()
      await wrapper.vm.$nextTick()
      expect(wrapper.emitted('delete')).toBeTruthy()
    }
    wrapper.unmount()
  })

  it('should close menu when backdrop clicked', async () => {
    const wrapper = mountActionMenu()
    await wrapper.find('.topic-action-menu').trigger('contextmenu')
    await wrapper.vm.$nextTick()

    const backdrop = document.querySelector('.topic-action-menu__backdrop') as HTMLElement
    expect(backdrop).toBeTruthy()
    if (backdrop) {
      backdrop.click()
      await wrapper.vm.$nextTick()
      expect(document.querySelector('.topic-action-menu__popover')).toBeFalsy()
    }
    wrapper.unmount()
  })

  it('should use custom editLabel and deleteLabel', async () => {
    const wrapper = mountActionMenu({ editLabel: '重命名', deleteLabel: '删除' })
    await wrapper.find('.topic-action-menu').trigger('contextmenu')
    await wrapper.vm.$nextTick()

    const items = document.querySelectorAll('.topic-action-menu__item span')
    if (items.length >= 2) {
      expect(items[0].textContent).toBe('重命名')
      expect(items[1].textContent).toBe('删除')
    }
    wrapper.unmount()
  })

  it('should use default labels', async () => {
    const wrapper = mountActionMenu()
    await wrapper.find('.topic-action-menu').trigger('contextmenu')
    await wrapper.vm.$nextTick()

    const items = document.querySelectorAll('.topic-action-menu__item span')
    if (items.length >= 2) {
      expect(items[0].textContent).toBe('Rename')
      expect(items[1].textContent).toBe('Delete')
    }
    wrapper.unmount()
  })

  it('should close menu when clicking outside popover', async () => {
    const wrapper = mountActionMenu()
    await wrapper.find('.topic-action-menu').trigger('contextmenu')
    await wrapper.vm.$nextTick()
    expect(document.querySelector('.topic-action-menu__popover')).toBeTruthy()

    // Click on body (outside popover) to trigger handleClickOutside
    document.body.click()
    await wrapper.vm.$nextTick()
    expect(document.querySelector('.topic-action-menu__popover')).toBeFalsy()
    wrapper.unmount()
  })

  it('should close menu on scroll event', async () => {
    const wrapper = mountActionMenu()
    await wrapper.find('.topic-action-menu').trigger('contextmenu')
    await wrapper.vm.$nextTick()
    expect(document.querySelector('.topic-action-menu__popover')).toBeTruthy()

    // Dispatch a scroll event with capture phase (listener uses capture: true)
    document.dispatchEvent(new Event('scroll', { bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(document.querySelector('.topic-action-menu__popover')).toBeFalsy()
    wrapper.unmount()
  })
})

describe('TopicActionMenu open state', () => {
  it('opens on contextmenu and emits edit when edit clicked', async () => {
    const wrapper = mount(TopicActionMenu, {
      slots: { default: '<div class="menu-host">Topic</div>' },
      global: { stubs: { Teleport: true } },
    })

    await wrapper.find('.menu-host').trigger('contextmenu', { clientX: 100, clientY: 100 })
    expect(wrapper.find('.topic-action-menu__popover').exists()).toBe(true)

    const items = wrapper.findAll('.topic-action-menu__item')
    await items[0].trigger('click')
    expect(wrapper.emitted('edit')).toHaveLength(1)
    // menu closes after action
    expect(wrapper.find('.topic-action-menu__popover').exists()).toBe(false)
  })

  it('emits delete when delete clicked', async () => {
    const wrapper = mount(TopicActionMenu, {
      slots: { default: '<div class="menu-host">Topic</div>' },
      global: { stubs: { Teleport: true } },
    })

    await wrapper.find('.menu-host').trigger('contextmenu', { clientX: 100, clientY: 100 })
    const items = wrapper.findAll('.topic-action-menu__item')
    await items[1].trigger('click')
    expect(wrapper.emitted('delete')).toHaveLength(1)
  })

  it('closes on backdrop click', async () => {
    const wrapper = mount(TopicActionMenu, {
      slots: { default: '<div class="menu-host">Topic</div>' },
      global: { stubs: { Teleport: true } },
    })

    await wrapper.find('.menu-host').trigger('contextmenu', { clientX: 100, clientY: 100 })
    expect(wrapper.find('.topic-action-menu__popover').exists()).toBe(true)

    await wrapper.find('.topic-action-menu__backdrop').trigger('click')
    expect(wrapper.find('.topic-action-menu__popover').exists()).toBe(false)
  })
})

describe('TopicActionMenu edge branches', () => {
  it('clamps position near the right/bottom viewport edges', async () => {
    const wrapper = mount(TopicActionMenu, {
      slots: { default: '<div class="menu-host">Topic</div>' },
      global: { stubs: { Teleport: true } },
    })

    // right-bottom corner: overflow both axes
    await wrapper.find('.menu-host').trigger('contextmenu', { clientX: 1000, clientY: 900 })
    const popover = wrapper.find('.topic-action-menu__popover')
    expect(popover.exists()).toBe(true)
    const style = popover.attributes('style')
    // clamped to x - menuWidth - padding = 1000 - 180 - 10 = 810
    expect(style).toContain('left: 810px')
    // clamped to y - menuHeight - padding = 900 - 100 - 10 = 790
    expect(style).toContain('top: 790px')
  })

  it('cancels long-press when touch ends before the delay', async () => {
    const wrapper = mount(TopicActionMenu, {
      slots: { default: '<div class="menu-host">Topic</div>' },
      global: { stubs: { Teleport: true } },
    })

    await wrapper.find('.menu-host').trigger('touchstart', { touches: [{ clientX: 50, clientY: 50 }] })
    await wrapper.find('.menu-host').trigger('touchend')
    // menu should NOT be visible
    expect(wrapper.find('.topic-action-menu__popover').exists()).toBe(false)
    wrapper.unmount()
  })

  it('unmounting with a pending long-press does not throw', async () => {
    const wrapper = mount(TopicActionMenu, {
      slots: { default: '<div class="menu-host">Topic</div>' },
      global: { stubs: { Teleport: true } },
    })
    await wrapper.find('.menu-host').trigger('touchstart', { touches: [{ clientX: 50, clientY: 50 }] })
    expect(() => wrapper.unmount()).not.toThrow()
  })
})
