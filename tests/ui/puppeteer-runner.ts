/**
 * Puppeteer-based UI Test Runner
 * Run UI tests using Puppeteer instead of chrome-devtools-mcp
 */
import puppeteer, { Browser, Page } from 'puppeteer'
import path from 'path'

export const CHATAPP_URL = 'http://localhost:5180'
export const DEFAULT_TIMEOUT = 30000

export interface TestContext {
  browser: Browser
  page: Page
  results: TestResult[]
  startTime: number
}

export interface TestResult {
  name: string
  status: 'pass' | 'fail' | 'skip'
  duration: number
  error?: string
  screenshot?: string
}

interface ScenarioModule {
  runAll(context: TestContext): Promise<void>
}

/**
 * Create browser helper functions
 */
export function createBrowserHelper(page: Page) {
  return {
    async navigate(url: string) {
      await page.goto(url, { waitUntil: 'networkidle0', timeout: DEFAULT_TIMEOUT })
    },

    async takeSnapshot() {
      // Return page content as JSON
      const title = await page.title()
      const url = page.url()
      const content = await page.content()
      return JSON.stringify({ title, url, content })
    },

    async click(selector: string) {
      await page.click(selector)
    },

    async fill(selector: string, value: string) {
      await page.fill(selector, value)
    },

    async waitForText(text: string, timeout = DEFAULT_TIMEOUT) {
      try {
        await page.waitForFunction(
          (t: string) => document.body.innerText.includes(t),
          { timeout },
          text
        )
        return true
      } catch {
        return false
      }
    },

    async waitFor(selector: string, timeout = DEFAULT_TIMEOUT) {
      try {
        await page.waitForSelector(selector, { timeout })
        return true
      } catch {
        return false
      }
    },

    async screenshot() {
      return await page.screenshot({ encoding: 'base64' })
    },

    async evaluate<T>(fn: () => T): Promise<T> {
      return await page.evaluate(fn)
    },

    async getText(selector: string): Promise<string> {
      const text = await page.textContent(selector)
      return text || ''
    },

    async isVisible(selector: string): Promise<boolean> {
      const isVisible = await page.evaluate((s: string) => {
        const el = document.querySelector(s)
        if (!el) return false
        const style = window.getComputedStyle(el)
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0'
      }, selector)
      return isVisible
    }
  }
}

/**
 * Run tests with Puppeteer
 */
export async function runTests(backendMode: 'mock' | 'real' = 'mock'): Promise<void> {
  console.log(`\n🧪 Starting Puppeteer UI Tests (${backendMode.toUpperCase()} mode)\n`)

  const results: TestResult[] = []
  const startTime = Date.now()

  let browser: Browser | null = null

  try {
    // Launch browser
    console.log('� Browser: Launching...')
    browser = await puppeteer.launch({
      headless: false, // Show browser for visual testing
      defaultViewport: { width: 1280, height: 720 },
      args: ['--start-maximized']
    })

    const page = await browser.newPage()
    const helper = createBrowserHelper(page)

    const context: TestContext = {
      browser,
      page,
      results,
      startTime
    }

    // Navigate to app
    console.log(`🌐 Navigating to ${CHATAPP_URL}...`)
    await helper.navigate(CHATAPP_URL)
    console.log('✅ Page loaded\n')

    // Test scenarios to run
    const scenarios: { name: string; path: string }[] = [
      { name: 'Chat', path: './scenarios/puppeteer/chat.js' },
      { name: 'Upload', path: './scenarios/puppeteer/upload.js' },
      { name: 'Navigation', path: './scenarios/puppeteer/navigation.js' },
      { name: 'Multimedia', path: './scenarios/puppeteer/multimedia.js' },
    ]

    // Run each scenario
    for (const scenario of scenarios) {
      try {
        console.log(`📋 Running: ${scenario.name}...`)

        // Try both .js and .ts extensions
        let module: ScenarioModule | undefined
        try {
          module = await import(scenario.path) as ScenarioModule
        } catch {
          // Try with .ts extension
          const tsPath = scenario.path.replace('.js', '.ts')
          module = await import(tsPath) as ScenarioModule
        }

        if (module) {
          await module.runAll(context)
          console.log(`✅ ${scenario.name} completed\n`)
        } else {
          console.log(`⚠️  ${scenario.name} not found\n`)
        }
      } catch (error) {
        const err = error as Error
        console.log(`⚠️  ${scenario.name}: ${err.message}\n`)
      }
    }

  } catch (error) {
    console.error('❌ Test execution failed:', error)
  } finally {
    if (browser) {
      await browser.close()
    }
  }

  // Print summary
  const duration = Date.now() - startTime
  const passed = results.filter(r => r.status === 'pass').length
  const failed = results.filter(r => r.status === 'fail').length

  console.log(`\n${'='.repeat(50)}`)
  console.log(`📊 Test Summary`)
  console.log(`${'='.repeat(50)}`)
  console.log(`Total: ${results.length}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)

  if (failed > 0) {
    console.log(`\nFailed tests:`)
    results.filter(r => r.status === 'fail').forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`)
    })
  }

  console.log(`⏱️  Duration: ${(duration / 1000).toFixed(1)}s`)
  console.log(`${'='.repeat(50)}\n`)
}

/**
 * Add test result
 */
export function addResult(context: TestContext, name: string, status: 'pass' | 'fail' | 'skip', error?: string) {
  context.results.push({
    name,
    status,
    duration: Date.now() - context.startTime,
    error
  })
}

// Run if executed directly
const args = process.argv.slice(2)
const mode = args[0] === 'real' ? 'real' : 'mock'
runTests(mode).catch(console.error)
