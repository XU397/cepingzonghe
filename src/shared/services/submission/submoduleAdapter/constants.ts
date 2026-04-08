/**
 * Shared constants for the submodule submission adapter.
 * Standardizes reserved target elements and default validation patterns.
 */
export const RESERVED_ELEMENTS: Set<string> = new Set<string>([
  'page',
  '页面',
  'next_button',
  '下一步按钮',
  '下一页按钮',
  'prev_button',
  '上一步按钮',
  'module',
  'flow_context',
  'task_timer',
  'countdown',
]);

export const DEFAULTS = {
  HISTORY_CODE_BASE: 100,
  TIME_FORMAT: 'YYYY-MM-DD HH:mm:ss',
  PAGE_NUMBER_REGEX: /^[1-9]\d*\.\d{2}$/,
  TARGET_PREFIX_REGEX: /^P\d+\.\d{2}_/,
} as const;

export function isReservedElement(element: string): boolean {
  return RESERVED_ELEMENTS.has(element);
}
