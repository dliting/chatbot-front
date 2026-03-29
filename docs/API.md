# AI Chatbot Frontend 组件 API 文档

## 文档信息
| 项目 | 内容 |
|------|------|
| 产品名称 | ai-chatbot-frontend |
| 版本 | v1.2 |
| 最后更新 | 2026-03-30 |

---

## 1. 快速开始

```bash
npm install chatbot
```

```vue
<template>
  <AIChatbot :config="chatConfig" />
</template>

<script setup>
import { AIChatbot } from 'chatbot'

const chatConfig = {
  apiBaseUrl: '/api',
  mode: 'extended',
  enableThinking: true,
}
</script>
```

---

## 2. AIChatbot 主组件

主入口组件，包含完整的聊天功能（会话管理、消息收发、流式响应等）。

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `config` | `ChatbotConfig` | `{}` | 聊天机器人配置对象 |

### ChatbotConfig 完整配置

```typescript
interface ChatbotConfig {
  // === 交互模式 ===
  mode?: 'floating' | 'extended' | 'sidebar'  // 交互模式（推荐）
  layout?: 'dual' | 'single'                // 布局（自动从 mode 推导）
  chatMode?: 'extended' | 'compact' | 'floating'  // 旧版模式（兼容）

  // === 布局配置 ===
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'  // 悬浮球位置
  panelWidth?: number          // 面板宽度（默认 400）
  panelHeight?: number         // 面板高度（默认 600）
  defaultExpanded?: boolean    // 默认展开（默认 false）
  panelMode?: 'sidebar' | 'dialog' | 'fullscreen' | 'auto'  // 面板模式

  // === 悬浮面板 ===
  draggable?: boolean     // 可拖拽（默认 true）
  resizable?: boolean     // 可调整大小（默认 true）
  minWidth?: number        // 最小宽度（默认 300）
  minHeight?: number       // 最小高度（默认 400）
  rememberPosition?: boolean  // 记住位置（默认 true）

  // === 功能开关 ===
  enableImageUpload?: boolean    // 图片上传（默认 true）
  enableSessionManager?: boolean // 会话管理（默认 true）
  enableVoiceInput?: boolean     // 语音输入（默认 false）
  enableCopyMessage?: boolean    // 复制消息（默认 true）
  enableDeleteMessage?: boolean  // 删除消息（默认 true）
  enableResend?: boolean         // 重新发送（默认 true）
  enableClearAll?: boolean       // 清空所有（默认 true）
  enableThinking?: boolean       // 思考模式（默认 false）

  // === 思考模式 ===
  thinkingDefaultEnabled?: boolean  // 默认启用思考（默认 true）
  thinkingAutoCollapse?: boolean   // 自动收起思考过程（默认 true）

  // === 上传限制 ===
  maxImageCount?: number     // 最大图片数（默认 8）
  maxImageSize?: number      // 最大图片大小 bytes（默认 10MB）
  allowedImageTypes?: string[]  // 允许的图片类型

  // === 样式 ===
  theme?: 'light' | 'dark' | 'system'  // 主题
  primaryColor?: string     // 主色调（默认 '#409eff'）
  customStyles?: Record<string, string>  // 自定义 CSS 变量

  // === API ===
  apiBaseUrl?: string        // 后端 API 地址（默认 '/api'）
  streamEnabled?: boolean   // 启用流式响应（默认 true）
  streamTimeout?: number    // 流式响应超时 ms（默认 120000 = 2分钟）

  // === 国际化 ===
  locale?: 'zh-CN' | 'en-US'
  labels?: Partial<ChatbotLabels>  // 自定义标签文案

  // === 消息 ===
  maxMessagesInMemory?: number  // 最大消息数（默认 1000）
  autoScroll?: boolean         // 自动滚动（默认 true）
}
```

### ChatbotLabels 标签文案

```typescript
interface ChatbotLabels {
  title: string           // 标题（默认 'AI Assistant'）
  placeholder: string     // 输入框占位符
  send: string            // 发送按钮
  newChat: string         // 新建对话
  history: string         // 历史记录
  copy: string            // 复制
  refresh: string         // 重新生成
  resend: string          // 重发
  delete: string          // 删除
  timeout: string         // 超时提示
  networkError: string    // 网络错误提示
  serverError: string     // 服务器错误提示
  generationStopped: string  // 已停止生成提示
  thinking?: {
    toggle: string        // 思考切换
    thinking: string      // 思考中
    deeplyThought: string // 深度思考
    showThinking: string  // 查看思考过程
    hideThinking: string  // 收起思考过程
  }
  // 欢迎页面标签
  welcomeTitle?: string
  welcomeSubtitle?: string
  quickAction1Title?: string
  quickAction1Desc?: string
  quickAction1Text?: string
  // ... quickAction2-4 类似
}
```

