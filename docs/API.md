# AI Chatbot Frontend API Documentation

| Field | Value |
|-------|-------|
| Product | ai-chatbot-frontend |
| Version | v1.3 |
| Last Updated | 2026-04-02 |

---

## 1. Overview

ai-chatbot-frontend is a Vue 3 component library for embedding AI chat into web applications. It supports three interaction modes (floating, extended, sidebar), streaming responses, topic management, file attachments, and thinking/chain-of-thought.

The component uses a **three-tier fallback** strategy for backend communication:
1. **Callbacks** (`ChatbotCallbacks`) -- host application provides direct control
2. **apiBaseUrl** (`useApiClient`) -- built-in REST client for standard backends
3. **Local-only** -- in-memory state with no backend

---

## 2. Installation / Quick Start

```bash
npm install chatbot
```

```vue
<template>
  <AIChatbot :config="chatConfig" />
</template>

<script setup lang="ts">
import { AIChatbot } from 'chatbot'
import type { ChatbotConfig } from 'chatbot'

const chatConfig: ChatbotConfig = {
  apiBaseUrl: '/api',
  mode: 'extended',
  enableThinking: true,
}
</script>
```

---

## 3. Configuration (ChatbotConfig)

```typescript
interface ChatbotConfig {
  // === Interaction Mode (dual-dimension architecture) ===
  mode?: 'floating' | 'extended' | 'sidebar'  // Interaction mode (default: 'floating')
  layout?: 'dual' | 'single'                   // Layout (auto-derived from mode)
  chatMode?: 'extended' | 'compact' | 'floating'  // Legacy (backward compat)

  // === Layout ===
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  panelWidth?: number              // Default 400
  panelHeight?: number             // Default 600
  panelMinWidth?: number           // Default 320
  panelMaxWidth?: number           // Default 600
  defaultExpanded?: boolean        // Default false
  panelMode?: 'sidebar' | 'dialog' | 'fullscreen' | 'auto'

  // === Floating Panel ===
  draggable?: boolean              // Default true
  resizable?: boolean              // Default true
  minWidth?: number                // Default 300
  minHeight?: number               // Default 400
  rememberPosition?: boolean       // Default true

  // === Feature Toggles ===
  enableImageUpload?: boolean      // Default true
  enableTopicManager?: boolean     // Default true
  enableVoiceInput?: boolean       // Default false
  enableCopyMessage?: boolean      // Default true
  enableDeleteMessage?: boolean    // Default true
  enableResend?: boolean           // Default true
  enableClearAll?: boolean         // Default true
  enableThinking?: boolean         // Default false

  // === Thinking / Chain-of-Thought ===
  thinkingDefaultEnabled?: boolean // Default true
  thinkingAutoCollapse?: boolean  // Default true

  // === Upload Limits ===
  maxImageCount?: number           // Default 8
  maxImageSize?: number            // Default 10MB (bytes)
  allowedImageTypes?: string[]     // Default: jpeg, png, gif, webp

  // === Style ===
  theme?: 'light' | 'dark' | 'system'  // Default 'light'
  primaryColor?: string            // Default '#409eff'
  customStyles?: Record<string, string>

  // === API ===
  apiBaseUrl?: string              // Default '/api'
  streamEnabled?: boolean          // Default true
  streamTimeout?: number           // Default 120000 (2min)

  // === Callbacks (host-controlled operations) ===
  callbacks?: ChatbotCallbacks

  // === Iframe ===
  iframeMode?: boolean
  allowedOrigins?: string[]

  // === Internationalization ===
  locale?: 'zh-CN' | 'en-US'      // Default 'en-US'
  labels?: Partial<ChatbotLabels>

  // === Messages ===
  maxMessagesInMemory?: number     // Default 1000
  autoScroll?: boolean             // Default true
}
```

---

## 4. Callbacks API

The `ChatbotCallbacks` interface lets the host application control all operations directly. All callbacks are optional -- the component falls back to `apiBaseUrl` (apiClient) or local-only behavior when a callback is not provided.

