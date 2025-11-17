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

  return {
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
};

export default createMarkObject;
