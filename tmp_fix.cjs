const fs = require('fs');
const path = 'src/flows/FlowModule.jsx';
let text = fs.readFileSync(path).toString('binary');
const start = "debugLog(`[FlowModule DEBUG] Render #${renderCountRef.current}`);\r\n";
const end = "\r\n  const loadFlow = useCallback(() => {";
const startIdx = text.indexOf(start);
const endIdx = text.indexOf(end, startIdx + start.length);
if (startIdx === -1 || endIdx === -1) {
  console.error('range not found');
  process.exit(1);
}
const before = text.slice(0, startIdx + start.length);
const after = text.slice(endIdx);
const insert = "\r\n  // Keep legacy PageRouter in sync with Flow initial page (avoid staying on Page_Login)\r\n  useEffect(() => {\r\n    const targetPageId = state.currentStep?.initialPageId;\r\n    if (!targetPageId || !appContext) {\r\n      return;\r\n    }\r\n    if (appContext.currentPageId === targetPageId) {\r\n      return;\r\n    }\r\n\r\n    if (typeof appContext.navigateToPage === 'function') {\r\n      appContext.navigateToPage(targetPageId, { skipSubmit: true });\r\n      return;\r\n    }\r\n    if (typeof appContext.setCurrentPageId === 'function') {\r\n      appContext.setCurrentPageId(targetPageId);\r\n    }\r\n  }, [appContext, state.currentStep?.initialPageId]);\r\n";
text = before + insert + after;
fs.writeFileSync(path, Buffer.from(text, 'binary'));
