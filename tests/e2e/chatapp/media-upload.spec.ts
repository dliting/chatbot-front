/**
 * E2E test for media upload and preview - ChatApp full application
 * Tests file upload, thumbnail preview, preview modal, file removal.
 * Covers removed chrome-devtools-mcp/Puppeteer scenarios: TC-COMMON-012, TC-COMMON-013, TC-COMMON-013B, TC-MEDIA-005.
 *
 * Entry: examples/chatapp/frontend (port 5180, mock backend on port 3001)
 */
import { test, expect } from '@playwright/test'
import { cleanState } from './helpers'

test.describe('Media Upload - Extended Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await cleanState(page)
    await page.goto('/extended')
    await expect(page.locator('.chat-input')).toBeVisible({ timeout: 10000 })
  })

  test('should upload image and show thumbnail preview (TC-COMMON-012)', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]')

    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==',
      'base64'
    )

    await fileInput.setInputFiles({
      name: 'test-image.png',
      mimeType: 'image/png',
      buffer: pngBuffer,
    })

    const previews = page.locator('.chat-input__previews')
    await expect(previews).toBeVisible()

    const imgPreview = page.locator('.chat-input__preview-img')
    await expect(imgPreview).toBeVisible()

    const sendBtn = page.locator('.chat-input__send-btn')
    await expect(sendBtn).toBeEnabled()
  })

  test('should remove uploaded file from preview (TC-COMMON-013)', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]')

    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==',
      'base64'
    )

    await fileInput.setInputFiles({
      name: 'test-image.png',
      mimeType: 'image/png',
      buffer: pngBuffer,
    })

    await expect(page.locator('.chat-input__previews')).toBeVisible()

    const removeBtn = page.locator('.chat-input__preview-remove')
    await expect(removeBtn).toBeVisible()
    await removeBtn.click()

    await expect(page.locator('.chat-input__previews')).not.toBeVisible()

    const sendBtn = page.locator('.chat-input__send-btn')
    await expect(sendBtn).toBeDisabled()
  })

  test('should open preview modal when clicking thumbnail (TC-COMMON-013B)', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]')

    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==',
      'base64'
    )

    await fileInput.setInputFiles({
      name: 'test-image.png',
      mimeType: 'image/png',
      buffer: pngBuffer,
    })

    const imgPreview = page.locator('.chat-input__preview-img')
    await expect(imgPreview).toBeVisible()
    await imgPreview.click()

    const modal = page.locator('.file-preview-modal')
    await expect(modal).toBeVisible()

    const modalTitle = page.locator('.file-preview-modal__title')
    await expect(modalTitle).toContainText('test-image.png')

    const modalContent = page.locator('.file-preview-modal__content')
    await expect(modalContent).toBeVisible()

    const closeBtn = page.locator('.file-preview-modal__close')
    await expect(closeBtn).toBeVisible()
    await closeBtn.click()

    await expect(modal).not.toBeVisible()
  })

  test('should have send button enabled when file is selected without text', async ({ page }) => {
    const sendBtn = page.locator('.chat-input__send-btn')
    await expect(sendBtn).toBeDisabled()

    const fileInput = page.locator('input[type="file"]')

    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==',
      'base64'
    )

    await fileInput.setInputFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer: pngBuffer,
    })

    await expect(sendBtn).toBeEnabled()
  })

  test('should accept multiple file types', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]')

    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==',
      'base64'
    )

    await fileInput.setInputFiles([
      {
        name: 'image1.png',
        mimeType: 'image/png',
        buffer: pngBuffer,
      },
      {
        name: 'image2.png',
        mimeType: 'image/png',
        buffer: pngBuffer,
      },
    ])

    const previews = page.locator('.chat-input__preview')
    await expect(previews).toHaveCount(2)
  })
})

test.describe('Media Upload - Floating Mode', () => {
  test('should upload image in floating panel', async ({ page }) => {
    await page.goto('/')
    await cleanState(page)
    await page.goto('/floating')

    const ball = page.locator('.chatbot-ball')
    await expect(ball).toBeVisible({ timeout: 10000 })
    await ball.click()

    const window = page.locator('.draggable-window')
    await expect(window).toBeVisible({ timeout: 5000 })

    const fileInput = window.locator('input[type="file"]')
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==',
      'base64'
    )

    await fileInput.setInputFiles({
      name: 'float-test.png',
      mimeType: 'image/png',
      buffer: pngBuffer,
    })

    const previews = window.locator('.chat-input__previews')
    await expect(previews).toBeVisible()
    const imgPreview = window.locator('.chat-input__preview-img')
    await expect(imgPreview).toBeVisible()
  })
})