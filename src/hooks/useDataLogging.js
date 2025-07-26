import { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';

/**
 * 数据记录自定义Hook
 * 提供标准化的数据记录方法
 * 
 * @param {string} pageId - 当前页面ID（可选，用于特殊逻辑）
 * @returns {Object} 数据记录方法集合
 */
export const useDataLogging = (pageId = null) => {
  const { logOperation, collectAnswer } = useAppContext();

  /**
   * 记录输入事件
   * @param {string} targetElement - 目标元素描述
   * @param {string} value - 输入值
   */
  const logInput = useCallback((targetElement, value) => {
    logOperation({
      targetElement,
      eventType: 'input',
      value: value || ''
    });
  }, [logOperation]);

  /**
   * 记录输入框失焦事件并收集答案
   * @param {string} targetElement - 目标元素描述
   * @param {string} value - 输入值
   * @param {string} answerElement - 答案元素描述（可选，默认使用targetElement）
   */
  const logInputBlur = useCallback((targetElement, value, answerElement = null) => {
    logOperation({
      targetElement,
      eventType: 'input_blur',
      value: value || ''
    });
    
    collectAnswer({
      targetElement: answerElement || targetElement,
      value: value || ''
    });
  }, [logOperation, collectAnswer]);

  /**
   * 记录按钮点击事件
   * @param {string} buttonName - 按钮名称
   * @param {string} action - 执行的动作描述
   */
  const logButtonClick = useCallback((buttonName, action = '点击') => {
    logOperation({
      targetElement: `${buttonName}按钮`,
      eventType: 'click',
      value: action
    });
  }, [logOperation]);

  /**
   * 记录复选框变更事件
   * @param {string} checkboxName - 复选框名称
   * @param {boolean} checked - 是否选中
   * @param {string} answerElement - 答案元素描述（可选）
   */
  const logCheckboxChange = useCallback((checkboxName, checked, answerElement = null) => {
    logOperation({
      targetElement: `${checkboxName}复选框`,
      eventType: checked ? 'checkbox_check' : 'checkbox_uncheck',
      value: checked ? '选中' : '取消选中'
    });
    
    if (answerElement) {
      collectAnswer({
        targetElement: answerElement,
        value: checked
      });
    }
  }, [logOperation, collectAnswer]);

  /**
   * 记录单选按钮选择事件
   * @param {string} radioName - 单选按钮组名称
   * @param {string} selectedValue - 选中的值
   * @param {string} answerElement - 答案元素描述（可选）
   */
  const logRadioSelect = useCallback((radioName, selectedValue, answerElement = null) => {
    logOperation({
      targetElement: `${radioName}单选按钮`,
      eventType: 'radio_select',
      value: selectedValue
    });
    
    if (answerElement) {
      collectAnswer({
        targetElement: answerElement,
        value: selectedValue
      });
    }
  }, [logOperation, collectAnswer]);

  /**
   * 记录模态框打开事件
   * @param {string} modalName - 模态框名称
   * @param {string} modalId - 模态框ID
   */
  const logModalOpen = useCallback((modalName, modalId) => {
    logOperation({
      targetElement: `${modalName}模态框`,
      eventType: 'modal_open',
      value: modalId
    });
  }, [logOperation]);

  /**
   * 记录模态框关闭事件
   * @param {string} modalName - 模态框名称
   * @param {string} modalId - 模态框ID
   * @param {number} viewDuration - 查看时长（秒）
   */
  const logModalClose = useCallback((modalName, modalId, viewDuration = 0) => {
    logOperation({
      targetElement: `${modalName}模态框`,
      eventType: 'modal_close',
      value: viewDuration > 0 ? `查看时长${viewDuration}秒` : `关闭${modalId}`
    });
  }, [logOperation]);

  /**
   * 记录页面进入事件
   * @param {string} pageName - 页面名称
   */
  const logPageEnter = useCallback((pageName) => {
    logOperation({
      targetElement: '页面',
      eventType: 'page_enter',
      value: pageName
    });
  }, [logOperation]);

  /**
   * 记录页面退出事件
   * @param {string} pageName - 页面名称
   */
  const logPageExit = useCallback((pageName) => {
    logOperation({
      targetElement: '页面',
      eventType: 'page_exit',
      value: pageName
    });
  }, [logOperation]);

  /**
   * 记录数据提交事件
   * @param {string} submitType - 提交类型
   * @param {boolean} success - 是否成功
   * @param {string} message - 附加信息
   */
  const logSubmit = useCallback((submitType, success, message = '') => {
    logOperation({
      targetElement: '数据提交',
      eventType: 'submit',
      value: `${submitType} - ${success ? '成功' : '失败'}${message ? ': ' + message : ''}`
    });
  }, [logOperation]);

  /**
   * 记录计时器事件
   * @param {string} timerName - 计时器名称
   * @param {string} action - 动作（start/stop）
   * @param {number} value - 计时值（可选）
   */
  const logTimer = useCallback((timerName, action, value = null) => {
    logOperation({
      targetElement: `${timerName}计时器`,
      eventType: action === 'start' ? 'timer_start' : 'timer_stop',
      value: value !== null ? `${value}秒` : action
    });
  }, [logOperation]);

  /**
   * 直接收集答案（不记录操作）
   * @param {string} targetElement - 目标元素描述
   * @param {any} value - 答案值
   */
  const collectDirectAnswer = useCallback((targetElement, value) => {
    collectAnswer({
      targetElement,
      value
    });
  }, [collectAnswer]);

  return {
    logInput,
    logInputBlur,
    logButtonClick,
    logCheckboxChange,
    logRadioSelect,
    logModalOpen,
    logModalClose,
    logPageEnter,
    logPageExit,
    logSubmit,
    logTimer,
    collectDirectAnswer,
    // 原始方法，用于特殊场景
    logOperation,
    collectAnswer
  };
}; 