/**
 * 统一页码映射工具
 *
 * 提供页码到页面ID的映射、复合页码解析、边界处理等功能
 * 用于统一各模块的页码映射逻辑，减少重复实现
 *
 * @module shared/utils/pageMapping
 */

// ==================== 类型定义 ====================

/**
 * 页面信息
 */
export interface PageInfo {
  /** 页面ID（内部标识） */
  pageId: string;
  /** 页码（后端返回的序号） */
  pageNum: number;
  /** 页面描述（用于日志和数据提交） */
  pageDesc?: string;
  /** 是否为默认页（注意事项页） */
  isDefault?: boolean;
}

/**
 * 页码映射表
 *
 * key: 页码（字符串或数字）
 * value: 页面ID
 *
 * 特殊键：
 * - "default": 默认页面ID（当页码无效或缺失时使用）
 */
export type PageMapping = Record<string | number, string> & {
  default?: string;
};

/**
 * 复合页码解析结果
 */
export interface CompositePageNum {
  /** Flow步骤索引 */
  stepIndex: number;
  /** 子模块内的页码 */
  subPageNum: number;
}

// ==================== 复合页码解析 ====================

/**
 * 解析复合页码
 *
 * 支持以下格式（按优先级）：
 * - `<stepIndex>.<subPageNum>` - 如 "1.5" 表示第1步的第5页
 * - `M<stepIndex>:<subPageNum>` - 如 "M1:5" 表示第1步的第5页（已废弃，仅保留兼容）
 *
 * @param pageNumStr - 复合页码字符串
 * @returns 解析结果，如果格式无效则返回 null
 *
 * @example
 * parseCompositePageNum("1.5")   // { stepIndex: 1, subPageNum: 5 }
 * parseCompositePageNum("M2:10") // { stepIndex: 2, subPageNum: 10 } 并输出警告
 * parseCompositePageNum("invalid") // null
 */
export function parseCompositePageNum(pageNumStr: string): CompositePageNum | null {
  if (!pageNumStr || typeof pageNumStr !== 'string') {
    return null;
  }

  // 点分格式: <stepIndex>.<subPageNum>
  const dotMatch = pageNumStr.match(/^(\d+)\.(\d+)$/);
  if (dotMatch) {
    const stepIndex = parseInt(dotMatch[1], 10);
    const subPageNum = parseInt(dotMatch[2], 10);

    if (isNaN(stepIndex) || isNaN(subPageNum) || stepIndex < 0 || subPageNum < 0) {
      return null;
    }

    return { stepIndex, subPageNum };
  }

  // 格式1: M<stepIndex>:<subPageNum>
  const format1Match = pageNumStr.match(/^M(\d+):(\d+)$/);
  if (format1Match) {
    console.warn('已废弃的 M 前缀格式，请使用点分格式');
    const stepIndex = parseInt(format1Match[1], 10);
    const subPageNum = parseInt(format1Match[2], 10);

    // 验证解析结果
    if (isNaN(stepIndex) || isNaN(subPageNum) || stepIndex < 0 || subPageNum < 0) {
      return null;
    }

    return { stepIndex, subPageNum };
  }

  // 无法识别的格式
  return null;
}

/**
 * 构造复合页码字符串
 *
 * @param stepIndex - Flow步骤索引
 * @param subPageNum - 子模块内的页码
 * @returns 复合页码字符串
 *
 * @example
 * buildCompositePageNum(1, 5) // "1.5"
 */
export function buildCompositePageNum(stepIndex: number, subPageNum: number): string {
  return `${stepIndex}.${subPageNum}`;
}

/**
 * 统一提交管道使用的复合页码编码函数
 *
 * 该函数是 {@link buildCompositePageNum} 的别名，确保所有提交上报统一使用点分格式编码。
 *
 * @param stepIndex - Flow步骤索引
 * @param subPageNum - 子模块内的页码
 * @returns 点分格式的复合页码
 *
 * @example
 * encodeCompositePageNum(2, 10) // "2.10"
 */
export function encodeCompositePageNum(stepIndex: number, subPageNum: number): string {
  return buildCompositePageNum(stepIndex, subPageNum);
}

/**
 * 构造目标元素ID前缀
 *
 * 返回 "P<pageNumber>_" 形式的字符串，可用于生成级联元素ID。
 *
 * @param pageNumber - 已编码的页码（如 "1.5"）
 * @returns 形如 "P1.5_" 的前缀
 *
 * @example
 * buildTargetElementPrefix("3.2"); // "P3.2_"
 */
