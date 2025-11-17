/**
 * 构造模块用户上下文
 * 在 ModuleRouter 与 Flow 入口之间复用，确保登录直达与刷新恢复一致
 *
 * @param {object|null} globalContext - 来自 AppContext 的全局状态
 * @param {object|null} authInfo - 登录/恢复信息（包含 url/pageNum 等）
 * @returns {object} 模块可用的用户上下文
 */
export function createModuleUserContext(globalContext, authInfo) {
  const baseUserInfo = {
    examNo: authInfo?.examNo || '',
    batchCode: authInfo?.batchCode || '',
    url: authInfo?.url || '',
    pageNum: authInfo?.pageNum ?? null,
  };

  const appStateInfo = globalContext
    ? {
        currentPageId: globalContext.currentPageId,
        remainingTime: globalContext.remainingTime,
        taskStartTime: globalContext.taskStartTime,
        pageEnterTime: globalContext.pageEnterTime,
        isLoggedIn: globalContext.isLoggedIn,
        isAuthenticated: globalContext.isAuthenticated,
        authToken: globalContext.authToken,
        currentUser: globalContext.currentUser,
        moduleUrl: globalContext.moduleUrl,
        isTaskFinished: globalContext.isTaskFinished,
        isTimeUp: globalContext.isTimeUp,
      }
    : {};

  const questionnaireInfo = globalContext
    ? {
        questionnaireData: globalContext.questionnaireData,
        questionnaireAnswers: globalContext.questionnaireAnswers,
        isQuestionnaireCompleted: globalContext.isQuestionnaireCompleted,
        questionnaireRemainingTime: globalContext.questionnaireRemainingTime,
        isQuestionnaireStarted: globalContext.isQuestionnaireStarted,
        isQuestionnaireTimeUp: globalContext.isQuestionnaireTimeUp,
        questionnaireStartTime: globalContext.questionnaireStartTime,
      }
    : {};

  const contextMethods = globalContext
    ? {
        logOperation: globalContext.logOperation,
        collectAnswer: globalContext.collectAnswer,
        handleLogout: globalContext.handleLogout,
        clearAllCache: globalContext.clearAllCache,
        startQuestionnaireTimer: globalContext.startQuestionnaireTimer,
        saveQuestionnaireAnswer: globalContext.saveQuestionnaireAnswer,
        getQuestionnaireAnswer: globalContext.getQuestionnaireAnswer,
        completeQuestionnaire: globalContext.completeQuestionnaire,
        submitPageData: globalContext.submitPageData,
        submitPageDataWithInfo: globalContext.submitPageDataWithInfo,
      }
    : {};

  return {
    ...baseUserInfo,
    ...appStateInfo,
    ...questionnaireInfo,
    ...contextMethods,
    _moduleMetadata: {
      constructedAt: new Date().toISOString(),
      sourceContext: 'global',
      hasGlobalContext: !!globalContext,
      hasAuthInfo: !!authInfo,
    },
  };
}

export default createModuleUserContext;
