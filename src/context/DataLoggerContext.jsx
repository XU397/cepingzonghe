import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAppContext } from './AppContext';
import { submitPageMarkData } from '../services/apiService';
import { pageInfoMapping } from '../utils/pageMappings';

/**
 * 数据记录与提交服务上下文
 * 负责记录用户操作和答案，并提交到后端
 */
const DataLoggerContext = createContext();

/**
 * 数据记录与提交服务上下文提供者组件
 * @param {Object} props - 组件属性
 * @param {React.ReactNode} props.children - 子组件
 */
export const DataLoggerProvider = ({ children }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitAttempt, setSubmitAttempt] = useState(0);

  const {
    currentPageId,
    batchCode,
    examNo,
    currentPageData, // Contains .operationList and .answerList populated by AppContext
    pageEnterTime,
    formatDateTime, // Get the real one from AppContext
  } = useAppContext();

  /**
   * 准备页面提交数据
   * @param {boolean} [isTimeout=false] - 是否是由于超时触发的提交
   * @returns {Object} 提交数据对象
   */
  const preparePageSubmissionData = useCallback((isTimeout = false) => {
    const pageInfo = pageInfoMapping[currentPageId] || { number: '0', desc: '未知页面' };
    const endTime = formatDateTime(new Date()); // Use formatDateTime from AppContext
    const beginTime = pageEnterTime ? formatDateTime(pageEnterTime) : endTime;

    // operationList is already populated by AppContext.logOperation
    // Timeout specific log should have been added by AppContext's timer logic
    // or App.jsx's timeout handling logic using AppContext.logOperation.
    // Thus, no need to augment operationList here for timeout.
    // The isTimeout flag is kept for potential future use if the payload needs
    // to differ in other ways for a timeout submission.

    return {
      batchCode,
      examNo,
      mark: {
        pageNumber: pageInfo.number,
        pageDesc: pageInfo.desc,
        operationList: currentPageData.operationList || [], // Use directly from AppContext
        answerList: currentPageData.answerList || [],   // Use directly from AppContext
        beginTime,
        endTime,
        imgList: [],
      },
    };
  }, [batchCode, examNo, currentPageId, currentPageData, pageEnterTime, formatDateTime]);

  /**
   * 提交当前页面的数据
   * @param {Function} [onCompleteCallback] - 提交成功后执行的回调
   * @param {boolean} [isTimeoutSubmit=false] - 是否是由于超时触发的提交
   * @returns {Promise<boolean>} 提交是否成功
   */
  const submitPageData = useCallback(async (onCompleteCallback, isTimeoutSubmit = false) => {
    if (isSubmitting) return false;

    // Answers are now collected directly by pages using AppContext.collectAnswer
    // pageIdToSubmit is removed, it always submits data for the AppContext.currentPageId

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      setSubmitAttempt(prev => prev + 1);
      
      const payload = preparePageSubmissionData(isTimeoutSubmit);
      console.log('提交数据 (isTimeout: ' + isTimeoutSubmit + '):', payload);
      
      // Simulate API call delay if needed for testing
      // await new Promise(resolve => setTimeout(resolve, 1000)); 
      const response = await submitPageMarkData(payload);
      console.log('提交响应:', response);
      
      if (onCompleteCallback) {
        onCompleteCallback();
      }
      
      setIsSubmitting(false);
      return true;
    } catch (error) {
      console.error('提交页面数据失败:', error);
      setSubmitError(error.message || '数据提交失败，请稍后重试');
      setIsSubmitting(false);
      return false;
    }
  }, [isSubmitting, preparePageSubmissionData]); // formatDateTime removed as it's a dep of preparePageSubmissionData

  /**
   * 重试提交
   * @param {Function} [onCompleteCallback] - 提交成功后执行的回调
   */
  const retrySubmit = useCallback(async (onCompleteCallback) => {
    // Retries submission for the current page's data, not a timeout submission by default
    return submitPageData(onCompleteCallback, false);
  }, [submitPageData]);

  const contextValue = {
    isSubmitting,
    submitError,
    submitAttempt,
    submitPageData,
    retrySubmit,
    preparePageSubmissionData, // Expose if direct preparation is needed by UI, though unlikely
  };

  return (
    <DataLoggerContext.Provider value={contextValue}>
      {children}
    </DataLoggerContext.Provider>
  );
};

/**
 * 使用数据记录与提交服务上下文的自定义Hook
 * @returns {Object} 数据记录与提交服务上下文值
 */
export const useDataLogger = () => {
  const context = useContext(DataLoggerContext);
  if (context === undefined) {
    throw new Error('useDataLogger必须在DataLoggerProvider内部使用');
  }
  return context;
};

export default DataLoggerContext; 