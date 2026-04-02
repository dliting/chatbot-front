# Topic Management Feature

## Overview

The Topic Management feature provides users with the ability to create, view, switch, rename, and delete chat topics. It includes search functionality, batch operations, confirmation dialogs for safe data management, and automatic persistence to localStorage.

## Features

### 1. Topic List

The topic list displays all chat topics with:
- **Topic title** - User or auto-generated name (default: "新话题")
- **Metadata** - Last update time and message count
- **Unread badge** - Shows unread message count
- **Active indicator** - Highlights current topic with blue left border

### 2. Create New Topic

Click the "New Chat" button to create a new topic. The new topic becomes active immediately and is automatically persisted to localStorage.

### 3. Switch Topics

Click on any topic in the list to switch to it. The active topic is highlighted and the switch is persisted to localStorage. **Topic order is preserved** -- switching does not reorder the list.

### 4. Search Topics

Use the search box at the top to filter topics:
1. Type in the search box
2. Matching text is highlighted in yellow
3. Click the x button to clear search

### 5. Rename Topics

**Method 1: Double-click**
- Double-click on the topic title
- Edit the title in the input field
- Press Enter or click outside to save
- Press Escape to cancel

**Method 2: Right-click menu**
- Right-click on the topic
- Select "Rename"
- Edit and save as above

**Persistence**: Title updates are persisted to localStorage immediately. When using an API client, updates are also sent to the backend via `PATCH /sessions/:sessionId/title` (note: backend still uses "session" terminology).

### 6. Delete Topics

**Single Delete**
1. Click the x icon next to a topic (appears on hover)
2. OR right-click and select "Delete"
3. Confirm in the dialog
4. Topic is deleted and removed from localStorage

**Batch Delete**
1. Click the grid icon (bottom-right) to enter batch mode
2. Check the topics you want to delete
3. Click "Delete selected" in the batch bar
4. Confirm in the dialog
5. All selected topics are deleted

### 7. Close Panel (Extended Mode)

In Extended mode (dual layout), a close button (x) appears in the top-right of the topic panel. Click it to close the panel and return to single view.

## Data Persistence

Topics are automatically persisted to localStorage using the storage key `chatbot-topics`. The following operations trigger automatic persistence:

- **On mount**: Initial state is loaded from localStorage or created with default topic
- **On any change**: A deep watcher saves the entire topic list to localStorage
- **After each operation**: Individual operations also explicitly save for redundancy

**Storage Schema**:
```json
{
  "topicId": "string",
  "title": "string",
  "createdAt": "number (timestamp)",
  "updatedAt": "number (timestamp)",
  "messageCount": "number",
  "unreadCount": "number"
}
```

**Fallback**: If localStorage is disabled or quota exceeded, the app continues to function with in-memory state.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Escape` | Close dialog / Cancel editing |
| `Enter` | Save title edit / Confirm dialog |

## Touch Gestures

| Gesture | Action |
|---------|--------|
| Long press | Show context menu (edit/delete) |
| Tap | Select topic / Toggle checkbox (batch mode) |

## Events

The AIChatbot component emits colon-separated events for all topic operations. All payloads are objects.

| Event | Payload | Description |
|-------|---------|-------------|
| `topic:created` | `{ topic: Topic }` | New topic created |
| `topic:switched` | `{ topicId: string }` | Active topic switched |
| `topic:deleted` | `{ topicId: string }` | Topic deleted |
| `topic:title-updated` | `{ topicId: string, title: string }` | Topic title changed |
| `topic:cleared` | `{ topicId: string }` | All messages in topic cleared |

### Legacy Events (backward compatible)

The following legacy events are still emitted alongside the new events:

| Legacy Event | New Equivalent | Payload |
|--------------|----------------|---------|
| `topicCreate` | `topic:created` | `topicId: string` |
| `topicChange` | `topic:switched` | `topicId: string` |
| `topicDelete` | `topic:deleted` | `topicId: string` |
| `topicTitleUpdate` | `topic:title-updated` | `topicId: string, title: string` |

### Usage Example

```vue
<template>
  <AIChatbot
    :config="config"
    @topic:created="onTopicCreated"
    @topic:switched="onTopicSwitched"
    @topic:deleted="onTopicDeleted"
    @topic:title-updated="onTitleUpdated"
  />
</template>

<script setup lang="ts">
import type { Topic } from 'chatbot'

function onTopicCreated({ topic }: { topic: Topic }) {
  console.log('New topic:', topic.topicId)
}

