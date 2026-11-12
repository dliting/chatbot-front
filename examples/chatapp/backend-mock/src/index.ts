import express from 'express'
import { corsMiddleware } from './middleware/cors'
import chatRoutes from './routes/chat'
import { initDatabase } from './services/database'
// config.ts loads env and validates HOST/PORT before anything else
import './config'

import { HOST, PORT } from './config'

const app = express()

// Middleware
app.use(corsMiddleware)
app.use(express.json({ limit: '10mb' }))

// Routes
app.use('/', chatRoutes)

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', mode: 'mock' })
})

// Initialize database and start server
async function start() {
  try {
    await initDatabase()
    console.log('Database initialized (mock mode)')

    // Bind to the configured HOST (127.0.0.1 in mock.env) — a bare
    // app.listen(PORT) binds 0.0.0.0/::6 semantics that mismatch IPv4-only
    // health checks and needlessly expose the dev server
    app.listen(PORT, HOST, () => {
      console.log(`Mock server running on http://${HOST}:${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

start()
