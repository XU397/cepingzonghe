const fs = require('fs');
const path = 'src/flows/FlowModule.jsx';
let text = fs.readFileSync(path, 'binary');
const old = `    const promise = loadFlowState({\r\n      flowId,\r\n      orchestrator: orchestratorRef.current,\r\n      logOperation: (...args) => logOperationRef.current?.(...args),\r\n      setState,\r\n      flowContextLogCacheRef,\r\n    }).finally(() => {\r\n      pendingLoadRef.current = null;\r\n    });`;
const neu = `    const promise = loadFlowState({\r\n      flowId,\r\n      orchestrator: orchestratorRef.current,\r\n      logOperation: (...args) => logOperationRef.current?.(...args),\r\n      setState,\r\n      flowContextLogCacheRef,\r\n      loginPageNum: effectiveUserContext?.pageNum || flowContextSnapshot?.pageNum || null,\r\n    }).finally(() => {\r\n      pendingLoadRef.current = null;\r\n    });`;
if (!text.includes(old)) { console.error('loadFlowState call not found'); process.exit(1);} 
text = text.replace(old, neu);
fs.writeFileSync(path, Buffer.from(text, 'binary'));
