const stringOrEmpty = (value) => {
  if (value === null || value === undefined) return '';
  return String(value);
};

const toDate = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }
  return new Date();
};

export const formatTimestamp = (value) => {
  const date = toDate(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const normalizeTimeField = (value) => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }
  return formatTimestamp(value);
};

const normalizeOperationValue = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return value;
  return String(value);
};

const normalizeOperation = (operation = {}, index) => {
  const normalized = {
    code: operation.code ?? index + 1,
    targetElement: stringOrEmpty(operation.targetElement),
    eventType: stringOrEmpty(operation.eventType),
    value: normalizeOperationValue(operation.value),
    time: normalizeTimeField(operation.time),
  };

  if (operation.pageId !== undefined && operation.pageId !== null) {
    normalized.pageId = String(operation.pageId);
  }

  return normalized;
};

const normalizeAnswer = (answer = {}, index) => ({
  code: answer.code ?? index + 1,
  targetElement: stringOrEmpty(answer.targetElement),
  value: stringOrEmpty(answer.value),
});

const normalizeImgList = (imgList) => (Array.isArray(imgList) ? imgList : []);

const ensureArray = (value) => (Array.isArray(value) ? value : []);

/**
 * MarkObject 字段顺序常量。
 * 按规范要求：pageNumber → pageDesc → operationList → answerList → beginTime → endTime → imgList
 */
export const MARK_FIELD_ORDER = Object.freeze([
  'pageNumber',
  'pageDesc',
  'operationList',
  'answerList',
  'beginTime',
  'endTime',
  'imgList',
]);

/**
 * 按固定顺序排列 MarkObject 字段。
 * 确保序列化时字段顺序为：pageNumber → pageDesc → operationList → answerList → beginTime → endTime → imgList
 * 所有字段始终存在（空集合输出为空数组）。
 *
 * **注意**：此函数仅负责字段排序和空值兜底，不执行字段格式归一化（如时间格式转换）。
 * 正常提交流程应使用 `createMarkObject()`，它会先标准化字段值再调用此函数。
 * 仅在已确保输入已标准化的场景下才应直接使用此函数。
 *
 * @param {Object} mark - 原始 MarkObject（应已通过 createMarkObject 或等效标准化流程处理）
 * @returns {Object} - 排序后的 MarkObject
 */
export const orderMarkFields = (mark) => {
  if (!mark || typeof mark !== 'object') {
    return {
      pageNumber: '',
      pageDesc: '',
      operationList: [],
      answerList: [],
      beginTime: '',
      endTime: '',
      imgList: [],
    };
  }

  // 按规范顺序构建对象，确保全字段输出
  return {
    pageNumber: mark.pageNumber ?? '',
    pageDesc: mark.pageDesc ?? '',
    operationList: Array.isArray(mark.operationList) ? mark.operationList : [],
    answerList: Array.isArray(mark.answerList) ? mark.answerList : [],
    beginTime: mark.beginTime ?? '',
    endTime: mark.endTime ?? '',
    imgList: Array.isArray(mark.imgList) ? mark.imgList : [],
  };
};

export const createMarkObject = (options = {}) => {
  const {
    pageNumber,
    pageDesc,
    operationList = [],
    answerList = [],
    beginTime,
    endTime,
    imgList = [],
  } = options;

  // 构建标准化的 MarkObject，使用 orderMarkFields 确保字段顺序
  const normalizedMark = {
    pageNumber: stringOrEmpty(pageNumber),
    pageDesc: stringOrEmpty(pageDesc),
    operationList: ensureArray(operationList).map((operation, index) =>
      normalizeOperation(operation, index),
    ),
    answerList: ensureArray(answerList).map((answer, index) =>
      normalizeAnswer(answer, index),
    ),
    beginTime: normalizeTimeField(beginTime),
    endTime: normalizeTimeField(endTime),
    imgList: normalizeImgList(imgList),
  };

  return orderMarkFields(normalizedMark);
};

export default createMarkObject;
