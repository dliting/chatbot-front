# AI Chatbot API 接口规范

## 文档信息
| 项目 | 内容 |
|------|------|
| 产品名称 | AI Chatbot Frontend |
| 版本 | v1.1 |
| 最后更新 | 2026-03-06 |

---

## 1. 接口概述

### 1.1 通信协议
- **流式消息**: SSE (Server-Sent Events) 或 WebSocket
- **普通消息**: REST API (HTTP/HTTPS)
- **图片上传**: Multipart/Form-Data

### 1.2 基础URL
```
开发环境: http://localhost:3000/api
生产环境: https://api.example.com/chatbot
```

## 路由API

ChatApp Frontend 使用 vue-router 4 进行客户端路由导航。

### router.push()

导航到指定路由：

```typescript
import { useRouter } from 'vue-router'

const router = useRouter()

// 导航到紧凑模式
router.push('/compact')

// 导航到扩展模式
router.push('/extended')

// 使用路由名称
router.push({ name: 'floating' })

// 返回首页
router.push('/')
```

### router.currentRoute

获取当前路由信息：

```typescript
import { useRoute } from 'vue-router'

const route = useRoute()
console.log(route.path)      // '/compact'
console.log(route.name)      // 'compact'
console.log(route.params)   // {}
```

---

## 2. 消息接口

### 2.1 发送消息 (流式)
```http
POST /chat/stream
Content-Type: application/json
Accept: text/event-stream
```

**请求参数:**
```json
{
  "sessionId": "string",      // 会话ID
  "content": "string",         // 消息内容
  "images": ["string"],        // 可选，图片URL数组
  "stream": true               // 启用流式输出
}
```

**响应 (SSE):**
```
data: {"type": "start", "messageId": "msg_123"}

data: {"type": "token", "content": "你"}

data: {"type": "token", "content": "好"}

data: {"type": "end", "fullContent": "你好"}
```

### 2.2 发送消息 (非流式)
```http
POST /chat/message
Content-Type: application/json
```

**请求参数:**
```json
{
  "sessionId": "string",
  "content": "string",
  "images": ["string"]
}
```

**响应:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "messageId": "string",
    "sessionId": "string",
    "role": "assistant",
    "content": "string",
    "timestamp": 1234567890
  }
}
```

---

## 3. 图片上传接口

### 3.1 上传图片
```http
POST /upload/images
Content-Type: multipart/form-data
```

**请求参数:**
```
images: File[]  // 多个图片文件
```

**响应:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "urls": [
      "https://cdn.example.com/images/abc123.jpg",
      "https://cdn.example.com/images/def456.jpg"
    ]
  }
}
```

---

## 4. 会话管理接口

### 4.1 获取会话列表
```http
GET /sessions
```

**响应:**
```json
{
  "code": 0,
  "data": {
    "sessions": [
      {
        "sessionId": "string",
        "title": "string",
        "createdAt": 1234567890,
        "updatedAt": 1234567890,
        "messageCount": 10
      }
    ]
  }
}
```

### 4.2 获取会话历史
```http
GET /sessions/{sessionId}/messages
```

**响应:**
```json
{
  "code": 0,
  "data": {
    "messages": [
      {
        "messageId": "string",
        "role": "user",
        "content": "string",
        "timestamp": 1234567890
      }
    ]
  }
}
```

### 4.3 创建会话
```http
POST /sessions
```

**响应:**
```json
{
  "code": 0,
  "data": {
    "sessionId": "string",
    "title": "新对话",
    "createdAt": 1234567890
  }
}
```

### 4.4 删除会话
```http
DELETE /sessions/{sessionId}
```

**响应:**
```json
{
  "code": 0,
  "message": "success"
}
```

---

## 5. 错误码

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器错误 |
| 1001 | 会话不存在 |
| 1002 | 消息发送失败 |
| 1003 | 图片上传失败 |
| 1004 | 流式连接断开 |

---

## 6. 模拟接口

前端开发时使用以下模拟接口：

```typescript
// mock/api.ts
export const mockStreamResponse = async function* (content: string) {
  yield { type: 'start' }
  for (const char of content) {
    await delay(50)
    yield { type: 'token', content: char }
  }
  yield { type: 'end' }
}
```
