# AI Chatbot Frontend

A Vue 3 + TypeScript + Element Plus chatbot component that can be embedded in any website.

## Modes

The component supports three display modes:

| Mode | Description | Use Case |
|-------|-------------|-----------|
| **扩展模式 (Extended)** | Full desktop chat with session sidebar + chat area | Desktop-first chat application |
| **紧凑模式 (Compact)** | Desktop sidebar or mobile full screen | Sidebar panel or mobile chat interface |
| **悬浮模式 (Floating)** | Floating ball that opens chat dialog | Space-saving, on-demand access |

## Examples

- **扩展模式**: [extended.html](examples/extended.html) - Full desktop chat interface
- **紧凑模式**: [compact.html](examples/compact.html) - Desktop sidebar or mobile interface
- **悬浮模式**: [floating.html](examples/floating.html) - Floating ball with chat dialog

## Features

- **Multi-modal Interaction**: Text and image input support
- **Responsive Design**: Automatically adapts to PC, tablet, and mobile screens
- **Multiple Embed Modes**: Component (Vue) or iframe (any framework)
- **Theme Support**: Light and dark themes
- **Session Management**: Multiple conversation sessions
- **Streaming Responses**: Real-time typewriter effect
- **Draggable Floating Ball**: Repositionable chat trigger
- **Style Isolated**: No conflicts with host page styles

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start dev server (access examples at http://localhost:5173)
npm run dev

# Build library
npm run build:lib

# Build iframe version
npm run build:iframe
```

### Usage in Vue 3 Project

```vue
<template>
  <AIChatbot
    :config="{
      position: 'bottom-right',
      panelWidth: 400,
      theme: 'light',
      enableImageUpload: true,
    }"
    @panel-toggle="handleToggle"
    @message-success="handleSuccess"
  />
</template>

<script setup>
import { AIChatbot } from 'ai-chatbot-frontend'
import 'ai-chatbot-frontend/style.css'
</script>
```

### Iframe Embed

```html
<iframe
  src="https://your-domain.com/chatbot-iframe.html"
  width="100%"
  height="600px"
  frameborder="0"
></iframe>
```

See `examples/demo-iframe.html` for a complete example.

## Configuration

```typescript
interface ChatbotConfig {
  // Display mode
  chatMode?: 'extended' | 'compact' | 'floating'

  // Layout
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  panelWidth?: number
  panelHeight?: number
  defaultExpanded?: boolean

  // Features
  enableImageUpload?: boolean
  enableSessionManager?: boolean
  enableCopyMessage?: boolean
  enableDeleteMessage?: boolean

  // Upload limits
  maxImageCount?: number
  maxImageSize?: number

  // Style
  theme?: 'light' | 'dark'
  primaryColor?: string

  // Labels
  labels?: {
    title?: string
    placeholder?: string
    newChat?: string
  }

  // API
  apiBaseUrl?: string
  streamEnabled?: boolean
}
```

## Project Structure

```
src/
├── components/       # Vue components
├── composables/      # Composition API functions
├── types/           # TypeScript types
├── utils/           # Utility functions
├── styles/          # SCSS styles
├── entries/         # Example entry points
│   ├── extended.ts         # Extended mode entry
│   ├── compact.ts          # Compact mode entry
│   └── floating.ts         # Floating mode entry
├── index.ts         # Library entry
└── iframe-entry.ts  # Iframe entry
```

## Browser Support

- Chrome >= 88
- Firefox >= 85
- Safari >= 14
- Edge >= 88

## License

MIT

## 组件架构

### 核心组件

#### DraggableWindow - 通用可拖动窗口组件

一个通用的可拖动、可调整大小的窗口组件，可以独立使用或作为其他窗口组件的基础。

**功能特性：**
- 8方向调整大小（上下左右四边 + 四个角）
- 拖动标题栏移动窗口
- 位置和尺寸记忆（localStorage）
- 圆角矩形样式
- 浅色/深色主题支持

**Props：**
```typescript
interface DraggableWindowProps {
  modelValue?: boolean           // v-model 可见性
  x?: number                    // 窗口 x 坐标
  y?: number                    // 窗口 y 坐标
  width?: number                // 窗口宽度
  height?: number               // 窗口高度
  minWidth?: number             // 最小宽度
  minHeight?: number            // 最小高度
  maxWidth?: number             // 最大宽度
  maxHeight?: number            // 最大高度
  draggable?: boolean           // 是否可拖动 (默认: true)
  resizable?: boolean           // 是否可调整大小 (默认: true)
  rounded?: boolean             // 是否圆角 (默认: true)
  theme?: 'light' | 'dark'      // 主题 (默认: 'light')
  rememberPosition?: boolean    // 记住位置 (默认: true)
  storageKey?: string           // localStorage 键名
  zIndex?: number               // z-index (默认: 9998)
}
```

**Events：**
```typescript
interface DraggableWindowEmits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'update:x', value: number): void
  (e: 'update:y', value: number): void
  (e: 'update:width', value: number): void
  (e: 'update:height', value: number): void
}
```

**Slots：**
- `header`: 标题栏内容（可拖动区域）
- `default`: 窗口主体内容

**使用示例：**
```vue
<template>
  <DraggableWindow
    v-model:x="windowX"
    v-model:y="windowY"
    v-model:width="windowWidth"
    v-model:height="windowHeight"
    :min-width="300"
    :min-height="400"
    :draggable="true"
    :resizable="true"
    :rounded="true"
    theme="light"
  >
    <template #header>
      <div style="display: flex; justify-content: space-between; width: 100%;">
        <span>窗口标题</span>
        <button @click="close">关闭</button>
      </div>
    </template>
    <div>
      窗口内容
    </div>
  </DraggableWindow>
