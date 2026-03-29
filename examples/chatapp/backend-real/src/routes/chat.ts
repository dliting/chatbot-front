import { Router, Request, Response } from 'express'
import {
  createSession,
  getSessions,
  getSession,
  deleteSession,
  getMessages,
  addMessage
} from '../services/database'
import { streamChat, chat, type OllamaMessage } from '../services/ollama'
import type { ApiResponse } from '../types'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

// POST /chat/stream - Stream chat
router.post('/chat/stream', async (req: Request, res: Response) => {
  try {
    const { sessionId, content, images, stream = true, options } = req.body

    if (!sessionId || !content) {
      res.status(400).json({ code: 400, message: 'Missing sessionId or content' })
      return
    }

    // Save user message
    addMessage(sessionId, 'user', content, images)

    // Get conversation history
    const messages = getMessages(sessionId)
    const ollamaMessages: OllamaMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
      ...(m.images && m.images.length > 0 ? { images: m.images } : {})
    }))

    // Add current message
    ollamaMessages.push({ role: 'user', content, ...(images && images.length > 0 ? { images } : {}) })

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')

      let clientClosed = false
      res.on('close', () => { clientClosed = true })

      const messageId = uuidv4()
      res.write(`data: ${JSON.stringify({ type: 'start', messageId })}\n\n`)

      let fullContent = ''
      for await (const chunk of streamChat(ollamaMessages, options)) {
        if (clientClosed) break

        if (chunk.type === 'reasoning' && chunk.reasoningContent) {
          res.write(`data: ${JSON.stringify({ type: 'reasoning', reasoningContent: chunk.reasoningContent })}\n\n`)
        } else if (chunk.type === 'token' && chunk.content) {
          fullContent += chunk.content
          res.write(`data: ${JSON.stringify({ type: 'token', content: chunk.content })}\n\n`)
        } else if (chunk.type === 'end') {
          // Save assistant message
          const assistantMessage = addMessage(sessionId, 'assistant', fullContent)
          res.write(
            `data: ${JSON.stringify({ type: 'end', fullContent, messageId: assistantMessage.messageId })}\n\n`
          )
        }
      }

      // If client disconnected mid-stream, save partial content
      if (clientClosed && fullContent) {
        addMessage(sessionId, 'assistant', fullContent)
      }

      // End SSE response to signal stream completion
      res.end()
    } else {
      // Non-streaming
      const response = await chat(ollamaMessages)
      const assistantMessage = addMessage(sessionId, 'assistant', response)

      const apiResponse: ApiResponse = {
        code: 0,
        message: 'success',
        data: {
          messageId: assistantMessage.messageId,
          sessionId,
          role: 'assistant',
          content: response,
          timestamp: assistantMessage.timestamp
        }
      }
      res.json(apiResponse)
    }
  } catch (error) {
    console.error('Chat error:', error)
    res.status(500).json({ code: 500, message: 'Internal server error' })
  }
})

// POST /chat/message - Non-streaming chat
router.post('/chat/message', async (req: Request, res: Response) => {
  try {
    const { sessionId, content, images } = req.body

    if (!sessionId || !content) {
      res.status(400).json({ code: 400, message: 'Missing sessionId or content' })
      return
    }

    // Save user message
    addMessage(sessionId, 'user', content, images)

    // Get conversation history
    const messages = getMessages(sessionId)
    const ollamaMessages: OllamaMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
      ...(m.images && m.images.length > 0 ? { images: m.images } : {})
    }))

    // Add current message
    ollamaMessages.push({ role: 'user', content, ...(images && images.length > 0 ? { images } : {}) })

    // Get response
    const response = await chat(ollamaMessages)
    const assistantMessage = addMessage(sessionId, 'assistant', response)

    const apiResponse: ApiResponse = {
      code: 0,
      message: 'success',
      data: {
        messageId: assistantMessage.messageId,
        sessionId,
        role: 'assistant',
        content: response,
        timestamp: assistantMessage.timestamp
      }
    }
    res.json(apiResponse)
  } catch (error) {
    console.error('Chat error:', error)
    res.status(500).json({ code: 500, message: 'Internal server error' })
  }
})

// POST /upload/images - Upload images (simplified - returns base URLs)
router.post('/upload/images', (req: Request, res: Response) => {
  // For this example, we'll just return a placeholder URL
  // In production, you'd upload to cloud storage
  const HOST = process.env.HOST || 'localhost'
  const PORT = process.env.PORT || 3000
  const urls = [`http://${HOST}:${PORT}/uploads/${uuidv4()}.jpg`]

  const apiResponse: ApiResponse = {
    code: 0,
    message: 'success',
    data: { urls }
  }
  res.json(apiResponse)
})

// GET /sessions - Get session list
router.get('/sessions', (_req: Request, res: Response) => {
  try {
    const sessions = getSessions()
    const apiResponse: ApiResponse = {
      code: 0,
      data: { sessions }
    }
    res.json(apiResponse)
  } catch (error) {
    console.error('Get sessions error:', error)
    res.status(500).json({ code: 500, message: 'Internal server error' })
  }
})

// GET /sessions/:id/messages - Get session messages
router.get('/sessions/:id/messages', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const session = getSession(id)

    if (!session) {
      res.status(404).json({ code: 404, message: 'Session not found' })
      return
    }

    const messages = getMessages(id)
    const apiResponse: ApiResponse = {
      code: 0,
      data: { messages }
    }
    res.json(apiResponse)
  } catch (error) {
    console.error('Get messages error:', error)
    res.status(500).json({ code: 500, message: 'Internal server error' })
  }
})

// POST /sessions - Create session
router.post('/sessions', (req: Request, res: Response) => {
  try {
    const { title } = req.body
    const session = createSession(title || '新对话')
    const apiResponse: ApiResponse = {
      code: 0,
      data: {
        sessionId: session.sessionId,
        title: session.title,
        createdAt: session.createdAt
      }
    }
    res.json(apiResponse)
  } catch (error) {
    console.error('Create session error:', error)
    res.status(500).json({ code: 500, message: 'Internal server error' })
  }
})

// DELETE /sessions/:id - Delete session
router.delete('/sessions/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const success = deleteSession(id)

    if (!success) {
      res.status(404).json({ code: 404, message: 'Session not found' })
      return
    }

    const apiResponse: ApiResponse = {
      code: 0,
      message: 'success'
    }
    res.json(apiResponse)
  } catch (error) {
    console.error('Delete session error:', error)
    res.status(500).json({ code: 500, message: 'Internal server error' })
  }
})

export default router
