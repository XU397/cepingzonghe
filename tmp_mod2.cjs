const fs = require('fs');
const path = 'src/flows/FlowModule.jsx';
let text = fs.readFileSync(path, 'binary');
const old = `const loadFlowState = async ({\r\n  flowId,\r\n  orchestrator,\r\n  logOperation,\r\n  setState,\r\n  shouldAbort,\r\n  flowContextLogCacheRef,\r\n}) => {`;
const neu = `const loadFlowState = async ({\r\n  flowId,\r\n  orchestrator,\r\n  logOperation,\r\n  setState,\r\n  shouldAbort,\r\n  flowContextLogCacheRef,\r\n  loginPageNum,\r\n}) => {`;
if (!text.includes(old)) { console.error('signature not found'); process.exit(1);} 
text = text.replace(old, neu);
fs.writeFileSync(path, Buffer.from(text, 'binary'));
