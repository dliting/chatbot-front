import { ref, computed } from 'vue'
import type { ChatMode } from '@/types'

export interface ChatViewState {
  currentView: 'chat' | 'topics'
}

export function useChatView(mode: ChatMode) {
  // View state (only used for non-extended modes)
  const viewState = ref<ChatViewState>({
    currentView: 'chat',
  })

  // Computed: whether topic list should be shown as sidebar (extended mode only)
  const showTopicSidebar = computed(() => mode === 'extended')

  // Computed: whether we should use view-based navigation (non-extended modes)
  const useViewNavigation = computed(() => mode !== 'extended')

  // Methods
  const showChatView = () => {
    if (useViewNavigation.value) {
      viewState.value.currentView = 'chat'
    }
  }

  const showTopicsView = () => {
    if (useViewNavigation.value) {
      viewState.value.currentView = 'topics'
    }
  }

  const toggleView = () => {
    if (useViewNavigation.value) {
      viewState.value.currentView =
        viewState.value.currentView === 'chat' ? 'topics' : 'chat'
    }
  }

  return {
    viewState,
    showTopicSidebar,
    useViewNavigation,
    showChatView,
    showTopicsView,
    toggleView,
  }
}
