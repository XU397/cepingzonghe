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
  const line18 = lines[17];
  console.log('第18行:', line18.substring(0, 60));
  
  // 用UTF-8写入
  fs.writeFileSync(outputFile, content, 'utf8');
  console.log('✅ 文件已保存:', outputFile);
  
} catch (error) {
  console.error('❌ 错误:', error.message);
  process.exit(1);
}
