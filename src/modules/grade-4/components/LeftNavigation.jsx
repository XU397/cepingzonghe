/**
 * 左侧导航栏组件 - 四年级模块通用
 * 提供统一的导航体验，根据当前步骤高亮相应项目
 * 参考七年级圆形数字导航样式，只显示数字
 */

import { useGrade4Context } from '../context/Grade4Context';
import './LeftNavigation.css';

const LeftNavigation = ({ currentStep }) => {
  const { setNavigationStep } = useGrade4Context();

  // 导航项定义 - 四年级只有11题，不显示文字
  const navigationItems = [
    { id: '1' },
    { id: '2' },
    { id: '3' },
    { id: '4' },
    { id: '5' },
    { id: '6' },
    { id: '7' },
    { id: '8' },
    { id: '9' },
    { id: '10' },
    { id: '11' }
  ];

  const totalSteps = navigationItems.length;
  const currentStepNumber = parseInt(currentStep) || 1;

  // 不允许点击导航切换页面
  const handleItemClick = (stepId) => {
    // 导航不可点击，移除点击处理逻辑
    return;
  };

  return (
    <div className="left-navigation">
      {/* 总体进度显示 */}
      <div className="progress-indicator">
        {currentStepNumber}/{totalSteps}
      </div>
      
      <div className="navigation-items">
        {navigationItems.map((item, index) => {
          const stepNumber = parseInt(item.id);
          const isHighlighted = stepNumber === currentStepNumber;
          const isCompleted = stepNumber < currentStepNumber;
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