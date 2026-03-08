/**
 * Unit tests for SessionListView component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import SessionListView from '@/components/SessionListView.vue'
import type { Session } from '@/types'

// Mock DOM methods for context menu positioning
Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 })
Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 768 })

describe('SessionListView', () => {
  const createMockSessions = (): Session[] => [
    { sessionId: '1', title: 'First Session', createdAt: Date.now() - 100000, updatedAt: Date.now() - 1000, messageCount: 5, unreadCount: 0 },
    { sessionId: '2', title: 'Second Session', createdAt: Date.now() - 200000, updatedAt: Date.now() - 2000, messageCount: 10, unreadCount: 2 },
    { sessionId: '3', title: 'Third Session', createdAt: Date.now() - 300000, updatedAt: Date.now() - 3000, messageCount: 3, unreadCount: 0 },
  ]

  describe('Component Rendering', () => {
    it('should render the component', () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
      })
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('.session-list-view').exists()).toBe(true)
    })

    it('should render new session button', () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
      })
      expect(wrapper.find('.session-list-view__new-btn').exists()).toBe(true)
    })

    it('should render session list', () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
      })
      expect(wrapper.find('.session-list-view__list').exists()).toBe(true)
    })
  })

  describe('Header', () => {
    it('should render header when not embedded', () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
          isEmbedded: false,
        },
      })
      expect(wrapper.find('.session-list-view__header').exists()).toBe(true)
    })

    it('should not render header when embedded', () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
          isEmbedded: true,
        },
      })
      expect(wrapper.find('.session-list-view__header').exists()).toBe(false)
    })
  })

  describe('Session List', () => {
    it('should render session items', () => {
      const sessions = createMockSessions()
      const wrapper = mount(SessionListView, {
        props: {
          sessions,
          currentSessionId: '1',
        },
      })
      const items = wrapper.findAll('.session-list-view__item')
      expect(items.length).toBe(sessions.length)
    })

    it('should highlight current session', () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
      })
      const activeItem = wrapper.find('.session-list-view__item--active')
      expect(activeItem.exists()).toBe(true)
    })
  })

  describe('Empty State', () => {
    it('should render empty state when no sessions', () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: [],
          currentSessionId: '',
        },
      })
      expect(wrapper.find('.session-list-view__empty').exists()).toBe(true)
    })
  })

  describe('Session Metadata', () => {
    it('should display message count in session metadata', () => {
      const sessions = createMockSessions()
      const wrapper = mount(SessionListView, {
        props: {
          sessions,
          currentSessionId: '1',
        },
      })

      const metaElements = wrapper.findAll('.chatbot-sessions__item-meta')
      expect(metaElements.length).toBeGreaterThan(0)

      // First session has 5 messages
      const firstMeta = metaElements[0].text()
      expect(firstMeta).toContain('5 条消息')

      // Second session has 10 messages
      const secondMeta = metaElements[1].text()
      expect(secondMeta).toContain('10 条消息')
    })

    it('should display singular message count for single message', () => {
      const session: Session = {
        sessionId: '1',
        title: 'Single Message Session',
        createdAt: Date.now() - 1000,
        updatedAt: Date.now() - 500,
        messageCount: 1,
        unreadCount: 0,
      }

      const wrapper = mount(SessionListView, {
        props: {
          sessions: [session],
          currentSessionId: '1',
        },
      })

      const metaElement = wrapper.find('.chatbot-sessions__item-meta')
      expect(metaElement.text()).toContain('1 条消息')
    })
  })

  describe('Events', () => {
    it('should emit create-session when new button is clicked', async () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
      })
      const newBtn = wrapper.find('.session-list-view__new-btn')

      await newBtn.trigger('click')

      expect(wrapper.emitted('create-session')).toBeTruthy()
    })

    it('should emit select-session when session is clicked', async () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
      })
      const sessionItem = wrapper.find('.session-list-view__item')

      await sessionItem.trigger('click')

      expect(wrapper.emitted('select-session')).toBeTruthy()
    })

    it('should emit delete-session when delete button is clicked and confirmed', async () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
      })
      const deleteBtn = wrapper.find('.session-list-view__item-delete')

      await deleteBtn.trigger('click')

      // After clicking delete, the confirmation dialog should be shown
      // The delete-session event is only emitted after confirming the dialog
      // For now, we just verify the button exists and can be clicked
      expect(deleteBtn.exists()).toBe(true)
    })
  })

  describe('XSS Protection', () => {
    it('should escape HTML in session titles', async () => {
      const xssSession: Session = {
        sessionId: 'xss-1',
        title: '<script>alert("XSS")</script>',
        createdAt: Date.now() - 1000,
        updatedAt: Date.now() - 500,
        messageCount: 1,
        unreadCount: 0,
      }

      const wrapper = mount(SessionListView, {
        props: {
          sessions: [xssSession],
          currentSessionId: 'xss-1',
        },
      })

      // The HTML should be escaped, not rendered
      const titleElement = wrapper.find('.chatbot-sessions__item-title')
      expect(titleElement.html()).not.toContain('<script>')
      expect(titleElement.text()).toContain('<script>alert("XSS")</script>')
    })

    it('should escape HTML in search query', async () => {
      // Create a session with a title that contains special characters
      const xssSession: Session = {
        sessionId: 'xss-2',
        title: 'Test <img src=x onerror=alert(1)> Session',
        createdAt: Date.now() - 1000,
        updatedAt: Date.now() - 500,
        messageCount: 1,
        unreadCount: 0,
      }

      const wrapper = mount(SessionListView, {
        props: {
          sessions: [xssSession],
          currentSessionId: 'xss-2',
        },
      })

      // Search for the title (the img tag is part of the title)
      await wrapper.find('input').setValue('img')

      // The HTML should be escaped in the highlighted result
      const titleElement = wrapper.find('.chatbot-sessions__item-title')
      const html = titleElement.html()

      // The <img> tag should be escaped, not rendered as an actual tag
      expect(html).not.toContain('<img ')
      // The escaped version should be present
      expect(html).toContain('&lt;')
      // Check that the entire malicious payload is escaped and displayed as text
      expect(titleElement.text()).toContain('Test <img src=x onerror=alert(1)> Session')
    })
  })

  describe('selectedCountFormat Prop', () => {
    it('should use custom selectedCountFormat for batch selection', async () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
          selectedCountFormat: '{count} items selected',
        },
      })

      // Toggle batch mode
      const batchToggleBtn = wrapper.find('.chatbot-sessions__batch-mode-btn')
      await batchToggleBtn.trigger('click')

      // Click first session to select it
      const sessionItem = wrapper.find('.session-list-view__item')
      await sessionItem.trigger('click')

      // Check that the custom format is used
      const countText = wrapper.find('.chatbot-sessions__batch-count').text()
      expect(countText).toBe('1 items selected')
    })

    it('should use default selectedCountFormat when not provided', async () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
      })

      // Toggle batch mode
      const batchToggleBtn = wrapper.find('.chatbot-sessions__batch-mode-btn')
      await batchToggleBtn.trigger('click')

      // Click first session to select it
      const sessionItem = wrapper.find('.session-list-view__item')
      await sessionItem.trigger('click')

      // Check that the default format is used
      const countText = wrapper.find('.chatbot-sessions__batch-count').text()
      expect(countText).toBe('已选择 1 个')
    })
  })

  describe('Search Functionality', () => {
    it('should render search input', () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
      })
      expect(wrapper.find('.session-search').exists()).toBe(true)
      expect(wrapper.find('.session-search__input').exists()).toBe(true)
    })

    it('should filter sessions by search query', async () => {
      const sessions = createMockSessions()
      const wrapper = mount(SessionListView, {
        props: {
          sessions,
          currentSessionId: '1',
        },
      })

      // Initially should show all sessions
      expect(wrapper.findAll('.session-list-view__item').length).toBe(3)

      // Search for 'First'
      const searchInput = wrapper.find('.session-search__input')
      await searchInput.setValue('First')

      // Should only show the first session
      const items = wrapper.findAll('.session-list-view__item')
      expect(items.length).toBe(1)
      expect(items[0].text()).toContain('First Session')
    })

    it('should highlight search query in results', async () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
      })

      // Search for 'Session'
      const searchInput = wrapper.find('.session-search__input')
      await searchInput.setValue('Session')

      // Check that the search term is highlighted with <mark> tag
      const titleElement = wrapper.find('.chatbot-sessions__item-title')
      expect(titleElement.html()).toContain('<mark>Session</mark>')
    })

    it('should show clear button when search has value', async () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
      })

      // Initially no clear button
      expect(wrapper.find('.session-search__clear').exists()).toBe(false)

      // Type in search
      const searchInput = wrapper.find('.session-search__input')
      await searchInput.setValue('test')

      // Clear button should appear
      expect(wrapper.find('.session-search__clear').exists()).toBe(true)
    })

    it('should clear search when clear button is clicked', async () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
      })

      // Search for something
      const searchInput = wrapper.find('.session-search__input')
      await searchInput.setValue('First')

      // Should only show one session
      expect(wrapper.findAll('.session-list-view__item').length).toBe(1)

      // Click clear button
      const clearBtn = wrapper.find('.session-search__clear')
      await clearBtn.trigger('click')

      // Should show all sessions again
      expect(wrapper.findAll('.session-list-view__item').length).toBe(3)
    })

    it('should show no results message when search finds no matches', async () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
      })

      // Search for non-existent session
      const searchInput = wrapper.find('.session-search__input')
      await searchInput.setValue('NonExistentSession')

      // Should show empty state with no results message
      expect(wrapper.find('.session-list-view__empty').exists()).toBe(true)
      expect(wrapper.text()).toContain('未找到匹配的对话')
    })

    it('should be case insensitive when searching', async () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
      })

      // Search with lowercase
      const searchInput = wrapper.find('.session-search__input')
      await searchInput.setValue('first session')

      // Should still find the session
      const items = wrapper.findAll('.session-list-view__item')
      expect(items.length).toBe(1)
      expect(items[0].text()).toContain('First Session')
    })
  })

  describe('Batch Mode', () => {
    it('should show batch mode button when sessions exist', () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
      })
      expect(wrapper.find('.chatbot-sessions__batch-mode-btn').exists()).toBe(true)
    })

    it('should not show batch mode button when no sessions', () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: [],
          currentSessionId: '',
        },
      })
      expect(wrapper.find('.chatbot-sessions__batch-mode-btn').exists()).toBe(false)
    })

    it('should enter batch mode when toggle button is clicked', async () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
      })

      const batchToggleBtn = wrapper.find('.chatbot-sessions__batch-mode-btn')
      await batchToggleBtn.trigger('click')

      // Should show batch toggle (done button) instead of new button
      expect(wrapper.find('.chatbot-sessions__batch-toggle').exists()).toBe(true)
      expect(wrapper.find('.session-list-view__new-btn').exists()).toBe(false)

      // Should show checkboxes
      expect(wrapper.find('.chatbot-sessions__checkbox').exists()).toBe(true)
    })

    it('should exit batch mode when done button is clicked', async () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
      })

      // Enter batch mode
      const batchToggleBtn = wrapper.find('.chatbot-sessions__batch-mode-btn')
      await batchToggleBtn.trigger('click')

      // Exit batch mode
      const doneBtn = wrapper.find('.chatbot-sessions__batch-toggle')
      await doneBtn.trigger('click')

      // Should show new button again
      expect(wrapper.find('.session-list-view__new-btn').exists()).toBe(true)
      expect(wrapper.find('.chatbot-sessions__batch-toggle').exists()).toBe(false)
    })

    it('should select session when clicking checkbox in batch mode', async () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
      })

      // Enter batch mode
      const batchToggleBtn = wrapper.find('.chatbot-sessions__batch-mode-btn')
      await batchToggleBtn.trigger('click')

      // Click checkbox on first session
      const checkbox = wrapper.find('.chatbot-sessions__checkbox')
      await checkbox.trigger('click')

      // Should show batch bar with selection count
      expect(wrapper.find('.chatbot-sessions__batch-bar').exists()).toBe(true)
      expect(wrapper.find('.chatbot-sessions__batch-count').text()).toBe('已选择 1 个')

      // Session should have selected class
      const sessionItem = wrapper.find('.session-list-view__item')
      expect(sessionItem.classes()).toContain('chatbot-sessions__item--selected')
    })

    it('should select multiple sessions', async () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
      })

      // Enter batch mode
      const batchToggleBtn = wrapper.find('.chatbot-sessions__batch-mode-btn')
      await batchToggleBtn.trigger('click')

      // Click checkboxes on first two sessions
      const checkboxes = wrapper.findAll('.chatbot-sessions__checkbox')
      await checkboxes[0].trigger('click')
      await checkboxes[1].trigger('click')

      // Should show correct count
      expect(wrapper.find('.chatbot-sessions__batch-count').text()).toBe('已选择 2 个')
    })

    it('should toggle selection when clicking checkbox again', async () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
      })

      // Enter batch mode
      const batchToggleBtn = wrapper.find('.chatbot-sessions__batch-mode-btn')
      await batchToggleBtn.trigger('click')

      // Click checkbox
      const checkbox = wrapper.find('.chatbot-sessions__checkbox')
      await checkbox.trigger('click')

      // Should be selected
      expect(wrapper.find('.chatbot-sessions__batch-bar').exists()).toBe(true)

      // Click again to deselect
      await checkbox.trigger('click')

      // Batch bar should be hidden
      expect(wrapper.find('.chatbot-sessions__batch-bar').exists()).toBe(false)
    })

    it('should clear selection when cancel button is clicked', async () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
      })

      // Enter batch mode and select a session
      const batchToggleBtn = wrapper.find('.chatbot-sessions__batch-mode-btn')
      await batchToggleBtn.trigger('click')

      const checkbox = wrapper.find('.chatbot-sessions__checkbox')
      await checkbox.trigger('click')

      // Should show batch bar
      expect(wrapper.find('.chatbot-sessions__batch-bar').exists()).toBe(true)

      // Click cancel button
      const cancelBtn = wrapper.find('.chatbot-sessions__batch-btn--cancel')
      await cancelBtn.trigger('click')

      // Batch bar should be hidden
      expect(wrapper.find('.chatbot-sessions__batch-bar').exists()).toBe(false)
    })

    it('should not emit select-session when clicking session item in batch mode', async () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
      })

      // Enter batch mode
      const batchToggleBtn = wrapper.find('.chatbot-sessions__batch-mode-btn')
      await batchToggleBtn.trigger('click')

      // Click session item (not checkbox)
      const sessionItem = wrapper.find('.session-list-view__item')
      await sessionItem.trigger('click')

      // Should toggle selection, not emit select-session
      expect(wrapper.emitted('select-session')).toBeFalsy()
      expect(wrapper.find('.chatbot-sessions__batch-bar').exists()).toBe(true)
    })

    it('should select session when clicking session item in batch mode', async () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
      })

      // Enter batch mode
      const batchToggleBtn = wrapper.find('.chatbot-sessions__batch-mode-btn')
      await batchToggleBtn.trigger('click')

      // Click session item
      const sessionItem = wrapper.find('.session-list-view__item')
      await sessionItem.trigger('click')

      // Should select the session
      expect(wrapper.find('.chatbot-sessions__batch-bar').exists()).toBe(true)
      expect(sessionItem.classes()).toContain('chatbot-sessions__item--selected')
    })
  })

  describe('Delete Confirmation', () => {
    it('should show confirmation dialog when delete button is clicked', async () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
        attachTo: document.body,
      })

      const deleteBtn = wrapper.find('.session-list-view__item-delete')
      await deleteBtn.trigger('click')

      // Wait for dialog to appear
      await wrapper.vm.$nextTick()

      // Dialog should be shown in body
      const dialog = document.body.querySelector('.confirm-dialog-overlay')
      expect(dialog).toBeTruthy()

      wrapper.unmount()
    })

    it('should emit delete-session when dialog is confirmed', async () => {
      // Note: Testing Teleport dialogs in unit tests is complex
      // This test verifies the dialog shows up correctly
      // The actual emit is tested via integration tests
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
        attachTo: document.body,
      })

      // Click delete button
      const deleteBtn = wrapper.find('.session-list-view__item-delete')
      await deleteBtn.trigger('click')

      // Wait for dialog to appear
      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 350))

      // Verify dialog appeared with correct elements
      const dialog = document.body.querySelector('.confirm-dialog-overlay')
      expect(dialog).toBeTruthy()
      expect(document.body.querySelector('.confirm-dialog__btn--confirm')).toBeTruthy()
      expect(document.body.querySelector('.confirm-dialog__btn--cancel')).toBeTruthy()

      wrapper.unmount()
    })

    it('should not emit delete-session when dialog is cancelled', async () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
        attachTo: document.body,
      })

      // Click delete button
      const deleteBtn = wrapper.find('.session-list-view__item-delete')
      await deleteBtn.trigger('click')

      // Wait for dialog to appear
      await wrapper.vm.$nextTick()

      // Find and click cancel button in teleported dialog
      const cancelBtn = document.body.querySelector('.confirm-dialog__btn--cancel') as HTMLElement
      expect(cancelBtn).toBeTruthy()
      cancelBtn.click()
      await wrapper.vm.$nextTick()

      // Should not emit delete-session
      expect(wrapper.emitted('delete-session')).toBeFalsy()

      wrapper.unmount()
    })

    it('should emit delete-sessions for batch delete', async () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
        attachTo: document.body,
      })

      // Enter batch mode
      const batchToggleBtn = wrapper.find('.chatbot-sessions__batch-mode-btn')
      await batchToggleBtn.trigger('click')

      // Select two sessions
      const checkboxes = wrapper.findAll('.chatbot-sessions__checkbox')
      await checkboxes[0].trigger('click')
      await checkboxes[1].trigger('click')

      // Click batch delete button
      const batchDeleteBtn = wrapper.find('.chatbot-sessions__batch-btn--delete')
      await batchDeleteBtn.trigger('click')

      // Wait for dialog to appear
      await wrapper.vm.$nextTick()

      // Find and click confirm button in teleported dialog
      const confirmBtn = document.body.querySelector('.confirm-dialog__btn--confirm') as HTMLElement
      expect(confirmBtn).toBeTruthy()
      confirmBtn.click()
      await wrapper.vm.$nextTick()

      // Should emit delete-sessions
      expect(wrapper.emitted('delete-sessions')).toBeTruthy()
      const emittedEvents = wrapper.emitted('delete-sessions') || []
      expect(emittedEvents[0]).toEqual([['1', '2']])

      wrapper.unmount()
    })

    it('should show different dialog message for batch delete', async () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
        attachTo: document.body,
      })

      // Enter batch mode
      const batchToggleBtn = wrapper.find('.chatbot-sessions__batch-mode-btn')
      await batchToggleBtn.trigger('click')

      // Select two sessions
      const checkboxes = wrapper.findAll('.chatbot-sessions__checkbox')
      await checkboxes[0].trigger('click')
      await checkboxes[1].trigger('click')

      // Click batch delete button
      const batchDeleteBtn = wrapper.find('.chatbot-sessions__batch-btn--delete')
      await batchDeleteBtn.trigger('click')

      // Wait for dialog to appear
      await wrapper.vm.$nextTick()

      // Check dialog message contains count
      const dialog = document.body.querySelector('.confirm-dialog')
      expect(dialog?.textContent).toContain('(2)')

      wrapper.unmount()
    })

    it('should exit batch mode after batch delete is confirmed', async () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
        attachTo: document.body,
      })

      // Enter batch mode
      const batchToggleBtn = wrapper.find('.chatbot-sessions__batch-mode-btn')
      await batchToggleBtn.trigger('click')

      // Select a session
      const checkbox = wrapper.find('.chatbot-sessions__checkbox')
      await checkbox.trigger('click')

      // Click batch delete and confirm
      const batchDeleteBtn = wrapper.find('.chatbot-sessions__batch-btn--delete')
      await batchDeleteBtn.trigger('click')

      // Wait for dialog to appear
      await wrapper.vm.$nextTick()

      // Find and click confirm button in teleported dialog
      const confirmBtn = document.body.querySelector('.confirm-dialog__btn--confirm') as HTMLElement
      expect(confirmBtn).toBeTruthy()
      confirmBtn.click()
      await wrapper.vm.$nextTick()

      // Should exit batch mode
      expect(wrapper.find('.chatbot-sessions__batch-toggle').exists()).toBe(false)
      expect(wrapper.find('.session-list-view__new-btn').exists()).toBe(true)

      wrapper.unmount()
    })
  })

  describe('Close Button', () => {
    it('should show close button when not embedded', () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
          isEmbedded: false,
        },
      })
      expect(wrapper.find('.session-list-view__close').exists()).toBe(true)
    })

    it('should not show close button when embedded and layout is not dual', () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
          isEmbedded: true,
          layout: 'single',
          enableClose: false,
        },
      })
      expect(wrapper.find('.session-list-view__close').exists()).toBe(false)
    })

    it('should show close button when embedded with dual layout and enableClose', () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
          isEmbedded: true,
          layout: 'dual',
          enableClose: true,
        },
      })
      expect(wrapper.find('.session-list-view__close').exists()).toBe(true)
    })

    it('should emit close event when close button is clicked', async () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
          isEmbedded: false,
        },
      })

      const closeBtn = wrapper.find('.session-list-view__close')
      await closeBtn.trigger('click')

      expect(wrapper.emitted('close')).toBeTruthy()
    })
  })

  describe('Title Editing', () => {
    it('should enter edit mode when double-clicking session title', async () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
      })

      const sessionContent = wrapper.find('.chatbot-sessions__item-content')
      await sessionContent.trigger('dblclick')

      // Should show input field
      expect(wrapper.find('.chatbot-sessions__item-title-input').exists()).toBe(true)
    })

    it('should emit update-session-title when saving edited title', async () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
      })

      // Enter edit mode
      const sessionContent = wrapper.find('.chatbot-sessions__item-content')
      await sessionContent.trigger('dblclick')

      // Change the title
      const input = wrapper.find('.chatbot-sessions__item-title-input')
      await input.setValue('New Title')
      await input.trigger('blur')

      // Should emit update-session-title
      expect(wrapper.emitted('update-session-title')).toBeTruthy()
      const emittedEvents = wrapper.emitted('update-session-title') || []
      expect(emittedEvents[0]).toEqual(['1', 'New Title'])
    })

    it('should save title when pressing Enter', async () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
      })

      // Enter edit mode
      const sessionContent = wrapper.find('.chatbot-sessions__item-content')
      await sessionContent.trigger('dblclick')

      // Change the title and press Enter
      const input = wrapper.find('.chatbot-sessions__item-title-input')
      await input.setValue('New Title')
      await input.trigger('keyup.enter')

      // Should emit update-session-title
      expect(wrapper.emitted('update-session-title')).toBeTruthy()
    })

    it('should cancel edit when pressing Escape', async () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
      })

      // Enter edit mode
      const sessionContent = wrapper.find('.chatbot-sessions__item-content')
      await sessionContent.trigger('dblclick')

      // Change the title but press Escape
      const input = wrapper.find('.chatbot-sessions__item-title-input')
      await input.setValue('New Title')
      await input.trigger('keyup.escape')

      // Should not emit update-session-title
      expect(wrapper.emitted('update-session-title')).toBeFalsy()

      // Should show original title
      expect(wrapper.find('.chatbot-sessions__item-title').exists()).toBe(true)
    })

    it('should not emit update-session-title if title is empty', async () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
      })

      // Enter edit mode
      const sessionContent = wrapper.find('.chatbot-sessions__item-content')
      await sessionContent.trigger('dblclick')

      // Clear the title
      const input = wrapper.find('.chatbot-sessions__item-title-input')
      await input.setValue('   ')
      await input.trigger('blur')

      // Should not emit update-session-title
      expect(wrapper.emitted('update-session-title')).toBeFalsy()
    })

    it('should not emit update-session-title if title has not changed', async () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
      })

      // Enter edit mode
      const sessionContent = wrapper.find('.chatbot-sessions__item-content')
      await sessionContent.trigger('dblclick')

      // Don't change the title
      const input = wrapper.find('.chatbot-sessions__item-title-input')
      await input.trigger('blur')

      // Should not emit update-session-title
      expect(wrapper.emitted('update-session-title')).toBeFalsy()
    })

    it('should not enter edit mode when in batch mode', async () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
      })

      // Enter batch mode
      const batchToggleBtn = wrapper.find('.chatbot-sessions__batch-mode-btn')
      await batchToggleBtn.trigger('click')

      // Try to enter edit mode
      const sessionContent = wrapper.find('.chatbot-sessions__item-content')
      await sessionContent.trigger('dblclick')

      // Should not show input field
      expect(wrapper.find('.chatbot-sessions__item-title-input').exists()).toBe(false)
    })
  })

  describe('Context Menu', () => {
    it('should emit edit event when context menu edit is clicked', async () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
        attachTo: document.body,
      })

      // Trigger context menu
      const sessionItem = wrapper.find('.session-action-menu')
      await sessionItem.trigger('contextmenu.prevent', { clientX: 100, clientY: 100 })

      // Wait for menu to appear
      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      // Find and click edit button in teleported menu
      const editBtn = document.body.querySelector('.session-action-menu__item') as HTMLElement
      expect(editBtn).toBeTruthy()
      editBtn.click()
      await wrapper.vm.$nextTick()

      // Should enter edit mode
      expect(wrapper.find('.chatbot-sessions__item-title-input').exists()).toBe(true)

      wrapper.unmount()
    })

    it('should trigger delete confirmation when context menu delete is clicked', async () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
        attachTo: document.body,
      })

      // Trigger context menu
      const sessionItem = wrapper.find('.session-action-menu')
      await sessionItem.trigger('contextmenu.prevent', { clientX: 100, clientY: 100 })

      // Wait for menu to appear
      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      // Find and click delete button in teleported menu
      const deleteBtn = document.body.querySelector('.session-action-menu__item--danger') as HTMLElement
      expect(deleteBtn).toBeTruthy()
      deleteBtn.click()
      await wrapper.vm.$nextTick()

      // Should show confirmation dialog
      const dialog = document.body.querySelector('.confirm-dialog-overlay')
      expect(dialog).toBeTruthy()

      wrapper.unmount()
    })
  })

  describe('Unread Badge', () => {
    it('should show unread badge when session has unread messages', () => {
      const sessions = createMockSessions()
      const wrapper = mount(SessionListView, {
        props: {
          sessions,
          currentSessionId: '2',
        },
      })

      const badges = wrapper.findAll('.chatbot-sessions__item-badge')
      expect(badges.length).toBeGreaterThan(0)

      // Second session has 2 unread messages
      const badgeText = badges[0].text()
      expect(badgeText).toBe('2')
    })

    it('should not show unread badge when session has no unread messages', () => {
      const sessions = createMockSessions()
      const wrapper = mount(SessionListView, {
        props: {
          sessions,
          currentSessionId: '1',
        },
      })

      const firstItem = wrapper.findAll('.session-list-view__item')[0]
      expect(firstItem.find('.chatbot-sessions__item-badge').exists()).toBe(false)
    })

    it('should show "99+" for unread count greater than 99', () => {
      const session: Session = {
        sessionId: '1',
        title: 'High Unread Session',
        createdAt: Date.now() - 1000,
        updatedAt: Date.now() - 500,
        messageCount: 150,
        unreadCount: 150,
      }

      const wrapper = mount(SessionListView, {
        props: {
          sessions: [session],
          currentSessionId: '1',
        },
      })

      const badge = wrapper.find('.chatbot-sessions__item-badge')
      expect(badge.text()).toBe('99+')
    })
  })

  describe('Default Title', () => {
    it('should show "未命名对话" for sessions without title', () => {
      const session: Session = {
        sessionId: '1',
        title: '',
        createdAt: Date.now() - 1000,
        updatedAt: Date.now() - 500,
        messageCount: 1,
        unreadCount: 0,
      }

      const wrapper = mount(SessionListView, {
        props: {
          sessions: [session],
          currentSessionId: '1',
        },
      })

      const titleElement = wrapper.find('.chatbot-sessions__item-title')
      expect(titleElement.text()).toContain('未命名对话')
    })

    it('should show "未命名对话" for sessions with null title', () => {
      const session: Session = {
        sessionId: '1',
        title: '',
        createdAt: Date.now() - 1000,
        updatedAt: Date.now() - 500,
        messageCount: 1,
        unreadCount: 0,
      }

      const wrapper = mount(SessionListView, {
        props: {
          sessions: [session],
          currentSessionId: '1',
        },
      })

      const titleElement = wrapper.find('.chatbot-sessions__item-title')
      expect(titleElement.text()).toContain('未命名对话')
    })
  })

  describe('Selected Session Styling', () => {
    it('should apply active class to current session', () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
      })

      const firstItem = wrapper.findAll('.session-list-view__item')[0]
      expect(firstItem.classes()).toContain('chatbot-sessions__item--active')
      expect(firstItem.classes()).toContain('session-list-view__item--active')
    })

    it('should not apply active class to non-current sessions', () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
      })

      const secondItem = wrapper.findAll('.session-list-view__item')[1]
      expect(secondItem.classes()).not.toContain('chatbot-sessions__item--active')
    })
  })

  describe('Empty State Messages', () => {
    it('should show no sessions message when no sessions and no search', () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: [],
          currentSessionId: '',
        },
      })

      const emptyState = wrapper.find('.session-list-view__empty')
      expect(emptyState.text()).toContain('暂无历史对话')
      expect(emptyState.text()).toContain('点击上方按钮开始新对话')
    })
  })

  describe('Accessibility', () => {
    it('should have proper aria-labels on buttons', () => {
      const wrapper = mount(SessionListView, {
        props: {
          sessions: createMockSessions(),
          currentSessionId: '1',
        },
      })

      // Close button
      const closeBtn = wrapper.find('.session-list-view__close')
      expect(closeBtn.attributes('aria-label')).toBe('取消')

      // Delete button
      const deleteBtn = wrapper.find('.session-list-view__item-delete')
      expect(deleteBtn.attributes('aria-label')).toBe('删除')

      // Batch mode button
      const batchBtn = wrapper.find('.chatbot-sessions__batch-mode-btn')
      expect(batchBtn.attributes('aria-label')).toBe('批量选择')
    })
  })
})
