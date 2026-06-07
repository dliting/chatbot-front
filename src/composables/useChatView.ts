import { ref, computed, type Ref, unref } from 'vue'
import type { ChatMode } from '@/types'

export interface ChatViewState {
  currentView: 'chat' | 'topics'
}

type MaybeRef<T> = T | Ref<T>

export function useChatView(mode: MaybeRef<ChatMode>) {
  const currentMode = computed(() => unref(mode))

  // View state (only used for non-extended modes)
  const viewState = ref<ChatViewState>({
    currentView: 'chat',
  })

  // Computed: whether topic list should be shown as sidebar (extended mode only)
  const showTopicSidebar = computed(() => currentMode.value === 'extended')

  // Computed: whether we should use view-based navigation (non-extended modes)
  const useViewNavigation = computed(() => currentMode.value !== 'extended')

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
