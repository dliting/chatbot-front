# AI Chatbot 设计文档

## 文档信息
| 项目 | 内容 |
|------|------|
| 产品名称 | AI Chatbot Frontend |
| 版本 | v1.1 |
| 最后更新 | 2026-03-06 |

---

## 1. 架构概览

### 1.1 组件架构

```
AIChat (根组件)
├── ChatExtended (扩展模式)
│   ├── SessionList (会话列表) ← 扩展模式特有
│   │   ├── SessionItem (会话项)
│   │   └── NewSessionButton (新建按钮)
│   └── ChatArea (聊天区域) ← 共用组件
│       ├── ChatHeader (头部)
│       ├── MessageList (消息列表)
│       ├── WelcomeScreen (欢迎界面)
│       └── InputArea (输入区域)
│
├── ChatCompact (紧凑模式)
│   ├── CompactSidebar (侧边栏) ← 紧凑模式特有
│   │   └── ChatArea (聊天区域) ← 共用组件
│   └── FloatingBall (悬浮球，收起时) ← 紧凑模式特有
│
└── ChatFloating (悬浮模式)
    ├── FloatingBall (悬浮球) ← 悬浮模式特有
    └── FloatingPanel (悬浮面板) ← 悬浮模式特有
        └── DraggableWindow (可拖拽窗口容器)
            └── ChatArea (聊天区域) ← 共用组件
```

### 1.2 模式切换架构

```
AIChat
├── 检测 chatMode 配置
├── 根据 chatMode 渲染对应组件
│   ├── 'extended' → ChatExtended
│   ├── 'compact' → ChatCompact
│   └── 'floating' → ChatFloating
└── 共用状态管理 (ChatStore)
```

### 1.3 组件复用关系

| 组件 | 类型 | 使用模式 | 说明 |
|------|------|----------|------|
| ChatArea | 共用 | 所有模式 | 核心聊天区域组件 |
| ChatHeader | 共用 | 所有模式 | 聊天头部组件 |
| MessageList | 共用 | 所有模式 | 消息列表组件 |
| WelcomeScreen | 共用 | 所有模式 | 欢迎界面组件 |
| InputArea | 共用 | 所有模式 | 输入区域组件 |
| SessionList | 扩展模式特有 | Extended | 会话列表组件 |
| CompactSidebar | 紧凑模式特有 | Compact | 侧边栏容器组件 |
| FloatingBall | 紧凑/悬浮模式特有 | Compact, Floating | 悬浮球组件 |
| FloatingPanel | 悬浮模式特有 | Floating | 悬浮面板组件 |
| DraggableWindow | 悬浮模式特有 | Floating | 可拖拽窗口组件 |
| LandingPage | Demo导航页 | Landing | 首页模式导航卡片组件 |
| CompactDemo | Demo演示页 | /compact | 紧凑模式演示页面 |
| ExtendedDemo | Demo演示页 | /extended | 扩展模式演示页面 |
| FloatingDemo | Demo演示页 | /floating | 悬浮模式演示页面 |
| IframeDemo | Demo演示页 | /iframe | iframe通信演示页面 |

### 1.4 路由架构

```
Router (vue-router 4)
├── / (LandingPage) - 首页导航
│   ├── Extended Mode Card → /extended
│   ├── Compact Mode Card → /compact
│   ├── Floating Mode Card → /floating
│   └── Iframe Mode Card → /iframe
│
├── /compact (CompactDemo) - 紧凑模式演示
│   └── ChatArea (共用组件)
│
├── /extended (ExtendedDemo) - 扩展模式演示
│   └── ChatArea (共用组件)
│
├── /floating (FloatingDemo) - 悬浮模式演示
│   └── ChatFloating (悬浮模式组件)
│
└── /iframe (IframeDemo) - Iframe嵌入演示
    └── postMessage 通信
```

**路由配置文件**: `examples/chatapp/frontend/src/router/index.ts`

**路由特性**:
- HTML5 History 模式
- 懒加载组件 (使用 `() => import()`)
- 使用 `router.push()` 进行 SPA 导航
- 支持 `VITE_API_BASE_URL` 环境变量配置 API 地址

---

## 2. 共用组件设计

### 2.1 ChatArea (聊天区域)

**用途**: 所有模式共用的核心聊天组件

