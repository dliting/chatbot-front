# Component Communication Architecture

## Document Information

| Project | Content |
|---------|---------|
| Product Name | AI Chatbot Frontend |
| Version | v1.1 |
| Last Updated | 2026-06-10 |

## Overview

This document describes the component communication architecture used in the AI Chatbot Frontend project. The architecture follows an **inject-primary pattern** where internal component communication uses Vue's `provide`/`inject` mechanism, while component `emit` events are reserved only for external-facing UI events.

## Core Principle: Inject-Primary Pattern

### The Rule

```
Internal actions → use provide/inject (via Symbol keys)
External events → use component emits
```

**Internal actions** are data operations that affect the application state:
- Sending messages
- Deleting messages/topics
- Switching topics
- Toggling theme
- Enabling/disabling features

**External events** are UI notifications for the parent application:
- `close` - Panel closed
- `file-click` - User clicked a file attachment

### Why This Pattern?

The previous dual-path architecture (both inject and emit for the same operation) caused bugs:
- Sidebar mode topic switching didn't navigate to chat view
- Emit and inject paths could get out of sync
- Unclear which path to use for new features

The inject-primary pattern provides:
1. **Single source of truth** - One path for each operation
2. **Clear boundaries** - Inject for internal, emit for external
3. **Easier testing** - Mock inject providers, verify calls
4. **Better maintainability** - No confusion about which path to use

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                     AIChatbot.vue (Root)                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  provide: chatStateKey, chatActionsKey, topicActionsKey,│   │
│  │          uiActionsKey                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│              ┌───────────────┴───────────────┐                  │
│              │                               │                  │
│          ┌───┘                               └───┐              │
│          ▼                                       ▼              │
│  ┌───────────────────┐                  ┌───────────────────┐  │
│  │ FloatingChatPanel │                  │ EmbeddedChatPanel │  │
│  │                   │                  │                   │  │
│  │ inject: chatState,│                  │ inject: chatState,│  │
│  │   uiActions       │                  │   uiActions       │  │
│  │ provide: enhanced │                  │ provide: enhanced │  │
│  │   uiActions with  │                  │   uiActions with  │  │
│  │   showChatView,   │                  │   showChatView,   │  │
│  │   showTopicsView  │                  │   showTopicsView  │  │
│  └───────────────────┘                  └───────────────────┘  │
│          │                                          │          │
│          ▼                                          ▼          │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              Child Components (ChatContent, etc.)         │ │
│  │                                                           │ │
│  │  inject: chatState, chatActions, topicActions, uiActions │ │
│  │  Call methods directly, NO emit for data operations      │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Injection Keys

Defined in `src/symbols.ts`:

```typescript
// Reactive state (messages, topics, streaming, thinking, etc.)
export const chatStateKey: InjectionKey<ChatState> = Symbol('chatState')

// Chat operations
export const chatActionsKey: InjectionKey<ChatActionHandlers> = Symbol('chatActions')

// Topic/Session operations
export const topicActionsKey: InjectionKey<TopicActionHandlers> = Symbol('topicActions')

// UI operations (theme, view navigation)
export const uiActionsKey: InjectionKey<UIActionHandlers> = Symbol('uiActions')
```

## Action Handler Interfaces

### ChatActionHandlers

```typescript
export interface ChatActionHandlers {
  sendMessage: (data: { content: string; attachments?: Attachment[] }) => void
  editMessage: (message: Message) => void
  deleteMessage: (message: Message) => void
  refreshMessage: (message: Message) => void
  stopGenerating: () => void
  isGenerating: { value: boolean }
  isThinkingActive: { value: boolean }
}
```

### TopicActionHandlers

```typescript
export interface TopicActionHandlers {
  createNewTopic: () => void
  switchToTopic: (topicId: string) => void
  removeTopic: (topicId: string) => void
  removeTopics: (topicIds: string[]) => void
  renameTopic: (topicId: string, title: string) => void
}
```

### UIActionHandlers

```typescript
export interface UIActionHandlers {
  toggleTheme: () => void
  setThinkingEnabled: (enabled: boolean) => void
  thinkingEnabled: { value: boolean }
  showChatView: () => void      // Navigate to chat view (single-layout modes)
  showTopicsView: () => void    // Navigate to topics view (single-layout modes)
}
```

## Enhanced Provide Chain

Panel components (FloatingChatPanel, EmbeddedChatPanel) inject the parent `uiActions` and provide an **enhanced version** that includes their local `showChatView`/`showTopicsView` methods from `useChatView` composable.

```typescript
// In FloatingChatPanel.vue / EmbeddedChatPanel.vue
const parentUiActions = inject(uiActionsKey, null)
const { viewState, showChatView, showTopicsView } = useChatView('floating')

provide(uiActionsKey, {
  ...parentUiActions,
  showChatView,
  showTopicsView,
} satisfies UIActionHandlers)
```

This ensures that when child components call `uiActions.showChatView()`, they trigger the panel's local view navigation, not the root's.

## Component Communication Examples

### Example 1: Sending a Message

