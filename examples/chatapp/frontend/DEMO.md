# ChatApp 前端演示

本目录包含AIChat组件的多种使用模式演示。

## 模式说明

### 紧凑模式 & 边栏模式 (/compact)

桌面端:聊天面板显示为右侧边栏,与主内容并列展示
移动端:自动切换为全屏模式

**适用场景:**
- SaaS后台管理系统
- 客户服务平台
- 需要持续显示助手的工具页面

### 扩展模式 (/extended)

桌面端全屏聊天界面,左侧会话列表 + 右侧聊天区域

**适用场景:**
- 独立的AI聊天应用
- 聊天机器人演示页面
- 专注于对话的体验页面

### 悬浮模式 (/floating)

页面右下角显示悬浮球,点击后打开聊天对话框

**适用场景:**
- 营销落地页
- 文档/帮助页面
- 不希望聊天干扰主内容的场景

### Iframe嵌入 (/iframe)

通过iframe将聊天bot嵌入任何网站,支持postMessage通信

**适用场景:**
- 第三方网站集成
- 跨域嵌入需求
- 需要完全隔离的场景

## 配置选项

### AIChatbot 组件配置

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `chatMode` | `'extended' \| 'compact' \| 'floating'` | `'floating'` | 聊天模式 |
| `apiBaseUrl` | `string` | - | API基础URL |
| `enableImageUpload` | `boolean` | `true` | 启用图片上传 |
| `enableSessionManager` | `boolean` | `true` | 启用会话管理 |
| `maxImageCount` | `number` | `4` | 最大图片数量 |
| `position` | `string` | `'bottom-right'` | 悬浮球位置 |
| `panelWidth` | `number` | `400` | 面板宽度(px) |

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 环境变量

创建 `.env` 文件:

```bash
VITE_API_BASE_URL=http://localhost:3001
```