**Props**:
```typescript
interface ChatAreaProps {
  sessionId?: string
  theme?: Theme
  showHeader?: boolean
  showWelcome?: boolean
  enableImageUpload?: boolean
  enableVoiceInput?: boolean
}
```

**功能**:
- 消息列表展示和滚动
- 消息发送和接收
- 流式响应处理
- 欢迎界面显示

**内部组件**:
- `ChatHeader`: 头部（标题、主题切换、设置按钮）
- `MessageList`: 消息列表（虚拟滚动）
- `WelcomeScreen`: 欢迎界面（快捷操作卡片）
- `InputArea`: 输入区域（文本输入、文件上传、发送按钮）

### 2.2 MessageList (消息列表)

**用途**: 渲染消息列表，支持虚拟滚动

**Props**:
```typescript
interface MessageListProps {
  messages: Message[]
  loading?: boolean
  autoScroll?: boolean
  enableCopy?: boolean
  enableDelete?: boolean
}
```

**特性**:
- 虚拟滚动（支持 1000+ 消息）
- 自动滚动到底部
- 用户滚动时暂停自动滚动
- 支持 Markdown 渲染
- 图片消息网格布局

**MessageItem 结构**:
```typescript
interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  images?: string[]
  timestamp: number
  status?: 'sending' | 'sent' | 'failed'
}
```

### 2.3 InputArea (输入区域)

**用途**: 处理用户输入和文件上传

**Props**:
```typescript
interface InputAreaProps {
  disabled?: boolean
  placeholder?: string
  enableImageUpload?: boolean
  enableVoiceInput?: boolean
  maxImageCount?: number
  onSend: (content: string, images?: File[]) => void
}
```

**功能**:
- 多行文本输入
- 快捷键支持（Enter 发送，Shift+Enter 换行）
- 图片上传和预览
- 语音输入按钮
- 发送状态控制

### 2.4 ChatHeader (聊天头部)

**用途**: 显示标题和操作按钮

**Props**:
```typescript
interface ChatHeaderProps {
  title?: string
  theme?: Theme
  showThemeToggle?: boolean
  showSettings?: boolean
  showClose?: boolean
  onClose?: () => void
}
```

**功能**:
- 显示标题
- 主题切换按钮
- 设置按钮（打开菜单）
- 关闭按钮（紧凑/悬浮模式）

### 2.5 WelcomeScreen (欢迎界面)

**用途**: 显示欢迎信息和快捷操作

**Props**:
```typescript
interface WelcomeScreenProps {
  title?: string
  subtitle?: string
  quickActions?: QuickAction[]
}
```

**功能**:
- 显示欢迎标题和副标题
- 显示快捷操作卡片
- 点击快捷操作填充输入框

**QuickAction 结构**:
```typescript
interface QuickAction {
  id: string
  label: string
  icon: string
  prompt: string
}
```

---

## 3. 扩展模式特有设计

### 3.1 ChatExtended 组件

**结构**:
```vue
<template>
  <div class="chat-extended">
    <SessionList v-if="enableSessionManager" />
    <ChatArea />
  </div>
</template>
```

**布局**:
```
┌─────────────────────────────────────────────┐
│              ┌──────────┐  ┌──────────────┐ │
│              │会话列表  │  │  聊天区域     │ │
│              │          │  │              │ │
│  200-300px   │  新对话  │  │  消息列表    │ │
│   (可配置)    │  会话1   │  │              │ │
│              │  会话2   │  │  欢迎界面    │ │
│              │  ...     │  │              │ │
│              │          │  │  [输入框]    │ │
│              └──────────┘  │  [发送]      │ │
│                            └──────────────┘ │
└─────────────────────────────────────────────┘
```

### 3.2 SessionList (会话列表)

**Props**:
```typescript
interface SessionListProps {
  sessions: Session[]
  currentSessionId?: string
  width?: number
  collapsible?: boolean
  collapsed?: boolean
  onSelect: (sessionId: string) => void
  onCreate: () => void
  onDelete: (sessionId: string) => void
}
```

**功能**:
- 显示会话列表
- 新建会话
- 切换会话
- 删除会话
- 折叠/展开

**SessionItem 结构**:
```typescript
interface Session {
  id: string
  title: string
  preview?: string
  timestamp: number
  messageCount: number
}
```

### 3.3 扩展模式配置

