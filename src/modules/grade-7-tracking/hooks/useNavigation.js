/**
 * useNavigation Hook
 * 管理7年级追踪测评模块的导航逻辑和页面完成验证
 */

import { useMemo, useCallback } from 'react';
import { getNextPage, getRelativePageInfo } from '../utils/pageMapping.js';
import { validateRequired } from '../utils/validation.js';

/**
 * 导航管理Hook
 *
 * @param {Object} context - TrackingContext的值
 * @param {number|string} context.currentPage - 当前页码
 * @param {string} context.navigationMode - 导航模式 ('hidden' | 'experiment' | 'questionnaire')
 * @param {Array} context.experimentTrials - 实验试验记录数组
 * @param {Object} context.questionnaireAnswers - 问卷答案对象 {questionId: answerId}
 * @param {Function} context.navigateToPage - 导航到指定页面的函数
 * @param {Object} context.textResponses - 文本回答对象
 * @param {Function} context.submitPageData - 提交页面数据的函数
 * @param {boolean} context.precautionsCheckbox - 注意事项页面复选框状态
 *
 * @returns {Object} 导航相关的状态和方法
 */
export function useNavigation(context) {
  const {
    currentPage,
    navigationMode,
    experimentTrials = [],
    questionnaireAnswers = {},
    navigateToPage,
    textResponses = {},
    submitPageData,
    precautionsCheckbox = false
  } = context || {};

  /**
   * 计算是否可以导航到下一页
   * 基于当前页面的完成条件
   */
  const canNavigateNext = useMemo(() => {
    const pageNum = parseFloat(currentPage);

    // 页面完成规则
    switch (pageNum) {
      case 0.1: {
        // 注意事项页: 必须勾选复选框
        return precautionsCheckbox === true;
      }

      case 2: {
        // 提出问题页: 文本输入不能为空
        const text = textResponses?.page2 || '';
        const validation = validateRequired(text, '问题输入');
        return validation.isValid;
      }

      case 8: {
        // 模拟实验页: 至少完成1次试验
        return experimentTrials.length >= 1;
      }

      case 14:
      case 15:
      case 16:
      case 17:
      case 18:
      case 19:
      case 20:
      case 21: {
        // 问卷页: 检查当前页面的所有问题是否已回答
        // 问卷结构映射
        const questionnaireStructure = {
          14: [1, 2, 3],           // 第14页: 问题1-3
          15: [4, 5, 6, 7],        // 第15页: 问题4-7
          16: [8, 9, 10],          // 第16页: 问题8-10
          17: [11, 12, 13],        // 第17页: 问题11-13
          18: [14, 15, 16],        // 第18页: 问题14-16
          19: [17, 18, 19],        // 第19页: 问题17-19
          20: [20, 21, 22, 23],    // 第20页: 问题20-23
          21: [24, 25, 26, 27]     // 第21页: 问题24-27
        };

        const questionsOnPage = questionnaireStructure[pageNum] || [];

        // 检查该页面所有问题是否已回答
        const allAnswered = questionsOnPage.every(questionNum => {
          const questionId = `q${questionNum}`;
          const answer = questionnaireAnswers[questionId];
          return answer !== null && answer !== undefined && answer !== '';
        });

        return allAnswered;
      }

      default:
        // 其他页面默认允许导航
        return true;
    }
  }, [currentPage, precautionsCheckbox, textResponses, experimentTrials, questionnaireAnswers]);

  /**
   * 获取导航属性
   * 返回当前页面在其所属部分的相对位置
   */
  const getNavigationProps = useCallback(() => {
    const { currentPage: relativeCurrent, totalPages } = getRelativePageInfo(currentPage);

    return {
      currentPage: relativeCurrent,
      totalPages,
      navigationMode
    };
  }, [currentPage, navigationMode]);

  /**
   * 导航到下一页
   * 验证当前页面完成条件 → 提交数据 → 执行导航
   */
  const goToNextPage = useCallback(async () => {
    // 1. 验证是否可以导航
    if (!canNavigateNext) {
      console.warn('[useNavigation] 导航被阻止: 当前页面未完成必填项');

      // 根据页面类型提供友好提示
      const pageNum = parseFloat(currentPage);
      let errorMessage = '请完成当前页面的所有必填项';

      if (pageNum === 0.1) {
        errorMessage = '请勾选"我已阅读并理解以上注意事项"后再继续';
      } else if (pageNum === 2) {
        errorMessage = '请输入您的问题后再继续';
      } else if (pageNum === 8) {
        errorMessage = '请至少完成1次实验试验后再继续';
      } else if (pageNum >= 14 && pageNum <= 21) {
        errorMessage = '请回答本页所有问题后再继续';
      }

      // 触发用户提示 (由调用方处理具体UI展示)
      throw new Error(errorMessage);
    }

    // 2. 获取下一页页码
    const nextPageNum = getNextPage(currentPage);

    if (nextPageNum === null) {
      console.warn('[useNavigation] 已到达最后一页，无法继续导航');
      return false;
    }

    try {
      // 3. 提交当前页面数据
      console.log(`[useNavigation] 准备提交页面 ${currentPage} 的数据`);

      if (submitPageData && typeof submitPageData === 'function') {
        const submitSuccess = await submitPageData();

        if (!submitSuccess) {
          console.error('[useNavigation] 数据提交失败，导航被阻止');
          throw new Error('数据提交失败，请稍后重试');
        }

        console.log(`[useNavigation] 页面 ${currentPage} 数据提交成功`);
      } else {
        console.warn('[useNavigation] submitPageData 函数未定义，跳过数据提交');
      }

      // 4. 执行导航
      console.log(`[useNavigation] 从页面 ${currentPage} 导航到页面 ${nextPageNum}`);

      if (navigateToPage && typeof navigateToPage === 'function') {
        await navigateToPage(nextPageNum);
        return true;
      } else {
        console.error('[useNavigation] navigateToPage 函数未定义');
        throw new Error('导航函数未定义');
      }
    } catch (error) {
      console.error('[useNavigation] 导航过程中发生错误:', error);
      throw error;
    }
  }, [canNavigateNext, currentPage, submitPageData, navigateToPage]);

  return {
    canNavigateNext,
    goToNextPage,
    getNavigationProps
  };
}
