# Session List Enhancement Design

## Overview

This document describes the design of the session list CRUD enhancements for the AI Chatbot Frontend.

## Features

### 1. Search Functionality
- **Component:** `SessionSearch.vue`
- **Debounced input** (300ms default)
- **Text highlighting** with `<mark>` tags
- **Clear button** visibility

### 2. Batch Selection
- **Toggle button** in bottom-right corner
- **Checkboxes** appear in batch mode
- **Batch operation bar** shows selected count
- **Cancel and delete** actions

### 3. Delete Confirmation
- **Component:** `ConfirmDialog.vue`
- **Reused** for single and batch delete
- **Danger type** styling
- **ESC key** and overlay click support

### 4. Context Menu
- **Component:** `SessionActionMenu.vue`
- **Right-click** (`contextmenu` event)
- **Long-press** (touch events)
- **Edit and delete** actions

### 5. Title Editing
- **Double-click** to edit
- **Input** with auto-focus and select
- **Save on blur/enter**, cancel on escape

### 6. Close Button
- **Dual layout only** (extended mode)
- **enableClose prop** controls visibility
- **Emits close event**

## Component Architecture

```
SessionListView (replaced with SessionManager)
├── SessionSearch
├── SessionActionMenu (wrapper per session)
│   └── [Popover menu]
├── ConfirmDialog
└── Session Items
    ├── Checkbox (batch mode)
    ├── Title (editable)
    ├── Meta info
    └── Delete button
```

## Props Interface

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `sessions` | `Session[]` | required | Session list |
| `currentSessionId` | `string` | required | Active session |
| `layout` | `'dual' \| 'single'` | `'single'` | Layout mode |
| `enableClose` | `boolean` | `false` | Show close button |
| `searchPlaceholder` | `string` | `'Search sessions...'` | Search input placeholder |
| `editLabel` | `string` | `'Rename'` | Edit action label |
| `deleteLabel` | `string` | `'Delete'` | Delete action label |
| ... | ... | ... | (see component for full list) |

## Events Interface

| Event | Payload | Description |
|-------|---------|-------------|
| `create-session` | `void` | Create new session |
| `select-session` | `sessionId: string` | Switch to session |
| `delete-session` | `sessionId: string` | Delete single session |
| `delete-sessions` | `sessionIds: string[]` | Batch delete |
| `update-session-title` | `sessionId, title` | Rename session |
| `close` | `void` | Close panel (dual layout) |

## State Management

### Internal State
```typescript
const searchQuery = ref<string>('')
const isBatchMode = ref<boolean>(false)
const selectedSessionIds = ref<string[]>([])
const showDeleteDialog = ref<boolean>(false)
const pendingDeleteIds = ref<string[]>([])
const editingSessionId = ref<string | null>(null)
const editingTitle = ref<string>('')
```

### Computed Properties
```typescript
const filteredSessions = computed(() => {
  // Filter by searchQuery
})

const showCloseButton = computed(() => {
  return props.layout === 'dual' && props.enableClose === true
})

const deleteDialog = computed(() => {
  // Dynamic title/message based on single/batch
})
```

## Styling

### CSS Classes (BEM)
- `.chatbot-sessions` - Root container
- `.chatbot-sessions__search` - Search area
- `.chatbot-sessions__batch-bar` - Batch operation bar
- `.chatbot-sessions__item` - Session item
- `.chatbot-sessions__item--active` - Active session
- `.chatbot-sessions__item--selected` - Selected in batch mode

### Backward Compatibility
Legacy `.session-list-view` classes are preserved:
- `.session-list-view` - Root (alias)
- `.session-list-view__item` - Item (alias)
- `.session-list-view__item--active` - Active (alias)

## Testing

Unit tests cover:
- Search input and filtering
- Batch mode toggling
- Selection/deselection
- Delete confirmation
- Title editing
- Context menu triggers
- Close button visibility

See: `tests/components/SessionListView.test.ts`
