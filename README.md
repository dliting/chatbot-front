# AI Chatbot Frontend

A Vue 3 + TypeScript + Element Plus chatbot component that can be embedded in any website.

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

# Start dev server
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

See `demo-iframe.html` for a complete example.

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
├── index.ts         # Library entry
├── main.ts          # Demo entry
└── iframe-entry.ts  # Iframe entry
```

## Browser Support

- Chrome >= 88
- Firefox >= 85
- Safari >= 14
- Edge >= 88

## License

MIT
