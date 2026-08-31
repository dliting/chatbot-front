# AI Chatbot Frontend API Documentation

| Field | Value |
|-------|-------|
| Product | ai-chatbot-frontend |
| Version | v2.0 |
| Last Updated | 2026-06-10 |

---

## 1. Overview

ai-chatbot-frontend is a Vue 3 component library for embedding AI chat into web applications. It supports three interaction modes (floating, extended, sidebar), streaming responses, topic management, file attachments, and thinking/chain-of-thought.

The component uses a **three-tier fallback** strategy for backend communication:
1. **Callbacks** (`ChatbotCallbacks`) -- host application provides direct control
2. **apiBaseUrl** (`useApiClient`) -- built-in REST client for standard backends
3. **Local-only** -- in-memory state with no backend

### Architecture: Inject-Primary Pattern

Internal component communication uses Vue's `provide`/`inject` mechanism with Symbol keys. Component `emit` events are reserved only for external-facing UI notifications. See `docs/design/component-communication-architecture.md` for details.

- **Internal actions** (data operations) → `provide`/`inject` via Symbol keys
- **External events** (UI notifications) → component `emit` events

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

  // === Layout ===
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  panelWidth?: number              // Default 400
  panelHeight?: number             // Default 600
  panelMinWidth?: number           // Default 320
  panelMaxWidth?: number           // Default 600
  sidebarWidth?: number            // Initial sidebar width in px (default 280)
  sidebarMinWidth?: number         // Minimum sidebar width in px (default 200)
  sidebarMaxWidth?: number         // Maximum sidebar width in px (default 500)
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
  theme?: 'light' | 'dark' | 'system'  // Default 'light'. Note: the theme toggle button in the header is hidden by default; host apps should control theme programmatically via config or the exposed setTheme method.
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
  quickActions?: QuickAction[]           // Quick action list (default: locale-aware defaults)
  quickActionIconBase?: string           // Base path for resolving custom icon paths
  promptVariables?: PromptVariableConfig // Prompt variable substitution configuration

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
  extraInfo?: string                     // Extra info from QuickAction, available in callbacks
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

### UI Events

| Event | Payload | Description |
|-------|---------|-------------|
| `ui:panel-toggle` | `{ isOpen: boolean, mode: string }` | Panel opened/closed |
| `ui:theme-changed` | `{ theme: string }` | Theme changed |
| `ui:stop-generating` | -- | User stopped generation |

### Lifecycle Events

| Event | Payload | Description |
|-------|---------|-------------|
| `chatbot:ready` | -- | Component fully mounted and ready |
| `chatbot:error` | `{ error: ChatbotError }` | Categorized error from any sub-system |

### ChatbotError

The `chatbot:error` event provides structured error information:

```typescript
class ChatbotError extends Error {
  readonly category: 'message' | 'topic' | 'stream' | 'network' | 'config'
  readonly userMessage: string
  readonly cause?: Error
}
```

Use `error.category` to filter errors by domain, and `error.userMessage` for display-friendly text.

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

### ChatState

Reactive state interface provided via `chatStateKey` injection. Child components inject this to access state without prop drilling.

```typescript
interface ChatState {
  messages: ComputedRef<Message[]>         // Messages for the current topic
  topics: ComputedRef<Topic[]>             // All topics (reactive)
  currentTopicId: ComputedRef<string>      // Active topic ID (reactive)
  isStreaming: ComputedRef<boolean>        // Whether a response is streaming
  streamingMessageId: ComputedRef<string | null>  // ID of the currently streaming message
  enableThinking: boolean                  // Thinking feature enabled in config
  thinkingEnabled: { value: boolean }      // Current thinking toggle state
  isThinking: { value: boolean }           // Whether currently in thinking phase
  enableVoiceInput: boolean                // Voice input enabled in config
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

### QuickAction

```typescript
interface QuickAction {
  id: string                // Unique identifier
  title: string             // Display title
  description?: string      // Optional description
  prompt: string            // Prompt text, supports {{variable}} placeholders
  icon?: string             // Built-in name, path, or URL
  extraInfo?: string        // Generic extra info, not used by component internally
}
```

### PromptVariableResolver

```typescript
type PromptVariableResolver = (variable: string) => string | Promise<string>
```

### PromptVariableConfig

```typescript
interface PromptVariableConfig {
  resolvers?: Record<string, PromptVariableResolver>
}
```

Built-in variables: `{{date}}`, `{{time}}`, `{{datetime}}`, `{{weekday}}`

Unresolved variables are left as-is in the prompt text.

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
type ErrorCategory = 'message' | 'topic' | 'stream' | 'network' | 'config'
```