export function buildTargetElementPrefix(pageNumber: string): string {
  return `P${pageNumber}_`;
}

/**
 * 构造页面描述日志前缀
 *
 * 当 flowId、submoduleId 与 stepIndex 均存在时，返回 "[flow/submodule/step] " 格式，便于日志聚合。
 *
 * @param flowId - Flow ID
 * @param submoduleId - 子模块ID
 * @param stepIndex - 步骤索引
 * @returns 前缀字符串或空字符串
 *
 * @example
 * buildPageDescPrefix("flowA", "subM1", 3); // "[flowA/subM1/3] "
 * buildPageDescPrefix("flowA");             // ""
 */
export function buildPageDescPrefix(
  flowId?: string,
  submoduleId?: string,
  stepIndex?: number
): string {
  if (!flowId || !submoduleId || typeof stepIndex !== 'number') {
    return '';
  }

  return `[${flowId}/${submoduleId}/${stepIndex}] `;
}

/**
 * 生成标准化的 pageDesc，自动拼接 Flow 前缀。
 */
export function generatePageDesc(
  flowId: string | undefined,
  submoduleId: string | undefined,
  stepIndex: number | undefined,
  desc: string,
): string {
  const prefix = buildPageDescPrefix(flowId, submoduleId, stepIndex);
  if (!desc && !prefix) {
    return '';
  }
  if (!prefix) {
    return desc;
  }
  return `${prefix}${desc}`;
}

/**
 * 生成带前缀的 targetElement。
 */
export function generateTargetElement(pageNumber: string, elementId: string): string {
  const prefix = buildTargetElementPrefix(pageNumber);
  const normalized = (elementId || '').trim();
  if (!normalized) {
    return prefix;
  }
  return `${prefix}${normalized}`;
}

// ==================== 页码映射 ====================

/**
 * 从页码获取页面ID
 *
 * 提供统一的边界处理和默认页策略：
 * 1. 如果 pageNum 无效（null/undefined/NaN/负数），返回默认页
 * 2. 如果 pageNum 在映射表中不存在，返回默认页
 * 3. 如果映射表没有定义默认页，返回映射表中的第一个页面ID
 *
 * @param pageNum - 页码（可能来自后端或URL参数）
 * @param mapping - 页码到页面ID的映射表
 * @returns 页面ID
 *
 * @example
 * const mapping = {
 *   "1": "intro",
 *   "2": "question-1",
 *   "3": "question-2",
 *   "default": "notices"
 * };
 *
 * getTargetPageIdFromPageNum(2, mapping)      // "question-1"
 * getTargetPageIdFromPageNum(999, mapping)    // "notices" (默认页)
 * getTargetPageIdFromPageNum(null, mapping)   // "notices" (默认页)
 */
export function getTargetPageIdFromPageNum(
  pageNum: string | number | null | undefined,
  mapping: PageMapping
): string {
  // 验证映射表
  if (!mapping || typeof mapping !== 'object' || Object.keys(mapping).length === 0) {
    console.warn('[pageMapping] Invalid or empty mapping provided');
    return 'default-page'; // 极端情况下的后备页面
  }

  // 获取默认页ID（如果定义了）
  const defaultPageId = mapping.default;

  // 获取映射表中第一个非default的页面ID作为后备
  const firstPageId = Object.entries(mapping)
    .filter(([key]) => key !== 'default')
    .map(([, value]) => value)[0];

  const fallbackPageId = defaultPageId || firstPageId || 'default-page';

  // 处理无效的 pageNum
  if (pageNum === null || pageNum === undefined) {
    console.debug('[pageMapping] pageNum is null/undefined, using fallback:', fallbackPageId);
    return fallbackPageId;
  }

  // 转换为字符串进行查找
  const pageNumStr = String(pageNum);

  // 尝试数字转换并验证
  const pageNumInt = parseInt(pageNumStr, 10);
  if (isNaN(pageNumInt) || pageNumInt < 0) {
    console.debug('[pageMapping] Invalid pageNum:', pageNum, ', using fallback:', fallbackPageId);
    return fallbackPageId;
  }

  // 查找映射（先尝试字符串键，再尝试数字键）
  let targetPageId = mapping[pageNumStr] || mapping[pageNumInt];

  // 如果找不到映射，使用默认页
  if (!targetPageId) {
    console.debug(
      '[pageMapping] No mapping found for pageNum:',
      pageNum,
      ', using fallback:',
      fallbackPageId
    );
    return fallbackPageId;
  }

  return targetPageId;
}

