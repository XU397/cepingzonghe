/**
 * 7年级模块包装器
 *
 * 这个组件作为现有PageRouter系统的薄包装层
 * 关键原则：不修改任何现有代码和导入路径
 * 目标：以最小风险的方式将现有系统集成到模块架构中
 */

import React, { useEffect } from 'react';

// 导入现有组件 - 保持原有路径不变！
import PageRouter from '../../components/PageRouter';
import StepNavigation from '../../components/common/StepNavigation';
import QuestionnaireNavigation from '../../components/questionnaire/QuestionnaireNavigation';
import { useAppContext } from '../../context/AppContext';
import { isQuestionnairePage, getQuestionnaireStepNumber, TOTAL_QUESTIONNAIRE_STEPS } from '../../utils/pageMappings';

/**
 * 7年级包装器组件
 * 
 * 这个组件简单地渲染现有的PageRouter，同时提供模块化的接口
 * 所有现有的AppContext、认证逻辑、页面路由都保持不变
 * 
 * @param {Object} props - 组件属性
 * @param {Object} props.userContext - 用户上下文（包含认证信息等）
 * @param {string} props.initialPageId - 初始页面ID（用于页面恢复）
 */
export const Grade7Wrapper = ({ userContext, initialPageId }) => {
  // 获取 AppContext 中的步骤信息（用于导航显示）
  const { currentStepNumber, totalUserSteps, currentPageId } = useAppContext();

  // 记录包装器的使用情况，便于调试 - 只在真正需要时记录
  useEffect(() => {
    console.log('[Grade7Wrapper] 🎯 7年级模块包装器已挂载', {
      hasUserContext: !!userContext,
      initialPageId,
      currentStepNumber,
      totalUserSteps,
      timestamp: new Date().toISOString()
    });

    // 清理函数
    return () => {
      console.log('[Grade7Wrapper] 🧹 7年级模块包装器已卸载');
    };
  }, [initialPageId, currentStepNumber, totalUserSteps]); // 只依赖initialPageId，避免userContext对象引用变化导致重复执行

  // 处理初始页面设置
  useEffect(() => {
    if (initialPageId) {
      console.log('[Grade7Wrapper] 🔄 设置初始页面', { initialPageId });

      // 注意：这里我们不直接操作页面跳转
      // 而是依赖现有的AppContext和登录逻辑来处理页面恢复
      // 这样可以保持现有的页面恢复机制不变
    }
  }, [initialPageId]);

  // 判断当前页面类型
  const isCurrentPageQuestionnaire = isQuestionnairePage(currentPageId);
  const currentQuestionnaireStep = getQuestionnaireStepNumber(currentPageId);

  // 决定是否显示左侧导航
  // 注意事项页面（currentStepNumber === 0）不显示导航
  // 问卷页面或人机交互页面显示对应的导航
  const showNavigation = isCurrentPageQuestionnaire || (currentStepNumber > 0 && totalUserSteps > 0);

  // 渲染现有的PageRouter组件，并添加左侧导航
  return (
    <div
      className="grade-7-module-wrapper"
      style={{
        display: 'flex',
        flexDirection: 'row',
        height: '100%',
        width: '100%'
      }}
    >
      {/* 左侧导航栏 - 根据页面类型渲染不同的导航 */}
      {showNavigation && (
        isCurrentPageQuestionnaire ? (
          <QuestionnaireNavigation
            currentQuestionnaireStep={currentQuestionnaireStep}
            totalQuestionnaireSteps={TOTAL_QUESTIONNAIRE_STEPS}
          />
        ) : (
          <StepNavigation
            currentStepNumber={currentStepNumber}
            totalSteps={totalUserSteps}
          />
        )
      )}

      {/* 主内容区域 */}
      <div style={{ flex: 1, height: '100%', overflow: 'auto' }}>
        {/*
          直接渲染现有的PageRouter组件
          所有现有的功能、Context、路由逻辑都保持不变
          PageRouter会自动处理：
          - 页面路由和导航
          - 用户认证检查
          - 页面组件渲染
          - 数据提交和日志记录
          - 计时器和进度管理
        */}
        <PageRouter />
      </div>

      {/*
        可选：添加模块特定的调试信息
        仅在开发环境显示，生产环境可通过环境变量控制
      */}
      {import.meta.env.DEV && (
        <div
          style={{
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '3px',
            fontSize: '12px',
            zIndex: 9999
          }}
        >
          Grade-7 Module Active
          {initialPageId && ` | Initial: ${initialPageId}`}
          {showNavigation && (
            isCurrentPageQuestionnaire
              ? ` | 问卷: ${currentQuestionnaireStep}/${TOTAL_QUESTIONNAIRE_STEPS}`
              : ` | 任务: ${currentStepNumber}/${totalUserSteps}`
          )}
        </div>
      )}
    </div>
  );
};

export default Grade7Wrapper;