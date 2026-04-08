/**
 * @file test-registry.js
 * @description 测试模块注册表的基本功能
 * 验证AC-6和AC-7的测试场景
 */

import moduleRegistry from './ModuleRegistry.js';

/**
 * 测试模块注册表功能
 */
async function testModuleRegistry() {
  console.log('🧪 [测试] 开始测试模块注册表功能...');
  
  try {
    // 初始化模块注册表
    await moduleRegistry.initialize();
    
    // 测试场景1 (AC-6): 验证有效URL返回正确模块定义
    console.log('\n📋 [测试场景1] 测试有效URL: /seven-grade');
    const sevenGradeModule = moduleRegistry.getModuleByUrl('/seven-grade');
    
    if (sevenGradeModule && sevenGradeModule.moduleId === 'grade-7') {
      console.log('✅ [测试场景1] 通过 - 成功获取7年级模块');
      console.log('   模块信息:', {
        moduleId: sevenGradeModule.moduleId,
        displayName: sevenGradeModule.displayName,
        url: sevenGradeModule.url,
        version: sevenGradeModule.version
      });
    } else {
      console.error('❌ [测试场景1] 失败 - 未能正确获取7年级模块');
    }
    
    // 测试场景2 (AC-7): 验证无效URL返回回退模块
    console.log('\n📋 [测试场景2] 测试无效URL: /invalid-url');
    const invalidModule = moduleRegistry.getModuleByUrl('/invalid-url');
    
    if (invalidModule && invalidModule.moduleId === 'fallback') {
      console.log('✅ [测试场景2] 通过 - 成功返回回退模块，系统未崩溃');
      console.log('   回退模块信息:', {
        moduleId: invalidModule.moduleId,
        displayName: invalidModule.displayName,
        url: invalidModule.url
      });
    } else {
      console.error('❌ [测试场景2] 失败 - 未能正确返回回退模块');
    }
    
    // 显示所有已注册模块
    console.log('\n📋 [系统状态] 所有已注册模块:');
    const allMappings = moduleRegistry.getAllUrlMappings();
    allMappings.forEach(mapping => {
      console.log(`   - ${mapping.displayName}: ${mapping.url} (${mapping.moduleId})`);
    });
    
    console.log('\n🎉 [测试] 模块注册表功能测试完成');
    
  } catch (error) {
    console.error('❌ [测试] 模块注册表测试失败:', error);
  }
}

// 导出测试函数
export { testModuleRegistry };

// 如果直接运行此文件，执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  testModuleRegistry();
}
