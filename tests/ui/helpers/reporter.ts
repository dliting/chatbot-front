export interface TestCaseResult {
  name: string
  status: 'pass' | 'fail'
  duration: number
  error?: string
  screenshot?: string
  consoleErrors?: any[]
}

export interface TestReport {
  timestamp: string
  total: number
  passed: number
  failed: number
  duration: number
  results: TestCaseResult[]
}

export class TestReporter {
  private results: TestCaseResult[] = []
  private startTime: number = 0
  private screenshots: string[] = []

  start() {
    this.startTime = Date.now()
    this.results = []
    this.screenshots = []
  }

  addResult(result: TestCaseResult) {
    this.results.push(result)
    if (result.screenshot) {
      this.screenshots.push(result.screenshot)
    }
  }

  finish(): TestReport {
    const duration = Date.now() - this.startTime
    const passed = this.results.filter(r => r.status === 'pass').length
    const failed = this.results.filter(r => r.status === 'fail').length

    return {
      timestamp: new Date().toISOString(),
      total: this.results.length,
      passed,
      failed,
      duration,
      results: this.results
    }
  }

  generateHTML(report: TestReport): string {
    const timestamp = new Date(report.timestamp).toLocaleString('zh-CN')

    let resultsHTML = report.results.map(r => `
      <div class="test-case ${r.status}">
        <h3>${r.status === 'pass' ? '✅' : '❌'} ${r.name}</h3>
        <p><strong>耗时:</strong> ${(r.duration / 1000).toFixed(2)}s</p>
        ${r.error ? `<p class="error"><strong>失败:</strong> ${r.error}</p>` : ''}
        ${r.screenshot ? `<img src="${r.screenshot}" alt="screenshot" />` : ''}
        ${r.consoleErrors && r.consoleErrors.length > 0 ? `
          <div class="console-errors">
            <h4>控制台错误:</h4>
            <ul>
              ${r.consoleErrors.map(e => `<li>${e.text}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `).join('')

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UI测试报告 - ${timestamp}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h1 { color: #333; }
    .summary { display: flex; gap: 20px; margin: 20px 0; }
    .summary-item { padding: 15px; border-radius: 4px; background: #f9f9f9; }
    .summary-item.total { background: #e3f2fd; }
    .summary-item.passed { background: #e8f5e9; }
    .summary-item.failed { background: #ffebee; }
    .test-case { margin: 15px 0; padding: 15px; border-left: 4px solid #ddd; background: #fafafa; }
    .test-case.pass { border-left-color: #4caf50; }
    .test-case.fail { border-left-color: #f44336; background: #ffebee; }
    .test-case h3 { margin-top: 0; }
    .error { color: #d32f2f; }
    img { max-width: 100%; border: 1px solid #ddd; margin-top: 10px; }
    .console-errors { background: #fff3cd; padding: 10px; margin-top: 10px; border-radius: 4px; }
    .console-errors ul { margin: 5px 0 0 20px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🧪 UI自动化测试报告</h1>
    <p><strong>测试时间:</strong> ${timestamp}</p>

    <div class="summary">
      <div class="summary-item total">
        <strong>总计:</strong> ${report.total}
      </div>
      <div class="summary-item passed">
        <strong>通过:</strong> ${report.passed}
      </div>
      <div class="summary-item failed">
        <strong>失败:</strong> ${report.failed}
      </div>
      <div class="summary-item">
        <strong>耗时:</strong> ${(report.duration / 1000).toFixed(1)}s
      </div>
    </div>

    <h2>测试结果详情</h2>
    ${resultsHTML}
  </div>
</body>
</html>`
  }

  async saveHTML(report: TestReport, filename: string): Promise<void> {
    const html = this.generateHTML(report)
    const fs = await import('fs/promises')
    const path = await import('path')

    const reportsDir = path.join(process.cwd(), 'tests/ui/reports')
    await fs.mkdir(reportsDir, { recursive: true })

    const filepath = path.join(reportsDir, filename)
    await fs.writeFile(filepath, html, 'utf-8')

    console.log(`📊 报告已生成: ${filepath}`)
  }
}
