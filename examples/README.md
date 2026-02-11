# AI 聊天组件使用示例

本目录展示 AI 聊天组件的三种主要使用模式。

## 三种模式对比

| 模式 | 文件 | 适用场景 | 特点 |
|------|------|----------|------|
| **全屏模式** | `fullscreen-demo.html` | 独立聊天应用 | AIChat 组件独立使用，占据整个视口 |
| **边栏模式** | `sidebar-demo.html` | 需要聊天 + 主内容的场景 | 聊天侧边栏固定显示，主内容可浏览 |
| **悬浮窗模式** | `floating-demo.html` | 不干扰主内容的辅助场景 | 默认隐藏，点击悬浮球弹出对话框 |

---

## 1. 全屏模式 (Fullscreen)

### 适用场景
- 独立的 AI 聊天应用
- 聊天机器人演示页面
- 专注于对话的体验页面

### 使用方式
```html
<div id="app"></div>

<script type="module">
  import { createApp } from 'vue'
  import AIChat from './components/AIChat.vue'

  createApp(AIChat, {
    mode: 'standalone',
    config: {
      labels: { title: 'AI 智能助手' },
      enableImageUpload: true,
    }
  }).mount('#app')
</script>
```

### 预览
打开 [`fullscreen-demo.html`](./fullscreen-demo.html) 查看效果。

---

## 2. 边栏模式 (Sidebar)

### 适用场景
- SaaS 后台管理系统
- 客户服务平台
- 需要持续显示助手的工具页面

### 使用方式
```html
<div class="main-content">...</div>
<aside id="chat-sidebar"></aside>

<script type="module">
  import { createApp } from 'vue'
  import AIChatbot from './components/AIChatbot.vue'

  createApp(AIChatbot, {
    config: {
      position: 'right',
      panelMode: 'sidebar',
      panelWidth: 400,
      enableSessionManager: true,
    }
  }).mount('#chat-sidebar')
</script>
```

### 预览
打开 [`sidebar-demo.html`](./sidebar-demo.html) 查看效果。

---

## 3. 悬浮窗模式 (Floating)

### 适用场景
- 营销落地页
- 文档/帮助页面
- 不希望聊天干扰主内容的场景

### 使用方式
```html
<div id="app">主内容...</div>
<div id="ai-chatbot"></div>

<script type="module">
  import { createApp } from 'vue'
  import AIChatbot from './components/AIChatbot.vue'

  createApp(AIChatbot, {
    config: {
      position: 'bottom-right',
      panelMode: 'dialog',
      enableSessionManager: false,
    }
  }).mount('#ai-chatbot')
</script>
```

### 预览
打开 [`floating-demo.html`](./floating-demo.html) 查看效果。

---

## 配置选项

### AIChat 组件 props
| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `mode` | `'standalone' \| 'internal'` | `'standalone'` | 显示模式 |
| `hideHeader` | `boolean` | `false` | 隐藏头部 |
| `hideWelcome` | `boolean` | `false` | 隐藏欢迎页 |
| `hideQuickActions` | `boolean` | `false` | 隐藏快捷操作 |
| `hideInputArea` | `boolean` | `false` | 隐藏输入区 |
| `config` | `ChatbotConfig` | `{}` | 配置对象 |

### AIChatbot 组件配置
| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `position` | `'left' \| 'right' \| 'bottom-left' \| 'bottom-right'` | `'right'` | 悬浮球位置 |
| `panelMode` | `'dialog' \| 'sidebar' \| 'fullscreen'` | `'dialog'` | 面板模式 |
| `panelWidth` | `number` | `400` | 面板宽度 (px) |
| `enableSessionManager` | `boolean` | `false` | 启用会话管理 |
| `theme` | `'light' \| 'dark'` | `'light'` | 主题 |
| `primaryColor` | `string` | `'#409eff'` | 主色调 |
