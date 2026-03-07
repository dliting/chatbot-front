import { TestContext } from '../../runner.js'

export async function testImageUploadButton(context: TestContext) {
  const { browser, reporter } = context
  const startTime = Date.now()

  try {
    await browser.navigate('http://localhost:5180/extended')
    await new Promise(resolve => setTimeout(resolve, 1000))

    const snapshot = await browser.page.takeSnapshot()
    const snapshotText = JSON.stringify(snapshot)

    // Look for the upload button (+ icon or upload indicator)
    const hasUploadButton = snapshotText.includes('+') ||
                           snapshotText.includes('上传') ||
                           snapshotText.includes('upload')

    if (!hasUploadButton) {
      throw new Error('Upload button not found')
    }

    reporter.addResult({
      name: 'TC-COMMON-012: 图片上传按钮',
      status: 'pass',
      duration: Date.now() - startTime
    })
  } catch (error: any) {
    const screenshot = await browser.screenshot(`tests/ui/reports/upload-button-${Date.now()}.png`)
    reporter.addResult({
      name: 'TC-COMMON-012: 图片上传按钮',
      status: 'fail',
      duration: Date.now() - startTime,
      error: error.message,
      screenshot
    })
  }
}

export async function runAll(context: TestContext) {
  await testImageUploadButton(context)
  // Additional upload tests can be added here as needed
}
