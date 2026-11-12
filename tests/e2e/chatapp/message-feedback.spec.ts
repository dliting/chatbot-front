/**
 * Mock-mode E2E for subproject-⑨ message feedback (👍/👎):
 * button visibility, exclusive toggle, deselect, REST persistence round-trip,
 * and default-off opt-in behavior.
 */
import { test, expect, type Page } from '@playwright/test'
import { cleanState } from './helpers'

const UP_BTN = '.chatbot-message__action-btn--feedback-up'
const DOWN_BTN = '.chatbot-message__action-btn--feedback-down'

/** Send one message and wait for the assistant reply to reach a terminal status */
async function chatOnce(page: Page, text: string) {
  const input = page.locator('textarea').first()
  await input.fill(text)
  await input.press('Enter')
  // Mock backend streams with ~20s thinking simulation — wait for status class, not just visibility
  await expect(
    page.locator('.chatbot-message--assistant.chatbot-message--sent, .chatbot-message--assistant.chatbot-message--stopped').last()
  ).toBeVisible({ timeout: 30000 })
}

test.describe('Message feedback - Extended Mode (mock)', () => {
  // Mock backend simulates ~20s of thinking+streaming per reply; interaction assertions need headroom
  test.setTimeout(120_000)

  test.beforeEach(async ({ page }) => {
    await page.goto('/extended')
    await expect(page.locator('.chat-input')).toBeVisible({ timeout: 10000 })
    await cleanState(page)
    await page.reload()
    await expect(page.locator('.chat-input')).toBeVisible({ timeout: 10000 })
  })

  test('feedback buttons appear on assistant messages but not user messages', async ({ page }) => {
    await chatOnce(page, 'feedback visibility check')

    const lastAssistant = page.locator('.chatbot-message--assistant').last()
    await expect(lastAssistant.locator(UP_BTN)).toBeVisible()
    await expect(lastAssistant.locator(DOWN_BTN)).toBeVisible()

    const userMessage = page.locator('.chatbot-message--user').first()
    await expect(userMessage.locator(UP_BTN)).toHaveCount(0)
    await expect(userMessage.locator(DOWN_BTN)).toHaveCount(0)
  })

  test('clicking 👍 activates it and POSTs feedback to the backend', async ({ page }) => {
    await chatOnce(page, 'feedback up check')

    const feedbackRequest = page.waitForRequest(
      (req) => req.method() === 'POST' && req.url().includes('/feedback'),
      { timeout: 10000 }
    )
    await page.locator('.chatbot-message--assistant').last().locator(UP_BTN).click()

    const req = await feedbackRequest
    expect(req.postDataJSON()).toEqual({ feedback: 'up' })

    const lastAssistant = page.locator('.chatbot-message--assistant').last()
    await expect(lastAssistant.locator(UP_BTN)).toHaveAttribute('aria-pressed', 'true')
    await expect(lastAssistant.locator(DOWN_BTN)).toHaveAttribute('aria-pressed', 'false')
  })

  test('clicking 👎 after 👍 switches exclusively to down', async ({ page }) => {
    await chatOnce(page, 'feedback switch check')

    const lastAssistant = page.locator('.chatbot-message--assistant').last()
    await lastAssistant.locator(UP_BTN).click()
    await expect(lastAssistant.locator(UP_BTN)).toHaveAttribute('aria-pressed', 'true')

    await lastAssistant.locator(DOWN_BTN).click()
    await expect(lastAssistant.locator(UP_BTN)).toHaveAttribute('aria-pressed', 'false')
    await expect(lastAssistant.locator(DOWN_BTN)).toHaveAttribute('aria-pressed', 'true')
  })

  test('clicking the active 👍 again deselects (feedback none)', async ({ page }) => {
    await chatOnce(page, 'feedback deselect check')

    const lastAssistant = page.locator('.chatbot-message--assistant').last()
    await lastAssistant.locator(UP_BTN).click()
    await expect(lastAssistant.locator(UP_BTN)).toHaveAttribute('aria-pressed', 'true')

    const noneRequest = page.waitForRequest(
      (req) => req.method() === 'POST' && req.postDataJSON()?.feedback === 'none',
      { timeout: 10000 }
    )
    await lastAssistant.locator(UP_BTN).click()
    await noneRequest

    await expect(lastAssistant.locator(UP_BTN)).toHaveAttribute('aria-pressed', 'false')
    await expect(lastAssistant.locator(DOWN_BTN)).toHaveAttribute('aria-pressed', 'false')
  })

  test('feedback survives a page reload (backend persistence round-trip)', async ({ page }) => {
    await chatOnce(page, 'feedback persistence check')
    // Wait for the feedback POST to complete before reloading — reload would abort an in-flight request
    const feedbackPost = page.waitForResponse(
      (res) => res.request().method() === 'POST' && res.request().url().includes('/feedback') && res.ok(),
      { timeout: 10000 }
    )
    await page.locator('.chatbot-message--assistant').last().locator(UP_BTN).click()
    await feedbackPost
    await expect(page.locator('.chatbot-message--assistant').last().locator(UP_BTN)).toHaveAttribute(
      'aria-pressed',
      'true'
    )

    await page.reload()
    await expect(page.locator('.chat-input')).toBeVisible({ timeout: 10000 })

    // Auto-restored topic[0] reloads messages including the persisted feedback
    const lastAssistant = page.locator('.chatbot-message--assistant').last()
    await expect(lastAssistant).toBeVisible({ timeout: 10000 })
    await expect(lastAssistant.locator(UP_BTN)).toHaveAttribute('aria-pressed', 'true', {
      timeout: 10000,
    })
  })

  test('no feedback buttons when the feature is off (sidebar demo, default config)', async ({ page }) => {
    await page.goto('/sidebar')
    await expect(page.locator('.chat-input')).toBeVisible({ timeout: 10000 })
    await cleanState(page)
    await page.reload()
    await expect(page.locator('.chat-input')).toBeVisible({ timeout: 10000 })

    await chatOnce(page, 'no feedback here')
    await expect(page.locator(UP_BTN)).toHaveCount(0)
    await expect(page.locator(DOWN_BTN)).toHaveCount(0)
  })
})
