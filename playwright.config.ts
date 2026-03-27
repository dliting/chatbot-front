import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E test configuration
 * @see https://playwright.dev/docs/test-configuration
 *
 * Running E2E tests:
 *   Lib (floating mode):  npm run test:e2e:lib
 *   ChatApp (full app):   npm run test:e2e:chatapp
 *   All:                  npm run test:e2e
 *
 * Note: webServer auto-start may not work on Windows due to IPv4/IPv6 issues.
 * If tests fail with ERR_CONNECTION_REFUSED, start the dev server manually first.
 */
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

  projects: [
    {
      name: 'lib',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://127.0.0.1:5173',
      },
      testDir: './tests/e2e/lib',
      webServer: {
        command: 'node node_modules/vite/bin/vite.js --host',
        url: 'http://127.0.0.1:5173',
        reuseExistingServer: true,
        timeout: 30000,
      },
    },
    {
      name: 'chatapp',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:5180',
      },
      testDir: './tests/e2e/chatapp',
      webServer: [
        {
          command: 'npm run dev',
          cwd: 'examples/chatapp/backend-mock',
          url: 'http://localhost:3001',
          reuseExistingServer: true,
          timeout: 30000,
        },
        {
          command: 'npm run dev',
          cwd: 'examples/chatapp/frontend',
          url: 'http://localhost:5180',
          reuseExistingServer: true,
          timeout: 30000,
        },
      ],
    },
  ],
})
