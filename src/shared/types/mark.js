/**
 * @typedef {Object} Operation
 * @property {number} code
 * @property {string} eventType
 * @property {string} targetElement
 * @property {string|number|boolean|Object|null} value
 * @property {string} time
 * @property {string} [pageId]
 */

/**
 * @typedef {Object} Answer
 * @property {number} code
 * @property {string} targetElement
 * @property {string|number|boolean|Object|null} value
 */

/**
 * @typedef {Object} MarkObject
 * @property {string} pageNumber
 * @property {string} pageDesc
 * @property {Operation[]} operationList
 * @property {Answer[]} answerList
 * @property {string} beginTime
 * @property {string} endTime
 * @property {Array<Object>} [imgList]
 */

/**
 * @typedef {Object} MarkInput
 * @property {string|number} pageNumber
 * @property {string} pageDesc
 * @property {Operation[]} [operationList]
 * @property {Answer[]} [answerList]
 * @property {string} [beginTime]
 * @property {string} [endTime]
 * @property {Array<Object>} [imgList]
 */

export {}; // 仅用于类型声明