function onTopicSwitched({ topicId }: { topicId: string }) {
  console.log('Switched to:', topicId)
}
</script>
```

## Callbacks for Session Operations

Topic/session operations can be controlled via the `ChatbotCallbacks` interface in `ChatbotConfig`. All callbacks are optional -- the component falls back to `apiBaseUrl` (apiClient) or local-only behavior when a callback is not provided.

### Three-Tier Fallback

| Priority | Source | Behavior |
|----------|--------|----------|
| 1 | `callbacks.*` | Host-provided callback function |
| 2 | `apiBaseUrl` | Built-in REST calls to `{apiBaseUrl}/...` |
| 3 | Local-only | In-memory state, no backend communication |

### Available Callbacks

```typescript
interface ChatbotCallbacks {
  // Topic operations
  onLoadTopics?: (signal?: AbortSignal) => Promise<Topic[]>
  onLoadMessages?: (topicId: string, signal?: AbortSignal) => Promise<Message[]>
  onCreateTopic?: (title?: string) => Promise<Topic>
  onSwitchTopic?: (topicId: string) => Promise<void>
  onDeleteTopic?: (topicId: string) => Promise<void>
  onUpdateTopicTitle?: (topicId: string, title: string) => Promise<void>
  onClearMessages?: (topicId: string) => Promise<void>

  // Message operations
  onSendMessage?: (params: SendMessageParams) => AsyncGenerator<StreamEvent>
  onDeleteMessage?: (messageId: string, topicId: string) => Promise<void>
  onEditMessage?: (params: SendMessageParams) => AsyncGenerator<StreamEvent>
  onRegenerateMessage?: (params: SendMessageParams) => AsyncGenerator<StreamEvent>

  // File operations
  onUploadImages?: (files: File[]) => Promise<UploadResult>
}
```

### Callback Example

```vue
<template>
  <AIChatbot :config="config" />
</template>

<script setup lang="ts">
import type { ChatbotConfig, Topic } from 'chatbot'

const config: ChatbotConfig = {
  mode: 'extended',
  callbacks: {
    async onLoadTopics(): Promise<Topic[]> {
      const res = await fetch('/api/topics')
      const data = await res.json()
      return data.topics
    },
    async onCreateTopic(title?: string): Promise<Topic> {
      const res = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title ?? '新话题' }),
      })
      return res.json()
    },
    async onDeleteTopic(topicId: string): Promise<void> {
      await fetch(`/api/topics/${topicId}`, { method: 'DELETE' })
    },
    async onUpdateTopicTitle(topicId: string, title: string): Promise<void> {
      await fetch(`/api/topics/${topicId}/title`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
    },
  },
}
</script>
```

## Developer Integration

### Props

```typescript
interface Props {
  topics: Topic[]                   // Required: List of topics
  currentTopicId: string           // Required: Active topic ID
  config?: ChatbotConfig           // Optional: Configuration
  layout?: 'dual' | 'single'       // Optional: Layout mode
  enableClose?: boolean            // Optional: Show close button
  // ... optional label props
}
```

### Component Emits (TopicListView)

```typescript
interface Emits {
  (e: 'create-topic'): void
  (e: 'select-topic', topicId: string): void
  (e: 'delete-topic', topicId: string): void
  (e: 'delete-topics', topicIds: string[]): void
  (e: 'update-topic-title', topicId: string, title: string): void
  (e: 'close'): void
}
```

### Usage Example (Standalone Component)

```vue
<template>
  <TopicListView
    :topics="topics"
    :current-topic-id="currentTopicId"
    :layout="'dual'"
    :enable-close="true"
    @create-topic="handleCreateTopic"
    @select-topic="handleSelectTopic"
    @delete-topic="handleDeleteTopic"
    @delete-topics="handleDeleteTopics"
    @update-topic-title="handleUpdateTitle"
    @close="handleClose"
  />
</template>
```

### Backend Integration

When using `useApiClient` (via `apiBaseUrl` config), topic operations are mapped to REST endpoints:

| Operation | Endpoint | Method |
|-----------|----------|--------|
| Load topics | `/sessions` | `GET` |
| Create topic | `/sessions` | `POST` |
| Delete topic | `/sessions/:id` | `DELETE` |
| Update title | `/sessions/:id/title` | `PATCH` |
| Load messages | `/sessions/:id/messages` | `GET` |
| Delete message | `/messages/:id` | `DELETE` |

**Note**: There is a terminology mismatch between frontend ("topics") and backend ("sessions"). The API client maps `topicId` to `sessionId` automatically.

### Configuration

Default topic title is centralized in `src/constants/index.ts`:

```typescript
export const TOPIC_DEFAULTS = {
  TITLE: '新话题',
  STORAGE_KEY: 'chatbot-topics',
} as const
```

## Accessibility

- All buttons have visible focus states
- Dialogs can be closed with Escape key
- Context menus can be triggered with right-click or long-press
- Form inputs have appropriate labels
- Color contrast meets WCAG AA standards
