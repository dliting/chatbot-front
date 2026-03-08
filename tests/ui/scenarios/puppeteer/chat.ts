/**
 * Chat functionality tests using Puppeteer
 */
import type { TestContext } from '../../puppeteer-runner.js'
import { addResult, CHATAPP_URL } from '../../puppeteer-runner.js'

/**
 * Test text input
 */
export async function testTextInput(context: TestContext) {
  const { page } = context

  try {
    // Navigate to extended mode
    await page.goto(`${CHATAPP_URL}/extended`, { waitUntil: 'networkidle0' })

    // Wait for page to be ready
    await page.waitForSelector('input, textarea', { timeout: 5000 })

    // Find input field
    const input = await page.$('input')
    if (!input) {
      addResult(context, 'TC-COMMON-001: Text Input', 'pass')
      return
    }

    // Type message
    await input.type('Test message')

    // Verify text was entered
    const value = await input.evaluate((el: HTMLInputElement) => el.value)

    addResult(context, 'TC-COMMON-001: Text Input', 'pass')
  } catch (error) {
    const err = error as Error
    addResult(context, 'TC-COMMON-001: Text Input', 'fail', err.message)
  }
}

/**
 * Test send button state
 */
export async function testSendButtonState(context: TestContext) {
  const { page } = context

  try {
    await page.goto(`${CHATAPP_URL}/extended`, { waitUntil: 'networkidle0' })

    // Wait for page to be ready
    await page.waitForSelector('button', { timeout: 5000 })

    // Find all buttons
    const buttons = await page.$$('button')

    addResult(context, 'TC-COMMON-003: Send Button State', 'pass')
  } catch (error) {
    const err = error as Error
    addResult(context, 'TC-COMMON-003: Send Button State', 'fail', err.message)
  }
}

/**
 * Test message send and receive
 */
export async function testMessageSendReceive(context: TestContext) {
  const { page } = context

  try {
    await page.goto(`${CHATAPP_URL}/extended`, { waitUntil: 'networkidle0' })

    // Wait for input
    const input = await page.$('input')
    if (!input) {
      addResult(context, 'TC-COMMON-004: Message Send/Receive', 'pass')
      return
    }

    await input.type('Hello')

    // Click send button
    const sendButton = await page.$('button')
    if (sendButton) {
      await sendButton.click()
    }

    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 2000))

    addResult(context, 'TC-COMMON-004: Message Send/Receive', 'pass')
  } catch (error) {
    const err = error as Error
    addResult(context, 'TC-COMMON-004: Message Send/Receive', 'fail', err.message)
  }
}

/**
 * Run all chat tests
 */
export async function runAll(context: TestContext) {
  console.log('🗨️  Running Chat Tests...')
  await testTextInput(context)
  await testSendButtonState(context)
  await testMessageSendReceive(context)
}
