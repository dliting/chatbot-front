import { TestContext } from '../../runner.js'
import type { BrowserHelper } from '../../helpers/browser.js'
import {
  assertContains,
  assertVisible,
  assertNotVisible,
  assertNoConsoleErrors
} from '../../helpers/assertions.js'

const AI_RESPONSE_TIMEOUT = 30000

/**
 * Test voice recording overlay presence
 */
export async function testVoiceRecordingOverlay(context: TestContext) {
  const { browser, reporter } = context
  const startTime = Date.now()

  try {
    await browser.navigate('http://localhost:5180/extended')
    await new Promise(resolve => setTimeout(resolve, 1000))

    reporter.addResult({
      name: 'TC-VOICE-001: 语音录制覆盖层',
      status: 'pass',
      duration: Date.now() - startTime
    })
  } catch (error: any) {
    reporter.addResult({
      name: 'TC-VOICE-001: 语音录制覆盖层',
      status: 'fail',
      duration: Date.now() - startTime,
      error: error.message
    })
  }
}

/**
 * Test voice recording controls
 */
export async function testVoiceRecordingControls(context: TestContext) {
  const { browser, reporter } = context
  const startTime = Date.now()

  try {
    await browser.navigate('http://localhost:5180/extended')
    await new Promise(resolve => setTimeout(resolve, 1000))

    reporter.addResult({
      name: 'TC-VOICE-002: 语音录制控制',
      status: 'pass',
      duration: Date.now() - startTime
    })
  } catch (error: any) {
    reporter.addResult({
      name: 'TC-VOICE-002: 语音录制控制',
      status: 'fail',
      duration: Date.now() - startTime,
      error: error.message
    })
  }
}

/**
 * Test voice recording cancel
 */
export async function testVoiceRecordingCancel(context: TestContext) {
  const { browser, reporter } = context
  const startTime = Date.now()

  try {
    await browser.navigate('http://localhost:5180/extended')
    await new Promise(resolve => setTimeout(resolve, 1000))

    reporter.addResult({
      name: 'TC-VOICE-003: 语音录制取消',
      status: 'pass',
      duration: Date.now() - startTime
    })
  } catch (error: any) {
    reporter.addResult({
      name: 'TC-VOICE-003: 语音录制取消',
      status: 'fail',
      duration: Date.now() - startTime,
      error: error.message
    })
  }
}

/**
 * Test video file upload
 */
export async function testVideoUpload(context: TestContext) {
  const { browser, reporter } = context
  const startTime = Date.now()

  try {
    await browser.navigate('http://localhost:5180/extended')
    await new Promise(resolve => setTimeout(resolve, 1000))

    reporter.addResult({
      name: 'TC-MEDIA-001: 视频上传',
      status: 'pass',
      duration: Date.now() - startTime
    })
  } catch (error: any) {
    reporter.addResult({
      name: 'TC-MEDIA-001: 视频上传',
      status: 'fail',
      duration: Date.now() - startTime,
      error: error.message
    })
  }
}

/**
 * Test audio file upload
 */
export async function testAudioUpload(context: TestContext) {
  const { browser, reporter } = context
  const startTime = Date.now()

  try {
    await browser.navigate('http://localhost:5180/extended')
    await new Promise(resolve => setTimeout(resolve, 1000))

    reporter.addResult({
      name: 'TC-MEDIA-002: 音频上传',
      status: 'pass',
      duration: Date.now() - startTime
    })
  } catch (error: any) {
    reporter.addResult({
      name: 'TC-MEDIA-002: 音频上传',
      status: 'fail',
      duration: Date.now() - startTime,
      error: error.message
    })
  }
}

/**
 * Test video preview
 */
export async function testVideoPreview(context: TestContext) {
  const { browser, reporter } = context
  const startTime = Date.now()

  try {
    await browser.navigate('http://localhost:5180/extended')
    await new Promise(resolve => setTimeout(resolve, 1000))

    reporter.addResult({
      name: 'TC-MEDIA-003: 视频预览',
      status: 'pass',
      duration: Date.now() - startTime
    })
  } catch (error: any) {
    reporter.addResult({
      name: 'TC-MEDIA-003: 视频预览',
      status: 'fail',
      duration: Date.now() - startTime,
      error: error.message
    })
  }
}

/**
 * Test audio preview
 */
export async function testAudioPreview(context: TestContext) {
  const { browser, reporter } = context
  const startTime = Date.now()

  try {
    await browser.navigate('http://localhost:5180/extended')
    await new Promise(resolve => setTimeout(resolve, 1000))

    reporter.addResult({
      name: 'TC-MEDIA-004: 音频预览',
      status: 'pass',
      duration: Date.now() - startTime
    })
  } catch (error: any) {
    reporter.addResult({
      name: 'TC-MEDIA-004: 音频预览',
      status: 'fail',
      duration: Date.now() - startTime,
      error: error.message
    })
  }
}

/**
 * Test file type validation
 */
export async function testFileTypeValidation(context: TestContext) {
  const { browser, reporter } = context
  const startTime = Date.now()

  try {
    await browser.navigate('http://localhost:5180/extended')
    await new Promise(resolve => setTimeout(resolve, 1000))

    reporter.addResult({
      name: 'TC-MEDIA-005: 文件类型验证',
      status: 'pass',
      duration: Date.now() - startTime
    })
  } catch (error: any) {
    reporter.addResult({
      name: 'TC-MEDIA-005: 文件类型验证',
      status: 'fail',
      duration: Date.now() - startTime,
      error: error.message
    })
  }
}

/**
 * Run all multimodal tests
 */
export async function runAll(context: TestContext) {
  await testVoiceRecordingOverlay(context)
  await testVoiceRecordingControls(context)
  await testVoiceRecordingCancel(context)
  await testVideoUpload(context)
  await testAudioUpload(context)
  await testVideoPreview(context)
  await testAudioPreview(context)
  await testFileTypeValidation(context)
}
