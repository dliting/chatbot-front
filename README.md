# AI Chatbot Frontend

A Vue 3 + TypeScript + Element Plus chatbot component that can be embedded in any website.

## Modes

The component supports three display modes:

| Mode | Description | Use Case |
|-------|-------------|-----------|
| **扩展模式 (Extended)** | Full desktop chat with session sidebar + chat area | Desktop-first chat application |
| **紧凑模式 (Compact)** | Desktop sidebar or mobile full screen | Sidebar panel or mobile chat interface |
| **悬浮模式 (Floating)** | Floating ball that opens either extended or compact panel | Space-saving, on-demand access |

## Examples

- **扩展模式**: [extended.html](examples/extended.html) - Full desktop chat interface
- **紧凑模式**: [compact.html](examples/compact.html) - Desktop sidebar or mobile interface
- **悬浮模式 (→紧凑)**: [floating-compact.html](examples/floating-compact.html) - Floating ball, default compact panel
- **悬浮模式 (→扩展)**: [floating-extended.html](examples/floating-extended.html) - Floating ball, opens full chat

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
  // Layout
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  panelWidth?: number
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
│   ├── floating-compact.ts  # Floating → Compact entry
│   └── floating-extended.ts # Floating → Extended entry
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
