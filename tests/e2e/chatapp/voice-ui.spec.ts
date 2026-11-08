/**
 * Voice-input UI flow (mock backend, Chromium fake media stream).
 * The fake audio device yields silence — transcription text comes from the
 * mock backend's canned response, so the pipeline (mic → record → stop →
 * transcribe → textarea) is what this spec pins down.
 */
import { test, expect } from '@playwright/test'
import { cleanState } from './helpers'

test.use({
  launchOptions: {
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
  },
})

test.describe('Voice input UI flow (mock)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/extended')
    await expect(page.locator('.chat-input')).toBeVisible({ timeout: 10000 })
    await cleanState(page)
    await page.reload()
    await expect(page.locator('.chat-input')).toBeVisible({ timeout: 10000 })
  })

  test('records, transcribes and fills the textarea', async ({ page }) => {
    const mic = page.locator('.chat-input__voice-btn')
    await expect(mic).toBeVisible() // enableVoiceInput default true in demo settings

    await mic.click()
    await expect(page.locator('.chat-input__voice-btn--recording')).toBeVisible({ timeout: 5000 })

    // force: the pulse animation keeps the element in motion (reduced-motion
    // emulation is not enabled for this browser context)
    await mic.click({ force: true })
    await expect(page.locator('.chat-input__voice-btn--transcribing')).toBeVisible({ timeout: 5000 })

    const textarea = page.locator('textarea').first()
    await expect(textarea).toHaveValue('mock voice transcription', { timeout: 15000 })
    await expect(page.locator('.chat-input__voice-btn--recording')).not.toBeVisible()
  })
})