```typescript
interface ExtendedModeConfig {
  // 会话列表配置
  sessionListWidth?: number        // 会话列表宽度 (200-300px)
  sessionListCollapsed?: boolean   // 默认折叠状态
  sessionListCollapsible?: boolean  // 是否可折叠

  // 会话管理
  enableSessionManager?: boolean    // 启用会话管理
  maxSessions?: number              // 最大会话数
  autoTitle?: boolean               // 自动提取标题
}
```

---

## 4. 紧凑模式特有设计

### 4.1 ChatCompact 组件

**结构**:
```vue
<template>
  <div class="chat-compact">
    <CompactSidebar v-if="expanded" @close="expanded = false" />
    <FloatingBall v-else @click="expanded = true" />
  </div>
</template>
```

**布局 (桌面)**:
```
┌─────────────────────────────────────────────┐
│ ┌────────┐  ┌──────────────────────────────┐ │
│ │        │  │                              │ │
│ │ 聊天   │  │      主内容区域              │ │
│ │ 侧边栏│  │                              │ │
│ │        │  │                              │ │
│ │ 400px  │  │                              │ │
│ │(可配置) │  │                              │ │
│ └────────┘  └──────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**布局 (移动端 < 768px)**:
```
┌─────────────────────────────────────────────┐
│                                             │
│              全屏聊天界面                    │
│                                             │
│  [← 返回]              [主题] [设置]        │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  │         消息列表                     │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ [输入框...]                    [发送]│   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### 4.2 CompactSidebar (紧凑侧边栏)

**Props**:
```typescript
interface CompactSidebarProps {
  width?: number
  position?: 'left' | 'right'
  showClose?: boolean
  onClose?: () => void
}
```

**功能**:
- 固定宽度侧边栏
- 折叠后显示悬浮球
- 移动端自动全屏
- 关闭按钮

### 4.3 紧凑模式配置

```typescript
interface CompactModeConfig {
  // 侧边栏配置
  sidebarWidth?: number           // 侧边栏宽度 (380-600px)
  sidebarPosition?: 'left' | 'right'  // 侧边栏位置
  defaultExpanded?: boolean       // 默认展开状态

  // 响应式配置
  mobileBreakpoint?: number       // 移动端断点 (默认 768px)
  mobileFullscreen?: boolean      // 移动端全屏

  // 悬浮球配置 (收起时)
  showFloatingBall?: boolean      // 收起时显示悬浮球
  floatingBallPosition?: 'bottom-left' | 'bottom-right'  // 悬浮球位置
}
```

---

## 5. 悬浮模式特有设计

### 5.1 ChatFloating 组件

**结构**:
```vue
<template>
  <div class="chat-floating">
    <FloatingBall v-if="!panelOpen" @click="openPanel" />
    <FloatingPanel v-else @close="closePanel" />
  </div>
</template>
```

**布局**:
```
页面右下角 (收起状态):
    ┌───┐
    │💬│  ← 悬浮球 (可拖拽)
    │ 1 │  ← 未读徽章
    └───┘

点击后展开:
┌─────────────────────┐
│  智能助手    [×]     │ ← 标题栏 (可拖拽)
├─────────────────────┤
│                     │
│    [消息列表]       │ ← 内容区域 (可调整大小)
│                     │
│                     │
├─────────────────────┤
│ [输入框...]    [发送]│
└─────────────────────┘
```

### 5.2 FloatingBall (悬浮球)

**Props**:
```typescript
interface FloatingBallProps {
  icon?: string
  badge?: number
  position?: Position
  offset?: { x: number; y: number }
  draggable?: boolean
}
```

**功能**:
- 固定在角落位置
- 可拖拽移动
- 显示未读徽章
- 点击展开面板
- 拖拽后吸附边缘

### 5.3 FloatingPanel (悬浮面板)

**Props**:
```typescript
interface FloatingPanelProps {
  width?: number
  height?: number
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  draggable?: boolean
  resizable?: boolean
  rememberPosition?: boolean
}
```

**功能**:
- 可拖拽移动（标题栏）
- 可8方向调整大小
- 位置和大小记忆
- 关闭后显示悬浮球

### 5.4 DraggableWindow (可拖拽窗口)

**Props**:
```typescript
interface DraggableWindowProps {
  title?: string
  initialWidth?: number
  initialHeight?: number
  minWidth?: number
  minHeight?: number
  draggable?: boolean
  resizable?: boolean
  showClose?: boolean
}
```

**功能**:
- 拖动标题栏移动
- 8方向调整大小手柄
- 最小尺寸限制
- 边界限制
- 位置和大小记忆（localStorage）

