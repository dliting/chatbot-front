/**
 * Single source of truth for ChatApp E2E server topology:
 * ports and Ollama coordinates are read from the deployment env files
 * (examples/chatapp/*.env) instead of being redefined here.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Playwright always loads the config from the repo root, and E2E specs run
// with the same cwd — resolve from there instead of __dirname (loader-agnostic).
const CHATAPP_DIR = join(process.cwd(), 'examples/chatapp')

/** Parse a dotenv-style file into a record (trims whitespace and one pair of quotes) */
export function parseEnvFile(name: string): Record<string, string> {
  const raw = readFileSync(join(CHATAPP_DIR, name), 'utf-8')
  const vars: Record<string, string> = {}
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    vars[trimmed.slice(0, eq).trim()] = value
  }
  return vars
}

let mockEnv: Record<string, string> | null = null
let realEnv: Record<string, string> | null = null

export function mockEnvVars(): Record<string, string> {
  mockEnv ??= parseEnvFile('mock.env')
  return mockEnv
}

/**
 * Real-mode env. Throws with setup guidance when real.env is absent
 * (it is gitignored deployment config — fresh clones must copy the template).
 */
export function realEnvVars(): Record<string, string> {
  realEnv ??= parseEnvFile('real.env')
  return realEnv
}

/** Real-mode env without throwing — null when real.env is not provisioned yet */
export function tryRealEnvVars(): Record<string, string> | null {
  try {
    return realEnvVars()
  } catch {
    return null
  }
}

export const MOCK_PORT = () => {
  const port = mockEnvVars().PORT
  if (!port) throw new Error('mock.env is missing a PORT entry')
  return port
}

export const REAL_PORT = () => {
  const port = realEnvVars().PORT
  if (!port) throw new Error('real.env is missing a PORT entry (copy real.env.example → real.env)')
  return port
}

export const OLLAMA_BASE_URL = () => {
  const url = realEnvVars().OLLAMA_BASE_URL
  if (!url) throw new Error('real.env is missing OLLAMA_BASE_URL (copy real.env.example → real.env)')
  return url
}
