import dotenv from 'dotenv'
import path from 'path'

// Load real.env from parent directory (examples/chatapp/real.env)
const envPath = path.resolve(__dirname, '../../real.env')
const envResult = dotenv.config({ path: envPath })
if (envResult.error) {
  console.warn(`Warning: Could not load env file from ${envPath}: ${envResult.error.message}`)
}

export const HOST = process.env.HOST || ''
export const PORT = parseInt(process.env.PORT || '', 10)

if (!HOST || isNaN(PORT)) {
  console.error('HOST and PORT must be configured in real.env')
  process.exit(1)
}

export const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || ''
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL || ''
export const OLLAMA_THINKING_ENABLED = process.env.OLLAMA_THINKING_ENABLED?.toLowerCase() !== 'false'
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
