import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import { initDatabase, addMessage, getMessages, createSession, getSessions } from './database'

// Use a temporary test database path
const TEST_DB_DIR = path.join(__dirname, '../../data-test')
const TEST_DB_PATH = path.join(TEST_DB_DIR, 'chatapp-test.db')

// The database module hardcodes its DB_PATH, so we need to test with
// the actual module. We'll create a fresh test environment by ensuring
// the test directory exists and cleaning up after.

describe('database', () => {
  beforeAll(async () => {
    // Ensure test data directory exists
    if (!fs.existsSync(TEST_DB_DIR)) {
      fs.mkdirSync(TEST_DB_DIR, { recursive: true })
    }
    // Remove any existing test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH)
    }
    await initDatabase()
  })

  afterAll(() => {
    // Clean up test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH)
    }
    if (fs.existsSync(TEST_DB_DIR) && fs.readdirSync(TEST_DB_DIR).length === 0) {
      fs.rmSync(TEST_DB_DIR, { recursive: true })
    }
  })

  describe('thinkingContent and thinkingTime persistence', () => {
    it('should store and retrieve thinkingContent and thinkingTime', () => {
      const sessionId = createSession('Thinking Test').sessionId

      const thinkingContent = 'Let me analyze this problem step by step...'
      const thinkingTime = 3500

      const msg = addMessage(sessionId, 'assistant', 'Here is the answer', undefined, thinkingContent, thinkingTime)

      expect(msg.thinkingContent).toBe(thinkingContent)
      expect(msg.thinkingTime).toBe(thinkingTime)
      expect(msg.content).toBe('Here is the answer')
      expect(msg.role).toBe('assistant')

      // Verify persistence via getMessages
      const messages = getMessages(sessionId)
      const savedMsg = messages.find(m => m.messageId === msg.messageId)
      expect(savedMsg).toBeDefined()
      expect(savedMsg!.thinkingContent).toBe(thinkingContent)
      expect(savedMsg!.thinkingTime).toBe(thinkingTime)
    })

    it('should handle messages without thinking data (backward compatibility)', () => {
      const sessionId = createSession('No Thinking').sessionId

      const msg = addMessage(sessionId, 'user', 'Hello')
      expect(msg.thinkingContent).toBeUndefined()
      expect(msg.thinkingTime).toBeUndefined()

      const msg2 = addMessage(sessionId, 'assistant', 'Hi there')
      expect(msg2.thinkingContent).toBeUndefined()
      expect(msg2.thinkingTime).toBeUndefined()

      const messages = getMessages(sessionId)
      const userMsg = messages.find(m => m.messageId === msg.messageId)
      const assistantMsg = messages.find(m => m.messageId === msg2.messageId)
      expect(userMsg!.thinkingContent).toBeUndefined()
      expect(userMsg!.thinkingTime).toBeUndefined()
      expect(assistantMsg!.thinkingContent).toBeUndefined()
      expect(assistantMsg!.thinkingTime).toBeUndefined()
    })

    it('should handle empty string thinkingContent as undefined but preserve zero thinkingTime', () => {
      const sessionId = createSession('Empty Thinking').sessionId

      // Empty string thinkingContent should be treated as undefined (not stored)
      // Zero thinkingTime is a valid value and should be preserved
      const msg = addMessage(sessionId, 'assistant', 'Response', undefined, '', 0)
      expect(msg.thinkingContent).toBeUndefined()
      expect(msg.thinkingTime).toBe(0)

      const messages = getMessages(sessionId)
      const savedMsg = messages.find(m => m.messageId === msg.messageId)
      expect(savedMsg!.thinkingContent).toBeUndefined()
      expect(savedMsg!.thinkingTime).toBe(0)
    })

    it('should persist thinkingContent with images', () => {
      const sessionId = createSession('Thinking + Images').sessionId

      const images = ['http://example.com/image1.png']
      const thinkingContent = 'Analyzing the image...'
      const thinkingTime = 1200

      const msg = addMessage(sessionId, 'assistant', 'The image shows...', images, thinkingContent, thinkingTime)
      expect(msg.images).toEqual(images)
      expect(msg.thinkingContent).toBe(thinkingContent)
      expect(msg.thinkingTime).toBe(thinkingTime)

      const messages = getMessages(sessionId)
      const savedMsg = messages.find(m => m.messageId === msg.messageId)
      expect(savedMsg!.images).toEqual(images)
      expect(savedMsg!.thinkingContent).toBe(thinkingContent)
      expect(savedMsg!.thinkingTime).toBe(thinkingTime)
    })
  })

  describe('videos and audios persistence', () => {
    it('should store and retrieve videos and audios', () => {
      const sessionId = createSession('Media Test').sessionId

      const videos = ['http://example.com/video1.mp4']
      const audios = ['http://example.com/audio1.mp3']

      const msg = addMessage(sessionId, 'assistant', 'Media response', undefined, undefined, undefined, videos, audios)
      expect(msg.videos).toEqual(videos)
      expect(msg.audios).toEqual(audios)

      const messages = getMessages(sessionId)
      const savedMsg = messages.find(m => m.messageId === msg.messageId)
      expect(savedMsg!.videos).toEqual(videos)
      expect(savedMsg!.audios).toEqual(audios)
    })

    it('should handle messages without videos/audios', () => {
      const sessionId = createSession('No Media').sessionId

      const msg = addMessage(sessionId, 'user', 'Hello')
      expect(msg.videos).toBeUndefined()
      expect(msg.audios).toBeUndefined()

      const messages = getMessages(sessionId)
      const savedMsg = messages.find(m => m.messageId === msg.messageId)
      expect(savedMsg!.videos).toBeUndefined()
      expect(savedMsg!.audios).toBeUndefined()
    })
  })

  describe('migration — column order with ALTER TABLE', () => {
    it('should correctly read messages from a migrated database where columns were added via ALTER TABLE', async () => {
      // Simulate a pre-migration database by creating a DB with the old schema,
      // inserting data, then running migration and verifying correct reads.
      // This tests that explicit column names in SELECT prevent index mismatch.
      const initSqlJs = (await import('sql.js')).default

      const SQL = await initSqlJs()
      const dbPath = path.join(TEST_DB_DIR, 'migration-test.db')

      // Clean up
      if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath)

      // Step 1: Create old-schema database
      const db = new SQL.Database()
      db.run(`CREATE TABLE sessions (
        sessionId TEXT PRIMARY KEY, title TEXT NOT NULL,
        createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL, messageCount INTEGER DEFAULT 0
      )`)
      db.run(`CREATE TABLE messages (
        messageId TEXT PRIMARY KEY, sessionId TEXT NOT NULL,
        role TEXT NOT NULL, content TEXT NOT NULL, images TEXT, timestamp INTEGER NOT NULL,
        FOREIGN KEY (sessionId) REFERENCES sessions(sessionId) ON DELETE CASCADE
      )`)

      const sid = 'migration-test-sid'
      db.run('INSERT INTO sessions VALUES (?, ?, ?, ?, ?)', [sid, 'Migration Test', 1000, 1000, 2])
      db.run('INSERT INTO messages VALUES (?, ?, ?, ?, ?, ?)', ['mid1', sid, 'user', 'hello', null, 1000])
      db.run('INSERT INTO messages VALUES (?, ?, ?, ?, ?, ?)', ['mid2', sid, 'assistant', 'response', null, 1001])

      // Step 2: Run migration (ALTER TABLE adds columns at the end)
      db.run('ALTER TABLE messages ADD COLUMN thinkingContent TEXT')
      db.run('ALTER TABLE messages ADD COLUMN thinkingTime INTEGER')
      db.run('ALTER TABLE messages ADD COLUMN videos TEXT')
      db.run('ALTER TABLE messages ADD COLUMN audios TEXT')

      // Step 3: Insert a message with thinking data after migration
      db.run('INSERT INTO messages (messageId, sessionId, role, content, thinkingContent, thinkingTime, images, videos, audios, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['mid3', sid, 'assistant', 'thoughtful response', 'I thought about this', 5000, null, null, null, 1002])

      // Step 4: Verify SELECT with explicit column names returns correct data
      const results = db.exec('SELECT messageId, sessionId, role, content, thinkingContent, thinkingTime, images, videos, audios, timestamp FROM messages WHERE sessionId = ? ORDER BY timestamp ASC', [sid])

      expect(results.length).toBe(1)
      expect(results[0].values.length).toBe(3)

      // Old message without thinking
      expect(results[0].values[0][0]).toBe('mid1') // messageId
      expect(results[0].values[0][3]).toBe('hello') // content
      expect(results[0].values[0][4]).toBeNull() // thinkingContent
      expect(results[0].values[0][5]).toBeNull() // thinkingTime

      // New message with thinking
      expect(results[0].values[2][0]).toBe('mid3')
      expect(results[0].values[2][3]).toBe('thoughtful response')
      expect(results[0].values[2][4]).toBe('I thought about this')
      expect(results[0].values[2][5]).toBe(5000)

      db.close()
      if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath)
    })
  })
})