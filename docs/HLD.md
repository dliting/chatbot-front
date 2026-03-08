# AI Chatbot Frontend - High-Level Design

This document provides the high-level architectural overview of the AI Chatbot Frontend component.

## Document Information

| Project | Content |
|---------|---------|
| Product Name | AI Chatbot Frontend (AIChat) |
| Version | v1.0 |
| Last Updated | 2026-03-08 |

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Component Structure](#component-structure)
3. [Documentation Index](#documentation-index)

## Architecture Overview

### Project Overview

**This project is a general-purpose AI chat frontend component AIChat, based on Vue framework, supporting offline deployment and operation.**

A Vue 3 + TypeScript-based embeddable AI chatbot frontend component that supports three interaction modes: extended mode, sidebar mode, and floating mode, with responsive layout and multimodal interaction capabilities.

### Dual-Dimension Architecture Design

This component adopts a dual-dimension architecture design that decouples "interaction mode" from "layout form":

**Layout Form**:
- **Dual Layout**: Session list and chat window displayed on the same page
- **Single Layout**: Session list and chat window displayed on different pages

**Interaction Mode**:
- **Extended Mode**: As a full-screen page, using tiled layout internally
- **Sidebar Mode**: As a sidebar, using compact layout internally
- **Floating Mode**: Floating ball + floating window, using compact layout internally

### Component Architecture

```
AIChat (Root Component)
├── ChatExtended (Extended Mode)
│   ├── SessionList (Session List) ← Extended Mode Exclusive
│   │   ├── SessionItem (Session Item)
│   │   └── NewSessionButton (New Button)
│   └── ChatArea (Chat Area) ← Shared Component
│       ├── ChatHeader (Header)
│       ├── MessageList (Message List)
│       ├── WelcomeScreen (Welcome Screen)
│       └── InputArea (Input Area)
│
├── ChatSidebar (Sidebar Mode)
│   ├── SidebarContainer (Sidebar Container)
│   │   ├── TabView (Tab Switch View)
│   │   │   ├── SessionTab (Session Tab)
│   │   │   └── ChatTab (Chat Tab)
│   │   └── ChatArea (Chat Area) ← Shared Component
│   └── FloatingBall (Floating Ball, when collapsed)
│
├── ChatCompact (Compact Mode)
│   ├── CompactSidebar (Sidebar)
│   │   └── ChatArea (Chat Area) ← Shared Component
│   └── FloatingBall (Floating Ball, when collapsed)
│
└── ChatFloating (Floating Mode)
    ├── FloatingBall (Floating Ball) ← Floating Mode Exclusive
    └── FloatingPanel (Floating Panel) ← Floating Mode Exclusive
        └── DraggableWindow (Draggable Window Container)
            └── ChatArea (Chat Area) ← Shared Component
```

### Mode Switching Architecture

```
AIChat
├── Detect mode configuration (new version) or chatMode (old version compatibility)
├── Render corresponding component based on mode
│   ├── 'extended' → ChatExtended (layout: 'dual')
│   ├── 'sidebar' → ChatSidebar (layout: 'single')
│   └── 'floating' → ChatFloating (layout: 'single')
└── Shared State Management (ChatStore)
```

### Component Reuse Relationship

| Component | Type | Used By Modes | Description |
|-----------|------|---------------|-------------|
| ChatArea | Shared | All Modes | Core chat area component |
| ChatHeader | Shared | All Modes | Chat header component |
| MessageList | Shared | All Modes | Message list component |
| WelcomeScreen | Shared | All Modes | Welcome screen component |
| InputArea | Shared | All Modes | Input area component |
| SessionList | Extended Mode Exclusive | Extended | Session list component |
| TabView | Sidebar Mode Exclusive | Sidebar | Tab switch view component |
| SidebarContainer | Sidebar Mode Exclusive | Sidebar | Sidebar container component |
| CompactSidebar | Compact Mode Exclusive | Compact | Sidebar container component |
| FloatingBall | Sidebar/Compact/Floating Mode Exclusive | Sidebar, Compact, Floating | Floating ball component |
| FloatingPanel | Floating Mode Exclusive | Floating | Floating panel component |
| DraggableWindow | Floating Mode Exclusive | Floating | Draggable window component |

## Component Structure

### Shared Components

#### ChatArea (Chat Area)

**Purpose**: Core chat component shared by all modes

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

**Features**:
- Message list display and scrolling
- Message sending and receiving
- Streaming response handling
- Welcome screen display

**Internal Components**:
- `ChatHeader`: Header (title, theme toggle, settings button)
- `MessageList`: Message list (virtual scrolling)
- `WelcomeScreen`: Welcome screen (quick action cards)
- `InputArea`: Input area (text input, file upload, send button)

#### MessageList (Message List)

**Purpose**: Render message list with virtual scrolling support

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

**Features**:
- Virtual scrolling (supports 1000+ messages)
- Auto-scroll to bottom
- Pause auto-scroll when user scrolls
- Markdown rendering support
- Image message grid layout

**MessageItem Structure**:
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

#### InputArea (Input Area)

**Purpose**: Handle user input and file uploads

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

**Features**:
- Multi-line text input
- Keyboard shortcut support (Enter to send, Shift+Enter for new line)
- Image upload and preview
- Voice input button
- Send state control

#### ChatHeader (Chat Header)

**Purpose**: Display title and action buttons

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

**Features**:
- Display title
- Theme toggle button
- Settings button (opens menu)
- Close button (sidebar/floating mode)

#### WelcomeScreen (Welcome Screen)

**Purpose**: Display welcome message and quick actions

**Props**:
```typescript
interface WelcomeScreenProps {
  title?: string
  subtitle?: string
  quickActions?: QuickAction[]
}
```

**Features**:
- Display welcome title and subtitle
- Display quick action cards
- Click quick action to fill input

**QuickAction Structure**:
```typescript
interface QuickAction {
  id: string
  label: string
  icon: string
  prompt: string
}
```

### Extended Mode Exclusive Design

#### ChatExtended Component

**Structure**:
```vue
<template>
  <div class="chat-extended">
    <SessionList v-if="enableSessionManager" />
    <ChatArea />
  </div>
</template>
```

**Layout**:
```
┌─────────────────────────────────────────────┐
│              ┌──────────┐  ┌──────────────┐ │
│              │Session   │  │  Chat Area   │ │
│              │  List    │  │              │ │
│  200-300px   │  New     │  │  Message     │ │
│   (config.)  │  Chat    │  │   List       │ │
│              │  Chat 1  │  │              │ │
│              │  Chat 2  │  │  Welcome     │ │
│              │  ...     │  │   Screen     │ │
│              │          │  │              │ │
│              │          │  │  [Input]     │ │
│              │          │  │  [Send]      │ │
│              └──────────┘  └──────────────┘ │
└─────────────────────────────────────────────┘
```

#### SessionList (Session List)

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

**Features**:
- Display session list
- Create new session
- Switch session
- Delete session
- Collapse/expand

**SessionItem Structure**:
```typescript
interface Session {
  id: string
  title: string
  preview?: string
  timestamp: number
  messageCount: number
}
```

#### Extended Mode Configuration

```typescript
interface ExtendedModeConfig {
  // Session list configuration
  sessionListWidth?: number        // Session list width (200-300px)
  sessionListCollapsed?: boolean   // Default collapsed state
  sessionListCollapsible?: boolean  // Whether collapsible

  // Session management
  enableSessionManager?: boolean    // Enable session management
  maxSessions?: number              // Maximum sessions
  autoTitle?: boolean               // Auto-extract title
}
```

### Sidebar Mode Exclusive Design

#### ChatSidebar Component

**Purpose**: Sidebar mode component, switch session/chat views through Tab

**Structure**:
```vue
<template>
  <div class="chat-sidebar">
    <SidebarContainer v-if="expanded">
      <TabView v-model:activeTab="activeTab">
        <SessionTab key="sessions" />
        <ChatTab key="chat">
          <ChatArea />
        </ChatTab>
      </TabView>
    </SidebarContainer>
    <FloatingBall v-else @click="expanded = true" />
  </div>
</template>
```

**Layout**:
```
Desktop:
┌─────────────────────────────────────────────┐
│ ┌────────┐  ┌──────────────────────────────┐ │
│ │        │  │                              │ │
│ │  Chat  │  │      Main Content Area       │ │
│ │Sidebar │  │                              │ │
│ │        │  │                              │ │
│ │ 400px  │  │                              │ │
│ │(config.)│  │                              │ │
│ └────────┘  └──────────────────────────────┘ │
└─────────────────────────────────────────────┘

Mobile (< 768px):
┌─────────────────────────────────────────────┐
│                                             │
│        Full Screen Chat Interface           │
│                                             │
│  [← Back]            [Theme] [Settings]     │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  │         Message List                │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ [Input...]                      [Send]│   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

#### TabView Component

**Props**:
```typescript
interface TabViewProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
}
```

**Features**:
- Tab switch view
- Session Tab: display session list
- Chat Tab: display chat area
- Switch animation

#### Sidebar Mode Configuration

```typescript
interface SidebarModeConfig {
  // Sidebar configuration
  sidebarWidth?: number           // Sidebar width (380-600px)
  sidebarPosition?: 'left' | 'right'  // Sidebar position
  defaultExpanded?: boolean       // Default expanded state

  // Tab configuration
  defaultTab?: 'sessions' | 'chat' // Default tab

  // Responsive configuration
  mobileBreakpoint?: number       // Mobile breakpoint (default 768px)
  mobileFullscreen?: boolean      // Mobile fullscreen

  // Floating ball configuration (when collapsed)
  showFloatingBall?: boolean      // Show floating ball when collapsed
  floatingBallPosition?: 'bottom-left' | 'bottom-right'  // Floating ball position
}
```

### Compact Mode Exclusive Design

#### ChatCompact Component

**Structure**:
```vue
<template>
  <div class="chat-compact">
    <CompactSidebar v-if="expanded" @close="expanded = false" />
    <FloatingBall v-else @click="expanded = true" />
  </div>
</template>
```

**Layout (Desktop)**:
```
┌─────────────────────────────────────────────┐
│ ┌────────┐  ┌──────────────────────────────┐ │
│ │        │  │                              │ │
│ │  Chat  │  │      Main Content Area       │ │
│ │Sidebar │  │                              │ │
│ │        │  │                              │ │
│ │ 400px  │  │                              │ │
│ │(config.)│  │                              │ │
│ └────────┘  └──────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Layout (Mobile < 768px)**:
```
┌─────────────────────────────────────────────┐
│                                             │
│        Full Screen Chat Interface           │
│                                             │
│  [← Back]            [Theme] [Settings]     │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  │         Message List                │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ [Input...]                      [Send]│   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

#### CompactSidebar (Compact Sidebar)

**Props**:
```typescript
interface CompactSidebarProps {
  width?: number
  position?: 'left' | 'right'
  showClose?: boolean
  onClose?: () => void
}
```

**Features**:
- Fixed width sidebar
- Show floating ball when collapsed
- Auto fullscreen on mobile
- Close button

#### Compact Mode Configuration

```typescript
interface CompactModeConfig {
  // Sidebar configuration
  sidebarWidth?: number           // Sidebar width (380-600px)
  sidebarPosition?: 'left' | 'right'  // Sidebar position
  defaultExpanded?: boolean       // Default expanded state

  // Responsive configuration
  mobileBreakpoint?: number       // Mobile breakpoint (default 768px)
  mobileFullscreen?: boolean      // Mobile fullscreen

  // Floating ball configuration (when collapsed)
  showFloatingBall?: boolean      // Show floating ball when collapsed
  floatingBallPosition?: 'bottom-left' | 'bottom-right'  // Floating ball position
}
```

### Floating Mode Exclusive Design

#### ChatFloating Component

**Structure**:
```vue
<template>
  <div class="chat-floating">
    <FloatingBall v-if="!panelOpen" @click="openPanel" />
    <FloatingPanel v-else @close="closePanel" />
  </div>
</template>
```

**Layout**:
```
Page bottom right (collapsed state):
    ┌───┐
    │💬│  ← Floating ball (draggable)
    │ 1 │  ← Unread badge
    └───┘

After click to expand:
┌─────────────────────┐
│  AI Assistant  [×]  │ ← Title bar (draggable)
├─────────────────────┤
│                     │
│    [Message List]   │ ← Content area (resizable)
│                     │
│                     │
├─────────────────────┤
│ [Input...]      [Send]│
└─────────────────────┘
```

#### FloatingBall (Floating Ball)

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

**Features**:
- Fixed in corner position
- Draggable
- Show unread badge
- Click to expand panel
- Snap to edge after drag

#### FloatingPanel (Floating Panel)

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

**Features**:
- Draggable (title bar)
- 8-direction resizable
- Remember position and size
- Show floating ball when closed

#### DraggableWindow (Draggable Window)

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

**Features**:
- Drag title bar to move
- 8-direction resize handles
- Minimum size limit
- Boundary limit
- Remember position and size (localStorage)

#### Floating Mode Configuration

```typescript
interface FloatingModeConfig {
  // Floating ball configuration
  ballPosition?: Position          // Floating ball position
  ballOffset?: { x: number; y: number }  // Offset
  ballIcon?: string                // Floating ball icon
  ballSize?: number                // Floating ball size
  ballDraggable?: boolean          // Floating ball draggable

  // Floating panel configuration
  panelWidth?: number              // Panel width
  panelHeight?: number             // Panel height
  panelMinWidth?: number           // Minimum width
  panelMinHeight?: number          // Minimum height
  panelDraggable?: boolean         // Panel draggable
  panelResizable?: boolean         // Panel resizable
  rememberPosition?: boolean       // Remember position and size

  // Animation configuration
  openAnimation?: boolean          // Open animation
  closeAnimation?: boolean         // Close animation
}
```

## Documentation Index

### Design Documents
Detailed design documents are available in the [`design/`](./design/) directory:

- [Session List Enhancement Design](./design/session-list-enhancement.md)

### Feature Documents
Feature requirements and user guides are available in the [`features/`](./features/) directory:

- [Session Management](./features/session-management.md)

### Implementation Plans
Detailed implementation plans are available in the [`plans/`](./plans/) directory:

- [Session List Replacement Design](./plans/2026-03-08-session-list-replacement-design.md)
- [Session List Replacement Implementation](./plans/2026-03-08-session-list-replacement-implementation.md)

### API Documentation
API documentation is available in [`API.md`](./API.md).

### Testing Documentation
Testing documentation is available in [`TDD.md`](./TDD.md) and [`../tests/UI_TEST_GUIDE.md`](../tests/UI_TEST_GUIDE.md).

### Product Requirements
Product requirements are available in [`PRD.md`](./PRD.md).