```typescript
interface ChatbotCallbacks {
  // ===== Message Operations =====

  /** Send a message and stream AI response.
   *  Must return an AsyncGenerator<StreamEvent>. */
  onSendMessage?: (params: SendMessageParams) => AsyncGenerator<StreamEvent>

  /** Delete a specific message. */
  onDeleteMessage?: (messageId: string, topicId: string) => Promise<void>

  /** Edit a message and get new AI response.
   *  params.messageId is the original message being modified. */
  onEditMessage?: (params: SendMessageParams) => AsyncGenerator<StreamEvent>

  /** Regenerate AI response for a user message.
   *  params contains the original user message content and attachments. */
  onRegenerateMessage?: (params: SendMessageParams) => AsyncGenerator<StreamEvent>

  // ===== Topic Operations =====

  /** Load all topics. Called on mount and after create/delete. */
  onLoadTopics?: (signal?: AbortSignal) => Promise<Topic[]>

  /** Load messages for a topic. Called on topic switch and mount. */
  onLoadMessages?: (topicId: string, signal?: AbortSignal) => Promise<Message[]>

  /** Create a new topic. Returns the full Topic object. */
  onCreateTopic?: (title?: string) => Promise<Topic>

  /** Switch to a topic. Component calls onLoadMessages after this resolves. */
  onSwitchTopic?: (topicId: string) => Promise<void>

  /** Delete a topic and all its messages. */
  onDeleteTopic?: (topicId: string) => Promise<void>

  /** Update topic title. */
  onUpdateTopicTitle?: (topicId: string, title: string) => Promise<void>

  /** Clear all messages in a topic. */
  onClearMessages?: (topicId: string) => Promise<void>

  // ===== File Operations =====

  /** Upload image files. Returns URLs of uploaded files. */
  onUploadImages?: (files: File[]) => Promise<UploadResult>
}
```

### SendMessageParams

Unified parameters for all send-related callbacks (`onSendMessage`, `onEditMessage`, `onRegenerateMessage`):

```typescript
interface SendMessageParams {
  topicId: string
  content: string
  attachments?: Attachment[]
  thinking?: { enabled: boolean }
  signal?: AbortSignal
  messageId?: string  // For edit/regenerate: the original message ID
}
```

### Example: Using Callbacks

```vue
<template>
  <AIChatbot :config="config" />
</template>

<script setup lang="ts">
import { AIChatbot } from 'chatbot'
import type { ChatbotConfig, SendMessageParams, StreamEvent } from 'chatbot'

async function* mySendMessage(params: SendMessageParams): AsyncGenerator<StreamEvent> {
  yield { type: 'start', messageId: crypto.randomUUID() }

  // Call your own backend or LLM service here
  const response = await fetch('/my-api/chat', {
    method: 'POST',
    body: JSON.stringify(params),
    signal: params.signal,
  })
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const text = decoder.decode(value)
    yield { type: 'token', content: text }
  }

  yield { type: 'end', fullContent: 'accumulated content' }
}

const config: ChatbotConfig = {
  mode: 'extended',
  callbacks: {
    onSendMessage: mySendMessage,
    async onLoadTopics() {
      const res = await fetch('/my-api/topics')
      return res.json()
    },
    async onCreateTopic(title) {
      const res = await fetch('/my-api/topics', {
        method: 'POST',
        body: JSON.stringify({ title }),
      })
      return res.json()
    },
  },
}
</script>
```

### Three-Tier Fallback

For each operation, the component tries in order:

| Priority | Source | Behavior |
|----------|--------|----------|
| 1 | `callbacks.*` | Host-provided callback function |
| 2 | `apiBaseUrl` (apiClient) | Built-in REST calls to `{apiBaseUrl}/...` |
| 3 | Local-only | In-memory state, no backend communication |

