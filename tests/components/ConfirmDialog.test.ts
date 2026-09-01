/**
 * Unit tests for ConfirmDialog component
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createApp, h } from 'vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

describe('ConfirmDialog', () => {
  let wrapper: VueWrapper | null = null
  let root: HTMLElement | null = null

  beforeEach(() => {
    // Create a root element for Teleport
    root = document.createElement('div')
    root.id = 'root'
    document.body.appendChild(root)
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
      wrapper = null
    }
    if (root && root.parentNode) {
      root.parentNode.removeChild(root)
      root = null
    }
    // Clean up any remaining teleport content
    const dialogs = document.querySelectorAll('.confirm-dialog-overlay')
    dialogs.forEach(el => el.remove())
  })

  const mountDialog = (props: Record<string, unknown> = {}) => {
    const app = createApp({
      render() {
        return h(ConfirmDialog, props)
      }
    })
    root = document.getElementById('root') || document.body.appendChild(document.createElement('div'))
    return mount(ConfirmDialog, {
      props,
      attachTo: root,
    })
  }

  describe('Component Rendering', () => {
    it('should not render when show is false', () => {
      wrapper = mountDialog({ show: false })
      expect(document.querySelector('.confirm-dialog-overlay')).toBeNull()
    })

    it('should render when show is true', () => {
      wrapper = mountDialog({ show: true })
      expect(document.querySelector('.confirm-dialog-overlay')).toBeTruthy()
      expect(document.querySelector('.confirm-dialog')).toBeTruthy()
    })

    it('should render with default props', () => {
      wrapper = mountDialog({ show: true })
      const title = document.querySelector('.confirm-dialog__title')
      const body = document.querySelector('.confirm-dialog__body p')
      const buttons = document.querySelectorAll('.confirm-dialog__btn')

      expect(title?.textContent).toBe('Confirm')
      expect(body?.textContent).toBe('Are you sure?')
      expect(buttons.length).toBe(2)
    })

    it('should render custom title and message', () => {
      wrapper = mountDialog({
        show: true,
        title: 'Delete Item',
        message: 'Are you sure you want to delete this item?',
      })
      const title = document.querySelector('.confirm-dialog__title')
      const body = document.querySelector('.confirm-dialog__body p')

      expect(title?.textContent).toBe('Delete Item')
      expect(body?.textContent).toBe('Are you sure you want to delete this item?')
    })

    it('should render custom button texts', () => {
      wrapper = mountDialog({
        show: true,
        confirmText: 'Yes, delete it',
        cancelText: 'No, keep it',
      })
      const buttons = document.querySelectorAll('.confirm-dialog__btn')

      expect(buttons[0]?.textContent).toBe('No, keep it')
      expect(buttons[1]?.textContent).toBe('Yes, delete it')
    })

    it('should apply danger type styles', () => {
      wrapper = mountDialog({ show: true, type: 'danger' })
      expect(document.querySelector('.confirm-dialog--danger')).toBeTruthy()
    })

    it('should apply warning type styles', () => {
      wrapper = mountDialog({ show: true, type: 'warning' })
      expect(document.querySelector('.confirm-dialog--warning')).toBeTruthy()
    })

    it('should apply info type styles by default', () => {
      wrapper = mountDialog({ show: true, type: 'info' })
      expect(document.querySelector('.confirm-dialog--info')).toBeTruthy()
    })
  })

  describe('Events', () => {
    it('should emit confirm when confirm button is clicked', async () => {
      wrapper = mountDialog({ show: true })
      const confirmBtn = document.querySelector('.confirm-dialog__btn--confirm') as HTMLElement

      await confirmBtn.click()

      expect(wrapper?.emitted('confirm')).toBeTruthy()
      expect(wrapper?.emitted('update:show')?.[0]).toEqual([false])
    })

    it('should emit cancel when cancel button is clicked', async () => {
      wrapper = mountDialog({ show: true })
      const cancelBtn = document.querySelector('.confirm-dialog__btn--cancel') as HTMLElement

      await cancelBtn.click()

      expect(wrapper?.emitted('cancel')).toBeTruthy()
      expect(wrapper?.emitted('update:show')?.[0]).toEqual([false])
    })

    it('should emit cancel when overlay is clicked with closeOnOverlay', async () => {
      wrapper = mountDialog({ show: true, closeOnOverlay: true })
      const overlay = document.querySelector('.confirm-dialog-overlay') as HTMLElement

      await overlay.click()

      expect(wrapper?.emitted('cancel')).toBeTruthy()
      expect(wrapper?.emitted('update:show')?.[0]).toEqual([false])
    })

    it('should not close on overlay click when closeOnOverlay is false', async () => {
      wrapper = mountDialog({ show: true, closeOnOverlay: false })
      const overlay = document.querySelector('.confirm-dialog-overlay') as HTMLElement

      await overlay.click()

      expect(wrapper?.emitted('cancel')).toBeFalsy()
      expect(wrapper?.emitted('update:show')).toBeFalsy()
    })
  })

  describe('Keyboard handling', () => {
    it('should close on ESC key press when dialog is shown', async () => {
      wrapper = mountDialog({ show: true })
      await document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

      expect(wrapper?.emitted('cancel')).toBeTruthy()
      expect(wrapper?.emitted('update:show')?.[0]).toEqual([false])
    })

    it('should not close on ESC key press when dialog is hidden', async () => {
      wrapper = mountDialog({ show: false })
      await document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

      expect(wrapper?.emitted('cancel')).toBeFalsy()
    })
  })
})