**Before (dual-path - problematic):**
```vue
<!-- ChatContent.vue -->
<script setup>
const emit = defineEmits(['send-message'])
const handleSend = (msg) => {
  if (chatActions) {
    chatActions.sendMessage(msg)  // inject path
  } else {
    emit('send-message', msg)     // emit path
  }
}
</script>

<!-- FloatingChatPanel.vue -->
<ChatContent @send-message="(msg) => emit('send-message', msg)" />

<!-- AIChatbot.vue -->
<FloatingChatPanel @send-message="handleSendMessage" />
```

**After (inject-primary - clean):**
```vue
<!-- ChatContent.vue -->
<script setup>
const chatActions = inject(chatActionsKey)
const handleSend = (msg) => {
  chatActions?.sendMessage(msg)  // Only inject path
}
</script>

<!-- FloatingChatPanel.vue -->
<ChatContent />  <!-- No event listener needed -->

<!-- AIChatbot.vue -->
<!-- Provides chatActions, handles everything via inject -->
```

### Example 2: Topic Selection with View Navigation

**The bug that led to this architecture:**

In sidebar mode, clicking a topic in TopicListView would switch the data (via inject) but NOT navigate to the chat view. The emit path was not triggering `showChatView()`.

**Solution:**

```typescript
// TopicListView.vue
const handleTopicClick = (topicId: string) => {
  if (isBatchMode.value) {
    toggleSelection(topicId)
  } else {
    // Both operations via inject
    topicActions?.switchToTopic(topicId)  // Switch data
    uiActions?.showChatView()              // Navigate to chat view
  }
}
```

The enhanced provide chain ensures `uiActions.showChatView()` is the panel's local method, which actually changes the view state.

### Example 3: Theme Toggle

```vue
<!-- ChatHeader.vue -->
<script setup>
const uiActions = inject(uiActionsKey)

const handleThemeToggle = () => {
  uiActions?.toggleTheme()  // Via inject
}
</script>

<template>
  <button @click="handleThemeToggle">Toggle Theme</button>
</template>
```

No emit needed. The theme state is managed at the root and propagates via props.

## Testing Strategy

### Mocking Inject Providers

```typescript
// tests/utils/mockActions.ts
export function createMockChatActions(): ChatActionHandlers {
  return {
    sendMessage: vi.fn(),
    editMessage: vi.fn(),
    deleteMessage: vi.fn(),
    refreshMessage: vi.fn(),
    stopGenerating: vi.fn(),
    isGenerating: ref(false),
    isThinkingActive: ref(false),
  }
}

// In test file
const mockChatActions = createMockChatActions()

const wrapper = mount(ChatContent, {
  global: {
    provide: {
      [chatActionsKey]: mockChatActions,
    },
  },
})

// Verify inject was called
await wrapper.find('.send-btn').trigger('click')
expect(mockChatActions.sendMessage).toHaveBeenCalledWith({ content: 'test' })
```

### Testing View Navigation

```typescript
// Test that showChatView is called after topic selection
const wrapper = mount(TopicListView, {
  global: {
    provide: {
      [topicActionsKey]: mockTopicActions,
      [uiActionsKey]: mockUIActions,
    },
  },
})

await wrapper.find('.topic-item').trigger('click')
expect(mockTopicActions.switchToTopic).toHaveBeenCalled()
expect(mockUIActions.showChatView).toHaveBeenCalled()
```

## Migration Guide

When adding a new feature that requires component communication:

1. **Is it a data operation?** → Add to appropriate action handler interface, provide at root, inject in child
2. **Is it a UI notification?** → Use component emit with clear naming

### Checklist for New Features

- [ ] If adding a data operation, add to `ChatActionHandlers`, `TopicActionHandlers`, or `UIActionHandlers`
- [ ] Implement the action in `useChatActions`, `useTopicActions`, or `useUIActions`
- [ ] Provide the action at the appropriate level (root or panel)
- [ ] Inject and call in child components
- [ ] Do NOT add emit for the same operation
- [ ] Update tests to mock inject and verify calls

## Common Mistakes to Avoid

### ❌ Dual-path (inject OR emit)

```typescript
// WRONG - dual path
if (chatActions) {
  chatActions.sendMessage(msg)
} else {
  emit('send-message', msg)
}
```

### ✅ Inject-only for data operations

```typescript
// CORRECT - inject only
chatActions?.sendMessage(msg)
```

### ❌ Emit forwarding through intermediate components

```vue
<!-- WRONG - forwarding emits -->
<ChatContent @send-message="(msg) => emit('send-message', msg)" />
```

### ✅ No forwarding needed

```vue
<!-- CORRECT - no event listener -->
<ChatContent />
```

### ❌ Emit for internal state changes

```typescript
// WRONG - using emit for theme toggle
emit('toggle-theme')
```

### ✅ Inject for internal state changes

```typescript
// CORRECT - using inject
uiActions?.toggleTheme()
```

## Summary

The inject-primary pattern provides a clear, maintainable architecture for component communication:

1. **Data operations** → `provide`/`inject` via Symbol keys
2. **UI notifications** → Component `emit` events
3. **Enhanced provide chain** → Panel components add `showChatView`/`showTopicsView` to `uiActions`
4. **Single source of truth** → No dual paths, no confusion

This architecture prevents the bugs that occurred with the previous dual-path approach and makes the codebase easier to understand and maintain.
