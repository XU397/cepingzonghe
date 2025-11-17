/**
 * PageDesc 增强工具
 * 为 Flow 模式下的提交追加 flowId/submoduleId/stepIndex 信息
 */

/**
 * 增强 pageDesc，追加 Flow 上下文信息
 * @param {string} originalPageDesc - 原始页面描述
 * @param {Object} flowContext - Flow 上下文（可选）
 * @param {string} flowContext.flowId - Flow ID
 * @param {string} flowContext.submoduleId - 子模块 ID
 * @param {number} flowContext.stepIndex - 步骤索引
 * @returns {string} 增强后的 pageDesc
 *
 * @example
 * // 非 Flow 模式
 * enhancePageDesc('问题1页面', null)
 * // => '问题1页面'
 *
 * // Flow 模式
 * enhancePageDesc('问题1页面', { flowId: 'g7a-mix-001', submoduleId: 'g7-experiment', stepIndex: 0 })
 * // => '[g7a-mix-001/g7-experiment/0] 问题1页面'
 */
export function enhancePageDesc(originalPageDesc, flowContext) {
  if (!flowContext) {
    return originalPageDesc;
  }

  const { flowId, submoduleId, stepIndex } = flowContext;

  if (!flowId || !submoduleId || stepIndex === undefined) {
    console.warn('[PageDescUtils] Incomplete flow context, skipping enhancement', flowContext);
    return originalPageDesc;
  }

  const prefix = `[${flowId}/${submoduleId}/${stepIndex}]`;
  return `${prefix} ${originalPageDesc}`;
}

/**
 * 从增强的 pageDesc 中提取 Flow 上下文
 * @param {string} pageDesc - 增强后的 pageDesc
 * @returns {{ flowId: string, submoduleId: string, stepIndex: number, originalDesc: string } | null}
 *
 * @example
 * extractFlowContext('[g7a-mix-001/g7-experiment/0] 问题1页面')
 * // => { flowId: 'g7a-mix-001', submoduleId: 'g7-experiment', stepIndex: 0, originalDesc: '问题1页面' }
 */
export function extractFlowContext(pageDesc) {
  const match = pageDesc?.match(/^\[([^/]+)\/([^/]+)\/(\d+)\]\s*(.*)$/);

  if (!match) {
    return null;
  }

  return {
    flowId: match[1],
    submoduleId: match[2],
    stepIndex: parseInt(match[3], 10),
    originalDesc: match[4],
  };
}

/**
 * 检查 pageDesc 是否包含 Flow 上下文
 * @param {string} pageDesc - 页面描述
 * @returns {boolean}
 */
export function hasFlowContext(pageDesc) {
  return /^\[([^/]+)\/([^/]+)\/(\d+)\]/.test(pageDesc);
}
