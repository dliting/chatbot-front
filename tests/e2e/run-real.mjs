/**
 * Cross-platform launcher for the real-backend E2E suite.
 * Sets E2E_REAL=1 (the playwright.config gates the backend-real webServer and
 * the spec's skip conditions on it) and delegates to the Playwright CLI.
 * Usage: npm run test:e2e:real
 *
 * Note: spawnSync uses shell:true on win32 — safe because none of the fixed
 * arguments contain spaces; keep it that way (or switch to an argv array).
 */
process.env.E2E_REAL = '1'

const { spawnSync } = await import('node:child_process')

const result = spawnSync(
  'npx',
  // workers=1: concurrent real chats + the ASR model load would thrash Ollama
  // (loading one model evicts the other even with keep_alive) — serialize
  ['playwright', 'test', '--project=chatapp', 'tests/e2e/chatapp/real-backend.spec.ts', '--workers=1'],
  { stdio: 'inherit', shell: process.platform === 'win32' }
)
process.exit(result.status ?? 1)
