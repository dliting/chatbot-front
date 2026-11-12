import { defineConfig, devices } from '@playwright/test'
import { MOCK_PORT, tryRealEnvVars } from './tests/e2e/helpers/readChatappEnv'

/**
 * Playwright E2E test configuration
 * @see https://playwright.dev/docs/test-webserver
 *
 * Running E2E tests:
 *   Lib (floating mode):  npm run test:e2e:lib
 *   ChatApp (full app):   npm run test:e2e:chatapp
 *   ChatApp real backend: npm run test:e2e:real   (local Ollama required)
 *   All:                  npm run test:e2e
 *
 * Server topology is declared at the TOP LEVEL: `webServer` inside
 * projects[] is silently ignored by Playwright (per-project webServer
 * support is not available in the installed version) — the original
 * config carried it there for years, which is why "auto-start never
 * worked on Windows": it never ran at all, not an IPv4 issue.
 * All hosts are explicit IPv4 (127.0.0.1): `localhost` may resolve to
 * ::1 on Windows and miss an IPv4-bound server.
 */
const REAL_BACKEND = process.env.E2E_REAL === '1'
// real.env parsed once; REAL_BACKEND runs imply it is provisioned
const REAL_ENV = tryRealEnvVars()

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './tests/e2e/results/artifacts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never', outputFolder: './tests/e2e/results/report' }],
    ['list'],
  ],
  timeout: 30000,
  expect: {
    timeout: 5000,
  },

  // Top-level webServer array — starts for every run regardless of project
  // selection. Local runs reuse manually started servers; CI always starts
  // fresh and tears everything down on exit.
  webServer: [
    {
      // Host binding (127.0.0.1 + strictPort 5173) lives in vite.config.ts —
      // this command must not redeclare it
      command: 'node node_modules/vite/bin/vite.js',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
    {
      command: 'npm run dev',
      cwd: 'examples/chatapp/backend-mock',
      url: `http://127.0.0.1:${MOCK_PORT()}/sessions`,
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
    // Real backend + its Ollama connection are only paid when running the
    // real-mode suite (npm run test:e2e:real sets E2E_REAL=1), and only when
    // real.env is provisioned (gitignored — fresh clones copy the template)
    ...(REAL_BACKEND && REAL_ENV
      ? [{
          command: 'npm run dev',
          cwd: 'examples/chatapp/backend-real',
          url: `http://127.0.0.1:${REAL_ENV.PORT}/health`,
          reuseExistingServer: !process.env.CI,
          timeout: 30000,
        }]
      : []),
    {
      command: 'npm run dev',
      cwd: 'examples/chatapp/frontend',
      url: 'http://127.0.0.1:5180',
      // Real mode: never reuse a frontend started while real.env was absent —
      // its /api/real proxy would be missing and every real call would 404
      reuseExistingServer: REAL_BACKEND ? false : !process.env.CI,
      timeout: 30000,
      // Surface the vite banner (config diag line) in run output while
      // debugging the real-mode 404s; harmless to keep
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],

  projects: [
    {
      name: 'lib',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://127.0.0.1:5173',
      },
      testDir: './tests/e2e/lib',
    },
    {
      name: 'chatapp',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://127.0.0.1:5180',
      },
      testDir: './tests/e2e/chatapp',
    },
  ],
})
