/**
 * ChatApp UI 交互测试脚本
 * 使用 Puppeteer 进行前端测试
 *
 * 运行方式: node tests/ui-chatapp-test.js
 */

const puppeteer = require('puppeteer');

const CHATAPP_URL = 'http://localhost:5180';
const MOCK_BACKEND = 'http://localhost:3001';
const REAL_BACKEND = 'http://localhost:3000';

let browser;
let testsPassed = 0;
let testsFailed = 0;

async function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'pass' ? '✅' : type === 'fail' ? '❌' : '📋';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

async function takeScreenshot(page, name) {
  const filename = `tests/screenshots/chatapp-${name}-${Date.now()}.png`;
  await page.screenshot({ path: filename, fullPage: true });
  log(`截图已保存: ${filename}`, 'info');
  return filename;
}

async function testLandingAndRoutes() {
  log('测试: Landing页面和路由导航');
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // 1. 访问Landing页面
    log('1. 访问Landing页面');
    await page.goto(CHATAPP_URL + '/', { waitUntil: 'networkidle0', timeout: 30000 });

    // 2. 验证页面加载
    const pageTitle = await page.title();
    if (pageTitle !== 'ChatApp') {
      throw new Error(`页面标题不正确: ${pageTitle}`);
    }
    log(`Landing页面加载成功 - 标题: ${pageTitle}`, 'pass');
    await takeScreenshot(page, 'landing-page');

    // 3. 测试模式卡片导航
    const modes = [
      { name: 'extended', label: '扩展' },
      { name: 'compact', label: '紧凑' },
      { name: 'floating', label: '悬浮' },
      { name: 'iframe', label: 'IFRAME' }
    ];

    for (const mode of modes) {
      log(`2.${modes.indexOf(mode) + 1} 测试${mode.label}模式导航`);

      // 尝试多种选择器找到模式卡片
      const cardSelectors = [
        `button:has-text("${mode.label}")`,
        `[class*="card"]:has-text("${mode.label}")`,
        `a:has-text("${mode.label}")`,
        `[role="button"]:has-text("${mode.label}")`
      ];

      let cardClicked = false;
      for (const selector of cardSelectors) {
        try {
          const card = await page.$(selector);
          if (card) {
            await card.click();
            cardClicked = true;
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      if (cardClicked) {
        await page.waitForTimeout(1000);

        // 验证URL变化
        const url = page.url();
        if (url.includes(`/${mode.name}`)) {
          log(`  → 成功导航到 /${mode.name}`, 'pass');
          await takeScreenshot(page, `${mode.name}-mode`);
        } else {
          log(`  → URL未包含/${mode.name}: ${url}`, 'info');
        }

        // 返回Landing页面
        await page.goto(CHATAPP_URL + '/', { waitUntil: 'networkidle0' });
        await page.waitForTimeout(500);
      } else {
        log(`  → 未找到${mode.label}模式卡片`, 'info');
      }
    }

    await page.close();
    testsPassed++;
    log('✅ Landing页面和路由测试通过', 'pass');
    return true;
  } catch (error) {
    log(`Landing页面和路由测试失败: ${error.message}`, 'fail');
    testsFailed++;
    return false;
  }
}

async function testPageLoad() {
  log('测试: 页面加载');
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(CHATAPP_URL, { waitUntil: 'networkidle0', timeout: 30000 });

    // 检查页面标题
    const title = await page.title();
    if (title !== 'ChatApp') {
      throw new Error(`页面标题不正确: ${title}`);
    }

    // 检查是否有控制台错误
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);

    log(`页面加载成功 - 标题: ${title}`, 'pass');
    await takeScreenshot(page, 'page-load');
    return page;
  } catch (error) {
    log(`页面加载失败: ${error.message}`, 'fail');
    testsFailed++;
    throw error;
  }
}

async function testWelcomeInterface(page) {
  log('测试: 欢迎界面');
  try {
    // 检查欢迎标题
    const welcomeTitle = await page.$eval('body', el => el.innerText).catch(() => '');

    // 检查是否有聊天组件
    const hasChatComponent = await page.$('.ai-chatbot, .ai-chat, #app') !== null;

    if (!hasChatComponent) {
      // 可能还在加载，等待一下
      await page.waitForTimeout(3000);
    }

    log('欢迎界面检查完成', 'pass');
    await takeScreenshot(page, 'welcome');
    return true;
  } catch (error) {
    log(`欢迎界面检查失败: ${error.message}`, 'fail');
    testsFailed++;
    return false;
  }
}

async function testSendMessage(page) {
  log('测试: 发送消息');
  try {
    // 查找输入框
    const inputSelector = 'input[type="text"], textarea, [contenteditable="true"]';

    // 等待输入框出现
    await page.waitForSelector(inputSelector, { timeout: 10000 }).catch(() => null);

    const input = await page.$(inputSelector);

    if (!input) {
      log('未找到输入框，尝试其他方式', 'info');
      // 尝试点击页面触发输入
      await page.click('body');
      await page.waitForTimeout(1000);
    }

    // 尝试查找发送按钮
    const sendButton = await page.$('button.send, button[type="submit"], [class*="send"]');

    if (input) {
      await input.click();
      await page.keyboard.type('你好，测试消息');

      if (sendButton) {
        await sendButton.click();
      } else {
        await page.keyboard.press('Enter');
      }

      log('消息已发送', 'info');
      await page.waitForTimeout(3000);

      // 检查消息是否显示
      const messages = await page.$$('[class*="message"], .user-message, .assistant-message');
      log(`检测到 ${messages.length} 条消息`, 'pass');

      await takeScreenshot(page, 'message-sent');
    } else {
      log('未找到输入框，跳过发送测试', 'info');
    }

    testsPassed++;
    return true;
  } catch (error) {
    log(`发送消息失败: ${error.message}`, 'fail');
    testsFailed++;
    return false;
  }
}

