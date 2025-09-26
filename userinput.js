// userinput.js - 交互式任务循环
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function getUserInput() {
  return new Promise((resolve) => {
    rl.question('prompt: ', (answer) => {
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log('交互式任务循环已启动。输入 "stop" 退出。');
  
  while (true) {
    try {
      const userInput = await getUserInput();
      
      if (userInput.toLowerCase() === 'stop') {
        console.log('退出任务循环。');
        break;
      }
      
      console.log(`用户输入: ${userInput}`);
      
      // 这里可以根据用户输入执行相应的任务
      if (userInput) {
        console.log('正在处理您的请求...');
        // 在这里添加任务处理逻辑
      }
      
    } catch (error) {
      console.error('发生错误:', error.message);
    }
  }
  
  rl.close();
}

// 处理程序退出
process.on('SIGINT', () => {
  console.log('\n用户中断操作');
  rl.close();
  process.exit(0);
});

main().catch(console.error);