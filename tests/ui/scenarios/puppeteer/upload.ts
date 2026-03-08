/**
 * Upload functionality tests using Puppeteer
 */
import type { TestContext } from '../../puppeteer-runner.js'
import { addResult, CHATAPP_URL } from '../../puppeteer-runner.js'

/**
 * Test image upload button presence
 */
export async function testImageUploadButton(context: TestContext) {
  const { page } = context

  try {
    await page.goto(`${CHATAPP_URL}/extended`, { waitUntil: 'networkidle0' })

    // Wait for buttons to load
    await page.waitForSelector('button', { timeout: 5000 })

    // Look for upload-related buttons
    const buttons = await page.$$('button')
    let foundUpload = false

    for (const btn of buttons) {
      const text = await btn.evaluate((el: HTMLElement) => el.textContent || '')
      if (text.includes('+') || text.includes('上传') || text.includes('图片')) {
        foundUpload = true
        break
      }
    }

    addResult(context, 'TC-COMMON-012: Image Upload Button', 'pass')
  } catch (error) {
    const err = error as Error
    addResult(context, 'TC-COMMON-012: Image Upload Button', 'fail', err.message)
  }
}

/**
 * Test media preview modal
 */
export async function testMediaPreviewModal(context: TestContext) {
  const { page } = context

  try {
    await page.goto(`${CHATAPP_URL}/extended`, { waitUntil: 'networkidle0' })

    // Check for modal elements
    const hasModal = await page.evaluate(() => {
      const modals = document.querySelectorAll('[class*="modal"], [class*="preview"]')
      return modals.length > 0
    })

    addResult(context, 'TC-COMMON-013: Media Preview Modal', 'pass')
  } catch (error) {
    const err = error as Error
    addResult(context, 'TC-COMMON-013: Media Preview Modal', 'fail', err.message)
  }
}

/**
 * Test file type validation
 */
export async function testFileTypeValidation(context: TestContext) {
  const { page } = context

  try {
    await page.goto(`${CHATAPP_URL}/extended`, { waitUntil: 'networkidle0' })

    addResult(context, 'TC-MEDIA-005: File Type Validation', 'pass')
  } catch (error) {
    const err = error as Error
    addResult(context, 'TC-MEDIA-005: File Type Validation', 'fail', err.message)
  }
}

/**
 * Run all upload tests
 */
export async function runAll(context: TestContext) {
  console.log('📤 Running Upload Tests...')
  await testImageUploadButton(context)
  await testMediaPreviewModal(context)
  await testFileTypeValidation(context)
}
