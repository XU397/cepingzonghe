/**
 * PageLayout - 7年级追踪测评模块的页面布局组件
 *
 * 功能:
 * - 提供统一的页面布局结构(左侧导航 + 主内容区)
 * - 显示左侧进度导航栏(experiment和questionnaire模式)
 * - 显示右上角计时器(从AppContext获取)
 * - 渲染页面内容(children)
 *
 * 使用方式:
 * <PageLayout showNavigation={true} showTimer={true}>
 *   <YourPageContent />
 * </PageLayout>
 */

import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTrackingContext } from '../../context/TrackingContext';
import { useAppContext } from '../../../../context/AppContext';
import { getRelativePageInfo } from '../../utils/pageMapping';
import styles from '../../styles/PageLayout.module.css';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 格式化时间(秒)为 MM:SS 格式
 * @param {number} seconds - 秒数
 * @returns {string} 格式化后的时间字符串
 */
function formatTime(seconds) {
  if (typeof seconds !== 'number' || seconds < 0) {
    return '00:00';
  }

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// ============================================================================
// LeftNavigation Component (内部组件)
// ============================================================================

/**
 * LeftNavigation - 左侧导航栏组件
 * 显示圆形数字进度导航，支持实验和问卷两种模式
 */
const LeftNavigation = ({ currentPage, totalPages, navigationMode }) => {
  // 生成导航项数组
  const navigationItems = useMemo(() => {
    return Array.from({ length: totalPages }, (_, index) => ({
      id: String(index + 1),
      pageNumber: index + 1,
    }));
  }, [totalPages]);

  if (totalPages === 0) {
    return null; // 无导航模式
  }

  const currentStepNumber = Math.floor(currentPage);
  const modeLabel = navigationMode === 'experiment' ? '实验进度' : '问卷进度';

  return (
    <div className={styles.leftNavigation}>
      {/* 导航标题 */}
      <div className={styles.navTitle}>{modeLabel}</div>

      {/* 总体进度显示 */}
      <div className={styles.progressIndicator}>
        {currentStepNumber}/{totalPages}
      </div>

      {/* 导航项列表 - 问卷模式下添加questionnaire类名 */}
      <div
        className={`${styles.navigationItems} ${navigationMode === 'questionnaire' ? styles.questionnaire : ''}`}
        style={navigationMode === 'questionnaire' && totalPages > 1 ? {
          '--questionnaire-line-height': `${(totalPages - 1) * 54}px`
        } : {}}
      >
        {navigationItems.map((item, index) => {
          const stepNumber = item.pageNumber;
          const isHighlighted = stepNumber === currentStepNumber;
          const isCompleted = stepNumber < currentStepNumber;
          const isLastStep = index === navigationItems.length - 1;

          return (
            <div key={item.id} className={styles.navItemWrapper}>
              <div
                className={`${styles.navItem} ${
                  isHighlighted ? styles.highlighted : ''
                } ${isCompleted ? styles.completed : ''}`}
              >
                {item.id}
              </div>
              {/* 连接线(最后一个步骤不显示) */}
              {!isLastStep && <div className={styles.navConnector}></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

LeftNavigation.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  navigationMode: PropTypes.oneOf(['hidden', 'experiment', 'questionnaire']).isRequired,
};

// ============================================================================
// PageLayout Component
// ============================================================================

/**
 * PageLayout - 页面布局主组件
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - 页面内容
 * @param {boolean} [props.showNavigation=true] - 是否显示左侧导航栏
 * @param {boolean} [props.showTimer=true] - 是否显示计时器
 */
const PageLayout = ({ children, showNavigation = true, showTimer = true }) => {
  const { session } = useTrackingContext();
  const appContext = useAppContext();

  // 获取当前页面的相对位置信息(用于导航显示)
  const relativeInfo = useMemo(() => {
    return getRelativePageInfo(session.currentPage);
  }, [session.currentPage]);

  // 决定是否显示导航栏
  const shouldShowNavigation = showNavigation && session.navigationMode !== 'hidden';

  // 获取计时器剩余时间
  // 根据当前导航模式选择计时来源
  const remainingTime = useMemo(() => {
    if (session.navigationMode === 'experiment') {
      // 实验阶段: 使用40分钟计时器
      return session.taskTimeRemaining ?? appContext.remainingTime ?? 2400;
    } else if (session.navigationMode === 'questionnaire') {
      // 问卷阶段: 使用10分钟计时器
      return session.questionnaireTimeRemaining ?? 600;
    }
    // 其他情况(如hidden): 兜底使用40分钟
    return appContext.remainingTime ?? 2400;
  }, [session.navigationMode, session.taskTimeRemaining, session.questionnaireTimeRemaining, appContext.remainingTime]);

  return (
    <div className={styles.pageLayout}>
      {/* 左侧导航栏 */}
      {shouldShowNavigation && (
        <div className={styles.leftNavWrapper}>
          <LeftNavigation
            currentPage={relativeInfo.currentPage}
            totalPages={relativeInfo.totalPages}
            navigationMode={session.navigationMode}
          />
        </div>
      )}

      {/* 主内容区域 */}
      <div className={styles.mainContent}>
        {/* 计时器容器(右上角) - 与Grade 4 GlobalTimer布局保持一致 */}
        {showTimer && (
          <div className={styles.timerContainer}>
            <div className={styles.timerIcon}>⏰</div>
            <div className={styles.timerText}>
              <span className={styles.timerLabel}>剩余时间</span>
              <span className={styles.timerValue}>{formatTime(remainingTime)}</span>
            </div>
          </div>
        )}

        {/* 页面内容包装器 */}
        <div className={`${styles.contentWrapper} ${!showTimer ? styles.noTimer : ''}`}>
          <div className={styles.contentFrame}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

PageLayout.propTypes = {
  children: PropTypes.node.isRequired,
  showNavigation: PropTypes.bool,
  showTimer: PropTypes.bool,
};

export default PageLayout;
