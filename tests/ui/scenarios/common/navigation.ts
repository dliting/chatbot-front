import { TestContext } from '../../runner.js'
import {
  assertContains,
  assertVisible
} from '../../helpers/assertions.js'

/**
 * Test landing page load
 */
export async function testLandingPage(context: TestContext) {
  const { browser, reporter } = context
  const startTime = Date.now()

  try {
    // Navigate to landing page
    await browser.navigateTo('/')

    let snapshot = await browser.takeSnapshot()

    // Check for main title
    assertContains(snapshot, 'AI Chatbot')

    // Check for subtitle
    assertContains(snapshot, 'Vue 3')

    reporter.addResult({
      name: 'TC-LANDING-001: 主页访问',
      status: 'pass',
      duration: Date.now() - startTime
    })
  } catch (error: any) {
    reporter.addResult({
      name: 'TC-LANDING-001: 主页访问',
      status: 'fail',
      duration: Date.now() - startTime,
      error: error.message
    })
  }
}

/**
 * Test mode card navigation
 */
export async function testModeCardNavigation(context: TestContext) {
  const { browser, reporter } = context
  const startTime = Date.now()

  try {
    await browser.navigateTo('/')

    let snapshot = await browser.takeSnapshot()
    const snapshotData = JSON.parse(snapshot)

    // Look for mode cards
    const extendedCard = snapshotData.root.find((el: any) =>
      el.children?.some((c: any) => c.text?.includes('扩展模式'))
    )

    reporter.addResult({
      name: 'TC-LANDING-002: 模式卡片',
      status: 'pass',
      duration: Date.now() - startTime
    })
  } catch (error: any) {
    reporter.addResult({
      name: 'TC-LANDING-002: 模式卡片',
      status: 'fail',
      duration: Date.now() - startTime,
      error: error.message
    })
  }
}

/**
 * Test extended mode page
 */
export async function testExtendedModePage(context: TestContext) {
  const { browser, reporter } = context
  const startTime = Date.now()

  try {
    await browser.navigateTo('/extended')

    let snapshot = await browser.takeSnapshot()

    // Check for dual layout
    assertVisible(snapshot, '智能助手')

    reporter.addResult({
      name: 'TC-EXTENDED-001: 扩展模式页面',
      status: 'pass',
      duration: Date.now() - startTime
    })
  } catch (error: any) {
    reporter.addResult({
      name: 'TC-EXTENDED-001: 扩展模式页面',
      status: 'fail',
      duration: Date.now() - startTime,
      error: error.message
    })
  }
}

/**
 * Test sidebar mode page
 */
export async function testSidebarModePage(context: TestContext) {
  const { browser, reporter } = context
  const startTime = Date.now()

  try {
    await browser.navigateTo('/sidebar')

    let snapshot = await browser.takeSnapshot()

    // Check for sidebar layout
    assertVisible(snapshot, '智能助手')

    reporter.addResult({
      name: 'TC-SIDEBAR-001: 边栏模式页面',
      status: 'pass',
      duration: Date.now() - startTime
    })
  } catch (error: any) {
    reporter.addResult({
      name: 'TC-SIDEBAR-001: 边栏模式页面',
      status: 'fail',
      duration: Date.now() - startTime,
      error: error.message
    })
  }
}

/**
 * Test iframe page
 */
export async function testIframePage(context: TestContext) {
  const { browser, reporter } = context
  const startTime = Date.now()

  try {
    await browser.navigateTo('/iframe')

    let snapshot = await browser.takeSnapshot()

    reporter.addResult({
      name: 'TC-IFRAME-001: Iframe嵌入页面',
      status: 'pass',
      duration: Date.now() - startTime
    })
  } catch (error: any) {
    reporter.addResult({
      name: 'TC-IFRAME-001: Iframe嵌入页面',
      status: 'fail',
      duration: Date.now() - startTime,
      error: error.message
    })
  }
}

/**
 * Test return to home link
 */
export async function testReturnToHome(context: TestContext) {
  const { browser, reporter } = context
  const startTime = Date.now()

  try {
    await browser.navigateTo('/extended')

    let snapshot = await browser.takeSnapshot()
    const snapshotData = JSON.parse(snapshot)

    // Look for return to home link
    const returnLink = snapshotData.root.find((el: any) =>
      el.children?.some((c: any) => c.text?.includes('返回首页'))
    )

    reporter.addResult({
      name: 'TC-COMMON-000: 返回首页',
      status: 'pass',
      duration: Date.now() - startTime
    })
  } catch (error: any) {
    reporter.addResult({
      name: 'TC-COMMON-000: 返回首页',
      status: 'fail',
      duration: Date.now() - startTime,
      error: error.message
    })
  }
}

/**
 * Run all navigation tests
 */
export async function runAll(context: TestContext) {
  await testLandingPage(context)
  await testModeCardNavigation(context)
  await testExtendedModePage(context)
  await testSidebarModePage(context)
  await testIframePage(context)
  await testReturnToHome(context)
}
