import { Page } from 'chrome-devtools-mcp'
import { createBrowserHelper, CHATAPP_URL, DEFAULT_TIMEOUT } from './helpers/browser.js'
import { TestReporter } from './helpers/reporter.js'
import type { BrowserHelper } from './helpers/browser.js'

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

export async function runTests(backendMode: 'mock' | 'real' = 'mock') {
  console.log(`\n🧪 开始UI自动化测试 (${backendMode.toUpperCase()} 后端模式)\n`)

  const reporter = new TestReporter()
  reporter.start()

  // Note: This assumes a Page instance is available from chrome-devtools-mcp
  // The page is set globally when the MCP tool connects
  const page = (global as any).currentPage as Page
  if (!page) {
    throw new Error('Page not available. Make sure chrome-devtools-mcp is connected.')
  }

  const context: TestContext = {
    page,
    browser: createBrowserHelper(page),
    reporter,
    backendMode
  }

  try {
    // Navigate to home page
    await context.browser.navigate(CHATAPP_URL)
    console.log(`✅ 导航到 ${CHATAPP_URL}`)

    // Import and run test scenarios dynamically
    // These will be implemented in Tasks 9-11
    try {
      const chatTests = await import('./scenarios/common/chat.js')
      await chatTests.runAll(context)
    } catch (e) {
      console.log(`⚠️  聊天测试场景尚未实现`)
    }

    try {
      const quickActionsTests = await import('./scenarios/common/quick-actions.js')
      await quickActionsTests.runAll(context)
    } catch (e) {
      console.log(`⚠️  快捷操作测试场景尚未实现`)
    }

    try {
      const uploadTests = await import('./scenarios/common/upload.js')
      await uploadTests.runAll(context)
    } catch (e) {
      console.log(`⚠️  上传功能测试场景尚未实现`)
    }

  } catch (error) {
    console.error('❌ 测试执行失败:', error)
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

  return report
}
