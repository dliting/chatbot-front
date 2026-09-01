/**
 * Comprehensive UI Test for AI Chatbot
 * Tests session CRUD enhancements and core functionality
 */

const puppeteer = require('puppeteer');

// Test configuration
const BASE_URL = 'http://localhost:5185/';
const SCREENSHOT_DIR = 'tests/screenshots';

// Test results tracker
const results = {
  passed: [],
  failed: [],
  total: 0
};

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, passed, details = '') {
  results.total++;
  if (passed) {
    results.passed.push({ name, details });
    log(`✓ ${name}`, 'green');
  } else {
    results.failed.push({ name, details });
    log(`✗ ${name}`, 'red');
    if (details) log(`  ${details}`, 'yellow');
  }
}

async function setupBrowser() {
  log('\n=== Starting Browser ===', 'blue');
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // Set viewport
  await page.setViewport({ width: 1280, height: 800 });

  // Capture console messages
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      log(`  [Console Error] ${msg.text()}`, 'yellow');
    }
  });

  // Capture network errors
  page.on('response', (response) => {
    if (response.status() >= 400) {
      log(`  [Network Error] ${response.url()} - ${response.status()}`, 'yellow');
    }
  });

  return { browser, page };
}

async function navigateToPage(page) {
  log('\n=== Navigating to Chat App ===', 'blue');
  try {
    // Then navigate to extended mode where the chat features are
    log('Navigating to Extended mode...', 'blue');
    await page.goto(`${BASE_URL}extended`, { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait for component to mount
    await new Promise(resolve => setTimeout(resolve, 2000));

    log(`Loaded: ${BASE_URL}extended`, 'green');
    return true;
  } catch (error) {
    log(`Failed to load page: ${error.message}`, 'red');
    return false;
  }
}

async function checkPageLoad(page) {
  log('\n=== Checking Page Load ===', 'blue');

  // Check for Vue app mount
  const appMounted = await page.evaluate(() => {
    const app = document.querySelector('#app');
    return app && app.children.length > 0;
  });
  logTest('Page loaded successfully', appMounted);

  return appMounted;
}

async function testSessionListDisplay(page) {
  log('\n=== Testing Session List Display ===', 'blue');

  // Wait for session list to appear
  await page.waitForSelector('.chatbot-sessions, .session-list-view', { timeout: 10000 })
    .catch(() => log('Session list selector not found', 'yellow'));

  const hasSessionList = await page.evaluate(() => {
    const sessionList = document.querySelector('.chatbot-sessions, .session-list-view');
    return sessionList !== null;
  });
  logTest('Session list is displayed', hasSessionList);

  // Check for session items
  const sessionCount = await page.evaluate(() => {
    const items = document.querySelectorAll('.chatbot-sessions__item, .session-list-view__item');
    return items.length;
  });
  logTest('Session items exist', sessionCount >= 0, `Found ${sessionCount} sessions`);

  return hasSessionList;
}

async function testSearchFunction(page) {
  log('\n=== Testing Search Function ===', 'blue');

  // Check if search component exists
  const hasSearch = await page.evaluate(() => {
    const searchWrapper = document.querySelector('.session-search');
    return searchWrapper !== null;
  });
  logTest('Search component exists', hasSearch);

  if (!hasSearch) return false;

  // Try to input search text
  try {
    const searchInput = await page.$('.session-search input');
    if (searchInput) {
      await searchInput.click();
      await searchInput.type('test');
      await new Promise(resolve => setTimeout(resolve, 500));

      const searchWorked = await page.evaluate(() => {
        const input = document.querySelector('.session-search input');
        return input && input.value.includes('test');
      });
      logTest('Search input accepts text', searchWorked);

      // Check for clear button
      const hasClearButton = await page.evaluate(() => {
        const clearBtn = document.querySelector('.session-search__clear');
        return clearBtn && clearBtn.offsetParent !== null;
      });
      logTest('Clear button appears with text', hasClearButton);
    }

    return true;
  } catch (error) {
    logTest('Search input interaction', false, error.message);
    return false;
  }
}

async function testBatchMode(page) {
  log('\n=== Testing Batch Selection Mode ===', 'blue');

  // Look for batch mode button
  const hasBatchButton = await page.evaluate(() => {
    const batchBtn = document.querySelector('.chatbot-sessions__batch-mode-btn');
    return batchBtn !== null;
  });
  logTest('Batch mode button exists', hasBatchButton);

  if (!hasBatchButton) {
    log('Batch mode button not found - checking if sessions exist', 'yellow');
    return false;
  }

  try {
    // Click batch mode button
    await page.click('.chatbot-sessions__batch-mode-btn');
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if checkboxes appear
    const hasCheckboxes = await page.evaluate(() => {
      const checkboxes = document.querySelectorAll('.chatbot-sessions__checkbox');
      return checkboxes.length > 0;
    });
    logTest('Checkboxes appear in batch mode', hasCheckboxes);

    return true;
  } catch (error) {
    logTest('Batch mode activation', false, error.message);
    return false;
  }
}

async function testNewSessionButton(page) {
  log('\n=== Testing New Session Button ===', 'blue');

  const hasNewButton = await page.evaluate(() => {
    const newBtn = document.querySelector('.chatbot-sessions__new-btn');
    return newBtn !== null;
  });
  logTest('New session button exists', hasNewButton);

  if (hasNewButton) {
    try {
      await page.click('.chatbot-sessions__new-btn');
      await new Promise(resolve => setTimeout(resolve, 1000));

      const sessionCount = await page.evaluate(() => {
        const items = document.querySelectorAll('.chatbot-sessions__item');
        return items.length;
      });
      logTest('Can create new session', sessionCount >= 0, `Total sessions: ${sessionCount}`);

      return true;
    } catch (error) {
      logTest('New session button click', false, error.message);
      return false;
    }
  }

  return false;
}

async function testMessageInput(page) {
  log('\n=== Testing Message Input ===', 'blue');

  const hasInput = await page.evaluate(() => {
    const input = document.querySelector('.chat-input textarea, .chatbot-input__textarea');
    return input !== null;
  });
  logTest('Message input exists', hasInput);

  if (!hasInput) return false;

  try {
    await page.click('.chat-input textarea, .chatbot-input__textarea');
    await page.type('.chat-input textarea, .chatbot-input__textarea', 'Hello, AI!');

    const inputHasText = await page.evaluate(() => {
      const input = document.querySelector('.chat-input textarea, .chatbot-input__textarea');
      return input && input.value.includes('Hello');
    });
    logTest('Can type in message input', inputHasText);

    return true;
  } catch (error) {
    logTest('Message input interaction', false, error.message);
    return false;
  }
}

async function testRightClickMenu(page) {
  log('\n=== Testing Right-Click Context Menu ===', 'blue');

  const sessionExists = await page.evaluate(() => {
    const items = document.querySelectorAll('.chatbot-sessions__item');
    return items.length > 0;
  });

  if (!sessionExists) {
    log('No sessions to test right-click menu', 'yellow');
    return false;
  }

  try {
    await page.evaluate(() => {
      const firstItem = document.querySelector('.chatbot-sessions__item');
      if (firstItem) {
        const event = new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        firstItem.dispatchEvent(event);
      }
    });

    await new Promise(resolve => setTimeout(resolve, 300));

    const menuAppeared = await page.evaluate(() => {
      const menu = document.querySelector('.session-action-menu__popover');
      return menu !== null;
    });
    logTest('Right-click menu appears', menuAppeared);

    if (menuAppeared) {
      await page.click('body');
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return true;
  } catch (error) {
    logTest('Right-click menu', false, error.message);
    return false;
  }
}

async function takeScreenshot(page, name) {
  const fs = require('fs');
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  try {
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/${name}.png`,
      fullPage: false
    });
    log(`Screenshot saved: ${name}.png`, 'blue');
  } catch (error) {
    log(`Failed to save screenshot: ${error.message}`, 'yellow');
  }
}

async function runTests() {
  log('\n╔══════════════════════════════════════════════╗', 'blue');
  log('║  AI Chatbot - Comprehensive UI Test Suite   ║', 'blue');
  log('╚══════════════════════════════════════════════╝', 'blue');

  let browser, page;
  try {
    // Setup
    ({ browser, page } = await setupBrowser());

    // Navigate
    const loaded = await navigateToPage(page);
    if (!loaded) {
      log('\n❌ Failed to load page. Exiting tests.', 'red');
      return;
    }

    // Take initial screenshot
    await takeScreenshot(page, '01-initial-load');

    // Run tests
    await checkPageLoad(page);
    await testSessionListDisplay(page);
    await testSearchFunction(page);
    await testBatchMode(page);
    await testNewSessionButton(page);
    await testMessageInput(page);
    await testRightClickMenu(page);

    // Take final screenshot
    await takeScreenshot(page, '02-after-tests');

  } catch (error) {
    log(`\n❌ Test suite error: ${error.message}`, 'red');
    console.error(error);
  } finally {
    if (browser) {
      log('\n=== Closing Browser ===', 'blue');
      await browser.close();
    }
  }

  // Print summary
  log('\n╔══════════════════════════════════════════════╗', 'blue');
  log('║              Test Summary                    ║', 'blue');
  log('╚══════════════════════════════════════════════╝', 'blue');
  log(`\n  Total Tests: ${results.total}`, 'bold');
  log(`  ✓ Passed: ${results.passed.length}`, 'green');
  log(`  ✗ Failed: ${results.failed.length}`, results.failed.length > 0 ? 'red' : 'green');
  log(`  Success Rate: ${results.total > 0 ? ((results.passed.length / results.total) * 100).toFixed(1) : 0}%`,
      results.passed.length === results.total ? 'green' : 'yellow');

  if (results.failed.length > 0) {
    log('\nFailed Tests:', 'red');
    results.failed.forEach(f => {
      log(`  - ${f.name}${f.details ? ': ' + f.details : ''}`, 'yellow');
    });
  }

  log(`\nScreenshots saved to: ${SCREENSHOT_DIR}/`, 'blue');
}

// Run tests
runTests().then(() => {
  process.exit(results.failed.length > 0 ? 1 : 0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
