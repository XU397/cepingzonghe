/**
 * Page09_Transition - 过渡页面
 *
 * FR-017: 显示小明图片,鼓励文字
 *
 * 页面内容:
 * - 标题: "实验准备完成"
 * - 小明和小伙伴图片
 * - 鼓励文字
 * - "开始实验"按钮 (无需额外交互即可点击)
 *
 * @component
 */

import { useEffect, useState, useCallback } from 'react';
import { useTrackingContext } from '../context/TrackingContext.jsx';
import { useDataLogger } from '../hooks/useDataLogger.js';
import Button from '../components/ui/Button.jsx';
import styles from '../styles/Page09_Transition.module.css';

// 引入图片
// import kidsTogetherImg from '../assets/images/kids-together.jpg'; // T104: 使用占位符替代

const Page09_Transition = () => {
  const { logOperation, clearOperations, currentPageOperations, navigateToPage } = useTrackingContext();
  const { submitPageData } = useDataLogger();
  const [pageStartTime] = useState(() => new Date());
  const [isNavigating, setIsNavigating] = useState(false);

  // 页面进入日志
  useEffect(() => {
    logOperation({
      action: 'page_enter',
      target: 'page_09_transition',
      value: '过渡页面 - 实验准备完成',
      time: new Date().toISOString()
    });

    return () => {
      // 页面离开日志
      logOperation({
        action: 'page_exit',
        target: 'page_09_transition',
        value: '过渡页面 - 实验准备完成',
        time: new Date().toISOString()
      });
    };
  }, [logOperation]);

  // 处理"开始实验"点击
  const handleStartExperiment = useCallback(async () => {
    if (isNavigating) return;

    setIsNavigating(true);

    try {
      logOperation({
        action: 'click_start_experiment',
        target: 'start_experiment_button',
        value: 'page_09_to_page_10',
        time: new Date().toISOString()
      });

      // 构建MarkObject
      const pageEndTime = new Date();
      const markObject = {
        pageNumber: '9',
        pageDesc: '过渡页面 - 实验准备完成',
        operationList: currentPageOperations.map(op => ({
          targetElement: op.target,
          eventType: op.action,
          value: op.value || '',
          time: op.time || new Date(op.timestamp).toISOString()
        })),
        answerList: [],
        beginTime: formatDateTime(pageStartTime),
        endTime: formatDateTime(pageEndTime),
        imgList: []
      };

      // 提交数据
      const success = await submitPageData(markObject);
      if (success) {
        clearOperations();
        await navigateToPage(10);
      } else {
        setIsNavigating(false);
        alert('页面跳转失败，请重试');
      }
    } catch (error) {
      console.error('[Page09_Transition] 导航失败:', error);
      setIsNavigating(false);
      alert(error.message || '页面跳转失败，请重试');
    }
  }, [isNavigating, logOperation, currentPageOperations, pageStartTime, submitPageData, clearOperations, navigateToPage]);

  return (
    <div className={styles.pageContainer}>
      {/* 主内容区域 */}
      <div className={styles.content}>
        {/* 图片区域 */}
        <div className={styles.imageSection}>
          <div className={styles.imageContainer}>
            <img
              src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3C/svg%3E" // T104: SVG占位符
              alt="小明和小伙伴准备开始实验"
              className={styles.kidsImage}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className={styles.imagePlaceholder}>
              <div className={styles.placeholderIcon}>👦👧</div>
              <p className={styles.placeholderText}>小明和小伙伴</p>
            </div>
          </div>
        </div>

        {/* 文字内容区域 */}
        <div className={styles.textSection}>
          <div className={styles.textCard}>
            {/* 标题 */}
            <div className={styles.titleContainer}>
              <div className={styles.checkmark}>✓</div>
              <h1 className={styles.title}>实验准备完成!</h1>
            </div>

            {/* 分隔线 */}
            <div className={styles.divider}></div>

            {/* 鼓励文字 */}
            <div className={styles.encouragement}>
              <p className={styles.mainText}>
                太棒了！你已经完成了实验设计和方案评估的所有准备工作。
              </p>
              <p className={styles.subText}>
                现在，让我们一起进入实验阶段，通过模拟实验来验证我们的假设吧！
              </p>

              {/* 提示要点 */}
              <div className={styles.tipsContainer}>
                <h2 className={styles.tipsTitle}>🔬 实验阶段提示：</h2>
                <ul className={styles.tipsList}>
                  <li>
                    <span className={styles.tipIcon}>•</span>
                    <span>仔细选择实验参数（含水量和温度）</span>
                  </li>
                  <li>
                    <span className={styles.tipIcon}>•</span>
                    <span>观察并记录小球下落的时间</span>
                  </li>
                  <li>
                    <span className={styles.tipIcon}>•</span>
                    <span>可以多次进行实验来验证你的发现</span>
                  </li>
                  <li>
                    <span className={styles.tipIcon}>•</span>
                    <span>思考实验数据与假设是否一致</span>
                  </li>
                </ul>
              </div>

              {/* 激励语 */}
              <div className={styles.motivation}>
                <p className={styles.motivationText}>
                  🌟 开启科学探索之旅吧！相信你一定能发现蜂蜜黏度的秘密！
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部按钮区域 */}
      <div className={styles.footer}>
        <Button
          onClick={handleStartExperiment}
          disabled={isNavigating}
          loading={isNavigating}
          variant="primary"
          ariaLabel="开始模拟实验"
        >
          开始实验
        </Button>
      </div>
    </div>
  );
};

// 辅助函数: 格式化日期时间
function formatDateTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

export default Page09_Transition;
