const fs = require('fs');
const path = 'src/flows/FlowModule.jsx';
const textBinary = fs.readFileSync(path).toString('binary');
const needle = "debugLog(`[FlowModule DEBUG] Render #${renderCountRef.current}`);\r\n  const loadFlow = useCallback(() => {";
if (!textBinary.includes(needle)) {
  console.error('needle not found');
  process.exit(1);
}
const snippet = "debugLog(`[FlowModule DEBUG] Render #${renderCountRef.current}`);\r\n\r\n  // 确保遗留 PageRouter 的 currentPageId 与 Flow 解析出的初始页面保持一致\r\n  useEffect(() => {\r\n    const targetPageId = state.currentStep?.initialPageId;\r\n    if (!targetPageId || !appContext) {\r\n      return;\r\n    }\r\n    if (appContext.currentPageId === targetPageId) {\r\n      return;\r\n    }\r\n\r\n    // 优先使用 navigateToPage 以走统一的页面切换逻辑；skipSubmit 避免触发提交\r\n    if (typeof appContext.navigateToPage === 'function') {\r\n      appContext.navigateToPage(targetPageId, { skipSubmit: true });\r\n      return;\r\n    }\r\n    // 兜底：直接写入 currentPageId，防止 PageRouter 停留在 Page_Login\r\n    if (typeof appContext.setCurrentPageId === 'function') {\r\n      appContext.setCurrentPageId(targetPageId);\r\n    }\r\n  }, [appContext, state.currentStep?.initialPageId]);\r\n\r\n  const loadFlow = useCallback(() => {";
const updated = textBinary.replace(needle, snippet);
fs.writeFileSync(path, Buffer.from(updated, 'binary'));
