import 'dotenv/config'
import express from 'express'
import { corsMiddleware } from './middleware/cors'
import chatRoutes from './routes/chat'
import { initDatabase } from './services/database'

const HOST = process.env.HOST || 'localhost'
const PORT = process.env.PORT || 3000
const app = express()

// Middleware
app.use(corsMiddleware)
app.use(express.json({ limit: '10mb' }))

// Routes
app.use('/', chatRoutes)

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Initialize database and start server
async function start() {
  try {
    await initDatabase()
    console.log('Database initialized')

    app.listen(PORT, () => {
      console.log(`Server running on http://${HOST}:${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

start()