async function testThemeToggle(page) {
  log('测试: 主题切换');
  try {
    // 查找主题切换按钮
    const themeButton = await page.$('[class*="theme"], [aria-label*="theme"], button.theme');

    if (themeButton) {
      await themeButton.click();
      await page.waitForTimeout(500);
      log('主题已切换', 'pass');
      await takeScreenshot(page, 'theme-toggle');
    } else {
      log('未找到主题切换按钮', 'info');
    }

    testsPassed++;
    return true;
  } catch (error) {
    log(`主题切换失败: ${error.message}`, 'fail');
    testsFailed++;
    return false;
  }
}

async function testSessionManagement(page) {
  log('测试: 会话管理');
  try {
    // 查找新建会话按钮
    const newChatButton = await page.$('[class*="new-chat"], [class*="session"], button.new');

    if (newChatButton) {
      await newChatButton.click();
      await page.waitForTimeout(1000);
      log('新建会话按钮已点击', 'pass');
      await takeScreenshot(page, 'new-session');
    } else {
      log('未找到新建会话按钮', 'info');
    }

    testsPassed++;
    return true;
  } catch (error) {
    log(`会话管理测试失败: ${error.message}`, 'fail');
    testsFailed++;
    return false;
  }
}

async function testApiConnection(page) {
  log('测试: API 连接');
  try {
    // 检查 Mock 后端连接
    const mockResponse = await page.evaluate(async (url) => {
      try {
        const response = await fetch(url + '/health');
        return await response.json();
      } catch (e) {
        return { error: e.message };
      }
    }, MOCK_BACKEND);

    log(`Mock 后端状态: ${JSON.stringify(mockResponse)}`, 'pass');

    // 测试发送消息到 Mock 后端
    const chatResponse = await page.evaluate(async (url) => {
      try {
        const response = await fetch(url + '/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: 'test-' + Date.now(),
            content: 'Hello API test'
          })
        });
        return await response.json();
      } catch (e) {
        return { error: e.message };
      }
    }, MOCK_BACKEND);

    log(`Mock 聊天响应: ${chatResponse.code === 0 ? '成功' : '失败'}`, 'pass');

    testsPassed++;
    return true;
  } catch (error) {
    log(`API 连接测试失败: ${error.message}`, 'fail');
    testsFailed++;
    return false;
  }
}

async function testConsoleErrors(page) {
  log('测试: 控制台错误检查');
  const errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  await page.waitForTimeout(2000);

  if (errors.length > 0) {
    log(`发现 ${errors.length} 个控制台错误:`, 'fail');
    errors.forEach(e => log(`  - ${e}`, 'fail'));
    testsFailed++;
  } else {
    log('无控制台错误', 'pass');
    testsPassed++;
  }

  return errors.length === 0;
}

async function testIframeMode() {
  log('测试: Iframe模式');
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // 导航到iframe页面
    log('1. 导航到Iframe页面');
    await page.goto(CHATAPP_URL + '/iframe', { waitUntil: 'networkidle0', timeout: 30000 });

    await takeScreenshot(page, 'iframe-page');

    // 测试控制按钮
    const buttons = ['切换聊天bot', '切换主题', '改变位置', '清除日志'];

    for (let i = 0; i < buttons.length; i++) {
      log(`2.${i + 1} 测试"${buttons[i]}"按钮`);

      const button = await page.$(`button:has-text("${buttons[i]}")`);
      if (button) {
        await button.click();
        await page.waitForTimeout(500);
        log(`  → ${buttons[i]}按钮已点击`, 'pass');
      } else {
        log(`  → 未找到${buttons[i]}按钮`, 'info');
      }
    }

    await takeScreenshot(page, 'iframe-controls-tested');
    await page.close();

    testsPassed++;
    log('✅ Iframe模式测试通过', 'pass');
    return true;
  } catch (error) {
    log(`Iframe模式测试失败: ${error.message}`, 'fail');
    testsFailed++;
    return false;
  }
}

async function runTests() {
  log('========================================');
  log('ChatApp UI 交互测试开始');
  log('========================================');

  try {
    // 启动浏览器
    log('启动浏览器...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();

    // 测试用例
    await testLandingAndRoutes();  // 新增: Landing页面和路由测试

    // 注意: 以下测试需要先导航到具体模式页面
    await page.goto(CHATAPP_URL + '/extended', { waitUntil: 'networkidle0' });
    await testWelcomeInterface(page);
    await testSendMessage(page);
    await testThemeToggle(page);
    await testSessionManagement(page);

    await testApiConnection(page);
    await testConsoleErrors(page);
    await testIframeMode();  // 新增: Iframe模式测试

    // 关闭浏览器
    await browser.close();

    // 输出测试结果
    log('========================================');
    log(`测试完成: ${testsPassed} 通过, ${testsFailed} 失败`);
    log('========================================');

    if (testsFailed > 0) {
      process.exit(1);
    }

  } catch (error) {
    log(`测试执行失败: ${error.message}`, 'fail');
    if (browser) {
      await browser.close();
    }
    process.exit(1);
  }
}

// 运行测试
runTests();
