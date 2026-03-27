/**
 * E2E test for chat interaction - ChatApp full application
 * Tests functional interactions: text input, send button, message send/receive, quick actions.
 * Covers removed chrome-devtools-mcp/Puppeteer scenarios: TC-COMMON-001, TC-COMMON-003, TC-COMMON-004, TC-COMMON-022.
 *
 * Entry: examples/chatapp/frontend (port 5180, mock backend on port 3001)
 */
import { test, expect } from '@playwright/test'

test.describe('Chat Interaction - Extended Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/extended')
    // Wait for the page to fully load
    await expect(page.locator('.chat-input')).toBeVisible({ timeout: 10000 })
  })

  test('should allow typing text into the input field (TC-COMMON-001)', async ({ page }) => {
    const textarea = page.locator('.chat-input__field')
    await expect(textarea).toBeVisible()

    // Type a message
    await textarea.fill('你好，这是一个测试消息')
    await expect(textarea).toHaveValue('你好，这是一个测试消息')
  })

  test('should have send button disabled when input is empty (TC-COMMON-003)', async ({ page }) => {
    const sendBtn = page.locator('.chat-input__send-btn')

    // Initially disabled (no text)
    await expect(sendBtn).toBeDisabled()

    // Type text - should become enabled
    const textarea = page.locator('.chat-input__field')
    await textarea.fill('测试消息')
    await expect(sendBtn).toBeEnabled()

    // Clear text - should become disabled again
    await textarea.clear()
    await expect(sendBtn).toBeDisabled()
  })

  test('should send message and receive mock response (TC-COMMON-004)', async ({ page }) => {
    const textarea = page.locator('.chat-input__field')
    const sendBtn = page.locator('.chat-input__send-btn')

    // Type and send a message
    await textarea.fill('Hi')
    await sendBtn.click()

    // Wait for the user message to appear in the message list
    const userMessage = page.locator('.chat-content__message.user .chat-content__text')
    await expect(userMessage).toContainText('Hi', { timeout: 10000 })

    // Wait for the assistant response (mock backend streams response ~400 chars at 20-50ms each)
    // Use 30s timeout to account for streaming + proxy overhead
    const assistantMessage = page.locator('.chat-content__message.assistant .chat-content__text')
    await expect(assistantMessage).toBeVisible({ timeout: 30000 })

    // The response should contain some content (not empty)
    const responseText = await assistantMessage.textContent()
    expect(responseText?.trim().length).toBeGreaterThan(0)
  })

  test('should send message with Enter key', async ({ page }) => {
    const textarea = page.locator('.chat-input__field')

    await textarea.fill('使用Enter键发送')
    await textarea.press('Enter')

    // Verify user message appears
    const userMessage = page.locator('.chat-content__message.user .chat-content__text')
    await expect(userMessage).toContainText('使用Enter键发送', { timeout: 10000 })
  })

  test('should send message with Shift+Enter for newline', async ({ page }) => {
    const textarea = page.locator('.chat-input__field')
    const sendBtn = page.locator('.chat-input__send-btn')

    // Type first line
    await textarea.fill('第一行')
    // Shift+Enter for newline
    await textarea.press('Shift+Enter')
    // Type second line
    await page.keyboard.type('第二行')
    await sendBtn.click()

    // Verify the message contains both lines
    const userMessage = page.locator('.chat-content__message.user .chat-content__text')
    await expect(userMessage).toContainText('第一行', { timeout: 10000 })
    await expect(userMessage).toContainText('第二行')
  })

  test('should send message when quick action is clicked (TC-COMMON-022)', async ({ page }) => {
    // Quick actions should be visible on the welcome screen
    const quickActions = page.locator('.chat-content__quick-action')
    await expect(quickActions.first()).toBeVisible()

    // There should be 4 quick actions
    await expect(quickActions).toHaveCount(4)

    // Click the first quick action ("写邮件") - this directly sends a message
    const firstAction = quickActions.first()
    await expect(firstAction).toContainText('写邮件')
    await firstAction.click()

    // The user message should appear (quick action sends "帮我写一封邮件" directly)
    const userMessage = page.locator('.chat-content__message.user .chat-content__text')
    await expect(userMessage).toContainText('帮我写一封邮件', { timeout: 10000 })

    // Welcome section should be hidden after sending a message
    const welcome = page.locator('.chat-content__welcome')
    await expect(welcome).not.toBeVisible()
  })

  test('should upload image when upload button is clicked (TC-COMMON-012)', async ({ page }) => {
    const uploadBtn = page.locator('.chat-input__upload-btn')
    await expect(uploadBtn).toBeVisible()

    // Set up file chooser listener before clicking
    const fileChooserPromise = page.waitForEvent('filechooser')

    await uploadBtn.click()

    // File chooser should appear
    const fileChooser = await fileChooserPromise
    expect(fileChooser).toBeTruthy()
  })
})

test.describe('Chat Interaction - Floating Mode', () => {
  test('should allow typing and sending message in floating panel', async ({ page }) => {
    await page.goto('/floating')

    // Open the panel
    const ball = page.locator('.chatbot-ball')
    await expect(ball).toBeVisible({ timeout: 10000 })
    await ball.click()

    const window = page.locator('.draggable-window')
    await expect(window).toBeVisible({ timeout: 5000 })

    // Type in input
    const textarea = window.locator('.chat-input__field')
    await expect(textarea).toBeVisible()
    await textarea.fill('Hi')

    // Send button should be enabled
    const sendBtn = window.locator('.chat-input__send-btn')
    await expect(sendBtn).toBeEnabled()

    // Send the message
    await sendBtn.click()

    // User message should appear
    const userMessage = window.locator('.chat-content__message.user .chat-content__text')
    await expect(userMessage).toContainText('Hi', { timeout: 10000 })

    // Assistant response should appear (use short message to minimize stream time)
    const assistantMessage = window.locator('.chat-content__message.assistant .chat-content__text')
    await expect(assistantMessage).toBeVisible({ timeout: 30000 })
  })

  test('should show quick actions in floating panel', async ({ page }) => {
    await page.goto('/floating')

    const ball = page.locator('.chatbot-ball')
    await expect(ball).toBeVisible({ timeout: 10000 })
    await ball.click()

    const window = page.locator('.draggable-window')
    await expect(window).toBeVisible({ timeout: 5000 })

    // Quick actions should be visible
    const quickActions = window.locator('.chat-content__quick-action')
    await expect(quickActions).toHaveCount(4)
  })
})
