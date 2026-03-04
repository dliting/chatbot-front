# ChatApp 示例项目

ChatApp 是一个完整的前后端分离聊天应用示例，用于验证和改进 AIChat 前端组件。

## 项目架构

```
chatapp/
├── frontend/          # 前端 (Vite + Vue 3)
│   ├── src/
│   │   ├── main.ts    # Vue 入口
│   │   └── App.vue    # 根组件
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
└── backend/           # 后端 (Express + TypeScript + SQLite)
    ├── src/
    │   ├── index.ts           # 服务入口
    │   ├── routes/chat.ts     # API 路由
    │   ├── services/
    │   │   ├── database.ts    # SQLite 服务
    │   │   └── ollama.ts      # Ollama 服务
    │   └── types/index.ts     # 类型定义
    ├── data/                  # SQLite 数据库
    ├── package.json
    └── tsconfig.json
```

## 快速开始

### 1. 启动 Ollama

确保本地已安装 [Ollama](https://github.com/ollama/ollama) 并启动了 qwen3.5:9b 模型：

```bash
ollama run qwen3.5:9b
```

### 2. 启动后端

```bash
cd backend
npm install
npm run dev
```

后端将在 http://localhost:3000 运行。

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端将在 http://localhost:5173 运行。

### 4. 访问应用

打开浏览器访问 http://localhost:5173

## API 接口

后端 API 对齐 ChatBot 组件规范：

| 接口 | 方法 | 说明 |
|------|------|------|
| `/chat/stream` | POST | 流式聊天 (SSE) |
| `/chat/message` | POST | 普通消息 |
| `/upload/images` | POST | 图片上传 |
| `/sessions` | GET | 获取会话列表 |
| `/sessions/:id/messages` | GET | 获取会话消息 |
| `/sessions` | POST | 创建会话 |
| `/sessions/:id` | DELETE | 删除会话 |

详细 API 规范见 `docs/API.md`

## 配置

### 前端配置

在 `frontend/src/App.vue` 中修改 ChatBot 配置：

```typescript
const config = {
  chatMode: 'fullscreen',      // 聊天模式
  apiBaseUrl: 'http://localhost:3000',  // 后端地址
  streamEnabled: true,          // 启用流式输出
  enableImageUpload: true,      // 启用图片上传
  enableSessionManager: true,   // 启用会话管理
  // ... 其他配置
}
```

### 后端配置

通过环境变量配置：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | 3000 | 服务端口 |
| `OLLAMA_BASE_URL` | http://localhost:11434 | Ollama 地址 |
| `OLLAMA_MODEL` | qwen3.5:9b | 使用的模型 |

## 验证 ChatBot 组件

ChatApp 的核心目的是验证和改进 ChatBot 组件：

- 测试前端与不同后端的兼容性
- 验证 API 对齐情况
- 测试多模态对话功能
- 测试会话管理功能
- 发现并改进 ChatBot 组件的问题
