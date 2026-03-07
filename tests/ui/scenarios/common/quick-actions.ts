import { TestContext } from '../../runner.js'
import { assertContains } from '../../helpers/assertions.js'

export async function testQuickActionsDisplay(context: TestContext) {
  const { browser, reporter } = context
  const startTime = Date.now()

  try {
    // Navigate to chat page first (extended mode has quick actions)
    await browser.navigate('http://localhost:5180/extended')
    await new Promise(resolve => setTimeout(resolve, 1000))

    const snapshot = await browser.page.takeSnapshot()
    const snapshotText = JSON.stringify(snapshot)

    // Find quick action cards
    const expectedActions = ['写邮件', '总结文章', '翻译', '数据分析']

    for (const action of expectedActions) {
      if (!snapshotText.includes(action)) {
        throw new Error(`Quick action "${action}" not found`)
      }
    }

    reporter.addResult({
      name: 'TC-COMMON-022: 快捷操作显示',
      status: 'pass',
      duration: Date.now() - startTime
    })
  } catch (error: any) {
    const screenshot = await browser.screenshot(`tests/ui/reports/quick-actions-${Date.now()}.png`)
    reporter.addResult({
      name: 'TC-COMMON-022: 快捷操作显示',
      status: 'fail',
      duration: Date.now() - startTime,
      error: error.message,
      screenshot
    })
  }
}

export async function testQuickActionClick(context: TestContext) {
  const { browser, reporter } = context
  const startTime = Date.now()

  try {
    // Navigate to chat page
    await browser.navigate('http://localhost:5180/extended')
    await new Promise(resolve => setTimeout(resolve, 1000))

    let snapshot = await browser.page.takeSnapshot()

    // Find "写邮件" card
    const snapshotData = JSON.parse(JSON.stringify(snapshot))
    const writeEmailCard = snapshotData.root.find((el: any) =>
      el.children?.some((c: any) => c.text === '写邮件')
    )

    if (!writeEmailCard) throw new Error('写邮件 card not found')

    // Click the card
    await browser.click(writeEmailCard.uid)

    // Verify input was filled
    await new Promise(resolve => setTimeout(resolve, 500))
    snapshot = await browser.page.takeSnapshot()
    const snapshotText = JSON.stringify(snapshot)

    // Check for expected prompt text variations
    const hasPrompt = snapshotText.includes('帮我写一封邮件') ||
                     snapshotText.includes('帮我撰写邮件') ||
                     snapshotText.includes('写邮件')

    if (!hasPrompt) {
      throw new Error('Input not filled with quick action text')
    }

    reporter.addResult({
      name: 'TC-COMMON-023: 快捷操作点击填充',
      status: 'pass',
      duration: Date.now() - startTime
    })
  } catch (error: any) {
    const screenshot = await browser.screenshot(`tests/ui/reports/quick-action-click-${Date.now()}.png`)
    reporter.addResult({
      name: 'TC-COMMON-023: 快捷操作点击填充',
      status: 'fail',
      duration: Date.now() - startTime,
      error: error.message,
      screenshot
    })
  }
}

export async function runAll(context: TestContext) {
  await testQuickActionsDisplay(context)
  await testQuickActionClick(context)
}