/**
 * 从页面ID获取页码
 *
 * 反向查找页码映射表，找到对应的页码
 *
 * @param pageId - 页面ID
 * @param mapping - 页码到页面ID的映射表
 * @returns 页码，如果找不到则返回 null
 *
 * @example
 * const mapping = { "1": "intro", "2": "question-1" };
 * getPageNumFromPageId("question-1", mapping) // "2"
 * getPageNumFromPageId("unknown", mapping)    // null
 */
export function getPageNumFromPageId(
  pageId: string,
  mapping: PageMapping
): string | null {
  if (!pageId || !mapping) {
    return null;
  }

  // 反向查找（跳过 default 键）
  const entry = Object.entries(mapping)
    .filter(([key]) => key !== 'default')
    .find(([, value]) => value === pageId);

  return entry ? entry[0] : null;
}

/**
 * 根据页面ID获取当前步骤序号（页码）
 *
 * @param pageId - 页面ID
 * @param mapping - 页码映射表
 * @returns 当前步骤（默认返回 1）
 */
export function getCurrentStep(
  pageId: string | null | undefined,
  mapping: PageMapping
): number {
  if (!pageId) {
    return 1;
  }

  const pageNum = getPageNumFromPageId(pageId, mapping);
  if (!pageNum) {
    return 1;
  }

  const parsed = parseInt(pageNum, 10);
  if (isNaN(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

/**
 * 验证页码是否在映射表的有效范围内
 *
 * @param pageNum - 页码
 * @param mapping - 页码到页面ID的映射表
 * @returns 是否有效
 *
 * @example
 * const mapping = { "1": "intro", "2": "question-1" };
 * isValidPageNum(1, mapping)   // true
 * isValidPageNum(999, mapping) // false
 */
export function isValidPageNum(
  pageNum: string | number | null | undefined,
  mapping: PageMapping
): boolean {
  if (pageNum === null || pageNum === undefined || !mapping) {
    return false;
  }

  const pageNumStr = String(pageNum);
  const pageNumInt = parseInt(pageNumStr, 10);

  if (isNaN(pageNumInt) || pageNumInt < 0) {
    return false;
  }

  return !!(mapping[pageNumStr] || mapping[pageNumInt]);
}

// ==================== 工具函数 ====================

/**
 * 获取映射表中的总页数（排除 default 键）
 *
 * @param mapping - 页码映射表
 * @returns 总页数
 */
export function getTotalPages(mapping: PageMapping): number {
  return Object.keys(mapping).filter(key => key !== 'default').length;
}

/**
 * 获取映射表中的所有页面ID（按页码顺序，排除 default）
 *
 * @param mapping - 页码映射表
 * @returns 页面ID数组
 */
export function getAllPageIds(mapping: PageMapping): string[] {
  return Object.entries(mapping)
    .filter(([key]) => key !== 'default')
    .sort(([a], [b]) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      return numA - numB;
    })
    .map(([, value]) => value);
}

/**
 * 获取下一页的页面ID
 *
 * @param currentPageId - 当前页面ID
 * @param mapping - 页码映射表
 * @returns 下一页的页面ID，如果已是最后一页则返回 null
 */
export function getNextPageId(
  currentPageId: string,
  mapping: PageMapping
): string | null {
  const allPageIds = getAllPageIds(mapping);
  const currentIndex = allPageIds.indexOf(currentPageId);

  if (currentIndex === -1 || currentIndex === allPageIds.length - 1) {
    return null;
  }

  return allPageIds[currentIndex + 1];
}

/**
 * 获取上一页的页面ID
 *
 * @param currentPageId - 当前页面ID
 * @param mapping - 页码映射表
 * @returns 上一页的页面ID，如果已是第一页则返回 null
 */
export function getPrevPageId(
  currentPageId: string,
  mapping: PageMapping
): string | null {
  const allPageIds = getAllPageIds(mapping);
  const currentIndex = allPageIds.indexOf(currentPageId);

  if (currentIndex <= 0) {
    return null;
  }

  return allPageIds[currentIndex - 1];
}
