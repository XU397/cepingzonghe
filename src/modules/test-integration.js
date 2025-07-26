/**
 * 模块系统集成测试
 * 验证模块注册、加载和基本功能
 */

/**
 * 测试模块注册系统
 */
async function testModuleRegistry() {
  console.log('🧪 开始测试模块注册系统...');
  
  try {
    // 导入模块注册表
    const moduleRegistry = (await import('./ModuleRegistry.js')).default;
    
    // 初始化模块系统
    await moduleRegistry.initialize();
    
    // 测试URL映射
    const grade7Module = moduleRegistry.getModuleByUrl('/seven-grade');
    
    if (grade7Module) {
      console.log('✅ 7年级模块注册成功:', {
        moduleId: grade7Module.moduleId,
        displayName: grade7Module.displayName,
        url: grade7Module.url
      });
      
      // 测试页面恢复功能
      const testPageNum = '13';
      const initialPage = grade7Module.getInitialPage(testPageNum);
      console.log('✅ 页面恢复测试:', {
        inputPageNum: testPageNum,
        outputPageId: initialPage
      });
      
    } else {
      console.error('❌ 未找到7年级模块');
      return false;
    }
    
    // 获取系统状态
    const status = moduleRegistry.getStatus();
    console.log('✅ 模块系统状态:', status);
    
    return true;
    
  } catch (error) {
    console.error('❌ 模块系统测试失败:', error);
    return false;
  }
}

/**
 * 测试模块配置
 */
async function testModuleConfig() {
  console.log('🧪 开始测试模块配置...');
  
  try {
    const { grade7Config, getConfigSnapshot } = await import('./grade-7/config.js');
    
    // 获取配置快照
    const snapshot = getConfigSnapshot();
    console.log('✅ 7年级模块配置:', snapshot);
    
    // 测试页面工具函数
    const testCases = [
      { pageNum: '1', desc: '注意事项页' },
      { pageNum: '13', desc: '仿真过渡页' },
      { pageNum: '19', desc: '任务完成页' },
      { pageNum: '28', desc: '问卷完成页' }
    ];
    
    for (const testCase of testCases) {
      const targetPageId = grade7Config.pageUtils.getTargetPageId(testCase.pageNum);
      const isCompleted = grade7Config.pageUtils.isTaskCompleted(testCase.pageNum);
      
      console.log(`✅ 页面测试 - pageNum: ${testCase.pageNum}:`, {
        targetPageId,
        isCompleted,
        description: testCase.desc
      });
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ 模块配置测试失败:', error);
    return false;
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('🚀 开始模块系统集成测试');
  console.log('==========================================');
  
  const results = [];
  
  // 测试模块注册系统
  results.push(await testModuleRegistry());
  
  console.log('------------------------------------------');
  
  // 测试模块配置
  results.push(await testModuleConfig());
  
  console.log('==========================================');
  
  const allPassed = results.every(result => result === true);
  
  if (allPassed) {
    console.log('🎉 所有测试通过！模块系统运行正常');
  } else {
    console.log('⚠️ 部分测试失败，请检查系统配置');
  }
  
  return allPassed;
}

// 导出测试函数
export {
  testModuleRegistry,
  testModuleConfig,
  runAllTests
};

// 如果直接运行此文件，执行所有测试
if (typeof window !== 'undefined' && window.location.search.includes('test=module')) {
  runAllTests();
}