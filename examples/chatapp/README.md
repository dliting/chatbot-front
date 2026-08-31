# ChatApp 示例项目

ChatApp 是一个完整的前后端分离聊天应用示例，用于验证和改进 AIChat 前端组件。

## 两种模式

### Mock 模式（本地模拟）- 不需要 LLM
- 不需要连接实际的 LLM 服务
- 返回预设的模拟响应
- 适合开发和测试

启动命令：
```bash
cd backend-mock
npm install
npm run dev
```
后端运行在 http://localhost:3001

### Real 模式（连接 Ollama）- 需要本地 LLM
- 连接本地 Ollama 服务
- 使用 qwen3.5:9b 模型
- 需要本地安装并运行 Ollama

启动命令：
```bash
# 先启动 Ollama
ollama serve
ollama run qwen3.5:9b

# 然后启动后端
cd backend-real
npm install
npm run dev
```
后端运行在 http://localhost:3000

## 前端配置

前端通过环境变量 `VITE_API_BASE_URL` 配置 API 地址：

```bash
# Mock 模式（默认）
VITE_API_BASE_URL=http://localhost:3001

# Real 模式
VITE_API_BASE_URL=http://localhost:3000
```

修改 `frontend/.env` 文件后需要重启前端。

## 项目架构

```
chatapp/
├── frontend/          # 前端 (Vite + Vue 3)
│   ├── src/
│   │   ├── main.ts    # Vue 入口
│   │   └── App.vue    # 根组件
│   ├── index.html
│   ├── .env           # 环境配置
│   ├── package.json
│   └── vite.config.ts
├── backend-real/           # Real 后端 (Express + TypeScript + SQLite)
│   ├── src/
│   │   ├── index.ts           # 服务入口
│   │   ├── routes/chat.ts     # API 路由
│   │   ├── services/
│   │   │   ├── database.ts    # SQLite 服务
│   │   │   └── ollama.ts      # Ollama 服务
│   │   └── types/index.ts     # 类型定义
│   ├── data/                  # SQLite 数据库
│   ├── package.json
│   └── tsconfig.json
└── backend-mock/      # Mock 后端 (模拟响应)
    ├── src/
    │   ├── index.ts           # 服务入口
    │   ├── routes/chat.ts     # API 路由
    │   ├── services/
    │   │   ├── database.ts    # SQLite 服务
    │   │   └── mockChat.ts   # 模拟 AI 响应
    │   └── types/index.ts     # 类型定义
    ├── data/                  # SQLite 数据库
    ├── package.json
    └── tsconfig.json
```

## 快速开始

### 一键启动（推荐）

项目根目录提供了脚本，可一键启动前后端服务：

```bash
# Mock 模式（不需要 LLM）
start-chatapp.bat mock

# Real 模式（需要本地 Ollama）
start-chatapp.bat real
```

脚本会自动完成以下操作：
1. 读取对应模式的环境配置文件（`mock.env` / `real.env`）
2. 检查并释放占用的端口（5173-5180 及后端端口）
3. 启动后端服务（mock 模式端口 3001，real 模式端口 3000）
4. 生成前端 `.env` 文件，设置 `VITE_API_BASE_URL` 指向后端
5. 启动前端开发服务器（端口 5180）

```bash
# 停止所有服务
stop-chatapp.bat
```

### 手动启动

#### Mock 模式（推荐用于开发测试）

```bash
# 1. 启动 Mock 后端
cd backend-mock
npm install
npm run dev

# 2. 启动前端（新终端）
cd frontend
npm install
npm run dev
```

前端将在 http://localhost:5180 运行。

#### Real 模式（需要 Ollama）

```bash
# 1. 启动 Ollama(如果没启动)
ollama serve
ollama run qwen3.5:9b

# 2. 启动 Real 后端
cd backend-real
npm install
npm run dev

# 3. 修改前端配置
# 编辑 frontend/.env，设置 VITE_API_BASE_URL=http://localhost:3000

# 4. 启动前端
cd frontend
npm run dev
```

### 访问应用

打开浏览器访问 http://localhost:5180

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
