// @ts-ignore - sql.js has no type declarations
import initSqlJs from 'sql.js'
type Database = any
import * as fs from 'fs'
import * as path from 'path'
import { v4 as uuidv4 } from 'uuid'
import type { Session, Message } from '../types'

const DB_PATH = path.join(__dirname, '../../data/chatapp-mock.db')

let db: Database | null = null

export async function initDatabase(): Promise<void> {
  const SQL = await initSqlJs()

  // Check if database file exists
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }

  // Create tables if they don't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      sessionId TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      messageCount INTEGER DEFAULT 0
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      messageId TEXT PRIMARY KEY,
      sessionId TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      thinkingContent TEXT,
      thinkingTime INTEGER,
      images TEXT,
      videos TEXT,
      audios TEXT,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (sessionId) REFERENCES sessions(sessionId) ON DELETE CASCADE
    )
  `)

  // Migration: add thinkingContent and thinkingTime columns to existing databases
  try {
    const columns = db.exec("PRAGMA table_info(messages)")
    if (columns.length > 0) {
      const columnNames = columns[0].values.map((row: any[]) => row[1] as string)
      if (!columnNames.includes('thinkingContent')) {
        db.run('ALTER TABLE messages ADD COLUMN thinkingContent TEXT')
      }
      if (!columnNames.includes('thinkingTime')) {
        db.run('ALTER TABLE messages ADD COLUMN thinkingTime INTEGER')
      }
    }
  } catch {
    // Migration failures on fresh databases are harmless
  }

  // Save to disk
  saveDatabase()
}

function saveDatabase(): void {
  if (!db) return

  const data = db.export()
  const buffer = Buffer.from(data)

  // Ensure directory exists
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(DB_PATH, buffer)
}

export function createSession(title: string = '新对话'): Session {
  if (!db) throw new Error('Database not initialized')

  const sessionId = uuidv4()
  const now = Date.now()

  db.run(
    'INSERT INTO sessions (sessionId, title, createdAt, updatedAt, messageCount) VALUES (?, ?, ?, ?, ?)',
    [sessionId, title, now, now, 0]
  )

  saveDatabase()

  return {
    sessionId,
    title,
    createdAt: now,
    updatedAt: now,
    messageCount: 0
  }
}

export function getSessions(): Session[] {
  if (!db) throw new Error('Database not initialized')

  const results = db.exec('SELECT * FROM sessions ORDER BY updatedAt DESC')
  if (results.length === 0) return []

  return results[0].values.map((row: any[]) => ({
    sessionId: row[0] as string,
    title: row[1] as string,
    createdAt: row[2] as number,
    updatedAt: row[3] as number,
    messageCount: row[4] as number
  }))
}

export function getSession(sessionId: string): Session | null {
  if (!db) throw new Error('Database not initialized')

  const results = db.exec('SELECT * FROM sessions WHERE sessionId = ?', [sessionId])
  if (results.length === 0 || results[0].values.length === 0) return null

  const row = results[0].values[0]
  return {
    sessionId: row[0] as string,
    title: row[1] as string,
    createdAt: row[2] as number,
    updatedAt: row[3] as number,
    messageCount: row[4] as number
  }
}

export function deleteSession(sessionId: string): boolean {
  if (!db) throw new Error('Database not initialized')

  // Delete messages first
  db.run('DELETE FROM messages WHERE sessionId = ?', [sessionId])
  db.run('DELETE FROM sessions WHERE sessionId = ?', [sessionId])

  saveDatabase()
  return true
}

export function addMessage(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string,
  images?: string[],
  videos?: string[],
  audios?: string[],
  thinkingContent?: string,
  thinkingTime?: number
): Message {
  if (!db) throw new Error('Database not initialized')

  const messageId = uuidv4()
  const timestamp = Date.now()

  db.run(
    'INSERT INTO messages (messageId, sessionId, role, content, thinkingContent, thinkingTime, images, videos, audios, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      messageId, sessionId, role, content,
      thinkingContent || null,
      thinkingTime || null,
      images ? JSON.stringify(images) : null,
      videos ? JSON.stringify(videos) : null,
      audios ? JSON.stringify(audios) : null,
      timestamp
    ]
  )

  // Update session
  db.run('UPDATE sessions SET updatedAt = ?, messageCount = messageCount + 1 WHERE sessionId = ?', [
    timestamp,
    sessionId
  ])

  // Update title if this is the first message
  const session = getSession(sessionId)
  if (session && session.title === '新对话' && role === 'user') {
    const title = content.slice(0, 30) + (content.length > 30 ? '...' : '')
    db.run('UPDATE sessions SET title = ? WHERE sessionId = ?', [title, sessionId])
  }

  saveDatabase()

  return {
    messageId,
    sessionId,
    role,
    content,
    thinkingContent: thinkingContent || undefined,
    thinkingTime: thinkingTime || undefined,
    images,
    videos,
    audios,
    timestamp
  }
}

export function getMessages(sessionId: string): Message[] {
  if (!db) throw new Error('Database not initialized')

  const results = db.exec('SELECT messageId, sessionId, role, content, thinkingContent, thinkingTime, images, videos, audios, timestamp FROM messages WHERE sessionId = ? ORDER BY timestamp ASC', [
    sessionId
  ])
  if (results.length === 0) return []

  return results[0].values.map((row: any[]) => ({
    messageId: row[0] as string,
    sessionId: row[1] as string,
    role: row[2] as 'user' | 'assistant',
    content: row[3] as string,
    thinkingContent: (row[4] as string) || undefined,
    thinkingTime: (row[5] as number) || undefined,
    images: row[6] ? JSON.parse(row[6] as string) : undefined,
    videos: row[7] ? JSON.parse(row[7] as string) : undefined,
    audios: row[8] ? JSON.parse(row[8] as string) : undefined,
    timestamp: row[9] as number
  }))
}

export function deleteMessage(messageId: string): boolean {
  if (!db) throw new Error('Database not initialized')

  // Get sessionId before deleting
  const results = db.exec('SELECT sessionId FROM messages WHERE messageId = ?', [messageId])
  if (results.length === 0 || results[0].values.length === 0) return false
  const sessionId = results[0].values[0][0] as string

  db.run('DELETE FROM messages WHERE messageId = ?', [messageId])
  // Decrement messageCount
  db.run('UPDATE sessions SET messageCount = MAX(messageCount - 1, 0) WHERE sessionId = ?', [sessionId])
  saveDatabase()
  return true
}

export function updateSessionTitle(sessionId: string, title: string): void {
  if (!db) throw new Error('Database not initialized')

  const now = Date.now()
  const existing = getSession(sessionId)
  if (existing) {
    db.run('UPDATE sessions SET title = ?, updatedAt = ? WHERE sessionId = ?', [
      title, now, sessionId
    ])
  } else {
    // Create session row if it doesn't exist
    db.run(
      'INSERT INTO sessions (sessionId, title, createdAt, updatedAt, messageCount) VALUES (?, ?, ?, ?, ?)',
      [sessionId, title, now, now, 0]
    )
  }

  saveDatabase()
}
