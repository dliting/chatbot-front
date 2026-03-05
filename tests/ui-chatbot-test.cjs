/**
 * AI Chatbot UI 交互测试脚本
 *
 * 使用 chrome-devtools MCP 进行 UI 交互测试
 *
 * 运行方式：
 * 1. 启动开发服务器: npm run dev
 * 2. 在 Claude Code 中执行此脚本
 */

// ==================== 配置 ====================
const CONFIG = {
  baseUrl: 'http://localhost:5173',
  timeout: 180000, // 3分钟超时
  screenshotDir: './tests/screenshots/',
};

// ==================== 主页面测试 ====================

/**
 * 测试主页面加载
 */
async function testHomePage() {
  console.log('=== 开始测试：主页面 ===');

  // 导航到主页
  await navigate_page(CONFIG.baseUrl);

  // 等待页面加载
  await wait_for('AI Chatbot');

  // 检查页面内容
  const snapshot = await take_snapshot();
  console.log('主页快照:', snapshot);

  // 截图
  await take_screenshot(`${CONFIG.screenshotDir}/homepage.png`);

  // 检查控制台错误
  const consoleMessages = await list_console_messages();
  const errors = consoleMessages.filter(m => m.level === 'error');
  if (errors.length > 0) {
    console.error('发现控制台错误:', errors);
  }

  console.log('=== 主页面测试完成 ===\n');
}

// ==================== 共用功能测试 ====================

/**
 * 测试文本输入与发送 (F-001)
 */
async function testTextInput(mode = 'extended') {
  console.log('=== 开始测试：文本输入与发送 ===');

  // 导航到对应模式页面
  await navigate_page(`${CONFIG.baseUrl}/examples/${mode}.html`);
  await wait_for('智能助手');

  // 测试输入框
  const snapshot1 = await take_snapshot();
  const inputUid = snapshot1.find(el => el.role === 'textbox' || el.attributes?.placeholder === '输入消息...')?.uid;

  if (inputUid) {
    // 测试多行输入
    await fill(inputUid, '这是一条测试消息');
    await take_screenshot(`${CONFIG.screenshotDir}/text-input-${mode}.png`);

    // 测试 Enter 发送
    await press_key('Enter');
    await wait_for('这是一条测试消息');

    // 测试 Shift+Enter 换行
    await fill(inputUid, '第一行');
    await press_key('Shift+Enter');
    await press_key('a'); // 输入第二行
    await take_screenshot(`${CONFIG.screenshotDir}/multiline-input-${mode}.png`);

    // 清空
    await fill(inputUid, '');

    // 检查空消息时发送按钮状态
    const snapshot2 = await take_snapshot();
    const sendButton = snapshot2.find(el => el.name === '发送');
    console.log('空消息时发送按钮状态:', sendButton?.attributes?.disabled);
  }

  console.log('=== 文本输入与发送测试完成 ===\n');
}

/**
 * 测试 AI 流式响应 (F-002)
 */
async function testStreamingResponse(mode = 'extended') {
  console.log('=== 开始测试：AI 流式响应 ===');

  await navigate_page(`${CONFIG.baseUrl}/examples/${mode}.html`);
  await wait_for('智能助手');

  const snapshot = await take_snapshot();
  const inputUid = snapshot.find(el => el.role === 'textbox')?.uid;
  const sendButtonUid = snapshot.find(el => el.name === '发送')?.uid;

  if (inputUid && sendButtonUid) {
    await fill(inputUid, '你好');
    await click(sendButtonUid);

    // 等待用户消息显示
    await wait_for('你好');

    // 截图
    await take_screenshot(`${CONFIG.screenshotDir}/streaming-response-${mode}.png`);

    // 等待 AI 响应
    await wait_for(5000); // 等待5秒让响应完成
  }

  console.log('=== AI 流式响应测试完成 ===\n');
}

/**
 * 测试消息气泡样式 (F-003)
 */
