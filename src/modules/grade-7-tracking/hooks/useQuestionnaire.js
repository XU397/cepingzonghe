/**
 * useQuestionnaire Hook
 * 管理问卷答案状态、完成度检查和验证逻辑
 *
 * 功能:
 * - 管理61题问卷答案状态
 * - 完成度检查(所有题目必答)
 * - 批量更新答案
 * - 验证逻辑
 * - 与TrackingContext集成
 */

import { useMemo, useCallback } from 'react';
import { useTrackingContext } from '../context/TrackingProvider.jsx';

/**
 * useQuestionnaire Hook
 *
 * @returns {Object} 问卷管理接口
 * @property {Object} answers - 问卷答案对象 { q1: 'A', q2: 'B', ... }
 * @property {Function} setAnswer - 设置单个答案 (questionNumber, value) => void
 * @property {Function} isPageComplete - 检查指定页面是否完成 (pageNumber) => boolean
 * @property {Function} getCompletionRate - 获取完成率 () => number (0-100)
 * @property {Function} resetAnswers - 重置所有答案 () => void
 * @property {Function} getPageQuestions - 获取指定页面的问题编号数组 (pageNumber) => number[]
 * @property {Function} getAnsweredCount - 获取已回答问题数量 () => number
 */
export function useQuestionnaire() {
  const {
    questionnaireAnswers,
    updateQuestionnaireAnswer,
    logOperation,
  } = useTrackingContext();

  // 将questionnaireAnswers对象转换为便于访问的格式 { q1: 'A', q2: 'B', ... }
  const answers = useMemo(() => {
    // questionnaireAnswers 是对象格式: { 1: { questionNumber: 1, selectedOption: 'A', ... }, ... }
    const answersObj = {};

    if (questionnaireAnswers && typeof questionnaireAnswers === 'object') {
      Object.keys(questionnaireAnswers).forEach((questionNumber) => {
        const answer = questionnaireAnswers[questionNumber];
        if (answer && answer.selectedOption) {
          const questionId = `q${questionNumber}`;
          answersObj[questionId] = answer.selectedOption;
        }
      });
    }

    return answersObj;
  }, [questionnaireAnswers]);

  /**
   * 页面-问题映射表
   * 定义每个页面包含哪些问题编号
   * 根据questionnaire.json实际数据更新
   */
  const PAGE_QUESTION_MAPPING = useMemo(
    () => ({
      14: [1, 2, 3, 4, 5, 6, 7, 8, 9], // 第14页: 9个问题 (科学探究态度问卷1)
      15: [10, 11, 12, 13, 14, 15, 16, 17, 18], // 第15页: 9个问题 (科学探究态度问卷2)
      16: [19, 20, 21, 22, 23, 24, 25, 26, 27, 28], // 第16页: 10个问题 (科学探究态度问卷3)
      17: [29, 30, 31, 32, 33], // 第17页: 5个问题 (自信度问卷)
      18: [34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44], // 第18页: 11个问题 (环境支持问卷)
      19: [45, 46, 47, 48, 49, 50, 51], // 第19页: 7个问题 (校内科学活动频率)
      20: [52, 53, 54, 55, 56, 57, 58], // 第20页: 7个问题 (校外科学活动频率)
      21: [59, 60, 61], // 第21页: 3个问题 (学习努力程度评估)
    }),
    []
  );

  /**
   * 设置单个问题的答案
   *
   * @param {number} questionNumber - 问题编号 (1-61)
   * @param {string} value - 选项值 ('A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J')
   * @param {string} [questionText] - 问题文本(可选,用于记录)
   */
  const setAnswer = useCallback(
    (questionNumber, value, questionText = '') => {
      // 验证问题编号范围
      if (questionNumber < 1 || questionNumber > 61) {
        console.error('[useQuestionnaire] Invalid question number:', questionNumber);
        return;
      }

      // 验证选项值 (支持A-J用于10分制量表)
      const validOptions = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
      if (!validOptions.includes(value)) {
        console.error('[useQuestionnaire] Invalid option value:', value);
        return;
      }

      // 记录操作日志
      logOperation({
        action: 'questionnaire_answer',
        target: `question_${questionNumber}`,
        value: value,
        time: new Date().toISOString(),
      });

      // 更新答案到Context
      updateQuestionnaireAnswer(questionNumber, value, questionText);
    },
    [updateQuestionnaireAnswer, logOperation]
  );

  /**
   * 获取指定页面的问题编号数组
   *
   * @param {number} pageNumber - 页码 (14-21)
   * @returns {number[]} 问题编号数组
   */
  const getPageQuestions = useCallback(
    (pageNumber) => {
      return PAGE_QUESTION_MAPPING[pageNumber] || [];
    },
    [PAGE_QUESTION_MAPPING]
  );

  /**
   * 检查指定页面是否完成(所有问题都已回答)
   *
   * @param {number} pageNumber - 页码 (14-21)
   * @returns {boolean} 是否完成
   */
  const isPageComplete = useCallback(
    (pageNumber) => {
      const questionsOnPage = getPageQuestions(pageNumber);

      if (questionsOnPage.length === 0) {
        console.warn('[useQuestionnaire] No questions found for page:', pageNumber);
        return false;
      }

      // 检查该页面所有问题是否都已回答
      const allAnswered = questionsOnPage.every((questionNum) => {
        const questionId = `q${questionNum}`;
        const answer = answers[questionId];
        return answer !== null && answer !== undefined && answer !== '';
      });

      return allAnswered;
    },
    [answers, getPageQuestions]
  );

  /**
   * 获取已回答的问题数量
   *
   * @returns {number} 已回答问题数量
   */
  const getAnsweredCount = useCallback(() => {
    if (!questionnaireAnswers || typeof questionnaireAnswers !== 'object') {
      return 0;
    }

    // questionnaireAnswers 是对象格式,遍历所有键
    return Object.values(questionnaireAnswers).filter(
      (answer) => answer && answer.isAnswered
    ).length;
  }, [questionnaireAnswers]);

  /**
   * 获取完成率(百分比)
   *
   * @returns {number} 完成率 (0-100)
   */
  const getCompletionRate = useCallback(() => {
    const totalQuestions = 61; // 更新总题数为61
    const answeredCount = getAnsweredCount();
    return Math.round((answeredCount / totalQuestions) * 100);
  }, [getAnsweredCount]);

  /**
   * 获取指定页面的完成进度
   *
   * @param {number} pageNumber - 页码 (14-21)
   * @returns {Object} { answered: number, total: number, rate: number }
   */
  const getPageCompletionProgress = useCallback(
    (pageNumber) => {
      const questionsOnPage = getPageQuestions(pageNumber);
      const total = questionsOnPage.length;

      const answered = questionsOnPage.filter((questionNum) => {
        const questionId = `q${questionNum}`;
        const answer = answers[questionId];
        return answer !== null && answer !== undefined && answer !== '';
      }).length;

      const rate = total > 0 ? Math.round((answered / total) * 100) : 0;

      return { answered, total, rate };
    },
    [answers, getPageQuestions]
  );

  /**
   * 重置所有答案(慎用,仅用于测试或重新开始)
   */
  const resetAnswers = useCallback(() => {
    console.warn('[useQuestionnaire] Resetting all answers - this action cannot be undone!');

    // 记录重置操作
    logOperation({
      action: 'questionnaire_reset',
      target: 'all_answers',
      value: 'reset',
      time: new Date().toISOString(),
    });

    // 遍历所有问题,重置为未回答状态
    for (let i = 1; i <= 61; i++) {
      updateQuestionnaireAnswer(i, null, '');
    }
  }, [updateQuestionnaireAnswer, logOperation]);

  /**
   * 获取指定问题的答案
   *
   * @param {number} questionNumber - 问题编号 (1-61)
   * @returns {string|null} 答案值
   */
  const getAnswer = useCallback(
    (questionNumber) => {
      const questionId = `q${questionNumber}`;
      return answers[questionId] || null;
    },
    [answers]
  );

  /**
   * 检查指定问题是否已回答
   *
   * @param {number} questionNumber - 问题编号 (1-61)
   * @returns {boolean} 是否已回答
   */
  const isQuestionAnswered = useCallback(
    (questionNumber) => {
      const answer = getAnswer(questionNumber);
      return answer !== null && answer !== undefined && answer !== '';
    },
    [getAnswer]
  );

  return {
    // State
    answers,

    // Answer Management
    setAnswer,
    getAnswer,
    isQuestionAnswered,

    // Completion Checking
    isPageComplete,
    getCompletionRate,
    getAnsweredCount,
    getPageCompletionProgress,

    // Page Mapping
    getPageQuestions,

    // Reset (use with caution)
    resetAnswers,
  };
}
