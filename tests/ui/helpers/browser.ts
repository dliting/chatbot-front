import type { Page } from 'chrome-devtools-mcp'
import { sleep } from '@/utils/helpers'

export const DEFAULT_TIMEOUT = 5000
export const POLL_INTERVAL = 100
export const CHATAPP_URL = 'http://localhost:5180'

export interface BrowserHelper {
  navigate: (url: string) => Promise<void>
  takeSnapshot: () => Promise<string>
  click: (uid: string) => Promise<void>
  fill: (uid: string, value: string) => Promise<void>
  waitForText: (text: string, timeout?: number) => Promise<boolean>
  waitFor: (selector: string, timeout?: number) => Promise<boolean>
  screenshot: (path?: string) => Promise<string>
  executeScript: (fn: string, ...args: any[]) => Promise<any>
  listConsoleMessages: () => Promise<any[]>
  listNetworkRequests: () => Promise<any[]>
}

function createBrowserHelper(page: Page): BrowserHelper {
  // Private helper for polling
  async function poll(condition: () => Promise<boolean>, timeout = DEFAULT_TIMEOUT): Promise<boolean> {
    const startTime = Date.now()
    while (Date.now() - startTime < timeout) {
      if (await condition()) return true
      await sleep(POLL_INTERVAL)
    }
    return false
  }

  return {
    async navigate(url: string) {
      await page.navigate({ type: 'url', url })
    },

    async takeSnapshot() {
      const snapshot = await page.takeSnapshot()
      return JSON.stringify(snapshot)
    },

    async click(uid: string) {
      await page.click({ uid })
    },

    async fill(uid: string, value: string) {
      await page.fill({ uid, value })
    },

    async waitForText(text: string, timeout = DEFAULT_TIMEOUT) {
      return poll(async () => {
        const snapshot = await page.takeSnapshot()
        const snapshotText = JSON.stringify(snapshot)
        return snapshotText.includes(text)
      }, timeout)
    },

    async waitFor(selector: string, timeout = DEFAULT_TIMEOUT) {
      return poll(async () => {
        const snapshot = await page.takeSnapshot()
        const snapshotText = JSON.stringify(snapshot)
        return snapshotText.includes(selector)
      }, timeout)
    },

    async screenshot(path) {
      const result = await page.takeScreenshot({ filePath: path })
      return result
    },

    async executeScript(fn, ...args) {
      const result = await page.evaluate_script({ function: fn, args })
      return result
    },

    async listConsoleMessages() {
      const messages = await page.list_console_messages({ types: ['error', 'warn'] })
      return messages
    },

    async listNetworkRequests() {
      const requests = await page.list_network_requests()
      return requests
    }
  }
}

export { createBrowserHelper }