### Events 事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `panelToggle` | `{ isOpen: boolean, mode: string }` | 面板打开/关闭 |
| `sessionChange` | `sessionId: string` | 切换会话 |
| `sessionCreate` | `sessionId: string` | 创建新会话 |
| `sessionDelete` | `sessionId: string` | 删除会话 |
| `sessionTitleUpdate` | `sessionId: string, title: string` | 更新会话标题 |
| `editMessage` | `message: Message` | 编辑消息 |

### Methods 暴露方法

通过 `ref` 调用：

```typescript
const chatRef = ref()
chatRef.value.togglePanel()  // 切换面板
chatRef.value.setTheme('dark')  // 设置主题
```

### 使用示例

**扩展模式（双栏布局）：**
```vue
<AIChatbot :config="{
  mode: 'extended',
  apiBaseUrl: '/api',
  enableThinking: true,
  labels: { title: '智能助手' }
}" />
```

**悬浮模式（悬浮球 + 弹窗）：**
```vue
<AIChatbot :config="{
  mode: 'floating',
  position: 'bottom-right',
  primaryColor: '#6366f1'
}" />
```

**边栏模式：**
```vue
<AIChatbot :config="{
  mode: 'sidebar',
  apiBaseUrl: 'https://api.example.com'
}" />
```

---

## 3. 独立组件

所有组件均可独立导入使用：

```typescript
import {
  SuspendedBall,    // 悬浮球
  ChatPanel,       // 面板容器
  DraggableWindow, // 可拖拽窗口
  MessageList,     // 消息列表
  MessageItem,     // 消息项
  InputArea,       // 输入区域
  SessionManager,  // 会话管理
} from 'chatbot'
```

### SuspendedBall 悬浮球

```vue
<SuspendedBall
  :visible="true"
  :size="56"
  :badge="5"
  position="bottom-right"
  @click="handleOpen"
/>
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `visible` | `boolean` | `true` | 是否显示 |
| `size` | `number` | `56` | 尺寸(px) |
| `badge` | `string \| number \| null` | `null` | 角标数字 |
| `unreadCount` | `number` | - | 未读数（优先于 badge） |
| `position` | `Position` | `'bottom-right'` | 位置 |
| `iconColor` | `string` | - | 图标颜色 |
| `backgroundColor` | `string` | - | 背景颜色 |
| `draggable` | `boolean` | `true` | 是否可拖拽 |

| 事件 | 参数 | 说明 |
|------|------|------|
| `click` | - | 点击 |

### MessageItem 消息项

```vue
<MessageItem
  :message="msg"
  :theme="'dark'"
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

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `message` | `Message` | **必填** | 消息对象 |
| `theme` | `'light' \| 'dark'` | `'light'` | 主题 |
| `showAvatar` | `boolean` | `true` | 显示头像 |
| `showLabel` | `boolean` | `false` | 显示角色标签 |
| `showTimestamp` | `boolean` | `false` | 显示时间戳 |
| `showActions` | `boolean` | `true` | 显示操作按钮 |
| `enableCopy` | `boolean` | `true` | 启用复制 |
| `enableDelete` | `boolean` | `true` | 启用删除 |
| `enableResend` | `boolean` | `true` | 启用重发 |
| `isStreaming` | `boolean` | `false` | 是否正在流式输出 |
| `isLastMessage` | `boolean` | `false` | 是否为最后一条 AI 消息 |

---

## 4. Composables 组合式函数

```typescript
import {
  useChatbotState,  // 聊天状态管理
  useResponsive,    // 响应式断点
  useStream,        // 流式响应处理
  useMessages,      // 消息管理
  useSessions,      // 会话管理
} from 'chatbot'
```

### useStream

```typescript
const { isStreaming, streamedContent, streamFromGenerator, cancel, reset } = useStream({
  onChunk: (content) => { /* 逐块接收 */ },
  onComplete: (fullContent) => { /* 完成 */ },
  onError: (error) => { /* 错误 */ },
})

// 使用 AsyncGenerator 流式处理
await streamFromGenerator(myGenerator())
```

### useApiClient

