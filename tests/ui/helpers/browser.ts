import type { Page } from 'chrome-devtools-mcp'

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

export function createBrowserHelper(page: Page): BrowserHelper {
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

    async waitForText(text: string, timeout = 5000) {
      const startTime = Date.now()
      while (Date.now() - startTime < timeout) {
        const snapshot = await page.takeSnapshot()
        const snapshotText = JSON.stringify(snapshot)
        if (snapshotText.includes(text)) return true
        await new Promise(r => setTimeout(r, 100))
      }
      return false
    },

    async waitFor(selector: string, timeout = 5000) {
      const startTime = Date.now()
      while (Date.now() - startTime < timeout) {
        const snapshot = await page.takeSnapshot()
        const snapshotText = JSON.stringify(snapshot)
        if (snapshotText.includes(selector)) return true
        await new Promise(r => setTimeout(r, 100))
      }
      return false
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

export const CHATAPP_URL = 'http://localhost:5180'