async function testMessageBubbles(mode = 'extended') {
  console.log('=== 开始测试：消息气泡样式 ===');

  await navigate_page(`${CONFIG.baseUrl}/examples/${mode}.html`);
  await wait_for('智能助手');

  // 发送消息
  const snapshot = await take_snapshot();
  const inputUid = snapshot.find(el => el.role === 'textbox')?.uid;
  const sendButtonUid = snapshot.find(el => el.name === '发送')?.uid;

  if (inputUid && sendButtonUid) {
    await fill(inputUid, '测试消息样式');
    await click(sendButtonUid);
    await wait_for('测试消息样式');

    // 检查消息气泡
    const snapshot2 = await take_snapshot();
    const userMessages = snapshot2.filter(el => el.text?.includes('测试消息样式'));
    console.log('用户消息:', userMessages);

    await take_screenshot(`${CONFIG.screenshotDir}/message-bubbles-${mode}.png`);
  }

  console.log('=== 消息气泡样式测试完成 ===\n');
}

/**
 * 测试消息操作 (F-301 ~ F-304)
 */
async function testMessageOperations(mode = 'extended') {
  console.log('=== 开始测试：消息操作 ===');

  await navigate_page(`${CONFIG.baseUrl}/examples/${mode}.html`);
  await wait_for('智能助手');

  // 发送消息
  const snapshot = await take_snapshot();
  const inputUid = snapshot.find(el => el.role === 'textbox')?.uid;
  const sendButtonUid = snapshot.find(el => el.name === '发送')?.uid;

  if (inputUid && sendButtonUid) {
    await fill(inputUid, '测试消息操作');
    await click(sendButtonUid);
    await wait_for('测试消息操作');

    // 悬停消息查看操作按钮
    const snapshot2 = await take_snapshot();
    const messageUid = snapshot2.find(el => el.text?.includes('测试消息操作'))?.uid;

    if (messageUid) {
      await hover(messageUid);
      await take_screenshot(`${CONFIG.screenshotDir}/message-operations-${mode}.png`);
    }
  }

  console.log('=== 消息操作测试完成 ===\n');
}

/**
 * 测试图片上传 (F-101 ~ F-104)
 */
async function testImageUpload(mode = 'extended') {
  console.log('=== 开始测试：图片上传 ===');

  await navigate_page(`${CONFIG.baseUrl}/examples/${mode}.html`);
  await wait_for('智能助手');

  // 点击菜单按钮
  const snapshot = await take_snapshot();
  const menuButtonUid = snapshot.find(el => el.name === '+')?.uid;

  if (menuButtonUid) {
    await click(menuButtonUid);

    // 等待菜单显示
    await wait_for(500);

    // 截图
    await take_screenshot(`${CONFIG.screenshotDir}/upload-menu-${mode}.png`);
  }

  console.log('=== 图片上传测试完成 ===\n');
}

/**
 * 测试主题切换 (F-401)
 */
async function testThemeToggle(mode = 'extended') {
  console.log('=== 开始测试：主题切换 ===');

  await navigate_page(`${CONFIG.baseUrl}/examples/${mode}.html`);
  await wait_for('智能助手');

  // 查找主题切换按钮
  const snapshot = await take_snapshot();
  const themeButtonUid = snapshot.find(el => el.attributes?.['aria-label']?.includes('主题'))?.uid;

  if (themeButtonUid) {
    // 切换到深色主题
    await click(themeButtonUid);
    await wait_for(500);
    await take_screenshot(`${CONFIG.screenshotDir}/dark-theme-${mode}.png`);

    // 切换回浅色主题
    await click(themeButtonUid);
    await wait_for(500);
    await take_screenshot(`${CONFIG.screenshotDir}/light-theme-${mode}.png`);
  }

  console.log('=== 主题切换测试完成 ===\n');
}

/**
 * 测试响应式设计 (F-010, F-011)
 */