---

## 8. Injection Keys (provide/inject)

The component uses Vue's `provide`/`inject` with Symbol keys for internal communication. Advanced consumers can use these keys to access state and actions from outside the component tree.

```typescript
import { chatStateKey, chatActionsKey, topicActionsKey, uiActionsKey, promptVarResolverKey } from 'chatbot'
```

| Key | Type | Provided By | Description |
|-----|------|-------------|-------------|
| `chatStateKey` | `InjectionKey<ChatState>` | `AIChatbot` | Reactive chat state (messages, topics, streaming, thinking) |
| `chatActionsKey` | `InjectionKey<ChatActionHandlers>` | `AIChatbot` | Chat operations (send, delete, edit, refresh, stop) |
| `topicActionsKey` | `InjectionKey<TopicActionHandlers>` | `AIChatbot` | Topic operations (create, switch, remove, rename) |
| `uiActionsKey` | `InjectionKey<UIActionHandlers>` | `AIChatbot` (enhanced by panels) | UI operations (theme, thinking toggle, view navigation) |
| `promptVarResolverKey` | `InjectionKey<PromptVarResolver>` | `AIChatbot` | Prompt variable resolver for {{variable}} substitution in quick actions |

### ChatActionHandlers

```typescript
interface ChatActionHandlers {
  sendMessage: (data: { content: string; attachments?: Attachment[]; extraInfo?: string }) => void
  refreshMessage: (message: Message) => void
  deleteMessage: (message: Message) => void
  editMessage: (message: Message) => void
  stopGenerating: () => void
  isGenerating: { value: boolean }
  isThinkingActive: { value: boolean }
}
```

### TopicActionHandlers

```typescript
interface TopicActionHandlers {
  createNewTopic: () => void
  switchToTopic: (topicId: string) => void
  removeTopic: (topicId: string) => void
  removeTopics: (topicIds: string[]) => void
  renameTopic: (topicId: string, title: string) => void
}
```

### UIActionHandlers

```typescript
interface UIActionHandlers {
  toggleTheme: () => void
  setThinkingEnabled: (enabled: boolean) => void
  thinkingEnabled: { value: boolean }
  showChatView: () => void      // Navigate to chat view (single-layout modes)
  showTopicsView: () => void    // Navigate to topics view (single-layout modes)
}
```

### Enhanced Provide Chain

Panel components (FloatingChatPanel, EmbeddedChatPanel) inject the parent `uiActionsKey` and provide an **enhanced version** that includes their local `showChatView`/`showTopicsView` methods from `useChatView`. This ensures that when child components call `uiActions.showChatView()`, they trigger the panel's local view navigation.

```typescript
// In panel components
const parentUiActions = inject(uiActionsKey, null)
const { viewState, showChatView, showTopicsView } = useChatView(layout)

provide(uiActionsKey, {
  ...parentUiActions,
  showChatView,
  showTopicsView,
} satisfies UIActionHandlers)
```

### Example: Injecting in a Custom Child Component

```vue
<script setup lang="ts">
import { inject } from 'vue'
import { chatStateKey, chatActionsKey } from 'chatbot'

const state = inject(chatStateKey)
const actions = inject(chatActionsKey)

const handleSend = () => {
  actions?.sendMessage({ content: 'Hello' })
}
</script>

<template>
  <div v-if="state?.isStreaming.value">Generating...</div>
  <button @click="handleSend">Send</button>
</template>
```

---

## 9. Independent Components

All components can be imported independently:

```typescript
import {
  AIChatbot,        // Main entry component
  SuspendedBall,    // Floating trigger ball
  ChatPanel,        // Chat window container
  DraggableWindow,  // Reusable draggable/resizable window
  MessageList,      // Message list container
  MessageItem,      // Single message display
} from 'chatbot'
```

### Component Hierarchy

```
AIChatbot (root — provides state + actions)
├── FloatingChatPanel     (floating mode — uses inject for state)
│   └── ChatContent       (injects chatStateKey, chatActionsKey, uiActionsKey)
├── EmbeddedChatPanel     (extended/sidebar mode — uses inject for state)
│   └── ChatContent       (injects chatStateKey, chatActionsKey, uiActionsKey)
└── ChatPanel             (window management wrapper)
    └── EmbeddedChatPanel
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

MessageItem follows the inject-primary pattern. Actions (delete, copy, resend, edit) use `chatActionsKey` inject instead of emit events.

```vue
<MessageItem
  :message="msg"
  :is-streaming="isStreaming"
  :show-avatar="true"
  :show-actions="true"
  :enable-copy="true"
  :enable-delete="true"
  :enable-resend="true"
