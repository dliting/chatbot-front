import { Router, Request, Response } from 'express'
import {
  createSession,
  getSessions,
  getSession,
  deleteSession,
  updateSessionTitle,
  getMessages,
  addMessage,
  deleteMessage
} from '../services/database'
import { streamMockChat, mockChat } from '../services/mockChat'
import { HOST, PORT } from '../config'
import type { ApiResponse } from '../types'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

// POST /chat/stream - Stream chat (mock)
router.post('/chat/stream', async (req: Request, res: Response) => {
  try {
    const { sessionId, content, images, videos, audios, stream = true, options } = req.body

    if (!sessionId || !content) {
      res.status(400).json({ code: 400, message: 'Missing sessionId or content' })
      return
    }

    // Save user message
    addMessage(sessionId, 'user', content, images, videos, audios)

    // Get conversation history
    const messages = getMessages(sessionId)
    const chatMessages = messages.map((m: any) => ({
      role: m.role,
      content: m.content,
    }))

    // Add current message
    chatMessages.push({ role: 'user', content })

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')

      let clientClosed = false
      res.on('close', () => { clientClosed = true })

      const messageId = uuidv4()
      res.write(`data: ${JSON.stringify({ type: 'start', messageId })}\n\n`)

      let fullContent = ''
      let fullThinkingContent = ''
      let thinkingStartTime = 0
      for await (const chunk of streamMockChat(chatMessages, options)) {
        if (clientClosed) break

        if (chunk.type === 'reasoning' && chunk.reasoningContent) {
          fullThinkingContent += chunk.reasoningContent
          if (!thinkingStartTime) thinkingStartTime = Date.now()
          res.write(`data: ${JSON.stringify({ type: 'reasoning', reasoningContent: chunk.reasoningContent })}\n\n`)
        } else if (chunk.type === 'token' && chunk.content) {
          fullContent += chunk.content
          res.write(`data: ${JSON.stringify({ type: 'token', content: chunk.content })}\n\n`)
        } else if (chunk.type === 'end') {
          const thinkingTime = thinkingStartTime ? Date.now() - thinkingStartTime : undefined
          const assistantMessage = addMessage(sessionId, 'assistant', fullContent, undefined, undefined, undefined, fullThinkingContent || undefined, thinkingTime)
          res.write(
            `data: ${JSON.stringify({ type: 'end', fullContent, messageId: assistantMessage.messageId })}\n\n`
          )
        }
      }

      // If client disconnected mid-stream, save partial content
      if (clientClosed && fullContent) {
        const thinkingTime = thinkingStartTime ? Date.now() - thinkingStartTime : undefined
        addMessage(sessionId, 'assistant', fullContent, undefined, undefined, undefined, fullThinkingContent || undefined, thinkingTime)
      }

      // End SSE response to signal stream completion
      res.end()
    } else {
      const response = await mockChat(chatMessages, options)
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

// POST /chat/message - Non-streaming chat (mock)
router.post('/chat/message', async (req: Request, res: Response) => {
  try {
    const { sessionId, content, images, videos, audios, options } = req.body

    if (!sessionId || !content) {
      res.status(400).json({ code: 400, message: 'Missing sessionId or content' })
      return
    }

    addMessage(sessionId, 'user', content, images, videos, audios)

    const messages = getMessages(sessionId)
    const chatMessages = messages.map((m: any) => ({
      role: m.role,
      content: m.content,
    }))
    chatMessages.push({ role: 'user', content })

    const response = await mockChat(chatMessages, options)
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

// POST /upload/images - Upload images (mock)
router.post('/upload/images', (_req: Request, res: Response) => {
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

    // Return messages even if session row doesn't exist
    // (messages may be stored before session metadata is created)
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

// PATCH /sessions/:id/title - Update session title
router.patch('/sessions/:id/title', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const { title } = req.body

    if (!title) {
      res.status(400).json({ code: 400, message: 'Title is required' })
      return
    }

    updateSessionTitle(id, title)

    const apiResponse: ApiResponse = {
      code: 0,
      message: 'success'
    }
    res.json(apiResponse)
  } catch (error) {
    console.error('Update session title error:', error)
    res.status(500).json({ code: 500, message: 'Internal server error' })
  }
})

// DELETE /messages/:id - Delete message
router.delete('/messages/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const success = deleteMessage(id)
    if (!success) {
      res.status(404).json({ code: 404, message: 'Message not found' })
      return
    }
    res.json({ code: 0, message: 'success' })
  } catch (error) {
    console.error('Delete message error:', error)
    res.status(500).json({ code: 500, message: 'Internal server error' })
  }
})

export default router
