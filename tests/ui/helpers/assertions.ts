export interface TestAssertion {
  pass: boolean
  message: string
  actual?: any
  expected?: any
}

export class AssertionError extends Error {
  constructor(public assertion: TestAssertion) {
    super(assertion.message)
    this.name = 'AssertionError'
  }
}

export function assert(condition: boolean, message: string, actual?: any, expected?: any): void {
  if (!condition) {
    throw new AssertionError({ pass: false, message, actual, expected })
  }
}

export function assertContains(text: string, substring: string, description?: string): void {
  const pass = text.includes(substring)
  assert(
    pass,
    description || `Expected "${text}" to contain "${substring}"`,
    text,
    substring
  )
}

export function assertExists(snapshot: any, selector: string): void {
  const snapshotText = JSON.stringify(snapshot)
  const pass = snapshotText.includes(selector)
  assert(
    pass,
    `Expected to find "${selector}" in snapshot`,
    snapshotText
  )
}

export function assertVisible(snapshot: any, text: string): void {
  const snapshotText = JSON.stringify(snapshot)
  const pass = snapshotText.includes(text)
  assert(
    pass,
    `Expected "${text}" to be visible`,
    snapshotText
  )
}

export function assertButtonEnabled(snapshot: any, buttonText: string): void {
  const snapshotText = JSON.stringify(snapshot)
  const pass = snapshotText.includes(`${buttonText}"`) &&
                !snapshotText.includes(`${buttonText}" disableable disabled`)
  assert(
    pass,
    `Expected button "${buttonText}" to be enabled`,
    snapshotText
  )
}

export function assertButtonDisabled(snapshot: any, buttonText: string): void {
  const snapshotText = JSON.stringify(snapshot)
  const pass = snapshotText.includes(`${buttonText}"`) &&
                snapshotText.includes(`disableable disabled`)
  assert(
    pass,
    `Expected button "${buttonText}" to be disabled`,
    snapshotText
  )
}

export async function assertNoConsoleErrors(browser: any): Promise<void> {
  const errors = await browser.listConsoleMessages()
  assert(
    errors.length === 0,
    `Expected no console errors, but found ${errors.length}`,
    errors.map((e: any) => e.text).join(', ')
  )
}