Example: when a user deletes a message:
1. If `callbacks.onDeleteMessage` exists, call it.
2. Else if `apiBaseUrl` is set, call `DELETE {apiBaseUrl}/messages/:id`.
3. Else, remove the message from local state only.

---

## 5. Events API

Events use a colon-separated naming convention (`domain:action`) and carry object payloads. All events are emitted from the `AIChatbot` component.

### Message Events

| Event | Payload | Description |
|-------|---------|-------------|
| `message:sent` | `{ message: Message }` | User message sent |
| `message:error` | `{ message: Message, error: Error }` | Message error occurred |
| `message:deleted` | `{ messageId: string, topicId: string }` | Message deleted (synced with backend) |
| `message:edited` | `{ messageId: string, topicId: string }` | Message edited |
| `message:copied` | `{ message: Message }` | Message content copied |
| `message:resend` | `{ message: Message }` | Message resent |
| `message:regenerated` | `{ messageId: string, topicId: string }` | AI response regenerated |
| `message:stream-start` | `{ messageId: string }` | Streaming response started |
| `message:stream-end` | `{ messageId: string, fullContent: string }` | Streaming response completed |

### Topic Events

| Event | Payload | Description |
|-------|---------|-------------|
| `topic:created` | `{ topic: Topic }` | New topic created |
| `topic:switched` | `{ topicId: string }` | Active topic switched |
| `topic:deleted` | `{ topicId: string }` | Topic deleted |
| `topic:title-updated` | `{ topicId: string, title: string }` | Topic title changed |
| `topic:cleared` | `{ topicId: string }` | All messages in topic cleared |

### UI Events

| Event | Payload | Description |
|-------|---------|-------------|
| `ui:panel-toggle` | `{ isOpen: boolean, mode: string }` | Panel opened/closed |
| `ui:theme-changed` | `{ theme: string }` | Theme changed |
| `ui:stop-generating` | -- | User stopped generation |

### Lifecycle Event

| Event | Payload | Description |
|-------|---------|-------------|
| `chatbot:ready` | -- | Component fully mounted and ready |

### Legacy Events (backward compatible)

The following legacy events are still emitted alongside the new events:

| Legacy Event | New Equivalent |
|--------------|----------------|
| `panelToggle` | `ui:panel-toggle` |
| `topicChange` | `topic:switched` |
| `topicCreate` | `topic:created` |
| `topicDelete` | `topic:deleted` |
| `topicTitleUpdate` | `topic:title-updated` |
| `editMessage` | `message:edited` |

---

## 6. Attachment Model

The unified `Attachment` interface replaces the previous separate `images[]`, `videos[]`, `audios[]`, and `documents[]` fields:

```typescript
interface Attachment {
  name: string
  url: string
  type: 'image' | 'video' | 'audio' | 'document'
  size?: number       // File size in bytes
  mimeType?: string   // MIME type, e.g. 'image/png'
}
```

Attachments are used in:
- `Message.attachments` -- array of attachments on a message
- `SendMessageParams.attachments` -- attachments sent with a message
- `SendMessageData.attachments` -- internal send data structure

Example:
```typescript
const message: Message = {
  messageId: 'msg-1',
  topicId: 'topic-1',
  role: 'user',
  type: 'mixed',
  content: 'Check this image',
  attachments: [
    { name: 'screenshot.png', url: 'https://example.com/img.png', type: 'image', size: 245000, mimeType: 'image/png' },
    { name: 'report.pdf', url: 'https://example.com/doc.pdf', type: 'document', mimeType: 'application/pdf' },
  ],
  timestamp: Date.now(),
  status: 'sent',
}
```

---

## 7. Types Reference

### Message

```typescript
interface Message {
  messageId: string
  topicId: string
  role: 'user' | 'assistant' | 'system'
  type: 'text' | 'image' | 'video' | 'audio' | 'mixed' | 'document'
  content: string
  attachments?: Attachment[]     // Unified attachment array
  timestamp: number
  status: 'sending' | 'sent' | 'error' | 'loading' | 'stopped'
  errorMessage?: string          // User-facing error when status is 'error' or 'stopped'
  thinkingContent?: string       // Thinking/reasoning process text
  thinkingTime?: number          // Thinking elapsed time in ms
  metadata?: Record<string, unknown>
}
```

