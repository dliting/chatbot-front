import dotenv from 'dotenv'
import path from 'path'

// Load mock.env from parent directory (examples/chatapp/mock.env)
const envPath = path.resolve(__dirname, '../../mock.env')
const envResult = dotenv.config({ path: envPath })
if (envResult.error) {
  console.warn(`Warning: Could not load env file from ${envPath}: ${envResult.error.message}`)
}

export const HOST = process.env.HOST || ''
export const PORT = parseInt(process.env.PORT || '', 10)

if (!HOST || isNaN(PORT)) {
  console.error('HOST and PORT must be configured in mock.env')
  process.exit(1)
}
