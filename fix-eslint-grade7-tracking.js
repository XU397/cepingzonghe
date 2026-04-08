/**
 * 批量修复 grade-7-tracking 模块的 ESLint 错误
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODULE_PATH = path.join(__dirname, 'src', 'modules', 'grade-7-tracking');

// 需要移除 'import React from react' 的文件列表
const filesToFixReact = [
  'components/experiment/BeakerSelector.jsx',
  'components/experiment/TemperatureControl.jsx',
  'components/experiment/TimerDisplay.jsx',
  'components/experiment/BallDropAnimation.jsx',
  'components/visualizations/LineChart.jsx',
  'components/layout/PageLayout.jsx',
  'context/TrackingContext.jsx',
  'pages/Page01_Notice.jsx',
  'pages/Page02_Intro.jsx',
  'pages/Page03_Question.jsx',
  'pages/Page04_Resource.jsx',
  'pages/Page10_Experiment.jsx',
  'pages/Page11_Analysis1.jsx',
  'pages/Page12_Analysis2.jsx',
  'pages/Page13_Analysis3.jsx',
  'pages/Page13_Summary.jsx',
  'pages/Page14_Solution.jsx',
];

// 修复单个文件
function fixFile(filePath) {
  const fullPath = path.join(MODULE_PATH, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  文件不存在: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf-8');
  let modified = false;

  // 1. 移除未使用的 React 导入
  const reactImportRegex = /^import React from ['"]react['"];?\n?/m;
  if (reactImportRegex.test(content)) {
    content = content.replace(reactImportRegex, '');
    modified = true;
    console.log(`✓ 移除 React 导入: ${filePath}`);
  }

  // 2. 修复转义字符 (将 " 替换为 &quot;)
  content = content.replace(/点击"开始实验"/g, '点击&quot;开始实验&quot;');
  content = content.replace(/点击"开始实验"查看小球下落/g, '点击&quot;开始实验&quot;查看小球下落');
  content = content.replace(/点击"新增"/g, '点击&quot;新增&quot;');

  // 3. 保存修改
  if (modified || content !== fs.readFileSync(fullPath, 'utf-8')) {
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log(`✅ 已修复: ${filePath}\n`);
  }
}

// 修复特定文件的特殊问题
function fixSpecificIssues() {
  // TemperatureControl.jsx - 移除未使用的 idx
  const tempControlPath = path.join(MODULE_PATH, 'components/experiment/TemperatureControl.jsx');
  if (fs.existsSync(tempControlPath)) {
    let content = fs.readFileSync(tempControlPath, 'utf-8');
    content = content.replace(/\.map\(\(temp, idx\) =>/g, '.map((temp) =>');
    content = content.replace(/\(temp, idx\)/g, '(temp)');
    fs.writeFileSync(tempControlPath, content, 'utf-8');
    console.log('✅ 修复 TemperatureControl.jsx 未使用变量 idx\n');
  }

  // TimerDisplay.jsx - 移除未使用的 formatTime
  const timerDisplayPath = path.join(MODULE_PATH, 'components/experiment/TimerDisplay.jsx');
  if (fs.existsSync(timerDisplayPath)) {
    let content = fs.readFileSync(timerDisplayPath, 'utf-8');
    // 移除整个formatTime函数定义
    content = content.replace(/ {2}\/\/ 格式化时间显示\(保留1位小数\)[\s\S]*? {2}};/, '  // formatTime removed (unused)');
    fs.writeFileSync(timerDisplayPath, content, 'utf-8');
    console.log('✅ 修复 TimerDisplay.jsx 未使用函数 formatTime\n');
  }

  // LineChart.jsx - 移除未使用的 calculateFallTime
  const lineChartPath = path.join(MODULE_PATH, 'components/visualizations/LineChart.jsx');
  if (fs.existsSync(lineChartPath)) {
    let content = fs.readFileSync(lineChartPath, 'utf-8');
    content = content.replace(/import \{ calculateFallTime \} from ['"].*?['"];?\n/, '');
    fs.writeFileSync(lineChartPath, content, 'utf-8');
    console.log('✅ 修复 LineChart.jsx 未使用导入 calculateFallTime\n');
  }

  // Page11_Analysis1.jsx - 移除未使用的 idx
  const page11Path = path.join(MODULE_PATH, 'pages/Page11_Analysis1.jsx');
  if (fs.existsSync(page11Path)) {
    let content = fs.readFileSync(page11Path, 'utf-8');
    content = content.replace(/\.slice\(-2\)\.map\(\(record, idx\) =>/g, '.slice(-2).map((record) =>');
    fs.writeFileSync(page11Path, content, 'utf-8');
    console.log('✅ 修复 Page11_Analysis1.jsx 未使用变量 idx\n');
  }

  // Page01_Notice.jsx - 移除未使用的 useNavigation
  const page01Path = path.join(MODULE_PATH, 'pages/Page01_Notice.jsx');
  if (fs.existsSync(page01Path)) {
    let content = fs.readFileSync(page01Path, 'utf-8');
    content = content.replace(/import \{ useTrackingContext, useNavigation \} from/g, 'import { useTrackingContext } from');
    content = content.replace(/const \{ session, logOperation, navigateToPage \} = useTrackingContext\(\);/g,
      'const { logOperation, navigateToPage } = useTrackingContext();');
    fs.writeFileSync(page01Path, content, 'utf-8');
    console.log('✅ 修复 Page01_Notice.jsx 未使用导入和变量\n');
  }
}

// 执行修复
console.log('🔧 开始修复 grade-7-tracking 模块的 ESLint 错误...\n');

filesToFixReact.forEach(fixFile);
fixSpecificIssues();

console.log('\n✅ 修复完成!请运行 npm run lint 验证结果。');
