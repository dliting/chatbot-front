# AI Chatbot 前端技术设计文档 (TDD)

## 文档信息
| 项目 | 内容 |
|------|------|
| 产品名称 | AI Chatbot Frontend |
| 版本 | v1.0 |
| 文档状态 | Draft |
| 最后更新 | 2026-02-10 |

---

## 1. 技术栈选型

### 1.1 核心技术
| 技术 | 版本 | 用途 |
|------|------|------|
| Vue | 3.x | 前端框架，使用 Composition API |
| TypeScript | 5.x | 类型系统 |
| Element Plus | 2.x | UI 组件库 |
| Vite | 5.x | 构建工具 |
| SCSS | - | CSS 预处理器 |

### 1.2 选型理由
- **Vue 3**: 组件化开发，响应式系统完善，生态成熟
- **TypeScript**: 类型安全，提升代码可维护性
- **Element Plus**: 组件丰富，API 规范，定制化能力强
- **Vite**: 开发体验好，构建速度快

---

## 2. 系统架构

### 2.1 整体架构图
```
┌─────────────────────────────────────────────────────────────┐
│                        Host Application                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Vue 3     │  │   iframe    │  │   Other Frameworks  │ │
│  │   Project   │  │   Embed     │  │   (React/Vanilla)   │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
├─────────┼────────────────┼─────────────────────┼───────────┤
│         │    ┌───────────▼───────────┐          │           │
│         │    │   AI Chatbot Widget   │          │           │
│         │    │                       │          │           │
│         │    │  ┌─────────────────┐  │          │           │
│         └────┼─▶│  Chatbot Root   │──┼──────────┘           │
│              │  │     Component   │  │                      │
│              │  └────────┬────────┘  │                      │
│              │           │           │                      │
│              │  ┌────────▼────────┐  │                      │
│              │  │  Core Modules   │  │                      │
│              │  │  - Interaction  │  │                      │
│              │  │  - UI State     │  │                      │
│              │  │  - Communication│  │                      │
│              │  └────────┬────────┘  │                      │
│              │           │           │                      │
│              │  ┌────────▼────────┐  │                      │
│              │  │  UI Components  │  │                      │
│              │  │  - SuspendedBall│  │                      │
│              │  │  - ChatPanel    │  │                      │
│              │  │  - MessageItem  │  │                      │
│              │  │  - SessionMgr   │  │                      │
│              │  └─────────────────┘  │                      │
│              └───────────────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 模块划分

#### 2.2.1 核心模块
| 模块 | 职责 |
|------|------|
| InteractionModule | 处理用户交互逻辑（输入、点击、拖拽） |
| UIStateModule | 管理 UI 状态（展开/收起、主题、尺寸） |
| CommunicationModule | 处理通信（SSE/WebSocket、postMessage） |
| MessageModule | 消息处理（发送、接收、存储、操作） |
| SessionModule | 会话管理（创建、切换、删除） |

---

## 3. 组件设计

### 3.1 组件树结构
```
AIChatbot (Root)
├── SuspendedBall
│   ├── BallIcon
│   └── Badge (可选)
├── ChatPanel
│   ├── PanelHeader
│   │   ├── Title
│   │   ├── ThemeToggle
│   │   └── CloseButton
│   ├── SessionSidebar (可选)
│   │   ├── SessionList
│   │   ├── SessionItem
│   │   └── NewSessionButton
│   ├── MessageContainer
│   │   ├── MessageList (虚拟滚动)
│   │   │   └── MessageItem
│   │   │       ├── TextContent
│   │   │       ├── ImageContent
│   │   │       ├── MessageActions
│   │   │       └── LoadingIndicator
│   │   └── ScrollToBottom
│   └── InputArea
│       ├── TextInput
│       ├── ImageUpload
│       ├── SendButton
│       └── VoiceInput (预留)
└── ConfigProvider
    └── ThemeConfig