</template>

<script setup>
import { ref } from 'vue'
import { DraggableWindow } from 'ai-chatbot-frontend'

const windowX = ref(100)
const windowY = ref(100)
const windowWidth = ref(400)
const windowHeight = ref(500)

const close = () => {
  // 关闭逻辑
}
</script>
```



#### AIChatbot - 智能助手主组件

组合使用 ChatPanel 和其他子组件，提供完整的 AI 聊天功能。

**配置示例：**
```typescript
const config = {
  // 悬浮模式配置
  panelMode: 'floating',
  panelWidth: 400,
  panelHeight: 600,

  // 拖动和调整大小
  draggable: true,
  resizable: true,
  minWidth: 300,
  minHeight: 400,
  rememberPosition: true,

  // 其他配置
  theme: 'light',
  enableImageUpload: true,
  enableSessionManager: true,
}
```

## 悬浮模式功能需求

### 悬浮模式 (Floating Mode)

悬浮模式在页面右下角显示一个悬浮球按钮，点击后打开聊天对话框。

#### 核心功能需求

1. **可拖动**
   - 悬浮聊天窗口应该能够通过拖动标题栏来移动位置
   - 拖动过程中窗口应该跟随鼠标/手指移动
   - 拖动结束后窗口应该停留在新的位置

2. **圆角矩形样式**
   - 窗口形状应该是圆角矩形。

3. **可改变尺寸**
   - 悬浮聊天窗口应该能够通过拖动边缘或角落来改变尺寸
   - 支持从四条边（上、下、左、右）和四个角调整大小
   - 最小尺寸限制（默认 300px x 400px）

4. **位置和尺寸记忆**
   - 关闭悬浮聊天窗口后，应该记住上次打开的位置和尺寸
   - 使用 localStorage 存储位置和尺寸信息
   - 存储格式：`{ x: number, y: number, width: number, height: number }`

5. **智能打开位置**
   - 点击悬浮球，悬浮窗口应该在最后一次打开的位置显示
   - 首次打开时，默认在浏览器界面的右侧显示
   - 如果上次位置超出当前视口，应自动调整到可见区域

#### 配置选项

```typescript
interface FloatingPanelConfig {
  // 是否可拖动
  draggable?: boolean;        // 默认: true

  // 是否可调整大小
  resizable?: boolean;        // 默认: true

  // 最小尺寸
  minWidth?: number;          // 默认: 300
  minHeight?: number;         // 默认: 400

  // 默认尺寸
  defaultWidth?: number;      // 默认: 400
  defaultHeight?: number;     // 默认: 600

  // 默认位置
  defaultPosition?: {         // 默认: { x: right, y: center }
    x?: number | 'left' | 'center' | 'right';
    y?: number | 'top' | 'center' | 'bottom';
  };

  // 是否记住位置和尺寸
  rememberPosition?: boolean; // 默认: true
}
```

#### 用户交互流程

1. 用户点击悬浮球
2. 悬浮窗口在记忆位置（或默认右侧位置）打开
3. 用户可以拖动窗口到新位置
4. 用户可以调整窗口大小（8个方向）
5. 用户关闭窗口
6. 下次打开时，窗口在上次位置和尺寸显示

#### 技术实现要点

- 使用 Vue 3 Composition API
- 使用 localStorage 存储位置信息
- 自定义 resize handles 实现8方向调整
- 使用 `position: fixed` 定位窗口
- 监听 `resize` 事件处理窗口边界检查