### Topic

```typescript
interface Topic {
  topicId: string
  title: string
  createdAt: number
  updatedAt: number
  messageCount: number
  unreadCount: number
}
```

### StreamEvent

```typescript
interface StreamEvent {
  type: 'start' | 'token' | 'reasoning' | 'end' | 'error'
  messageId?: string
  content?: string
  fullContent?: string
  reasoningContent?: string   // Thinking content fragment
  thinkingTime?: number       // Cumulative thinking time in ms
  error?: string
}
```

### UploadResult

```typescript
interface UploadResult {
  urls: string[]
  errors?: Array<{ file: string; error: string }>
}
```

### ChatbotLabels

```typescript
interface ChatbotLabels {
  title: string
  placeholder: string
  send: string
  newTopic: string
  history: string
  clearAll: string
  delete: string
  copy: string
  refresh: string
  resend: string
  uploading: string
  uploadFailed: string
  retry: string
  timeout: string
  networkError: string
  serverError: string
  generationStopped: string
  close: string
  expand: string
  collapse: string
  welcomeTitle?: string
  welcomeSubtitle?: string
  quickAction1Title?: string
  quickAction1Desc?: string
  quickAction1Text?: string
  // quickAction2-4 follow the same pattern
  copied?: string
  thinking?: {
    toggle?: string
    thinking?: string
    deeplyThought?: string
    showThinking?: string
    hideThinking?: string
  }
}
```

### Utility Types

```typescript
type MessageRole = 'user' | 'assistant' | 'system'
type MessageType = 'text' | 'image' | 'video' | 'audio' | 'mixed' | 'document'
type MessageStatus = 'sending' | 'sent' | 'error' | 'loading' | 'stopped'
type AttachmentType = 'image' | 'video' | 'audio' | 'document'
type InteractionMode = 'floating' | 'extended' | 'sidebar'
type Layout = 'dual' | 'single'
type Position = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
type PanelMode = 'sidebar' | 'dialog' | 'fullscreen' | 'auto'
type Theme = 'light' | 'dark' | 'system'
type Locale = 'zh-CN' | 'en-US'
```

---

## 8. Independent Components

All components can be imported independently:

```typescript
import {
  AIChatbot,        // Main entry component
  SuspendedBall,    // Floating trigger ball
  ChatPanel,        // Chat window container
  DraggableWindow,  // Reusable draggable/resizable window
  MessageList,      // Message list container
  MessageItem,      // Single message display
  InputArea,        // User input area
  TopicManager,     // Topic/session management panel
} from 'chatbot'
```

### SuspendedBall

```vue
<SuspendedBall
  :visible="true"
  :size="56"
  :badge="5"
  position="bottom-right"
  @click="handleOpen"
/>
```

### MessageItem

```vue
<MessageItem
  :message="msg"
  :is-streaming="isStreaming"
  :show-avatar="true"
  :show-actions="true"
  :enable-copy="true"
  :enable-delete="true"
  :enable-resend="true"
  @copy="handleCopy"
  @delete="handleDelete"
  @resend="handleResend"
  @edit="handleEdit"
/>
```

---

## 9. Composables

```typescript
import {
  useChatbotState,  // Chat state management
  useResponsive,    // Responsive breakpoints
  useStream,        // Stream response handling
  useMessages,      // Message management
  useTopics,        // Topic management
} from 'chatbot'
```

### useStream

```typescript
const { isStreaming, streamedContent, streamFromGenerator, cancel, reset } = useStream({
  onChunk: (content) => { /* receive chunk */ },
  onComplete: (fullContent) => { /* completed */ },
  onError: (error) => { /* error */ },
})

await streamFromGenerator(myGenerator())
```

### useChatbotState

