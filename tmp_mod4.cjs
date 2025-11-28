const fs = require('fs');
const path = 'src/flows/FlowModule.jsx';
let text = fs.readFileSync(path, 'binary');
const old = `    setState({\r\n      loading: false,\r\n      error: null,\r\n      showTransition: false,\r\n      currentStep: resolved,\r\n      submoduleComponent: resolved.submoduleDefinition.Component,\r\n      definition,\r\n      progress,\r\n    });`;
const neu = `    setState({\r\n      loading: false,\r\n      error: null,\r\n      showTransition: false,\r\n      currentStep: resolved,\r\n      submoduleComponent: resolved.submoduleDefinition.Component,\r\n      definition,\r\n      progress: progressForResolve,\r\n    });`;
if (!text.includes(old)) { console.error('setState block not found'); process.exit(1);} 
text = text.replace(old, neu);
fs.writeFileSync(path, Buffer.from(text, 'binary'));
