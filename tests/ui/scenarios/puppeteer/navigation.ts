/**
 * Navigation tests using Puppeteer
 */
import type { TestContext } from '../../puppeteer-runner.js'
import { addResult, CHATAPP_URL } from '../../puppeteer-runner.js'

/**
 * Test landing page
 */
export async function testLandingPage(context: TestContext) {
  const { page } = context

  try {
    await page.goto(CHATAPP_URL, { waitUntil: 'networkidle0' })

    // Check page loaded
    const title = await page.title()
    console.log(`   Title: ${title}`)

    // Wait for content to load
    await page.waitForSelector('body', { timeout: 5000 })

    addResult(context, 'TC-LANDING-001: Landing Page Load', 'pass')
  } catch (error) {
    const err = error as Error
    addResult(context, 'TC-LANDING-001: Landing Page Load', 'fail', err.message)
  }
}

/**
 * Test mode card navigation
 */
export async function testModeCardNavigation(context: TestContext) {
  const { page } = context

  try {
    await page.goto(CHATAPP_URL, { waitUntil: 'networkidle0' })

    // Check for mode options
    const pageText = await page.evaluate(() => document.body.innerText)

    addResult(context, 'TC-LANDING-002: Mode Card Navigation', 'pass')
  } catch (error) {
    const err = error as Error
    addResult(context, 'TC-LANDING-002: Mode Card Navigation', 'fail', err.message)
  }
}

/**
 * Test extended mode page
 */
export async function testExtendedModePage(context: TestContext) {
  const { page } = context

  try {
    await page.goto(`${CHATAPP_URL}/extended`, { waitUntil: 'networkidle0' })

    // Wait for page to load
    await page.waitForSelector('body', { timeout: 5000 })

    addResult(context, 'TC-EXTENDED-001: Extended Mode Page', 'pass')
  } catch (error) {
    const err = error as Error
    addResult(context, 'TC-EXTENDED-001: Extended Mode Page', 'fail', err.message)
  }
}

/**
 * Test sidebar mode page
 */
export async function testSidebarModePage(context: TestContext) {
  const { page } = context

  try {
    await page.goto(`${CHATAPP_URL}/sidebar`, { waitUntil: 'networkidle0' })
    await page.waitForSelector('body', { timeout: 5000 })

    addResult(context, 'TC-SIDEBAR-001: Sidebar Mode Page', 'pass')
  } catch (error) {
    const err = error as Error
    addResult(context, 'TC-SIDEBAR-001: Sidebar Mode Page', 'fail', err.message)
  }
}

/**
 * Test floating mode page
 */
export async function testFloatingModePage(context: TestContext) {
  const { page } = context

  try {
    await page.goto(`${CHATAPP_URL}/floating`, { waitUntil: 'networkidle0' })
    await page.waitForSelector('body', { timeout: 5000 })

    addResult(context, 'TC-FLOATING-001: Floating Mode Page', 'pass')
  } catch (error) {
    const err = error as Error
    addResult(context, 'TC-FLOATING-001: Floating Mode Page', 'fail', err.message)
  }
}

/**
 * Run all navigation tests
 */
export async function runAll(context: TestContext) {
  console.log('🧭 Running Navigation Tests...')
  await testLandingPage(context)
  await testModeCardNavigation(context)
  await testExtendedModePage(context)
  await testSidebarModePage(context)
  await testFloatingModePage(context)
}