/>
```

---

## 10. Composables

```typescript
import {
  useChatbotState,  // Chat state management (factory + coordinator)
  useResponsive,    // Responsive breakpoints
  useStream,        // Stream response handling (standalone utility)
} from 'chatbot'
```

### useChatbotState

Creates the core chatbot state: initializes sub-composables (`useUIState`, `useMessagesState`, `useTopicsState`, `useInteractionState`), wires them together via `useChatbotCoordinator`, and exposes state + actions.

```typescript
const {
  // Reactive state (sub-composable state)
  state,              // { ui, messages, topics, interaction }

  // Computed
  currentMessages,    // ComputedRef<Message[]>
  currentTopic,       // ComputedRef<Topic | undefined>
  isStreaming,        // ComputedRef<boolean>

  // UI Actions
  togglePanel,
  setTheme,
  setCurrentView,
  toggleView,
  updateScreenSize,

  // Message Actions
  addMessage,
  updateMessage,
  removeMessage,
  insertMessage,
  setMessages,
  ensureMessages,
  clearCurrentMessages,
  setStreamingMessage,

  // Topic Actions
  switchTopic,
  createTopic,
  deleteTopic,
  updateTopicTitle,
  setTopicList,
  setCurrentTopicId,
  addTopicToFront,

  // Interaction Actions
  setSelectedImages,
  addSelectedImage,
  removeSelectedImage,
  clearSelectedImages,

  // Lifecycle
  init,               // Call in onMounted (defers side effects)
  cleanup,            // Call in onUnmounted
} = useChatbotState(config)
```

### useChatbotCoordinator

**Internal composable** — not part of the public API. Handles cross-cutting sync between `useTopicsState` and `useMessagesState` using `watch`-based reactivity so that `messages.currentTopicId` automatically syncs when `topics.currentId` changes.

Used internally by `useChatbotState`. Not exported; direct usage requires importing from the source module.

### useStream

Standalone utility for consuming `AsyncGenerator<StreamEvent>` streams. Not used internally by the chat flow (which uses `useChatActions.processStream`); provided for consumers building custom streaming UIs.

```typescript
const { isStreaming, streamedContent, streamFromGenerator, cancel, reset } = useStream({
  onChunk: (content) => { /* receive chunk */ },
  onComplete: (fullContent) => { /* completed */ },
  onError: (error) => { /* error */ },
})

await streamFromGenerator(myGenerator())
```

### usePromptVariables

Creates a prompt variable resolver with built-in and custom resolvers.

```typescript
import { usePromptVariables } from 'chatbot'

const { resolve } = usePromptVariables({
  customResolvers: {
    username: () => 'Alice',
    company: async () => await getCompanyName(),
  },
})

const resolved = await resolve('Hello {{username}}, today is {{date}}')
// "Hello Alice, today is 2026-06-11"
```

---

## 11. Storage Adapter

The storage layer uses an adapter pattern to decouple from `localStorage`. Schema versioning ensures safe migration when stored data format changes.

### StorageAdapter Interface

```typescript
interface StorageAdapter {
  get<T>(key: string): T | null
  set(key: string, value: unknown): void
  remove(key: string): void
  clear(): void
}
```

### LocalStorageAdapter

Default implementation using `localStorage`. Gracefully handles environments where localStorage is unavailable (SSR, restricted contexts).

```typescript
import { LocalStorageAdapter } from 'chatbot'

const adapter = new LocalStorageAdapter()
adapter.set('my-key', { foo: 'bar' })
const data = adapter.get<{ foo: string }>('my-key')
```

### Versioned Storage

```typescript
import { loadVersioned, saveVersioned, TOPICS_SCHEMA_VERSION, LocalStorageAdapter } from 'chatbot'

const adapter = new LocalStorageAdapter()

// Save with schema version
saveVersioned(adapter, 'my-data', myData, TOPICS_SCHEMA_VERSION)