```

### 3.2 核心组件设计

#### 3.2.1 AIChatbot (根组件)
**职责**:
- 整合所有子组件
- 管理全局状态
- 处理配置项和事件回调

**Props**:
```typescript
interface ChatbotProps {
  // 布局配置
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  panelWidth?: number
  defaultExpanded?: boolean

  // 功能配置
  enableImageUpload?: boolean
  enableSessionManager?: boolean
  enableVoiceInput?: boolean
  maxImageCount?: number

  // 样式配置
  theme?: 'light' | 'dark'
  primaryColor?: string
  customStyles?: Record<string, string>

  // API 配置
  apiBaseUrl?: string
  streamEnabled?: boolean

  // iframe 模式
  iframeMode?: boolean
  allowedOrigins?: string[]

  // 国际化
  locale?: 'zh-CN' | 'en-US'
}
```

**Emits**:
```typescript
interface ChatbotEmits {
  sendMessage: (data: SendMessageData) => void
  messageSuccess: (data: MessageSuccessData) => void
  messageError: (error: Error) => void
  panelToggle: (data: { isOpen: boolean }) => void
  sessionChange: (sessionId: string) => void
}
```

#### 3.2.2 SuspendedBall (悬浮球组件)
**职责**:
- 显示悬浮球图标
- 处理拖拽逻辑
- 触发面板展开/收起

**状态**:
```typescript
interface SuspendedBallState {
  position: { x: number; y: number }
  isDragging: boolean
  isVisible: boolean
}
```

**关键方法**:
```typescript
// 拖拽处理
handleDragStart(event: MouseEvent): void
handleDragMove(event: MouseEvent): void
handleDragEnd(): void

// 位置吸附
snapToEdge(): void
```

#### 3.2.3 ChatPanel (聊天面板组件)
**职责**:
- 管理面板显示/隐藏
- 处理响应式布局
- 管理面板尺寸

**Props**:
```typescript
interface ChatPanelProps {
  isOpen: boolean
  width: number
  mode: 'sidebar' | 'dialog' | 'fullscreen'
  position: 'left' | 'right'
  showSessionManager: boolean
}
```

#### 3.2.4 MessageItem (消息项组件)
**职责**:
- 渲染单条消息
- 处理消息操作
- 显示加载状态

**Props**:
```typescript
interface MessageItemProps {
  message: Message
  isStreaming?: boolean
  showActions?: boolean
}
```

**数据结构**:
```typescript
interface Message {
  id: string
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  type: 'text' | 'image' | 'mixed'
  content: string
  images?: string[]
  timestamp: number
  status: 'sending' | 'sent' | 'error' | 'loading'
  metadata?: Record<string, any>
}
```

---

## 4. 状态管理

### 4.1 状态结构
```typescript
interface ChatbotState {
  // UI 状态
  ui: {
    isPanelOpen: boolean
    panelMode: 'sidebar' | 'dialog' | 'fullscreen'
    theme: 'light' | 'dark'
    screenWidth: number
    isMobile: boolean
  }

  // 消息状态
  messages: {
    bySession: Record<string, Message[]>
    currentSessionId: string
    streamingMessageId: string | null
  }

  // 会话状态
  sessions: {
    list: Session[]
    currentId: string
  }

  // 交互状态
  interaction: {
    isSending: boolean
    uploadQueue: File[]
    selectedImages: string[]
  }
}
```

### 4.2 状态管理方案
使用 Vue 3 Composition API + `reactive`/`ref` 进行状态管理，无需引入额外状态管理库。

```typescript
// composables/useChatbotState.ts
export function useChatbotState(initialProps: ChatbotProps) {
  const ui = reactive<UIState>({
    isPanelOpen: initialProps.defaultExpanded ?? false,
    panelMode: 'dialog',
    theme: initialProps.theme ?? 'light',
    // ...
  })

  const messages = reactive<MessagesState>({
    bySession: {},
    currentSessionId: generateId(),
    streamingMessageId: null,
  })

  // ... actions

  return {
    state: { ui, messages, sessions, interaction },
    actions,
  }
}
```

---

## 5. 样式系统设计

### 5.1 CSS 架构
```
styles/
├── base/
│   ├── reset.scss          # 样式重置
│   ├── variables.scss      # CSS 变量
│   └── mixins.scss         # SCSS mixins
├── components/
│   ├── suspended-ball.scss
│   ├── chat-panel.scss
│   ├── message-item.scss
│   └── input-area.scss
└── themes/
    ├── light.scss          # 浅色主题
    └── dark.scss           # 深色主题
