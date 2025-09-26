/**
 * 四年级测评页面布局组件
 * 实现统一的页面结构和导航，集成现有的视觉风格和CSS变量系统
 * 遵循编码标准规范
 */

import { useGrade4Context } from '../../context/Grade4Context';
import '../../../../styles/global.css';

const AssessmentPageLayout = ({ 
  title, 
  subtitle,
  children, 
  showNextButton = true,
  nextButtonText = "下一页",
  isNextButtonEnabled = true,
  onNextClick,
  className = "",
  backgroundImage = null, // 新增背景图片参数
  backgroundStyle = {} // 新增背景样式参数
}) => {
  const { logOperation } = useGrade4Context();

  const handleNextClick = () => {
    if (!isNextButtonEnabled) return;
    
    // 记录导航操作
    logOperation({
      targetElement: '下一页按钮',
      eventType: 'button_click',
      value: `点击${nextButtonText}按钮`
    });
    
    if (onNextClick) {
      onNextClick();
    }
  };

  const containerStyle = {
    height: '100%',
    width: '100%',
    position: 'relative',
    minHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
    ...(backgroundImage && {
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: 'contain', // 改为contain确保图片完整显示
      backgroundPosition: 'center top', // 调整位置到顶部中心
      backgroundRepeat: 'no-repeat',
      ...backgroundStyle
    })
  };

  return (
    <div className={`page-content page-fade-in ${className}`} style={containerStyle}>
      {/* 直接渲染页面内容，填满整个容器 */}
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
      
      {/* 下一页按钮 */}
      {showNextButton && (
        <div style={{ 
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000
        }}>
          <button
            type="button"
            disabled={!isNextButtonEnabled}
            onClick={handleNextClick}
            className={isNextButtonEnabled ? 'btn btn-primary' : 'btn btn-disabled'}
            style={{ 
              padding: '14px 32px',
              fontSize: '18px',
              fontWeight: '700',
              borderRadius: '25px',
              border: '3px solid white',
              cursor: isNextButtonEnabled ? 'pointer' : 'not-allowed',
              background: isNextButtonEnabled ? 'var(--cartoon-primary)' : '#e0e0e0',
              color: isNextButtonEnabled ? 'white' : '#9e9e9e',
              transition: 'all 0.3s ease',
              boxShadow: isNextButtonEnabled ? '0 6px 20px rgba(89, 193, 255, 0.5), 0 0 0 3px white' : '0 0 0 3px white',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
            onMouseEnter={(e) => {
              if (isNextButtonEnabled) {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 8px 25px rgba(89, 193, 255, 0.7), 0 0 0 3px white';
              }
            }}
            onMouseLeave={(e) => {
              if (isNextButtonEnabled) {
                e.target.style.transform = 'none';
                e.target.style.boxShadow = '0 6px 20px rgba(89, 193, 255, 0.5), 0 0 0 3px white';
              }
            }}
            title={isNextButtonEnabled ? `点击${nextButtonText}` : '请完成当前页面内容'}
          >
            {nextButtonText}
          </button>
        </div>
      )}
    </div>
  );
};

export default AssessmentPageLayout;