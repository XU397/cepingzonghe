const fs = require('fs');
const path = 'src/flows/FlowModule.jsx';
let text = fs.readFileSync(path, 'binary');
const old = "import { FlowOrchestrator } from './orchestrator/FlowOrchestrator';";
const neu = "import { FlowOrchestrator, parseFlowPageNum } from './orchestrator/FlowOrchestrator';";
if (!text.includes(old)) { console.error('old import not found'); process.exit(1);} 
text = text.replace(old, neu);
fs.writeFileSync(path, Buffer.from(text, 'binary'));
