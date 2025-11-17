import { submitPageMarkData } from './apiService.js';
import {
  createMarkObject,
  formatTimestamp,
} from './submission/createMarkObject.js';

export { createMarkObject, formatTimestamp } from './submission/createMarkObject.js';

/**
 * 创建提交载荷对象
 * @param {Object} userContext - 用户上下文信息
 * @param {string} userContext.batchCode - 测评批次号
 * @param {string} userContext.examNo - 学生考号
 * @param {Object} markData - 页面标记数据
 * @returns {Object} 提交载荷对象
 */
export const createSubmissionPayload = (userContext, markData) => {
  return {
    batchCode: String(userContext.batchCode || ''),
    examNo: String(userContext.examNo || ''),
    mark: markData
  };
};

/**
 * 提交页面数据到后端
 * 使用标准化的数据格式和 FormData 提交方式
 * @param {Object} userContext - 用户上下文信息
 * @param {Object} pageData - 页面数据
 * @returns {Promise<Object>} 后端响应数据
 */
export const submitPageData = async (userContext, pageData) => {
  try {
    // 创建标准化的 MarkObject
    const markObject = createMarkObject(pageData);
    
    // 创建提交载荷
    const payload = createSubmissionPayload(userContext, markObject);
    
    console.log('DataLogger: 准备提交页面数据', {
      pageNumber: markObject.pageNumber,
      pageDesc: markObject.pageDesc,
      operationCount: markObject.operationList.length,
      answerCount: markObject.answerList.length,
      batchCode: payload.batchCode,
      examNo: payload.examNo
    });
    
    // 提交到后端
    const response = await submitPageMarkData(payload);
    
    console.log('DataLogger: 页面数据提交成功', response);
    return response;
  } catch (error) {
    console.error('DataLogger: 页面数据提交失败', error);
    throw error;
  }
};

/**
 * 创建操作记录对象
 * @param {Object} operation - 操作信息
 * @param {string} operation.targetElement - 目标元素
 * @param {string} operation.eventType - 事件类型
 * @param {string} [operation.value] - 操作值
 * @param {string} [operation.elementId] - 元素ID
 * @param {number} [operation.code] - 操作序号
 * @returns {Object} 标准化的操作记录对象
 */
export const createOperationRecord = (operation) => {
  return {
    code: operation.code || 1,
    targetElement: String(operation.targetElement || ''),
    eventType: String(operation.eventType || ''),
    value: String(operation.value || ''),
    time: formatTimestamp(new Date())
  };
};

/**
 * 创建答案记录对象
 * @param {Object} answer - 答案信息
 * @param {string} answer.targetElement - 问题标识
 * @param {any} answer.value - 答案值
 * @param {number} [answer.code] - 答案序号
 * @returns {Object} 标准化的答案记录对象
 */
export const createAnswerRecord = (answer) => {
  return {
    code: answer.code || 1,
    targetElement: String(answer.targetElement || ''),
    value: answer.value !== undefined ? String(answer.value) : ''
  };
};

/**
 * 数据记录器类
 * 用于在页面会话期间收集操作和答案数据
 */
export class PageDataLogger {
  constructor(pageNumber, pageDesc) {
    this.pageNumber = String(pageNumber);
    this.pageDesc = String(pageDesc);
    this.operationList = [];
    this.answerList = [];
    this.beginTime = new Date();
    this.endTime = null;
  }
  
  /**
   * 记录用户操作
   * @param {Object} operation - 操作信息
   */
  logOperation(operation) {
    const operationRecord = createOperationRecord({
      ...operation,
      code: this.operationList.length + 1
    });
    this.operationList.push(operationRecord);
    console.log('DataLogger: 记录操作', operationRecord);
  }
  
  /**
   * 收集答案
   * @param {Object} answer - 答案信息
   */
  collectAnswer(answer) {
    const answerRecord = createAnswerRecord({
      ...answer,
      code: this.answerList.length + 1
    });
    this.answerList.push(answerRecord);
    console.log('DataLogger: 收集答案', answerRecord);
  }
  
  /**
   * 设置页面结束时间
   */
  setEndTime() {
    this.endTime = new Date();
  }
  
  /**
   * 获取页面数据对象
   * @returns {Object} 页面数据对象
   */
  getPageData() {
    return {
      pageNumber: this.pageNumber,
      pageDesc: this.pageDesc,
      operationList: this.operationList,
      answerList: this.answerList,
      beginTime: this.beginTime,
      endTime: this.endTime || new Date(),
      imgList: []
    };
  }
  
  /**
   * 提交当前页面数据
   * @param {Object} userContext - 用户上下文
   * @returns {Promise<Object>} 提交结果
   */
  async submit(userContext) {
    this.setEndTime();
    const pageData = this.getPageData();
    return await submitPageData(userContext, pageData);
  }
}