async function testResponsive(mode = 'extended') {
  console.log('=== 开始测试：响应式设计 ===');

  await navigate_page(`${CONFIG.baseUrl}/examples/${mode}.html`);
  await wait_for('智能助手');

  // 测试桌面端
  await resize_page(1280, 720);
  await take_screenshot(`${CONFIG.screenshotDir}/desktop-${mode}.png`);

  // 测试移动端
  await resize_page(375, 667);
  await emulate({ viewport: { width: 375, height: 667, isMobile: true } });
  await take_screenshot(`${CONFIG.screenshotDir}/mobile-${mode}.png`);

  // 恢复桌面端
  await resize_page(1280, 720);

  console.log('=== 响应式设计测试完成 ===\n');
}

// ==================== 扩展模式特有测试 ====================

/**
 * 测试会话列表 (F-201)
 */
async function testSessionList() {
  console.log('=== 开始测试：会话列表 ===');

  await navigate_page(`${CONFIG.baseUrl}/examples/extended.html`);
  await wait_for('智能助手');

  // 检查会话列表
  const snapshot = await take_snapshot();
  const sessionList = snapshot.find(el => el.attributes?.['class']?.includes('session-list'));
  console.log('会话列表:', sessionList);

  // 测试新建会话
  const newSessionButton = snapshot.find(el => el.name === '新建对话' || el.name === '新对话');
  if (newSessionButton) {
    await click(newSessionButton.uid);
    await wait_for(500);
    await take_screenshot(`${CONFIG.screenshotDir}/session-list-new.png`);
  }

  console.log('=== 会话列表测试完成 ===\n');
}

// ==================== 紧凑模式特有测试 ====================

/**
 * 测试侧边栏折叠 (F-009)
 */
async function testSidebarCollapse() {
  console.log('=== 开始测试：侧边栏折叠 ===');

  await navigate_page(`${CONFIG.baseUrl}/examples/compact.html`);
  await wait_for('智能助手');

  // 检查侧边栏
  const snapshot1 = await take_snapshot();
  await take_screenshot(`${CONFIG.screenshotDir}/sidebar-expanded.png`);

  // 查找关闭按钮
  const closeButton = snapshot1.find(el => el.attributes?.['aria-label'] === '关闭');
  if (closeButton) {
    await click(closeButton.uid);
    await wait_for(500);
    await take_screenshot(`${CONFIG.screenshotDir}/sidebar-collapsed.png`);
  }

  // 检查悬浮球
  const snapshot2 = await take_snapshot();
  const floatingBall = snapshot2.find(el => el.attributes?.['class']?.includes('floating-ball'));
  console.log('悬浮球显示:', !!floatingBall);

  console.log('=== 侧边栏折叠测试完成 ===\n');
}

// ==================== 悬浮模式特有测试 ====================

/**
 * 测试悬浮球 (F-005)
 */
async function testFloatingBall() {
  console.log('=== 开始测试：悬浮球 ===');

  await navigate_page(`${CONFIG.baseUrl}/examples/floating.html`);
  await wait_for(1000); // 等待页面加载

  // 检查悬浮球
  const snapshot = await take_snapshot();
  const floatingBall = snapshot.find(el => el.attributes?.['class']?.includes('floating-ball'));
  console.log('悬浮球:', floatingBall);

  if (floatingBall) {
    await take_screenshot(`${CONFIG.screenshotDir}/floating-ball.png`);

    // 点击悬浮球
    await click(floatingBall.uid);
    await wait_for(500);
    await take_screenshot(`${CONFIG.screenshotDir}/floating-panel.png`);
  }

  console.log('=== 悬浮球测试完成 ===\n');
}

/**
 * 测试悬浮面板拖拽 (F-501)
 */