### 5.5 悬浮模式配置

```typescript
interface FloatingModeConfig {
  // 悬浮球配置
  ballPosition?: Position          // 悬浮球位置
  ballOffset?: { x: number; y: number }  // 偏移量
  ballIcon?: string                // 悬浮球图标
  ballSize?: number                // 悬浮球大小
  ballDraggable?: boolean          // 悬浮球可拖拽

  // 悬浮面板配置
  panelWidth?: number              // 面板宽度
  panelHeight?: number             // 面板高度
  panelMinWidth?: number           // 最小宽度
  panelMinHeight?: number          // 最小高度
  panelDraggable?: boolean         // 面板可拖拽
  panelResizable?: boolean         // 面板可调整大小
  rememberPosition?: boolean       // 记忆位置和大小

  // 动画配置
  openAnimation?: boolean          // 打开动画
  closeAnimation?: boolean         // 关闭动画
}
```

---

## 6. 状态管理设计

### 6.1 ChatStore (共用状态)

```typescript
interface ChatStore {
  // 会话状态
  sessions: Session[]
  currentSessionId: string | null

  // 消息状态
  messages: Record<string, Message[]>  // sessionId -> messages
  loadingStates: Record<string, boolean>

  // UI 状态
  theme: Theme
  sidebarExpanded: boolean    // 紧凑模式侧边栏状态
  panelOpen: boolean          // 悬浮模式面板状态

  // 操作
  createSession(): string
  deleteSession(sessionId: string): void
  switchSession(sessionId: string): void
  sendMessage(content: string, images?: File[]): Promise<void>
  deleteMessage(messageId: string): void
  clearMessages(sessionId: string): void
  setTheme(theme: Theme): void
}
```

### 6.2 模式特定状态

**扩展模式**:
```typescript
interface ExtendedStore {
  sessionListWidth: number
  sessionListCollapsed: boolean
}
```

**紧凑模式**:
```typescript
interface CompactStore {
  sidebarExpanded: boolean
  isMobile: boolean
}
```

**悬浮模式**:
```typescript
interface FloatingStore {
  panelOpen: boolean
  ballPosition: { x: number; y: number }
  panelPosition: { x: number; y: number }
  panelSize: { width: number; height: number }
}
```

---

## 7. 样式设计

### 7.1 主题系统

```typescript
interface ThemeConfig {
  // 浅色主题
  light: {
    background: '#ffffff'
    surface: '#f5f5f5'
    primary: '#409eff'
    text: '#303133'
    textSecondary: '#909399'
    border: '#dcdfe6'
    userBubble: '#409eff'
    aiBubble: '#f5f5f5'
  }

  // 深色主题
  dark: {
    background: '#1a1a1a'
    surface: '#2a2a2a'
    primary: '#409eff'
    text: '#e5eaf3'
    textSecondary: '#a3a6ad'
    border: '#4c4d4f'
    userBubble: '#409eff'
    aiBubble: '#2a2a2a'
  }
}
```

### 7.2 BEM 命名规范

```css
/* 块 (Block) */
.chat-extended {}
.chat-compact {}
.chat-floating {}

/* 元素 (Element) */
.chat-extended__session-list {}
.chat-extended__chat-area {}
.chat-extended__header {}

/* 修饰符 (Modifier) */
.chat-extended--collapsed {}
.chat-compact--mobile {}
.chat-floating--panel-open {}

/* 消息气泡 */
.message {}
.message--user {}
.message--assistant {}
.message__bubble {}
.message__avatar {}
.message__timestamp {}
```

### 7.3 响应式断点

```scss
$breakpoint-mobile: 768px;
$breakpoint-tablet: 1024px;
$breakpoint-desktop: 1280px;

// 移动端
@media (max-width: $breakpoint-mobile - 1) {
  // 全屏显示
}

// 平板
@media (min-width: $breakpoint-mobile) and (max-width: $breakpoint-tablet - 1) {
  // 适配布局
}

// 桌面
@media (min-width: $breakpoint-tablet) {
  // 完整布局
}
```

---

## 8. 事件系统

### 8.1 组件事件

