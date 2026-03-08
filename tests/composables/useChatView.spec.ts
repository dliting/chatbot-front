/**
 * Unit tests for useChatView composable
 * Tests view state management for single layout mode
 */
import { describe, it, expect } from 'vitest'
import { useChatView } from '@/composables/useChatView'
import type { ChatMode } from '@/types'

describe('useChatView Composable', () => {
  describe('Extended mode (dual layout)', () => {
    it('should show session sidebar in extended mode', () => {
      const mode: ChatMode = 'extended'
      const { showSessionSidebar, useViewNavigation, viewState } = useChatView(mode)

      expect(showSessionSidebar.value).toBe(true)
      expect(useViewNavigation.value).toBe(false)
      expect(viewState.value.currentView).toBe('chat')
    })

    it('should not change view in extended mode when showChatView is called', () => {
      const mode: ChatMode = 'extended'
      const { showChatView, viewState } = useChatView(mode)

      showChatView()
      // viewState should not change because useViewNavigation is false
      expect(viewState.value.currentView).toBe('chat')
    })

    it('should not change view in extended mode when showSessionsView is called', () => {
      const mode: ChatMode = 'extended'
      const { showSessionsView, viewState } = useChatView(mode)

      showSessionsView()
      // viewState should not change because useViewNavigation is false
      expect(viewState.value.currentView).toBe('chat')
    })

    it('should not toggle view in extended mode', () => {
      const mode: ChatMode = 'extended'
      const { toggleView, viewState } = useChatView(mode)

      toggleView()
      // viewState should not change because useViewNavigation is false
      expect(viewState.value.currentView).toBe('chat')
    })
  })

  describe('Floating mode (single layout)', () => {
    it('should not show session sidebar in floating mode', () => {
      const mode: ChatMode = 'floating'
      const { showSessionSidebar, useViewNavigation } = useChatView(mode)

      expect(showSessionSidebar.value).toBe(false)
      expect(useViewNavigation.value).toBe(true)
    })

    it('should change to chat view when showChatView is called', () => {
      const mode: ChatMode = 'floating'
      const { showChatView, showSessionsView, viewState } = useChatView(mode)

      // First switch to sessions view
      showSessionsView()
      expect(viewState.value.currentView).toBe('sessions')

      // Then switch back to chat view
      showChatView()
      expect(viewState.value.currentView).toBe('chat')
    })

    it('should change to sessions view when showSessionsView is called', () => {
      const mode: ChatMode = 'floating'
      const { showSessionsView, viewState } = useChatView(mode)

      showSessionsView()
      expect(viewState.value.currentView).toBe('sessions')
    })

    it('should toggle view when toggleView is called', () => {
      const mode: ChatMode = 'floating'
      const { toggleView, viewState } = useChatView(mode)

      // Initially chat view
      expect(viewState.value.currentView).toBe('chat')

      // Toggle to sessions
      toggleView()
      expect(viewState.value.currentView).toBe('sessions')

      // Toggle back to chat
      toggleView()
      expect(viewState.value.currentView).toBe('chat')
    })
  })

  describe('Sidebar mode (single layout)', () => {
    it('should not show session sidebar in sidebar mode', () => {
      const mode: ChatMode = 'sidebar'
      const { showSessionSidebar, useViewNavigation } = useChatView(mode)

      expect(showSessionSidebar.value).toBe(false)
      expect(useViewNavigation.value).toBe(true)
    })

    it('should toggle view in sidebar mode', () => {
      const mode: ChatMode = 'sidebar'
      const { toggleView, viewState } = useChatView(mode)

      expect(viewState.value.currentView).toBe('chat')

      toggleView()
      expect(viewState.value.currentView).toBe('sessions')
    })
  })

  describe('Fullscreen mode (single layout)', () => {
    it('should handle fullscreen mode correctly', () => {
      const mode: ChatMode = 'fullscreen'
      const { showSessionSidebar, useViewNavigation, toggleView, viewState } = useChatView(mode)

      expect(showSessionSidebar.value).toBe(false)
      expect(useViewNavigation.value).toBe(true)

      toggleView()
      expect(viewState.value.currentView).toBe('sessions')
    })
  })
})
