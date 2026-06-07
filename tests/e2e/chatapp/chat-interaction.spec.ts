/**
 * E2E test for chat interaction - ChatApp full application
 * Tests functional interactions: text input, send button, message send/receive, quick actions.
 * Covers removed chrome-devtools-mcp/Puppeteer scenarios: TC-COMMON-001, TC-COMMON-003, TC-COMMON-004, TC-COMMON-022.
 *
 * Entry: examples/chatapp/frontend (port 5180, mock backend on port 3001)
 */
import { test, expect } from '@playwright/test'
import { cleanState } from './helpers'

test.describe('Chat Interaction - Extended Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await cleanState(page)
    await page.goto('/extended')
    await expect(page.locator('.chat-input')).toBeVisible({ timeout: 10000 })
  })

  test('should allow typing text into the input field (TC-COMMON-001)', async ({ page }) => {
    const textarea = page.locator('.chat-input__field')
    await expect(textarea).toBeVisible()

    // fill() is sufficient here — only checking the value, not Vue reactivity
    await textarea.fill('你好，这是一个测试消息')
    await expect(textarea).toHaveValue('你好，这是一个测试消息')
  })

  test('should have send button disabled when input is empty (TC-COMMON-003)', async ({ page }) => {
    const sendBtn = page.locator('.chat-input__send-btn')

    // Initially disabled (no text)
    await expect(sendBtn).toBeDisabled()

    // Type text - should become enabled (type() triggers Vue v-model)
    const textarea = page.locator('.chat-input__field')
    await textarea.type('测试消息')
    await expect(sendBtn).toBeEnabled()

    // Clear text - should become disabled again
    await textarea.clear()
    await expect(sendBtn).toBeDisabled()
  })

  test('should send message and receive mock response (TC-COMMON-004)', async ({ page }) => {
    const textarea = page.locator('.chat-input__field')
    const sendBtn = page.locator('.chat-input__send-btn')

    await textarea.type('Hi')
    await expect(sendBtn).toBeEnabled()
    await sendBtn.click()

    // .last() is safe: beforeEach ensures clean state with at most one user/assistant message pair
    const userMessage = page.locator('.chat-content__message.user .chat-content__text').last()
    await expect(userMessage).toContainText('Hi', { timeout: 10000 })

    const assistantMessage = page.locator('.chat-content__message.assistant .chat-content__text').last()
    await expect(assistantMessage).toBeVisible({ timeout: 30000 })

    const responseText = await assistantMessage.textContent()
    expect(responseText?.trim().length).toBeGreaterThan(0)
  })

  test('should send message with Enter key', async ({ page }) => {
    const textarea = page.locator('.chat-input__field')

    await textarea.type('使用Enter键发送')
    await textarea.press('Enter')

    const userMessage = page.locator('.chat-content__message.user .chat-content__text').last()
    await expect(userMessage).toContainText('使用Enter键发送', { timeout: 10000 })
  })

  test('should send message with Shift+Enter for newline', async ({ page }) => {
    const textarea = page.locator('.chat-input__field')
    const sendBtn = page.locator('.chat-input__send-btn')

    await textarea.type('第一行')
    await textarea.press('Shift+Enter')
    await page.keyboard.type('第二行')
    await sendBtn.click()

    const userMessage = page.locator('.chat-content__message.user .chat-content__text').last()
    await expect(userMessage).toContainText('第一行', { timeout: 10000 })
    await expect(userMessage).toContainText('第二行')
  })

  test('should send message when quick action is clicked (TC-COMMON-022)', async ({ page }) => {
    // Quick actions are visible on the welcome screen (beforeEach ensures clean state)
    const quickActions = page.locator('.chat-content__quick-action')
    await expect(quickActions.first()).toBeVisible({ timeout: 10000 })

    await expect(quickActions).toHaveCount(4)

    const firstAction = quickActions.first()
    await expect(firstAction).toContainText('写邮件')
    await firstAction.click()

    const userMessage = page.locator('.chat-content__message.user .chat-content__text').last()
    await expect(userMessage).toContainText('帮我写一封邮件', { timeout: 10000 })

    const welcome = page.locator('.chat-content__welcome')
    await expect(welcome).not.toBeVisible()
  })

  test('should upload image when upload button is clicked (TC-COMMON-012)', async ({ page }) => {
    const uploadBtn = page.locator('.chat-input__upload-btn')
    await expect(uploadBtn).toBeVisible()

    const fileChooserPromise = page.waitForEvent('filechooser')
    await uploadBtn.click()

    const fileChooser = await fileChooserPromise
    expect(fileChooser).toBeTruthy()
  })
})

test.describe('Chat Interaction - Floating Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await cleanState(page)
    await page.goto('/floating')
  })

  test('should allow typing and sending message in floating panel', async ({ page }) => {
    const ball = page.locator('.chatbot-ball')
    await expect(ball).toBeVisible({ timeout: 10000 })
    await ball.click()

    const window = page.locator('.draggable-window')
    await expect(window).toBeVisible({ timeout: 5000 })

    const textarea = window.locator('.chat-input__field')
    await expect(textarea).toBeVisible()
    await textarea.type('Hi')

    const sendBtn = window.locator('.chat-input__send-btn')
    await expect(sendBtn).toBeEnabled()
    await sendBtn.click()

    const userMessage = window.locator('.chat-content__message.user .chat-content__text').last()
    await expect(userMessage).toContainText('Hi', { timeout: 10000 })

    const assistantMessage = window.locator('.chat-content__message.assistant .chat-content__text').last()
    await expect(assistantMessage).toBeVisible({ timeout: 30000 })
  })

  test('should show quick actions in floating panel', async ({ page }) => {
    const ball = page.locator('.chatbot-ball')
    await expect(ball).toBeVisible({ timeout: 10000 })
    await ball.click()

    const window = page.locator('.draggable-window')
    await expect(window).toBeVisible({ timeout: 5000 })

    const quickActions = window.locator('.chat-content__quick-action')
    await expect(quickActions.first()).toBeVisible({ timeout: 10000 })
    await expect(quickActions).toHaveCount(4)
  })
})