```

### 5.2 BEM 命名规范
```scss
// Block
.chatbot {}

// Element
.chatbot__panel {}
.chatbot__message {}
.chatbot__input {}

// Modifier
.chatbot__panel--sidebar {}
.chatbot__message--user {}
.chatbot__message--assistant {}
```

### 5.3 主题变量
```scss
// variables.scss
:root {
  // 主题色
  --chatbot-primary-color: #409eff;
  --chatbot-success-color: #67c23a;
  --chatbot-warning-color: #e6a23c;
  --chatbot-danger-color: #f56c6c;

  // 浅色主题
  --chatbot-bg-color: #ffffff;
  --chatbot-text-color: #303133;
  --chatbot-border-color: #dcdfe6;

  // 气泡颜色
  --chatbot-user-bubble-bg: #409eff;
  --chatbot-user-bubble-text: #ffffff;
  --chatbot-assistant-bubble-bg: #f5f7fa;
  --chatbot-assistant-bubble-text: #303133;

  // 尺寸
  --chatbot-panel-width: 400px;
  --chatbot-ball-size: 56px;
  --chatbot-border-radius: 12px;
}

[data-theme="dark"] {
  --chatbot-bg-color: #1a1a1a;
  --chatbot-text-color: #e5e5e5;
  --chatbot-border-color: #4c4d4f;

  --chatbot-assistant-bubble-bg: #2c2c2c;
  --chatbot-assistant-bubble-text: #e5e5e5;
}
```

### 5.4 样式隔离策略
1. **CSS Scoped**: 组件样式使用 Vue Scoped CSS
2. **BEM 命名**: 使用 `.chatbot-` 前缀避免冲突
3. **CSS Variables**: 使用 CSS 自定义属性实现主题切换
4. **Shadow DOM (可选)**: iframe 模式天然隔离

---

## 6. 通信设计

### 6.1 与后端通信

#### 6.1.1 流式输出 (SSE)
```typescript
// utils/stream.ts
export class StreamClient {
  private eventSource: EventSource | null = null

  connect(url: string, onMessage: (data: string) => void) {
    this.eventSource = new EventSource(url)

    this.eventSource.onmessage = (event) => {
      onMessage(event.data)
    }

    this.eventSource.onerror = (error) => {
      console.error('Stream error:', error)
      this.disconnect()
    }
  }

