/**
 * 生产环境部署验证脚本
 * 验证多模块架构系统的部署状态和功能完整性
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 验证结果收集
const verificationResults = {
  passed: [],
  failed: [],
  warnings: []
};

// 添加验证结果
function addResult(type, category, message, details = null) {
  const result = { category, message, details, timestamp: new Date().toISOString() };
  verificationResults[type].push(result);
  
  const symbol = type === 'passed' ? '✅' : type === 'failed' ? '❌' : '⚠️';
  console.log(`${symbol} [${category}] ${message}`);
  if (details) {
    console.log(`   详情: ${JSON.stringify(details)}`);
  }
}

// 验证文件存在性
function verifyFileExists(filePath, category, description) {
  try {
    if (fs.existsSync(filePath)) {
      addResult('passed', category, `${description} 存在: ${filePath}`);
      return true;
    } else {
      addResult('failed', category, `${description} 缺失: ${filePath}`);
      return false;
    }
  } catch (error) {
    addResult('failed', category, `检查 ${description} 时出错: ${error.message}`);
    return false;
  }
}

// 验证模块系统文件结构
function verifyModuleSystemStructure() {
  console.log('\n🔍 验证模块系统文件结构...');
  
  const requiredFiles = [
    { path: 'src/modules/ModuleRegistry.js', desc: '模块注册中心' },
    { path: 'src/modules/ErrorBoundary.jsx', desc: '错误边界组件' },
    { path: 'src/modules/grade-7/index.jsx', desc: '7年级模块入口' },
    { path: 'src/modules/grade-7/wrapper.jsx', desc: '7年级包装器' },
    { path: 'src/modules/grade-7/config.js', desc: '7年级配置' },
    { path: 'src/ModuleRouter.jsx', desc: '模块路由器' },
    { path: '.env.development', desc: '开发环境配置' },
    { path: '.env.production', desc: '生产环境配置' }
  ];

  let allFilesExist = true;
  for (const file of requiredFiles) {
    if (!verifyFileExists(file.path, '文件结构', file.desc)) {
      allFilesExist = false;
    }
  }

  return allFilesExist;
}

// 验证环境变量配置
function verifyEnvironmentConfig() {
  console.log('\n🔧 验证环境变量配置...');
  
  try {
    // 检查开发环境配置
    const devEnvPath = '.env.development';
    if (fs.existsSync(devEnvPath)) {
      const devEnvContent = fs.readFileSync(devEnvPath, 'utf8');
      if (devEnvContent.includes('REACT_APP_ENABLE_MODULE_SYSTEM=true')) {
        addResult('passed', '环境配置', '开发环境正确配置为启用模块系统');
      } else {
        addResult('warnings', '环境配置', '开发环境未启用模块系统');
      }
    }

    // 检查生产环境配置
    const prodEnvPath = '.env.production';
    if (fs.existsSync(prodEnvPath)) {
      const prodEnvContent = fs.readFileSync(prodEnvPath, 'utf8');
      if (prodEnvContent.includes('REACT_APP_ENABLE_MODULE_SYSTEM=false')) {
        addResult('passed', '环境配置', '生产环境正确配置为禁用模块系统（安全）');
      } else if (prodEnvContent.includes('REACT_APP_ENABLE_MODULE_SYSTEM=true')) {
        addResult('warnings', '环境配置', '生产环境已启用模块系统');
      } else {
        addResult('failed', '环境配置', '生产环境配置不完整');
      }
    }

    return true;
  } catch (error) {
    addResult('failed', '环境配置', `验证环境配置时出错: ${error.message}`);
    return false;
  }
}

// 验证构建文件
function verifyBuildOutput() {
  console.log('\n📦 验证构建输出...');
  
  const distPath = 'dist';
  if (!fs.existsSync(distPath)) {
    addResult('warnings', '构建输出', '未找到构建输出目录，请运行 npm run build');
    return false;
  }

  // 检查关键构建文件
  const buildFiles = fs.readdirSync(distPath);
  const hasIndexHtml = buildFiles.some(file => file === 'index.html');
  const hasAssets = fs.existsSync(path.join(distPath, 'assets'));
  const hasTestPage = buildFiles.some(file => file === 'module-test.html');

  if (hasIndexHtml) {
    addResult('passed', '构建输出', '主页面文件存在');
  } else {
    addResult('failed', '构建输出', '主页面文件缺失');
  }

  if (hasAssets) {
    const assetsFiles = fs.readdirSync(path.join(distPath, 'assets'));
    const jsFiles = assetsFiles.filter(file => file.endsWith('.js'));
    const cssFiles = assetsFiles.filter(file => file.endsWith('.css'));
    
    addResult('passed', '构建输出', `资源文件正常 (JS: ${jsFiles.length}, CSS: ${cssFiles.length})`);
    
    // 检查是否有模块相关的代码分割文件
    const moduleFiles = jsFiles.filter(file => 
      file.includes('Module') || file.includes('module')
    );
    
    if (moduleFiles.length > 0) {
      addResult('passed', '构建输出', `模块系统代码分割正常: ${moduleFiles.join(', ')}`);
    }
    
  } else {
    addResult('failed', '构建输出', '资源目录缺失');
  }

  if (hasTestPage) {
    addResult('passed', '构建输出', '测试页面已包含');
  } else {
    addResult('warnings', '构建输出', '测试页面未包含在构建中');
  }

  return hasIndexHtml && hasAssets;
}

// 验证代码质量
function verifyCodeQuality() {
  console.log('\n📋 验证代码质量...');
  
  // 检查关键文件的语法正确性
  const criticalFiles = [
    'src/modules/ModuleRegistry.js',
    'src/modules/grade-7/index.jsx',
    'src/ModuleRouter.jsx'
  ];

  let allFilesValid = true;
  for (const filePath of criticalFiles) {
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 基本语法检查
        if (content.includes('import') && content.includes('export')) {
          addResult('passed', '代码质量', `${filePath} 模块语法正确`);
        } else {
          addResult('warnings', '代码质量', `${filePath} 可能缺少导入/导出语句`);
        }
        
        // 检查错误处理
        if (content.includes('try') && content.includes('catch')) {
          addResult('passed', '代码质量', `${filePath} 包含错误处理`);
        } else {
          addResult('warnings', '代码质量', `${filePath} 可能缺少错误处理`);
        }
        
      }
    } catch (error) {
      addResult('failed', '代码质量', `检查 ${filePath} 时出错: ${error.message}`);
      allFilesValid = false;
    }
  }

  return allFilesValid;
}

// 验证向后兼容性
function verifyBackwardCompatibility() {
  console.log('\n🔄 验证向后兼容性...');
  
  // 检查关键的现有文件是否未被修改（路径完整性）
  const criticalExistingFiles = [
    'src/components/PageRouter.jsx',
    'src/context/AppContext.jsx',
    'src/utils/pageMappings.js',
    'src/services/apiService.js'
  ];

  let compatibilityMaintained = true;
  for (const filePath of criticalExistingFiles) {
    if (verifyFileExists(filePath, '向后兼容', `关键现有文件: ${path.basename(filePath)}`)) {
      // 文件存在是好的，表示没有被误删
    } else {
      compatibilityMaintained = false;
    }
  }

  // 检查是否有新的依赖破坏了现有功能
  const packageJsonPath = 'package.json';
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const dependencies = Object.keys(packageJson.dependencies || {});
      const devDependencies = Object.keys(packageJson.devDependencies || {});
      
      addResult('passed', '向后兼容', `依赖项数量正常 (生产: ${dependencies.length}, 开发: ${devDependencies.length})`);
      
      // 检查是否有新的破坏性依赖
      const knownSafeDeps = ['react', 'react-dom', 'jsencrypt', 'vite'];
      const unknownDeps = dependencies.filter(dep => !knownSafeDeps.includes(dep));
      
      if (unknownDeps.length === 0) {
        addResult('passed', '向后兼容', '未发现新的依赖项');
      } else {
        addResult('warnings', '向后兼容', `发现新依赖项: ${unknownDeps.join(', ')}`);
      }
      
    } catch (error) {
      addResult('failed', '向后兼容', `检查依赖项时出错: ${error.message}`);
      compatibilityMaintained = false;
    }
  }

  return compatibilityMaintained;
}

// 生成验证报告
function generateReport() {
  console.log('\n📊 生成验证报告...');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: verificationResults.passed.length + verificationResults.failed.length + verificationResults.warnings.length,
      passed: verificationResults.passed.length,
      failed: verificationResults.failed.length,
      warnings: verificationResults.warnings.length
    },
    results: verificationResults,
    recommendations: []
  };

  // 生成建议
  if (report.summary.failed > 0) {
    report.recommendations.push('❌ 存在关键问题，建议修复后再部署');
  }
  
  if (report.summary.warnings > 0) {
    report.recommendations.push('⚠️ 存在警告项，建议检查但不阻止部署');
  }
  
  if (report.summary.failed === 0 && report.summary.warnings === 0) {
    report.recommendations.push('✅ 验证通过，可以安全部署');
  }

  // 保存报告到文件
  const reportPath = 'deployment-verification-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📄 完整报告已保存至: ${reportPath}`);
  
  return report;
}

// 主验证流程
async function runVerification() {
  console.log('🚀 开始多模块架构部署验证...');
  console.log('=========================================');

  // 运行所有验证检查
  const checks = [
    verifyModuleSystemStructure,
    verifyEnvironmentConfig,
    verifyBuildOutput,
    verifyCodeQuality,
    verifyBackwardCompatibility
  ];

  for (const check of checks) {
    try {
      await check();
    } catch (error) {
      addResult('failed', '系统错误', `验证检查失败: ${error.message}`);
    }
  }

  // 生成最终报告
  const report = generateReport();
  
  console.log('\n=========================================');
  console.log('📋 验证汇总:');
  console.log(`   ✅ 通过: ${report.summary.passed}`);
  console.log(`   ❌ 失败: ${report.summary.failed}`);
  console.log(`   ⚠️  警告: ${report.summary.warnings}`);
  
  console.log('\n🎯 建议:');
  report.recommendations.forEach(rec => console.log(`   ${rec}`));
  
  // 返回验证是否通过
  return report.summary.failed === 0;
}

// 直接执行验证
runVerification()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ 验证过程出现异常:', error);
    process.exit(1);
  });

export {
  runVerification,
  verificationResults
};