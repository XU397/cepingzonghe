// userinput.cjs
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askForInput() {
  rl.question('prompt: ', (answer) => {
    console.log(`用户输入: ${answer}`);
    
    if (answer.toLowerCase() === 'stop') {
      console.log('退出程序');
      rl.close();
      process.exit(0);
    }
    
    // 处理用户输入的逻辑
    processUserInput(answer);
    
    // 继续下一轮输入
    setTimeout(() => {
      askForInput();
    }, 1000);
  });
}

function processUserInput(input) {
  console.log(`正在处理: ${input}`);
  
  // 根据用户输入执行不同的任务
  switch(input.toLowerCase()) {
    case 'help':
      console.log('可用命令:');
      console.log('- help: 显示帮助信息');
      console.log('- status: 显示当前状态');
      console.log('- dev: 激活开发者模式');
      console.log('- stop: 退出程序');
      break;
    case 'status':
      console.log('系统状态: 正常运行');
      console.log('项目: steamed-bun-task');
      break;
    case 'dev':
      console.log('💻 激活开发者模式 - James (Full Stack Developer)');
      console.log('可用命令: *help, *run-tests, *explain, *exit');
      break;
    default:
      console.log(`未知命令: ${input}`);
      console.log('输入 "help" 查看可用命令');
  }
}

console.log('=== 交互式任务循环启动 ===');
console.log('输入命令开始工作，输入 "stop" 退出程序');
askForInput();