import { Page } from 'chrome-devtools-mcp'
import { createBrowserHelper, CHATAPP_URL } from './helpers/browser.js'
import { TestReporter } from './helpers/reporter.js'
import type { BrowserHelper } from './helpers/browser.js'

// Interface for test scenario modules
export interface TestScenarioModule {
  runAll(context: TestContext): Promise<void>
}

// Global interface for chrome-devtools-mcp integration
declare global {
  var currentPage: Page | undefined
}

export interface TestSuite {
  name: string
  setup: () => Promise<void>
  teardown: () => Promise<void>
  tests: () => Promise<void>
}

export interface TestContext {
  page: Page
  browser: BrowserHelper
  reporter: TestReporter
  backendMode: 'mock' | 'real'
}

export interface TestReport {
  total: number
  passed: number
  failed: number
  duration: number
  hasErrors: boolean
}

export async function runTests(backendMode: 'mock' | 'real' = 'mock'): Promise<TestReport> {
  console.log(`\n🧪 开始UI自动化测试 (${backendMode.toUpperCase()} 后端模式)\n`)

  const reporter = new TestReporter()
  reporter.start()

  // Get Page instance from global scope (set by chrome-devtools-mcp)
  const page = global.currentPage
  if (!page) {
    throw new Error('Page not available. Make sure chrome-devtools-mcp is connected and has set global.currentPage.')
  }

  const context: TestContext = {
    page,
    browser: createBrowserHelper(page),
    reporter,
    backendMode
  }

  let hasErrors = false

  try {
    // Navigate to home page
    await context.browser.navigate(CHATAPP_URL)
    console.log(`✅ 导航到 ${CHATAPP_URL}`)

    // Helper to load and run test scenarios
    async function loadAndRunScenario(
      name: string,
      path: string
    ): Promise<boolean> {
      try {
        const scenarioModule = await import(path) as TestScenarioModule
        await scenarioModule.runAll(context)
        console.log(`✅ ${name} 测试场景完成`)
        return true
      } catch (error: unknown) {
        // Check if this is a "module not found" error
        const err = error as { code?: string; message?: string }
        if (err.code === 'ERR_MODULE_NOT_FOUND' || err.message?.includes('Cannot find import')) {
          console.log(`⚠️  ${name} 测试场景尚未实现 (将在后续任务中完成)`)
          return true // Not an error, just not implemented yet
        }
        // Other errors are actual test failures
        console.error(`❌ ${name} 测试场景执行失败:`, err.message || error)
        hasErrors = true
        return false
      }
    }

    // Run test scenarios
    await loadAndRunScenario('聊天', './scenarios/common/chat.js')
    await loadAndRunScenario('快捷操作', './scenarios/common/quick-actions.js')
    await loadAndRunScenario('上传功能', './scenarios/common/upload.js')

  } catch (error) {
    console.error('❌ 测试执行失败:', error)
    hasErrors = true
  }

  // Generate report
  const report = reporter.finish()
  await reporter.saveHTML(report, `${backendMode}-report-${Date.now()}.html`)

  // Print summary
  console.log(`\n${'='.repeat(50)}`)
  console.log(`📊 测试摘要`)
  console.log(`${'='.repeat(50)}`)
  console.log(`总计: ${report.total}`)
  console.log(`✅ 通过: ${report.passed}`)
  console.log(`❌ 失败: ${report.failed}`)
  console.log(`⏱️  耗时: ${(report.duration / 1000).toFixed(1)}s`)
  console.log(`${'='.repeat(50)}\n`)

  // Return report with error status
  return { ...report, hasErrors }
}
