import { ref, computed } from 'vue'
import type { ChatMode } from '@/types'

export interface ChatViewState {
  currentView: 'chat' | 'sessions'
}

export function useChatView(mode: ChatMode) {
  // View state (only used for non-extended modes)
  const viewState = ref<ChatViewState>({
    currentView: 'chat',
  })

  // Computed: whether session list should be shown as sidebar (extended mode only)
  const showSessionSidebar = computed(() => mode === 'extended')

  // Computed: whether we should use view-based navigation (non-extended modes)
  const useViewNavigation = computed(() => mode !== 'extended')

  // Methods
  const showChatView = () => {
    if (useViewNavigation.value) {
      viewState.value.currentView = 'chat'
    }
  }

  const showSessionsView = () => {
    if (useViewNavigation.value) {
      viewState.value.currentView = 'sessions'
    }
  }

  const toggleView = () => {
    if (useViewNavigation.value) {
      viewState.value.currentView =
        viewState.value.currentView === 'chat' ? 'sessions' : 'chat'
    }
  }

  return {
    viewState,
    showSessionSidebar,
    useViewNavigation,
    showChatView,
    showSessionsView,
    toggleView,
  }
}