// Load with migration support
const data = loadVersioned<MyType>(adapter, 'my-data', {
  0: (raw) => migrateFromLegacy(raw),   // version 0 = unversioned legacy data
  1: (data) => data as MyType,          // current version
})
```

### Custom Storage Adapter

Pass a custom adapter to `useTopicsState` for alternative storage backends (IndexedDB, sessionStorage, etc.):

```typescript
const topicsState = useTopicsState({
  defaultTitle: 'New Topic',
  storageAdapter: new IndexedDBAdapter(),
})
```

---

## 12. Backend API Endpoints

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

## 13. Error Handling

### Error Categories

All errors are wrapped in `ChatbotError` with a category for structured handling:

| Category | Description | Example |
|----------|-------------|---------|
| `message` | Message operation failed | Send/delete/edit error |
| `topic` | Topic operation failed | Load/create/switch error |
| `stream` | Streaming response error | Connection lost, parse error |
| `network` | Network-level failure | Timeout, DNS failure |
| `config` | Configuration error | Invalid API URL |

### User-Facing Errors

| Scenario | User Prompt | Message Status |
|----------|-------------|----------------|
| Network unreachable | "Network connection failed" | `error` |
| Request timeout (default 2min) | "Response timeout" | `error` |
| HTTP error | "Server error (HTTP {status})" | `error` |
| User clicked stop (partial content) | "Generation stopped" | `stopped` |
| User clicked stop (no content) | "Generation stopped" | `error` |

### Error Observation

Host applications can observe all errors via the `chatbot:error` event:

```vue
<AIChatbot :config="config" @chatbot:error="handleError" />
```

```typescript
function handleError({ error }: { error: ChatbotError }) {
  if (error.category === 'network') {
    // Show network-specific recovery UI
  }
  logToService(error)
}
```

---

## 14. Timeout Control

Default stream timeout is **2 minutes** (120000ms). Configurable via `streamTimeout`:

```typescript
const config: ChatbotConfig = {
  streamTimeout: 60000,          // 1 minute
  // or longer for complex reasoning:
  streamTimeout: 30 * 60 * 1000, // 30 minutes
}
```

---

## 15. Usage Examples

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

### Error Monitoring

```vue
<AIChatbot
  :config="chatConfig"
  @chatbot:error="({ error }) => trackError(error.category, error.userMessage)"
  @chatbot:ready="() => console.log('Chatbot loaded')"
/>
```

### Custom Quick Actions

```vue
<AIChatbot :config="{
  mode: 'extended',
  quickActions: [
    { id: 'weekly', title: '写周报', description: '生成本周周报', prompt: '帮我写一份本周工作周报，今天是{{date}}', icon: 'write' },
    { id: 'review', title: '代码审查', description: '审查代码质量', prompt: '请帮我审查以下代码', icon: 'code', extraInfo: 'code-review' },
  ],
  promptVariables: {
    resolvers: {
      username: () => currentUser.name,
    },
  },
}" />
```

---

## 16. Full Export Reference

```typescript
// Components
export { default as AIChatbot } from './components/AIChatbot.vue'
export { default as SuspendedBall } from './components/SuspendedBall.vue'
export { default as ChatPanel } from './components/ChatPanel.vue'
export { default as DraggableWindow } from './components/DraggableWindow.vue'
export { default as MessageList } from './components/MessageList.vue'
export { default as MessageItem } from './components/MessageItem.vue'

// Types (re-exported from src/types)
export type * from './types'
export type { ChatbotConfig, ChatbotCallbacks, SendMessageParams } from './types/config'
export type { QuickAction, PromptVariableResolver, PromptVariableConfig } from './types/config'

// Injection Keys
export { chatStateKey, chatActionsKey, topicActionsKey, uiActionsKey, promptVarResolverKey } from './symbols'

// Composables
export { useChatbotState } from './composables/useChatbotState'
export { useResponsive } from './composables/useResponsive'
export { useStream } from './composables/useStream'
export { usePromptVariables } from './composables/usePromptVariables'

// Utilities
export { generateId, throttle, debounce, copyToClipboard } from './utils/helpers'
export { makeDraggable, getInitialPosition } from './utils/drag'
export { StreamClient, fetchStream } from './utils/stream'
export { IframeMessenger, HostMessenger } from './utils/postMessage'
export { createMockUploadEndpoint } from './utils/upload'
export { deriveMessageType, getAttachmentsByType } from './utils/message'
export { LocalStorageAdapter, TOPICS_SCHEMA_VERSION, loadVersioned, saveVersioned } from './utils/storage'
export type { StorageAdapter, VersionedData } from './utils/storage'
export { ChatbotError, toChatbotError } from './utils/errors'
export type { ErrorCategory } from './utils/errors'
export { resolveQuickActionIcon, isBuiltinIconName } from './utils/icons'
export type { ResolvedIcon, BuiltinIconName } from './utils/icons'

// Constants
export { getDefaultQuickActions, defaultQuickActions } from './constants/quickActions'

// Vue Plugin
export const ChatbotPlugin = { install: (app, options?) => app.component('AIChatbot', AIChatbot) }
```
