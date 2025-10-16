/**
 * 数据验证工具
 * 提供文本长度验证、必填项检查等功能
 */

/**
 * 验证文本长度
 *
 * @param {string} text - 待验证的文本
 * @param {number} minLength - 最小长度
 * @param {number} maxLength - 最大长度
 * @returns {{isValid: boolean, error?: string}} 验证结果
 */
export function validateTextLength(text, minLength = 0, maxLength = Infinity) {
  const trimmedText = (text || '').trim();
  const length = trimmedText.length;

  if (length < minLength) {
    return {
      isValid: false,
      error: `文本长度至少需要${minLength}个字符(当前${length}个)`
    };
  }

  if (length > maxLength) {
    return {
      isValid: false,
      error: `文本长度不能超过${maxLength}个字符(当前${length}个)`
    };
  }

  return { isValid: true };
}

/**
 * 验证必填项
 *
 * @param {any} value - 待验证的值
 * @param {string} fieldName - 字段名称
 * @returns {{isValid: boolean, error?: string}} 验证结果
 */
export function validateRequired(value, fieldName = '此项') {
  if (value === null || value === undefined || value === '') {
    return {
      isValid: false,
      error: `${fieldName}不能为空`
    };
  }

  // 处理字符串空白
  if (typeof value === 'string' && value.trim() === '') {
    return {
      isValid: false,
      error: `${fieldName}不能为空`
    };
  }

  // 处理数组为空
  if (Array.isArray(value) && value.length === 0) {
    return {
      isValid: false,
      error: `${fieldName}至少需要选择一项`
    };
  }

  return { isValid: true };
}

/**
 * 验证问卷页面是否全部作答
 *
 * @param {Object} answers - 答案对象 {questionId: answerId, ...}
 * @param {number} questionCount - 问题总数
 * @returns {{isValid: boolean, error?: string, unansweredCount?: number}} 验证结果
 */
export function validateQuestionnaireCompletion(answers, questionCount) {
  const answeredCount = Object.keys(answers).filter(key => answers[key] !== null && answers[key] !== '').length;

  if (answeredCount < questionCount) {
    const unanswered = questionCount - answeredCount;
    return {
      isValid: false,
      error: `还有${unanswered}题未作答,请完成所有题目后再提交`,
      unansweredCount: unanswered
    };
  }

  return { isValid: true, unansweredCount: 0 };
}

/**
 * 验证实验试验记录完整性
 *
 * @param {Object} trial - 试验记录对象
 * @returns {{isValid: boolean, errors: string[]}} 验证结果
 */
export function validateTrialRecord(trial) {
  const errors = [];

  if (!trial.waterContent) {
    errors.push('未选择含水量');
  }

  if (!trial.temperature) {
    errors.push('未选择温度');
  }

  if (!trial.fallTime || trial.fallTime <= 0) {
    errors.push('未记录下落时间或时间无效');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
