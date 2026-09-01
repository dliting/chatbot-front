/**
 * Unit tests for useChatView composable
 * Tests view state management for single layout mode
 */
import { describe, it, expect } from 'vitest'
import { ref, computed } from 'vue'
import { useChatView } from '@/composables/useChatView'
import type { InteractionMode } from '@/types'

describe('useChatView Composable', () => {
  describe('Extended mode (dual layout)', () => {
    it('should show topic sidebar in extended mode', () => {
      const mode: InteractionMode = 'extended'
      const { showTopicSidebar, useViewNavigation, viewState } = useChatView(mode)

      expect(showTopicSidebar.value).toBe(true)
      expect(useViewNavigation.value).toBe(false)
      expect(viewState.value.currentView).toBe('chat')
    })

    it('should not change view in extended mode when showChatView is called', () => {
      const mode: InteractionMode = 'extended'
      const { showChatView, viewState } = useChatView(mode)

      showChatView()
      // viewState should not change because useViewNavigation is false
      expect(viewState.value.currentView).toBe('chat')
    })

    it('should not change view in extended mode when showTopicsView is called', () => {
      const mode: InteractionMode = 'extended'
      const { showTopicsView, viewState } = useChatView(mode)

      showTopicsView()
      // viewState should not change because useViewNavigation is false
      expect(viewState.value.currentView).toBe('chat')
    })

    it('should not toggle view in extended mode', () => {
      const mode: InteractionMode = 'extended'
      const { toggleView, viewState } = useChatView(mode)

      toggleView()
      // viewState should not change because useViewNavigation is false
      expect(viewState.value.currentView).toBe('chat')
    })
  })

  describe('Floating mode (single layout)', () => {
    it('should not show topic sidebar in floating mode', () => {
      const mode: InteractionMode = 'floating'
      const { showTopicSidebar, useViewNavigation } = useChatView(mode)

      expect(showTopicSidebar.value).toBe(false)
      expect(useViewNavigation.value).toBe(true)
    })

    it('should change to chat view when showChatView is called', () => {
      const mode: InteractionMode = 'floating'
      const { showChatView, showTopicsView, viewState } = useChatView(mode)

      // First switch to topics view
      showTopicsView()
      expect(viewState.value.currentView).toBe('topics')

      // Then switch back to chat view
      showChatView()
      expect(viewState.value.currentView).toBe('chat')
    })

    it('should change to topics view when showTopicsView is called', () => {
      const mode: InteractionMode = 'floating'
      const { showTopicsView, viewState } = useChatView(mode)

      showTopicsView()
      expect(viewState.value.currentView).toBe('topics')
    })

    it('should toggle view when toggleView is called', () => {
      const mode: InteractionMode = 'floating'
      const { toggleView, viewState } = useChatView(mode)

      // Initially chat view
      expect(viewState.value.currentView).toBe('chat')

      // Toggle to topics
      toggleView()
      expect(viewState.value.currentView).toBe('topics')

      // Toggle back to chat
      toggleView()
      expect(viewState.value.currentView).toBe('chat')
    })
  })

  describe('Sidebar mode (single layout)', () => {
    it('should not show topic sidebar in sidebar mode', () => {
      const mode: InteractionMode = 'sidebar'
      const { showTopicSidebar, useViewNavigation } = useChatView(mode)

      expect(showTopicSidebar.value).toBe(false)
      expect(useViewNavigation.value).toBe(true)
    })

    it('should toggle view in sidebar mode', () => {
      const mode: InteractionMode = 'sidebar'
      const { toggleView, viewState } = useChatView(mode)

      expect(viewState.value.currentView).toBe('chat')

      toggleView()
      expect(viewState.value.currentView).toBe('topics')
    })
  })

  describe('Reactive mode parameter (MaybeRef)', () => {
    it('should react to mode changes when mode is a ref', () => {
      const mode = ref<InteractionMode>('floating')
      const { showTopicSidebar, useViewNavigation } = useChatView(mode)
      expect(showTopicSidebar.value).toBe(false)
      expect(useViewNavigation.value).toBe(true)

      mode.value = 'extended'
      expect(showTopicSidebar.value).toBe(true)
      expect(useViewNavigation.value).toBe(false)
    })

    it('should react to mode changes when mode is a computed', () => {
      const source = ref<InteractionMode>('floating')
      const mode = computed(() => source.value)
      const { showTopicSidebar } = useChatView(mode)
      expect(showTopicSidebar.value).toBe(false)

      source.value = 'extended'
      expect(showTopicSidebar.value).toBe(true)
    })
  })
})
