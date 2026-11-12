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
import { OLLAMA_BASE_URL } from '../helpers/readChatappEnv'

// Single source: examples/chatapp/real.env (not a parallel definition here).
// Read lazily — importing this spec file must not require real.env
// (mock-mode runs collect this file too; only E2E_REAL=1 needs it).
const ollamaUrl = () => OLLAMA_BASE_URL()

let ollamaUp = false

test.beforeAll(async () => {
  if (!process.env.E2E_REAL) return
  try {
    const res = await fetch(`${ollamaUrl()}/api/tags`, { signal: AbortSignal.timeout(3000) })
    ollamaUp = res.ok
  } catch {
    ollamaUp = false
  }
  if (!ollamaUp) throw new Error(`Real mode requires a running Ollama at ${ollamaUrl()}`)
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
  test.setTimeout(120_000)  // AGENTS: per-test cap 2min

  test.beforeAll(async ({ request }) => {
    // Hook budget must cover the worst-case warmup below: 4×(60s+10s)=280s
    test.setTimeout(300_000)
    if (!process.env.E2E_REAL) return

    // 1. Fail fast (<5s) with an actionable message when backend-real is down.
    //    Without this, the warmup loop below burns its whole budget against a
    //    dead proxy and fails as an opaque 5-minute timeout.
    let probeCause = ''
    try {
      const probe = await request.get('/api/real/health', { timeout: 5_000 })
      if (!probe.ok()) probeCause = `health returned HTTP ${probe.status()}`
    } catch (e) {
      probeCause = e instanceof Error ? e.message : String(e)
    }
    if (probeCause) {
      throw new Error(
        `backend-real is not reachable via /api/real (${probeCause}). ` +
        'Run `npm run test:e2e:real` (starts it automatically) or start it manually: ' +
        'cd examples/chatapp/backend-real && npm run dev'
      )
    }

    // 2. Warm the chat model: Ollama answers 503 while a model is loading, and
    //    backend-real commits SSE 200 headers BEFORE dialing Ollama — so a
    //    merely-2xx response proves nothing. Success = the SSE body reached a
    //    `type:'end'` event. Worst case 4×(60s+10s)=280s ≤ hook budget 300s.
    const WARMUP_ATTEMPTS = 4
    for (let attempt = 1; attempt <= WARMUP_ATTEMPTS; attempt++) {
      try {
        const res = await request.post('/api/real/chat/stream', {
          data: { sessionId: 'warmup', content: 'ping' },
          timeout: 60_000,
        })
        if (res.ok()) {
          const body = await res.text()
          if (body.includes('"type":"end"')) {
            // Remove the warmup session so it never leaks into assertions
            await request.delete('/api/real/sessions/warmup').catch(() => undefined)
            return
          }
          console.log(`[real-warmup] attempt ${attempt}/${WARMUP_ATTEMPTS}: SSE ended without an end event (upstream failure?)`)
        } else {
          const body = await res.text().catch(() => '')
          console.log(`[real-warmup] attempt ${attempt}/${WARMUP_ATTEMPTS}: HTTP ${res.status()} from ${new URL(res.url()).host} body=${body.slice(0, 160)}`)
        }
      } catch (e) {
        console.log(`[real-warmup] attempt ${attempt}/${WARMUP_ATTEMPTS}: ${e instanceof Error ? e.message : 'stream error'} (model loading?)`)
      }
      if (attempt < WARMUP_ATTEMPTS) await new Promise((r) => setTimeout(r, 10_000))
    }
    throw new Error(`Model warmup did not succeed within the budget — check Ollama at ${ollamaUrl()}`)
  })

  test.beforeEach(async ({ page }) => {
    await useRealBackend(page)
    await page.goto('/extended')
    await expect(page.locator('.chat-input')).toBeVisible({ timeout: 10000 })
    await cleanState(page)
    // cleanState only clears the mock backend — purge real-backend sessions too
    await page.evaluate(async () => {
      try {
        const res = await fetch('/api/real/sessions')
        const data = await res.json()
        if (data.data?.sessions) {
          for (const s of data.data.sessions) {
            await fetch(`/api/real/sessions/${s.sessionId}`, { method: 'DELETE' })
          }
        }
      } catch { /* real backend down is surfaced by the warmup hook */ }
    })
    await page.reload()
    await expect(page.locator('.chat-input')).toBeVisible({ timeout: 10000 })
  })

  test('sends a message and receives a real Ollama reply', async ({ page }) => {
    const input = page.locator('.chatbot-input textarea, .chat-input textarea, textarea').first()
    await input.fill('请用一句话介绍你自己')
    await input.press('Enter')

    const assistantText = page.locator('.chatbot-message__bubble--assistant .chatbot-message__text').last()
    await expect(assistantText).toBeVisible({ timeout: 100_000 })
    await expect(assistantText).not.toHaveText('', { timeout: 100_000 })
  })

  test('clears the conversation via the header action', async ({ page }) => {
    const input = page.locator('.chatbot-input textarea, .chat-input textarea, textarea').first()
    await input.fill('你好')
    await input.press('Enter')
    await expect(
      page.locator('.chatbot-message__bubble--assistant .chatbot-message__text').last()
    ).toBeVisible({ timeout: 100_000 })

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
    ).toBeVisible({ timeout: 100_000 })

    // create a fresh topic; messages list resets
    await page.locator('.topic-list-view__new-btn').first().click()
    await expect(page.locator('.chatbot-message__bubble')).toHaveCount(0)
  })

  test('message feedback persists against the real backend', async ({ page }) => {
    const input = page.locator('.chatbot-input textarea, .chat-input textarea, textarea').first()
    await input.fill('一句话介绍长城')
    await input.press('Enter')
    await expect(
      page.locator('.chatbot-message--assistant.chatbot-message--sent').last()
    ).toBeVisible({ timeout: 100_000 })

    // 👍 must reach the real backend's feedback endpoint and survive a reload
    const feedbackPost = page.waitForResponse(
      (res) => res.request().method() === 'POST' && res.request().url().includes('/feedback') && res.status() === 200,
      { timeout: 15_000 }
    )
    await page.locator('.chatbot-message--assistant').last().locator('.chatbot-message__action-btn--feedback-up').click()
    await feedbackPost

    await page.reload()
    await expect(page.locator('.chat-input')).toBeVisible({ timeout: 10000 })
    const lastAssistant = page.locator('.chatbot-message--assistant').last()
    await expect(lastAssistant).toBeVisible({ timeout: 15000 })
    await expect(lastAssistant.locator('.chatbot-message__action-btn--feedback-up')).toHaveAttribute(
      'aria-pressed',
      'true',
      { timeout: 15000 }
    )
  })
})

test.describe('Real backend - voice transcription (Ollama ASR)', () => {
  test.skip(() => !process.env.E2E_REAL, 'set E2E_REAL=1 to run real-backend suite')
  test.setTimeout(120_000)  // AGENTS: per-test cap 2min

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
          timeout: 100_000,
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