```typescript
// AIChat 组件事件
interface ChatEvents {
  // 会话事件
  'session-created': (sessionId: string) => void
  'session-deleted': (sessionId: string) => void
  'session-changed': (sessionId: string) => void

  // 消息事件
  'message-sent': (message: Message) => void
  'message-received': (message: Message) => void
  'message-deleted': (messageId: string) => void

  // UI 事件
  'theme-changed': (theme: Theme) => void
  'panel-opened': () => void
  'panel-closed': () => void
  'sidebar-toggled': (expanded: boolean) => void

  // 错误事件
  'error': (error: ChatError) => void
}
```

### 8.2 iframe 通信事件

```typescript
// iframe 模式 postMessage 事件
interface IframeMessages {
  // 主站 → iframe
  'chat:init': { config: Partial<ChatbotConfig> }
  'chat:send-message': { content: string; images?: string[] }
  'chat:set-theme': { theme: Theme }

  // iframe → 主站
  'chat:ready': {}
  'chat:message-sent': { message: Message }
  'chat:message-received': { message: Message }
  'chat:error': { error: ChatError }
}
```

---

## 9. 性能优化

### 9.1 虚拟滚动

```typescript
// MessageList 使用虚拟滚动
import { useVirtualList } from '@vueuse/core'

const { list: virtualMessages, containerProps, wrapperProps } = useVirtualList(
  messages,
  { itemHeight: 80, overscan: 10 }
)
```

### 9.2 图片懒加载

```vue
<template>
  <img v-lazy="imageUrl" alt="图片" />
</template>
```

### 9.3 消息去抖动

```typescript
import { useDebounceFn } from '@vueuse/core'

const debouncedScroll = useDebounceFn(() => {
  // 处理滚动事件
}, 100)
```

### 9.4 流式响应优化

```typescript
// 使用 requestAnimationFrame 优化渲染
function* streamResponse(content: string) {
  for (const char of content) {
    yield char
    await new Promise(resolve => requestAnimationFrame(resolve))
  }
}
```

---

## 10. 安全考虑

### 10.1 XSS 防护

```typescript
// 转义用户输入
import DOMPurify from 'dompurify'

function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'code', 'pre'],
    ALLOWED_ATTR: ['href']
  })
}
```

### 10.2 CSP 策略

```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               img-src 'self' data: https:;
               script-src 'self' 'unsafe-inline';
               style-src 'self' 'unsafe-inline';">
```

### 10.3 跨域控制

```typescript
// iframe 模式白名单验证
function validateOrigin(origin: string, allowedOrigins: string[]): boolean {
  return allowedOrigins.some(allowed => {
    if (allowed === '*') return true
    if (allowed.startsWith('*.')) {
      return origin.endsWith(allowed.slice(1))
    }
    return origin === allowed
  })
}
```

---

## 11. 目录结构

```
src/
├── components/
│   ├── AIChat/
│   │   ├── index.vue                 # 根组件
│   │   ├── ChatExtended.vue          # 扩展模式组件
│   │   ├── ChatCompact.vue           # 紧凑模式组件
│   │   └── ChatFloating.vue          # 悬浮模式组件
│   ├── chat/                        # 共用聊天组件
│   │   ├── ChatArea.vue
│   │   ├── ChatHeader.vue
│   │   ├── MessageList.vue
│   │   ├── MessageItem.vue
│   │   ├── WelcomeScreen.vue
│   │   ├── InputArea.vue
│   │   └── ImagePreview.vue
│   ├── session/                     # 会话管理组件
│   │   ├── SessionList.vue           # 扩展模式特有
│   │   ├── SessionItem.vue
│   │   └── NewSessionButton.vue
│   ├── floating/                    # 悬浮组件
│   │   ├── FloatingBall.vue          # 悬浮模式特有
│   │   ├── FloatingPanel.vue         # 悬浮模式特有
│   │   └── DraggableWindow.vue       # 悬浮模式特有
│   └── sidebar/                     # 侧边栏组件
│       └── CompactSidebar.vue        # 紧凑模式特有
├── composables/
│   ├── useChat.ts                   # 聊天逻辑
│   ├── useMessage.ts                # 消息操作
│   ├── useSession.ts                # 会话管理
│   ├── useTheme.ts                  # 主题切换
│   └── useDraggable.ts              # 拖拽逻辑
├── stores/
│   └── chat.ts                      # 聊天状态管理
├── types/
│   ├── index.ts
│   ├── config.ts
│   └── events.ts
└── utils/
    ├── markdown.ts                  # Markdown 渲染
    ├── sanitizer.ts                 # XSS 防护
    └── storage.ts                   # 本地存储
```
