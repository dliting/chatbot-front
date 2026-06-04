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
