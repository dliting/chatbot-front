import { TestContext } from '../../runner.js'
import type { BrowserHelper } from '../../helpers/browser.js'
import {
  assertContains,
  assertButtonEnabled,
  assertButtonDisabled,
  assertVisible,
  assertNoConsoleErrors
} from '../../helpers/assertions.js'

export async function testTextInput(context: TestContext) {
  const { browser, reporter } = context
  const startTime = Date.now()

  try {
    const snapshot1 = await browser.takeSnapshot()
    assertVisible(snapshot1, '输入消息...')

    // Find input field
    const snapshotData = JSON.parse(snapshot1)
    const inputField = snapshotData.root.find((el: any) =>
      el.attributes?.placeholder === '输入消息...'
    )

    if (!inputField) {
      throw new Error('Input field with placeholder "输入消息..." not found')
    }

    await browser.fill(inputField.uid, '测试消息')

    const snapshot2 = await browser.takeSnapshot()
    assertContains(snapshot2, '测试消息')

    reporter.addResult({
      name: 'TC-COMMON-001: 文本输入',
      status: 'pass',
      duration: Date.now() - startTime
    })
  } catch (error: any) {
    const screenshot = await browser.screenshot(`tests/ui/reports/text-input-${Date.now()}.png`)
    reporter.addResult({
      name: 'TC-COMMON-001: 文本输入',
      status: 'fail',
      duration: Date.now() - startTime,
      error: error.message,
      screenshot
    })
  }
}

export async function testSendButtonState(context: TestContext) {
  const { browser, reporter } = context
  const startTime = Date.now()

  try {
    // Check initial state - empty input should disable send button
    let snapshot = await browser.takeSnapshot()
    assertButtonDisabled(snapshot, '发送')

    // Find input field
    const snapshotData = JSON.parse(snapshot)
    const inputField = snapshotData.root.find((el: any) =>
      el.attributes?.placeholder === '输入消息...'
    )

    if (inputField) {
      // Type text
      await browser.fill(inputField.uid, '测试')
      snapshot = await browser.takeSnapshot()
      assertButtonEnabled(snapshot, '发送')
    }

    reporter.addResult({
      name: 'TC-COMMON-003: 发送按钮状态',
      status: 'pass',
      duration: Date.now() - startTime
    })
  } catch (error: any) {
    const screenshot = await browser.screenshot(`tests/ui/reports/send-button-${Date.now()}.png`)
    reporter.addResult({
      name: 'TC-COMMON-003: 发送按钮状态',
      status: 'fail',
      duration: Date.now() - startTime,
      error: error.message,
      screenshot
    })
  }
}

export async function testMessageSendAndReceive(context: TestContext) {
  const { browser, reporter } = context
  const startTime = Date.now()

  try {
    // Find input field
    let snapshot = await browser.takeSnapshot()
    const snapshotData = JSON.parse(snapshot)
    const inputField = snapshotData.root.find((el: any) =>
      el.attributes?.placeholder === '输入消息...'
    )

    if (!inputField) throw new Error('Input field not found')

    // Type message
    await browser.fill(inputField.uid, '你好')

    // Find and click send button
    snapshot = await browser.takeSnapshot()
    const sendButton = JSON.parse(snapshot).root.find((el: any) =>
      el.name === 'button' && el.children?.some((c: any) => c.text === '发送')
    )

    if (!sendButton) throw new Error('Send button not found')
    await browser.click(sendButton.uid)

    // Wait for AI response (with longer timeout for streaming)
    const hasResponse = await browser.waitForText('你好', 30000)

    if (!hasResponse) {
      throw new Error('Timeout waiting for AI response')
    }

    // Verify no console errors
    await assertNoConsoleErrors(browser)

    reporter.addResult({
      name: 'TC-COMMON-004: 消息发送和接收',
      status: 'pass',
      duration: Date.now() - startTime
    })
  } catch (error: any) {
    const screenshot = await browser.screenshot(`tests/ui/reports/message-flow-${Date.now()}.png`)
    const consoleErrors = await browser.listConsoleMessages()

    reporter.addResult({
      name: 'TC-COMMON-004: 消息发送和接收',
      status: 'fail',
      duration: Date.now() - startTime,
      error: error.message,
      screenshot,
      consoleErrors
    })
  }
}

export async function runAll(context: TestContext) {
  await testTextInput(context)
  await testSendButtonState(context)
  await testMessageSendAndReceive(context)
}
