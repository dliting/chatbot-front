/**
 * E2E test for media upload and preview - ChatApp full application
 * Tests file upload, thumbnail preview, preview modal, file removal.
 * Covers removed chrome-devtools-mcp/Puppeteer scenarios: TC-COMMON-012, TC-COMMON-013, TC-COMMON-013B, TC-MEDIA-005.
 *
 * Entry: examples/chatapp/frontend (port 5180, mock backend on port 3001)
 */
import { test, expect } from '@playwright/test'

test.describe('Media Upload - Extended Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/extended')
    await expect(page.locator('.chat-input')).toBeVisible({ timeout: 10000 })
  })

  test('should upload image and show thumbnail preview (TC-COMMON-012)', async ({ page }) => {
    // Use setInputFiles to directly upload a test image
    const fileInput = page.locator('input[type="file"]')

    // Create a minimal PNG file (1x1 transparent pixel)
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==',
      'base64'
    )

    await fileInput.setInputFiles({
      name: 'test-image.png',
      mimeType: 'image/png',
      buffer: pngBuffer,
    })

    // Preview container should appear
    const previews = page.locator('.chat-input__previews')
    await expect(previews).toBeVisible()

    // Image thumbnail should be visible
    const imgPreview = page.locator('.chat-input__preview-img')
    await expect(imgPreview).toBeVisible()

    // Send button should be enabled even without text (file is selected)
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

    // Preview should appear
    await expect(page.locator('.chat-input__previews')).toBeVisible()

    // Click remove button
    const removeBtn = page.locator('.chat-input__preview-remove')
    await expect(removeBtn).toBeVisible()
    await removeBtn.click()

    // Previews should disappear
    await expect(page.locator('.chat-input__previews')).not.toBeVisible()

    // Send button should be disabled again (no text, no files)
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

    // Click on image thumbnail to open preview modal
    const imgPreview = page.locator('.chat-input__preview-img')
    await expect(imgPreview).toBeVisible()
    await imgPreview.click()

    // Preview modal should appear (teleported to body)
    const modal = page.locator('.file-preview-modal')
    await expect(modal).toBeVisible()

    // Modal title should contain filename
    const modalTitle = page.locator('.file-preview-modal__title')
    await expect(modalTitle).toContainText('test-image.png')

    // Modal content should have an image
    const modalContent = page.locator('.file-preview-modal__content')
    await expect(modalContent).toBeVisible()

    // Close modal via close button
    const closeBtn = page.locator('.file-preview-modal__close')
    await expect(closeBtn).toBeVisible()
    await closeBtn.click()

    // Modal should be hidden
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

    // Send button should be enabled with a file selected (no text needed)
    await expect(sendBtn).toBeEnabled()
  })

  test('should accept multiple file types', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]')

    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==',
      'base64'
    )

    // Upload multiple files
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

    // Two previews should appear
    const previews = page.locator('.chat-input__preview')
    await expect(previews).toHaveCount(2)
  })
})

test.describe('Media Upload - Floating Mode', () => {
  test('should upload image in floating panel', async ({ page }) => {
    await page.goto('/floating')

    // Open floating panel
    const ball = page.locator('.chatbot-ball')
    await expect(ball).toBeVisible({ timeout: 10000 })
    await ball.click()

    const window = page.locator('.draggable-window')
    await expect(window).toBeVisible({ timeout: 5000 })

    // Upload image
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

    // Preview should appear inside the floating window
    const previews = window.locator('.chat-input__previews')
    await expect(previews).toBeVisible()
    const imgPreview = window.locator('.chat-input__preview-img')
    await expect(imgPreview).toBeVisible()
  })
})
