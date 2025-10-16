/**
 * 左侧导航栏组件 - 共享组件
 * 提供统一的导航体验，支持多种导航模式
 *
 * Props:
 * - currentPage: 当前页码 (1-based)
 * - totalPages: 总页数
 * - navigationMode: 'experiment' | 'questionnaire' | 'hidden' (default: 'experiment')
 *   - 'experiment': 显示实验类导航 (数字进度)
 *   - 'questionnaire': 显示问卷类导航 (预留，未来实现)
 *   - 'hidden': 隐藏导航栏
 *
 * Backward Compatibility:
 * - 支持旧版 grade-4 模块的 currentStep 属性
 * - 默认 navigationMode 为 'experiment' 以保持现有行为
 */

import './LeftNavigation.css';

const LeftNavigation = ({
  currentPage,
  totalPages,
  currentStep, // 兼容旧版 grade-4 模块
  navigationMode = 'experiment'
}) => {
  // Backward compatibility: 优先使用 currentPage，否则使用 currentStep
  const currentPageNumber = currentPage || (currentStep ? parseInt(currentStep) : 1);
  const total = totalPages || 11; // 默认 11 页以兼容 grade-4

  // 如果 navigationMode 为 'hidden'，不渲染任何内容
  if (navigationMode === 'hidden') {
    return null;
  }

  // 生成导航项
  const navigationItems = Array.from({ length: total }, (_, i) => ({
    id: String(i + 1)
  }));

  return (
    <div className="left-navigation">
      {/* 总体进度显示 */}
      <div className="progress-indicator">
        {currentPageNumber}/{total}
      </div>

      <div className="navigation-items">
        {navigationItems.map((item, index) => {
          const stepNumber = parseInt(item.id);
          const isHighlighted = stepNumber === currentPageNumber;
          const isCompleted = stepNumber < currentPageNumber;
          const isLastStep = index === navigationItems.length - 1;

          return (
            <div key={item.id} className="nav-item-wrapper">
              <div
                className={`nav-item ${
                  isHighlighted ? 'highlighted' : ''
                } ${
                  isCompleted ? 'completed' : ''
                }`}
              >
                {item.id}
              </div>
              {/* 最后一个步骤不显示连接线 */}
              {!isLastStep && <div className="nav-connector"></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LeftNavigation;
