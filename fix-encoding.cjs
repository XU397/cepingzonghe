const fs = require('fs');
const iconv = require('iconv-lite');

const inputFile = 'src/context/AppContext.jsx';
const outputFile = 'src/context/AppContext_fixed.jsx';

console.log('开始处理:', inputFile);

try {
  // 读取原始字节
  const rawBytes = fs.readFileSync(inputFile);
  console.log('✓ 读取文件:', rawBytes.length, '字节');
  
  // 尝试用GBK解码
  const content = iconv.decode(rawBytes, 'GBK');
  console.log('✓ GBK解码:', content.length, '字符');
  
  // 检查修复结果 - 第18行
  const lines = content.split('\n');
  const line18 = lines[17] || '';
  console.log('第18行:', line18.substring(0, 60));
  
  // 检查第175行
  const line175 = lines[174] || '';
  console.log('第175行:', line175.substring(0, 80));
  
  // 用UTF-8写入
  fs.writeFileSync(outputFile, content, 'utf8');
  console.log('✅ 文件已保存:', outputFile);
  
  // 验证
  const verifyContent = fs.readFileSync(outputFile, 'utf8');
  const verifyLines = verifyContent.split('\n');
  console.log('\n验证结果:');
  console.log('第18行:', verifyLines[17].substring(0, 60));
  console.log('第175行:', verifyLines[174].substring(0, 80));
  
} catch (error) {
  console.error('❌ 错误:', error.message);
  console.error(error.stack);
  process.exit(1);
}