  disconnect() {
    this.eventSource?.close()
    this.eventSource = null
  }
}
```

#### 6.1.2 图片上传
```typescript
// utils/upload.ts
export async function uploadImages(
  files: File[],
  apiBaseUrl: string
): Promise<string[]> {
  const formData = new FormData()
  files.forEach(file => formData.append('images', file))

  const response = await fetch(`${apiBaseUrl}/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Upload failed')
  }

  const result = await response.json()
  return result.urls
}
```

### 6.2 iframe 跨域通信

```typescript
// utils/postMessage.ts
export class IframeMessenger {
  private allowedOrigins: Set<string>
  private listeners: Map<string, Function[]>

  constructor(allowedOrigins: string[]) {
    this.allowedOrigins = new Set(allowedOrigins)
    this.listeners = new Map()

    window.addEventListener('message', this.handleMessage.bind(this))
  }

  // 发送消息给父页面
  send(type: string, data: any) {
    window.parent.postMessage({
      source: 'ai-chatbot',
      type,
      data,
    }, '*')
  }

  // 监听父页面消息
  on(type: string, handler: Function) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, [])
    }
    this.listeners.get(type)!.push(handler)
  }

  private handleMessage(event: MessageEvent) {
    if (!this.allowedOrigins.has(event.origin)) {
      return
    }

    const { source, type, data } = event.data
    if (source !== 'host-page') return

    const handlers = this.listeners.get(type)
    if (handlers) {
      handlers.forEach(handler => handler(data))
    }
  }
}
```

---

## 7. 响应式设计

### 7.1 断点定义
```scss
// breakpoints.scss
$breakpoint-mobile: 768px;
$breakpoint-tablet: 1024px;
$breakpoint-desktop: 1440px;
```

### 7.2 响应式策略
```typescript
// composables/useResponsive.ts
export function useResponsive() {
  const screenWidth = ref(window.innerWidth)
  const isMobile = computed(() => screenWidth.value < 768)
  const isTablet = computed(() =>
    screenWidth.value >= 768 && screenWidth.value < 1024
  )
  const isDesktop = computed(() => screenWidth.value >= 1024)

  const panelMode = computed(() => {
    if (isMobile.value) return 'fullscreen'
    if (isTablet.value) return 'dialog'
    return 'sidebar'
  })

  const updateScreenWidth = () => {
    screenWidth.value = window.innerWidth
  }

  onMounted(() => {
    window.addEventListener('resize', updateScreenWidth)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateScreenWidth)
  })

  return { screenWidth, isMobile, isTablet, isDesktop, panelMode }
}
```

---

## 8. 性能优化

### 8.1 虚拟滚动
```vue
<!-- MessageList.vue -->
<template>
  <el-virtual-list
    :data="messages"
    :height="containerHeight"
    :item-size="80"
    :key="messageId"
  >
    <template #default="{ item }">
      <MessageItem :message="item" />
    </template>
  </el-virtual-list>
</template>
```

### 8.2 防抖/节流
```typescript
// utils/performance.ts
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0
  return (...args) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      fn(...args)
    }
  }
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
```

### 8.3 代码分割
```typescript
// 懒加载非核心组件
const SessionManager = defineAsyncComponent(
  () => import('./components/SessionManager.vue')
)
const VoiceInput = defineAsyncComponent(
  () => import('./components/VoiceInput.vue')
)
```

---

## 9. 项目结构

### 9.1 目录结构
```
src/
├── components/              # 核心组件
│   ├── AIChatbot.vue        # 根组件
│   ├── SuspendedBall.vue
│   ├── ChatPanel.vue
│   ├── MessageItem.vue
│   ├── SessionManager.vue
│   ├── InputArea.vue
│   └── shared/              # 共享子组件
│       ├── PanelHeader.vue
│       ├── MessageList.vue
│       └── ImagePreview.vue
├── composables/             # 组合式函数
│   ├── useChatbotState.ts
│   ├── useMessages.ts
│   ├── useSessions.ts
│   ├── useStream.ts
│   └── useResponsive.ts
├── utils/                   # 工具函数
│   ├── drag.ts
│   ├── upload.ts
│   ├── stream.ts
│   ├── postMessage.ts
│   ├── performance.ts
│   └── helpers.ts
├── types/                   # TypeScript 类型
│   ├── index.ts
│   ├── message.ts
│   ├── session.ts
│   └── config.ts
├── styles/                  # 样式文件
│   ├── base/
│   ├── components/
│   └── themes/
├── constants/               # 常量
│   └── index.ts
├── mock/                    # 模拟数据
│   └── api.ts
├── App.vue
└── main.ts
```

### 9.2 打包配置

#### 9.2.1 组件模式打包
```typescript
// vite.config.ts - library mode
export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'AIChatbot',
      fileName: 'ai-chatbot',
    },
    rollupOptions: {
      external: ['vue', 'element-plus'],
      output: {
        globals: {
          vue: 'Vue',
          'element-plus': 'ElementPlus',
        },
      },
    },
  },
})
```

#### 9.2.2 iframe 模式打包
```typescript
// vite.config.iframe.ts
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'src/iframe-entry.ts',
      },
      output: {
        entryFileNames: 'chatbot-iframe.js',
      },
    },
  },
})
```

---

## 10. API 接口设计

### 10.1 后端接口
```typescript
// API 定义
interface ChatAPI {
  // 发送消息 (流式)
  sendMessageStream: (
    sessionId: string,
    content: string,
    images?: string[]
  ) => ReadableStream<string>

  // 发送消息 (非流式)
  sendMessage: (
    sessionId: string,
    content: string,
    images?: string[]
  ) => Promise<Message>

  // 上传图片
  uploadImages: (files: File[]) => Promise<string[]>

  // 获取会话历史
  getSessionHistory: (sessionId: string) => Promise<Message[]>

  // 获取会话列表
  getSessions: () => Promise<Session[]>

  // 创建会话
  createSession: () => Promise<Session>

  // 删除会话
  deleteSession: (sessionId: string) => Promise<void>
}
```

### 10.2 模拟接口
```typescript
// mock/api.ts
export const mockAPI: ChatAPI = {
  async *sendMessageStream(sessionId, content, images) {
    const response = `这是对"${content}"的模拟回复。`
    for (const char of response) {
      await new Promise(resolve => setTimeout(resolve, 50))
      yield char
    }
  },

  async uploadImages(files) {
    return files.map(file => URL.createObjectURL(file))
  },

  // ... 其他方法
}
```

---

## 11. 开发规范

### 11.1 代码风格
- 使用 ESLint + Prettier
- 遵循 Vue 3 官方风格指南
- 使用 TypeScript 严格模式

### 11.2 命名规范
- 组件: PascalCase (如 `ChatPanel.vue`)
- 函数: camelCase (如 `sendMessage`)
- 常量: UPPER_SNAKE_CASE (如 `MAX_IMAGE_COUNT`)
- 类型/接口: PascalCase (如 `Message`, `ChatbotProps`)

### 11.3 注释规范
```typescript
/**
 * 发送消息到 AI 服务
 * @param sessionId - 会话 ID
 * @param content - 消息内容
 * @param images - 可选的图片 URL 数组
 * @returns Promise<Message> 返回完整的 AI 消息
 * @throws {Error} 当网络请求失败时抛出错误
 */
async function sendMessage(
  sessionId: string,
  content: string,
  images?: string[]
): Promise<Message> {
  // Implementation...
}
```

---

## 12. 部署方案

### 12.1 组件模式部署
```bash
# 构建组件库
npm run build:lib

# 生成产物
dist/
├── ai-chatbot.es.js       # ES Module
├── ai-chatbot.umd.js      # UMD
└── types/                 # TypeScript 声明文件
```

### 12.2 iframe 模式部署
```bash
# 构建独立页面
npm run build:iframe

# 生成产物
dist-iframe/
├── chatbot-iframe.js
└── assets/
```

---

## 13. 测试策略

### 13.1 单元测试
- 使用 Vitest
- 覆盖核心工具函数
- 测试覆盖率目标: 80%+

### 13.2 组件测试
- 使用 Vue Test Utils
- 测试组件交互逻辑
- 测试 props/emits

### 13.3 E2E 测试
- 使用 Playwright
- 测试关键用户流程
- 跨浏览器测试

---

## 14. 扩展点设计

### 14.1 插件系统 (预留)
```typescript
interface ChatbotPlugin {
  name: string
  install: (app: App, options: any) => void
}

// 使用示例
const customPlugin: ChatbotPlugin = {
  name: 'custom-theme',
  install(app, options) {
    // 自定义主题逻辑
  }
}
```

### 14.2 语音输入接口 (预留)
```typescript
// composables/useVoiceInput.ts
export function useVoiceInput() {
  const startRecording = () => {
    // TODO: 实现语音录制
  }

  const stopRecording = () => {
    // TODO: 停止录制并返回文本
  }

  return { startRecording, stopRecording }
}
```

---

## 附录

### A. 配置项完整列表
参见 PRD 中第 5 节配置项说明

### B. 事件完整列表
参见 PRD 中第 5 节事件说明

### C. 浏览器兼容性
参见 TDD 中第 7.2 节兼容性要求
