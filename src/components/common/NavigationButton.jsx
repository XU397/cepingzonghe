import { useAppContext } from '../../context/AppContext';
import { getNextPageId } from '../../utils/pageMappings';

/**
 * 导航按钮组件
 * 处理页面间导航逻辑
 * 
 * @param {Object} props - 组件属性
 * @param {string} props.currentPageId - 当前页面ID
 * @param {boolean} props.disabled - 是否禁用按钮
 * @param {string} props.buttonText - 按钮文本，默认为"下一页"
 * @param {Function} props.onClick - 点击前回调函数，返回false可阻止导航
 * @param {Object} props.customStyle - 自定义按钮样式
 * @returns {JSX.Element} 导航按钮组件
 */
const NavigationButton = ({ 
  currentPageId, 
  disabled = false, 
  buttonText = "下一页", 
  onClick,
  customStyle = {}
}) => {
  const { navigateToPage, logOperation } = useAppContext();

  /**
   * 处理导航按钮点击
   */
  const handleNavigation = async () => {
    try {
      // 如果提供了onClick回调，执行它
      if (onClick && typeof onClick === 'function') {
        // 检查onClick是否是async函数
        const result = onClick();
        
        // 如果是Promise（async函数），等待它完成
        if (result && typeof result.then === 'function') {
          const success = await result;
          if (success === false) {
            return;
          }
          // async onClick函数已经处理了所有逻辑（包括数据提交和导航），直接返回
          return;
        } else {
          // 同步函数，检查返回值
          if (result === false) {
            return;
          }
        }
      }

      // 记录操作（只有在默认逻辑时才记录，避免重复）
      logOperation({
        targetElement: `${buttonText}按钮`,
        eventType: 'click',
        value: `点击${buttonText}按钮`
      });

      // 获取下一页ID
      const nextPageId = getNextPageId(currentPageId);
      if (!nextPageId) {
        console.error(`[NavigationButton] 无法确定从${currentPageId}的下一页`);
        return;
      }
      // 使用AppContext的navigateToPage，它已经包含了数据提交和session过期处理
      await navigateToPage(nextPageId);
    } catch (error) {
      console.error('[NavigationButton] 导航过程出错:', error);
    }
  };

  // 合并默认样式和自定义样式
  const buttonStyle = {
    ...customStyle
  };

  return (
    <div className="navigation">
      <button
        className={`btn ${disabled ? 'btn-disabled' : 'btn-primary'}`}
        disabled={disabled}
        onClick={handleNavigation}
        style={buttonStyle}
      >
        {buttonText}
      </button>
    </div>
  );
};

export default NavigationButton; 