async function testFloatingPanelDrag() {
  console.log('=== 开始测试：悬浮面板拖拽 ===');

  await navigate_page(`${CONFIG.baseUrl}/examples/floating.html`);
  await wait_for(1000);

  // 打开面板
  const snapshot1 = await take_snapshot();
  const floatingBall = snapshot1.find(el => el.attributes?.['class']?.includes('floating-ball'));

  if (floatingBall) {
    await click(floatingBall.uid);
    await wait_for(500);

    // 查找标题栏
    const snapshot2 = await take_snapshot();
    const header = snapshot2.find(el => el.attributes?.['class']?.includes('chat-header'));

    if (header) {
      // 拖拽面板
      await drag(header.uid, header.uid);
      await wait_for(500);
      await take_screenshot(`${CONFIG.screenshotDir}/floating-panel-dragged.png`);
    }
  }

  console.log('=== 悬浮面板拖拽测试完成 ===\n');
}

// ==================== 综合测试套件 ====================

/**
 * 运行所有共用功能测试
 */
async function runCommonTests() {
  console.log('\n========================================');
  console.log('开始运行：共用功能测试套件');
  console.log('========================================\n');

  await testTextInput();
  await testStreamingResponse();
  await testMessageBubbles();
  await testMessageOperations();
  await testImageUpload();
  await testThemeToggle();
  await testResponsive();

  console.log('========================================');
  console.log('共用功能测试套件完成');
  console.log('========================================\n');
}

/**
 * 运行扩展模式测试
 */
async function runExtendedModeTests() {
  console.log('\n========================================');
  console.log('开始运行：扩展模式测试套件');
  console.log('========================================\n');

  await testTextInput('extended');
  await testStreamingResponse('extended');
  await testThemeToggle('extended');
  await testSessionList();

  console.log('========================================');
  console.log('扩展模式测试套件完成');
  console.log('========================================\n');
}

/**
 * 运行紧凑模式测试
 */
async function runCompactModeTests() {
  console.log('\n========================================');
  console.log('开始运行：紧凑模式测试套件');
  console.log('========================================\n');

  await testTextInput('compact');
  await testStreamingResponse('compact');
  await testThemeToggle('compact');
  await testSidebarCollapse();

  console.log('========================================');
  console.log('紧凑模式测试套件完成');
  console.log('========================================\n');
}

/**
 * 运行悬浮模式测试
 */
async function runFloatingModeTests() {
  console.log('\n========================================');
  console.log('开始运行：悬浮模式测试套件');
  console.log('========================================\n');

  await testTextInput('floating');
  await testStreamingResponse('floating');
  await testThemeToggle('floating');
  await testFloatingBall();
  await testFloatingPanelDrag();

  console.log('========================================');
  console.log('悬浮模式测试套件完成');
  console.log('========================================\n');
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('\n========================================');
  console.log('AI Chatbot UI 测试开始');
  console.log('========================================\n');

  // 主页面测试
  await testHomePage();

  // 共用功能测试
  await runCommonTests();

  // 扩展模式测试
  await runExtendedModeTests();

  // 紧凑模式测试
  await runCompactModeTests();

  // 悬浮模式测试
  await runFloatingModeTests();

  console.log('\n========================================');
  console.log('所有测试完成！');
  console.log('========================================\n');
}

// ==================== 导出 ====================

// 可以根据需要运行不同的测试套件
module.exports = {
  // 主页面测试
  testHomePage,

  // 共用功能测试
  testTextInput,
  testStreamingResponse,
  testMessageBubbles,
  testMessageOperations,
  testImageUpload,
  testThemeToggle,
  testResponsive,
  runCommonTests,

  // 扩展模式测试
  testSessionList,
  runExtendedModeTests,

  // 紧凑模式测试
  testSidebarCollapse,
  runCompactModeTests,

  // 悬浮模式测试
  testFloatingBall,
  testFloatingPanelDrag,
  runFloatingModeTests,

  // 综合测试
  runAllTests,
};

// 如果直接运行此文件
if (require.main === module) {
  runAllTests().catch(console.error);
}