```typescript
const { state, togglePanel, setTheme, switchSession, createSession, deleteSession, updateSessionTitle, cleanup } = useChatbotState(config)
```

---

## 10. Backend API Endpoints

When using `apiBaseUrl` (without callbacks), the component expects the following REST endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/chat/stream` | Stream chat (SSE) |
| `POST` | `/chat/message` | Non-streaming chat |
| `POST` | `/upload/images` | Upload images |
| `GET` | `/sessions` | List sessions/topics |
| `POST` | `/sessions` | Create session/topic |
| `GET` | `/sessions/:id/messages` | Get session messages |
| `DELETE` | `/sessions/:id` | Delete session/topic |
| `PATCH` | `/sessions/:id/title` | Update session title |
| `DELETE` | `/messages/:id` | Delete a specific message |

### Stream Chat (SSE)

```
POST {apiBaseUrl}/chat/stream
Content-Type: application/json

Request:
{
  "sessionId": "string",
  "content": "string",
  "images": ["string"],
  "videos": ["string"],
  "audios": ["string"],
  "stream": true,
  "options": { "thinking": { "enabled": true } }
}

Response: SSE stream
  data: {"type":"start","messageId":"..."}
  data: {"type":"reasoning","reasoningContent":"思考内容"}  // optional
  data: {"type":"token","content":"文本片段"}
  data: {"type":"end","fullContent":"完整内容","messageId":"..."}
```

### Delete Message

```
DELETE {apiBaseUrl}/messages/:id

Response:
{ "code": 0, "message": "success" }
```

**Note**: The backend uses "session" terminology while the frontend uses "topic". The apiClient maps `topicId` to `sessionId` automatically.

### Full Backend Reference

A complete backend implementation is available at `examples/chatapp/` (both mock and real modes).

---

## 11. Error Handling

| Scenario | User Prompt | Message Status |
|----------|-------------|----------------|
| Network unreachable | "Network connection failed" | `error` |
| Request timeout (default 2min) | "Response timeout" | `error` |
| HTTP error | "Server error (HTTP {status})" | `error` |
| User clicked stop (partial content) | "Generation stopped" | `stopped` |
| User clicked stop (no content) | "Generation stopped" | `error` |

---

## 12. Timeout Control

Default stream timeout is **2 minutes** (120000ms). Configurable via `streamTimeout`:

```typescript
const config: ChatbotConfig = {
  streamTimeout: 60000,          // 1 minute
  // or longer for complex reasoning:
  streamTimeout: 30 * 60 * 1000, // 30 minutes
}
```

---

## 13. Usage Examples

### Extended Mode (dual layout)

```vue
<AIChatbot :config="{
  mode: 'extended',
  apiBaseUrl: '/api',
  enableThinking: true,
  labels: { title: '智能助手' }
}" />
```

### Floating Mode (suspension ball + popup)

```vue
<AIChatbot :config="{
  mode: 'floating',
  position: 'bottom-right',
  primaryColor: '#6366f1'
}" />
```

### Sidebar Mode

```vue
<AIChatbot :config="{
  mode: 'sidebar',
  apiBaseUrl: 'https://api.example.com'
}" />
```

### Full Callback Control

```vue
<AIChatbot :config="{
  mode: 'extended',
  callbacks: {
    onSendMessage: myLlmHandler,
    onDeleteMessage: async (id) => await db.deleteMessage(id),
    onLoadTopics: async () => await db.getTopics(),
    onLoadMessages: async (topicId) => await db.getMessages(topicId),
    onCreateTopic: async (title) => await db.createTopic(title),
    onSwitchTopic: async (topicId) => { /* optional side effects */ },
    onDeleteTopic: async (topicId) => await db.deleteTopic(topicId),
    onUpdateTopicTitle: async (topicId, title) => await db.updateTitle(topicId, title),
    onClearMessages: async (topicId) => await db.clearMessages(topicId),
    onUploadImages: async (files) => await uploadService.upload(files),
  }
}" />
```