```typescript
import { useApiClient } from 'chatbot'

const { streamChat, sendMessage, getSessions } = useApiClient({
  baseUrl: '/api',
  streamTimeout: 120000,  // 2分钟超时
})

// 流式聊天（返回 AsyncGenerator）
const stream = streamChat(sessionId, content, images, undefined, undefined, {
  signal: abortController.signal,
  thinking: { enabled: true },
})

for await (const chunk of stream) {
  // chunk.type: 'start' | 'token' | 'reasoning' | 'end'
  if (chunk.type === 'token') {
    console.log(chunk.content)
  }
}
```

### useChatbotState

```typescript
const { state, togglePanel, setTheme, switchSession, createSession, deleteSession, updateSessionTitle, cleanup } = useChatbotState(config)
```

---

## 5. 类型定义

```typescript
import type {
  Message,           // 消息
  Session,           // 会话
  MessageStatus,     // 'sending' | 'sent' | 'error' | 'loading' | 'stopped'
  MessageType,       // 'text' | 'image' | 'video' | 'audio' | 'mixed' | 'document'
  MessageRole,       // 'user' | 'assistant' | 'system'
  InteractionMode,   // 'floating' | 'extended' | 'sidebar'
  Layout,            // 'dual' | 'single'
  StreamEvent,       // 流式事件
  ChatbotConfig,     // 配置
} from 'chatbot'
```

### Message 消息结构

```typescript
interface Message {
  messageId: string
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  type: 'text' | 'image' | 'video' | 'audio' | 'mixed' | 'document'
  content: string
  images?: string[]
  videos?: string[]
  audios?: string[]
  documents?: DocumentAttachment[]
  timestamp: number
  status: 'sending' | 'sent' | 'error' | 'loading' | 'stopped'
  errorMessage?: string      // 错误/停止时的提示信息
  thinkingContent?: string   // 思考过程内容
  thinkingTime?: number      // 思考耗时（毫秒）
  metadata?: Record<string, unknown>
}
```

### StreamEvent 流式事件

```typescript
interface StreamEvent {
  type: 'start' | 'token' | 'reasoning' | 'end' | 'error'
  messageId?: string
  content?: string           // 文本内容
  fullContent?: string       // 完整内容（end 事件）
  reasoningContent?: string  // 思考内容（reasoning 事件）
  error?: string             // 错误信息（error 事件）
}
```

---

## 6. 错误处理

组件内置以下错误处理机制：

| 场景 | 用户提示 | 消息状态 |
|------|----------|----------|
| 网络不可达 | "网络连接失败，请检查网络" | `error` |
| 请求超时（默认 2min） | "响应超时，请检查网络或后端服务" | `error` |
| HTTP 错误 | "服务器错误 (HTTP {status})" | `error` |
| 用户点击停止（有部分内容） | "已停止生成" | `stopped` |
| 用户点击停止（无内容） | "已停止生成" | `error` |
| 其他错误 | 原始错误信息 | `error` |

错误消息通过 `message.errorMessage` 字段传递，可在 UI 中显示并支持重试。

---

## 7. 超时控制

流式请求默认超时时间为 **2 分钟**（120000ms），可通过配置修改：

```typescript
const config = {
  streamTimeout: 60000,  // 1分钟超时
  // 或更长
  streamTimeout: 30 * 60 * 1000,  // 30分钟（适用于复杂推理）
}
```

超时后自动中断请求，前端显示超时错误提示，用户可重试。

---

## 8. 后端接口对接

组件通过 `apiBaseUrl` 配置对接后端。后端需实现以下接口：

### 流式聊天

```
POST {apiBaseUrl}/chat/stream

请求: { sessionId, content, images, videos, audios, stream: true, options: { thinking: { enabled } } }
响应: SSE 流
  data: {"type":"start","messageId":"..."}
  data: {"type":"reasoning","reasoningContent":"思考内容"}  // 可选
  data: {"type":"token","content":"文本片段"}
  data: {"type":"end","fullContent":"完整内容","messageId":"..."}
```

### 其他接口

- `POST {apiBaseUrl}/sessions` — 创建会话
- `GET {apiBaseUrl}/sessions` — 获取会话列表
- `GET {apiBaseUrl}/sessions/{id}/messages` — 获取会话消息
- `DELETE {apiBaseUrl}/sessions/{id}` — 删除会话
- `POST {apiBaseUrl}/upload/images` — 上传图片

完整的后端实现可参考 `examples/chatapp/` 目录下的示例代码。
