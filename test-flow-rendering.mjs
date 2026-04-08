import { chromium } from '@playwright/test';

async function testFlowRendering() {
  console.log('========================================');
  console.log('Flow 渲染循环修复验证测试');
  console.log('========================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleMessages = [];
  const mockFlowApiLogs = [];
  const flowModuleLogs = [];

  // 捕获浏览器控制台日志
  page.on('console', (msg) => {
    const text = msg.text();
    consoleMessages.push(text);

    if (text.includes('[Mock Flow API]')) {
      mockFlowApiLogs.push(text);
    }
    if (text.includes('[FlowModule]')) {
      flowModuleLogs.push(text);
    }
  });

  // 捕获页面错误
  page.on('pageerror', (error) => {
    console.error('❌ 页面错误:', error.message);
  });

  console.log('1️⃣  启动浏览器并访问测试页面...');
  console.log('   URL: http://localhost:3000/flow/test-flow-1\n');

  try {
    await page.goto('http://localhost:3000/flow/test-flow-1', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('2️⃣  页面加载完成，等待 15 秒监控日志...\n');

    // 每 5 秒报告一次当前日志数
    for (let i = 0; i < 3; i++) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      console.log(`   ⏱️  ${(i + 1) * 5} 秒 | Mock API: ${mockFlowApiLogs.length} | FlowModule: ${flowModuleLogs.length}`);
    }

    console.log('\n3️⃣  捕获页面快照...\n');
    const title = await page.title();
    const url = page.url();

    console.log('========================================');
    console.log('📊 测试结果汇总');
    console.log('========================================\n');

    console.log('页面信息:');
    console.log(`  标题: ${title}`);
    console.log(`  URL: ${url}\n`);

    console.log('日志统计 (15 秒):');
    console.log(`  总控制台消息: ${consoleMessages.length}`);
    console.log(`  Mock Flow API 日志: ${mockFlowApiLogs.length}`);
    console.log(`  FlowModule 日志: ${flowModuleLogs.length}\n`);

    // 分析 Mock API 日志模式
    const heartbeatCount = mockFlowApiLogs.filter(log => log.includes('heartbeat')).length;
    const fetchingCount = mockFlowApiLogs.filter(log => log.includes('Fetching flow definition')).length;

    console.log('Mock API 详细分类:');
    console.log(`  Heartbeat 请求: ${heartbeatCount}`);
    console.log(`  Fetching Definition 请求: ${fetchingCount}`);

    if (fetchingCount > 0) {
      const ratio = (heartbeatCount / fetchingCount).toFixed(2);
      console.log(`  比例 (heartbeat : fetching): ${ratio} : 1\n`);
    } else {
      console.log(`  比例: 无 fetching 请求\n`);
    }

    // FlowModule 挂载/卸载分析
    const mountCount = flowModuleLogs.filter(log => log.includes('mount') && !log.includes('unmount')).length;
    const unmountCount = flowModuleLogs.filter(log => log.includes('unmount')).length;

    console.log('FlowModule 生命周期:');
    console.log(`  挂载 (mount): ${mountCount}`);
    console.log(`  卸载 (unmount): ${unmountCount}\n`);

    // 评估结果
    console.log('========================================');
    console.log('✅ 修复效果评估');
    console.log('========================================\n');

    const expectedMaxLogs = 100; // 期望 15 秒内 < 100 条日志
    const baselineFailureLogs = 1500; // 修复前 10 秒 1500+ 条

    if (mockFlowApiLogs.length === 0 && flowModuleLogs.length === 0) {
      console.log('⚠️  警告: 没有捕获到任何 Flow 相关日志');
      console.log('   可能原因: 页面未加载 Flow 组件或日志被过滤\n');
    } else if (mockFlowApiLogs.length < expectedMaxLogs) {
      console.log(`✅ 成功: Mock API 日志量正常 (${mockFlowApiLogs.length} < ${expectedMaxLogs})`);
      console.log(`   相比修复前减少: ${((1 - mockFlowApiLogs.length / baselineFailureLogs) * 100).toFixed(1)}%\n`);
    } else {
      console.log(`❌ 失败: Mock API 日志量仍然过高 (${mockFlowApiLogs.length} >= ${expectedMaxLogs})`);
      console.log('   建议: 检查 FlowModule 是否仍存在无限渲染循环\n');
    }

    if (mountCount === 1 && unmountCount === 0) {
      console.log('✅ 成功: FlowModule 正常挂载且未重复卸载/挂载');
    } else if (mountCount > 1) {
      console.log(`❌ 失败: FlowModule 重复挂载 ${mountCount} 次`);
      console.log('   这表明组件可能仍在无限循环重渲染\n');
    }

    // 输出前 10 条日志样本
    if (mockFlowApiLogs.length > 0) {
      console.log('\n📝 Mock API 日志样本 (前 10 条):');
      mockFlowApiLogs.slice(0, 10).forEach((log, i) => {
        console.log(`  ${i + 1}. ${log}`);
      });
    }

    if (flowModuleLogs.length > 0) {
      console.log('\n📝 FlowModule 日志样本 (前 10 条):');
      flowModuleLogs.slice(0, 10).forEach((log, i) => {
        console.log(`  ${i + 1}. ${log}`);
      });
    }

    console.log('\n========================================');
    console.log('测试完成');
    console.log('========================================\n');

  } catch (error) {
    console.error('\n❌ 测试执行失败:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

testFlowRendering().catch(console.error);
