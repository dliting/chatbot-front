/**
 * Real-backend E2E tests (local Ollama via backend-real).
 *
 * Run with: E2E_REAL=1 npx playwright test --project=chatapp real-backend
 * Skipped unless E2E_REAL=1 — CI has no Ollama. A timeout counts as a failure.
 */
import { test, expect, type Page } from '@playwright/test'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { cleanState } from './helpers'

const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434'
const REAL_REPLY_TIMEOUT = 60_000

let ollamaUp = false

test.beforeAll(async () => {
  if (!process.env.E2E_REAL) return
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(3000) })
    ollamaUp = res.ok
  } catch {
    ollamaUp = false
  }
  if (!ollamaUp) throw new Error(`Real mode requires a running Ollama at ${OLLAMA_URL}`)
})

async function useRealBackend(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'chatapp-settings',
      JSON.stringify({ backendMode: 'real', theme: 'light', apiTimeout: 30000 })
    )
  })
}

test.describe('Real backend - ChatApp (local Ollama)', () => {
  test.skip(() => !process.env.E2E_REAL, 'set E2E_REAL=1 to run real-backend suite')
  // Cold model loads (qwen3.5 6.6GB / lfm3-audio 1.7GB swaps) can eat the
  // default 30s test timeout — allow 3 minutes per test in this suite.
  test.setTimeout(180_000)

  test.beforeAll(async ({ request }) => {
    if (!process.env.E2E_REAL) return
    // Warm the chat model (evicted whenever the ASR model loads and vice versa)
    await request.post('/api/real/chat/stream', {
      data: { sessionId: 'warmup', content: 'ping' },
      timeout: 180_000,
    }).catch(() => undefined)
  })

  test.beforeEach(async ({ page }) => {
    await useRealBackend(page)
    await page.goto('/extended')
    await expect(page.locator('.chat-input')).toBeVisible({ timeout: 10000 })
    await cleanState(page)
    await page.reload()
    await expect(page.locator('.chat-input')).toBeVisible({ timeout: 10000 })
  })

  test('sends a message and receives a real Ollama reply', async ({ page }) => {
    const input = page.locator('.chatbot-input textarea, .chat-input textarea, textarea').first()
    await input.fill('请用一句话介绍你自己')
    await input.press('Enter')

    const assistantText = page.locator('.chatbot-message__bubble--assistant .chatbot-message__text').last()
    await expect(assistantText).toBeVisible({ timeout: REAL_REPLY_TIMEOUT })
    await expect(assistantText).not.toHaveText('', { timeout: REAL_REPLY_TIMEOUT })
  })

  test('clears the conversation via the header action', async ({ page }) => {
    const input = page.locator('.chatbot-input textarea, .chat-input textarea, textarea').first()
    await input.fill('你好')
    await input.press('Enter')
    await expect(
      page.locator('.chatbot-message__bubble--assistant .chatbot-message__text').last()
    ).toBeVisible({ timeout: REAL_REPLY_TIMEOUT })

    await page.locator('.chat-header__clear').click()
    await page.locator('.confirm-dialog__btn--confirm').click()

    await expect(page.locator('.chatbot-message__bubble--assistant')).toHaveCount(0)
  })

  test('switches topics and keeps history independent', async ({ page }) => {
    const input = page.locator('.chatbot-input textarea, .chat-input textarea, textarea').first()
    await input.fill('记住数字四十二')
    await input.press('Enter')
    await expect(
      page.locator('.chatbot-message__bubble--assistant .chatbot-message__text').last()
    ).toBeVisible({ timeout: REAL_REPLY_TIMEOUT })

    // create a fresh topic; messages list resets
    await page.locator('.topic-list-view__new-btn').first().click()
    await expect(page.locator('.chatbot-message__bubble')).toHaveCount(0)
  })
})

test.describe('Real backend - voice transcription (Ollama ASR)', () => {


  function synthWav(voice: string, text: string, outPath: string): Buffer {
    execSync(
      `powershell -NoProfile -Command "Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; $s.SelectVoice('${voice}'); $s.SetOutputToWaveFile('${outPath}'); $s.Speak('${text}'); $s.Dispose()"`,
      { timeout: 60000 }
    )
    return readFileSync(outPath)
  }

  test('transcribes English and Chinese audio via the real ASR model', async ({ request }) => {
    const wavEn = synthWav('Microsoft Zira Desktop', 'What is the weather today', join(tmpdir(), 'e2e-asr-en.wav'))
    const wavZh = synthWav('Microsoft Huihui Desktop', '今天天气怎么样', join(tmpdir(), 'e2e-asr-zh.wav'))

    for (const [label, wav, keyword] of [
      ['en', wavEn, 'weather'],
      ['zh', wavZh, '天气'],
    ] as const) {
      // Ollama returns 503 while swapping models — retry with backoff
      let res = null
      for (let attempt = 0; attempt < 6; attempt++) {
        res = await request.post('/api/real/chat/transcribe', {
          data: { audio: wav.toString('base64'), format: 'wav' },
          timeout: 180_000,
        })
        if (res.status() === 200) break
        await new Promise((r) => setTimeout(r, 10_000))
      }
      expect(res!.status()).toBe(200)
      const body = await res!.json()
      expect(body.code).toBe(0)
      expect(String(body.data.text).toLowerCase()).toContain(keyword.toLowerCase())
      console.log(`[${label}] transcript:`, body.data.text)
    }
  })
})
