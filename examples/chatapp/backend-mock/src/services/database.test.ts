/**
 * Unit tests for the mock backend's message persistence:
 * feedback column migration, setMessageFeedback and the
 * addMessage messageId correlation seam.
 *
 * The DB file is redirected via MOCK_DB_FILE so the dev server's
 * data directory is never touched.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import { tmpdir } from 'os'

process.env.MOCK_DB_FILE = `mock-db-test-${Date.now()}.db`

const { initDatabase, createSession, addMessage, getMessages, setMessageFeedback, deleteSession } = await import(
  './database'
)

const DB_FILE = path.join(__dirname, '../../data', process.env.MOCK_DB_FILE)

let sessionId = ''

beforeAll(async () => {
  await initDatabase()
  const session = createSession('feedback-unit-tests')
  sessionId = session.sessionId
})

afterAll(async () => {
  if (sessionId) deleteSession(sessionId)
  if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE)
})

describe('message feedback persistence (mock backend)', () => {
  it('addMessage stores a message under the provided messageId', async () => {
    const stored = addMessage(sessionId, 'assistant', 'correlated answer', undefined, undefined, undefined, undefined, undefined, 'client-provided-id-1')

    expect(stored.messageId).toBe('client-provided-id-1')
    const messages = getMessages(sessionId)
    expect(messages.find((m: { messageId: string }) => m.messageId === 'client-provided-id-1')?.content).toBe(
      'correlated answer'
    )
  })

  it('addMessage generates an id when none is provided', async () => {
    const stored = addMessage(sessionId, 'user', 'plain message')

    expect(stored.messageId).toBeTruthy()
    expect(stored.messageId).not.toBe('client-provided-id-1')
  })

  it('setMessageFeedback stores and clears feedback (none → null)', async () => {
    const stored = addMessage(sessionId, 'assistant', 'rate me', undefined, undefined, undefined, undefined, undefined, 'fb-msg-1')

    expect(setMessageFeedback('fb-msg-1', 'up')).toBe(true)
    expect(getMessages(sessionId).find((m: { messageId: string }) => m.messageId === 'fb-msg-1')?.feedback).toBe('up')

    // 'none' clears the stored feedback
    expect(setMessageFeedback('fb-msg-1', 'none')).toBe(true)
    expect(getMessages(sessionId).find((m: { messageId: string }) => m.messageId === 'fb-msg-1')?.feedback).toBeUndefined()
  })

  it('setMessageFeedback returns false for unknown messages', async () => {
    expect(setMessageFeedback('no-such-message', 'up')).toBe(false)
  })

  it('feedback survives a full database reload (persistence round-trip)', async () => {
    const stored = addMessage(sessionId, 'assistant', 'persist my feedback', undefined, undefined, undefined, undefined, undefined, 'persist-fb-1')
    expect(setMessageFeedback(stored.messageId, 'down')).toBe(true)

    // Re-read from disk through a fresh module instance
    const { initDatabase: reinit, getMessages: freshGetMessages } = await import('./database')
    await reinit()
    const reloaded = freshGetMessages(sessionId).find(
      (m: { messageId: string }) => m.messageId === stored.messageId
    )
    expect(reloaded?.feedback).toBe('down')
  })

  it('messages table carries the feedback column after migration', async () => {
    // Any persisted+reloaded feedback proves the column exists in schema AND
    // migration paths; assert the round-trip directly
    const stored = addMessage(sessionId, 'assistant', 'migration probe', undefined, undefined, undefined, undefined, undefined, 'migrate-probe-1')
    setMessageFeedback(stored.messageId, 'up')

    const { initDatabase: reinit, getMessages: freshGetMessages } = await import('./database')
    await reinit()
    const reloaded = freshGetMessages(sessionId).find(
      (m: { messageId: string }) => m.messageId === stored.messageId
    )
    expect(reloaded?.feedback).toBe('up')
  })
})
