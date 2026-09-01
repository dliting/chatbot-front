// Font subset verification: run against a dev server (default http://localhost:5173)
//   node tests/verify-fonts.cjs
// Verifies: css + 4 woff2 load over HTTP 200, FontFace decodes, text renders
// with 'Noto Sans SC' at weights 400 and 700 (subset charset coverage), plus a
// direct load of each woff2 file (machines with Noto installed locally satisfy
// the @font-face local() source without downloading the subset).
// Screenshot: tests/e2e/results/screenshots/font-subset-verify.png
const { chromium } = require('@playwright/test')

const BASE = process.env.BASE_URL || 'http://localhost:5173'

;(async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

  const fontResponses = []
  page.on('response', (r) => {
    if (r.url().includes('noto-sans-sc')) fontResponses.push(`${r.status()} ${r.url().split('/').pop()}`)
  })

  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.addStyleTag({ url: '/fonts/noto-sans-sc.css' })

  // Drive FontFace load for regular + bold with subset-covered sample text
  const result = await page.evaluate(async () => {
    const sample = '设置主题思考深度已删除你好世界聊天助手 Monday 12:30'
    await Promise.all([
      document.fonts.load('400 16px "Noto Sans SC"', sample),
      document.fonts.load('700 16px "Noto Sans SC"', sample),
    ])
    return {
      regular: document.fonts.check('400 16px "Noto Sans SC"', sample),
      bold: document.fonts.check('700 16px "Noto Sans SC"', sample),
      loaded: [...document.fonts].filter((f) => f.family.includes('Noto')).map((f) => `${f.family} ${f.weight} ${f.status}`),
    }
  })

  // Render a probe line and measure it actually uses the font (width > 0)
  const probe = await page.evaluate(() => {
    document.body.insertAdjacentHTML(
      'beforeend',
      `<div id="font-probe" style="font-family:'Noto Sans SC';font-size:32px;position:fixed;top:0;left:0;color:#111;background:#fff;">设置主题思考深度</div>`
    )
    const rect = document.getElementById('font-probe').getBoundingClientRect()
    return { width: rect.width, height: rect.height }
  })

  // The local() source may satisfy the @font-face on machines with Noto
  // installed; load the woff2 files directly to prove the subset files
  // themselves decode and render (what font-less clients will download).
  const direct = await page.evaluate(async () => {
    const faces = await Promise.all(
      ['Light', 'Regular', 'Medium', 'Bold'].map(async (w) => {
        const face = new FontFace('NotoSubsetProbe', `url(/fonts/noto-sans-sc/NotoSansSC-${w}.woff2)`)
        await face.load()
        document.fonts.add(face)
        return `${w}:${face.status}`
      })
    )
    const sample = '设置主题思考深度已删除你好世界聊天助手 Monday'
    const rendered = document.fonts.check('16px "NotoSubsetProbe"', sample)
    document.body.insertAdjacentHTML(
      'beforeend',
      `<div id="probe2" style="font-family:'NotoSubsetProbe';font-size:32px;position:fixed;top:60px;left:0;color:#111;background:#fff;">设置主题思考深度</div>`
    )
    const rect = document.getElementById('probe2').getBoundingClientRect()
    return { faces, rendered, width: rect.width }
  })

  await page.screenshot({ path: 'tests/e2e/results/screenshots/font-subset-verify.png', clip: { x: 0, y: 0, width: 600, height: 130 } })

  console.log('font responses:', fontResponses)
  console.log('font checks:', JSON.stringify(result))
  console.log('probe size:', JSON.stringify(probe))

  console.log('direct woff2:', JSON.stringify(direct))

  const ok =
    fontResponses.every((r) => r.startsWith('200')) &&
    result.regular &&
    result.bold &&
    probe.width > 50 &&
    probe.height > 20 &&
    direct.faces.every((f) => f.endsWith('loaded')) &&
    direct.rendered &&
    direct.width > 50

  await browser.close()
  console.log(ok ? 'PASS' : 'FAIL')
  process.exit(ok ? 0 : 1)
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
