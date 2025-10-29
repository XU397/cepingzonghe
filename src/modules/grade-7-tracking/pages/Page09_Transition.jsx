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
import { useTrackingContext } from '../context/TrackingProvider.jsx';
import { useDataLogger } from '../hooks/useDataLogger.js';
import { PAGE_MAPPING } from '../config.js';
import Button from '../components/ui/Button.jsx';
import PageLayout from '../components/layout/PageLayout.jsx';
import styles from '../styles/Page09_Transition.module.css';

// 引入图片
// import kidsTogetherImg from '../assets/images/kids-together.jpg'; // T104: 使用占位符替代

const Page09_Transition = () => {
  const { session, logOperation, clearOperations, buildMarkObject, navigateToPage } = useTrackingContext();
  const { submitPageData } = useDataLogger();
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

      // 构建并提交MarkObject
      // 从session获取当前页码而不是硬编码
      const pageInfo = PAGE_MAPPING[session.currentPage];
      const markObject = buildMarkObject(String(session.currentPage), pageInfo?.desc || '过渡页面');
      const success = await submitPageData(markObject);

      if (success) {
        clearOperations();
        await navigateToPage(8);
      } else {
        throw new Error('数据提交失败');
      }
    } catch (error) {
      console.error('[Page09_Transition] 导航失败:', error);
      setIsNavigating(false);
      alert(error.message || '页面跳转失败，请重试');
    }
  }, [isNavigating, session, logOperation, buildMarkObject, submitPageData, clearOperations, navigateToPage]);

  return (
    <PageLayout showNavigation={true} showTimer={true}>
      <div className={styles.pageContainer}>
        {/* 标题 */}
        <h1 className={styles.title}>蜂蜜变稀</h1>

        {/* 主内容区域 */}
        <div className={styles.content}>
          {/* 小明和对话气泡的横向布局 */}
          <div className={styles.dialogSection}>
            {/* 小明图片和名字 */}
            <div className={styles.characterSection}>
              <div className={styles.imageContainer}>
                <img
                  src="/src/assets/images/小明.png"
                  alt="小明"
                  className={styles.characterImage}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className={styles.imagePlaceholder}>
                  <div className={styles.placeholderIcon}>👦</div>
                </div>
              </div>
              <p className={styles.characterName}>小明</p>
            </div>

            {/* 对话气泡 */}
            <div className={styles.speechBubble}>
              <p className={styles.bubbleText}>
                我想利用落球法测量蜂蜜的黏度，探究温度、含水量与落球时间的关系。
              </p>
            </div>
          </div>

          {/* 引导文字 */}
          <p className={styles.guideText}>
            接下来，就让我们一起加入小明的实验，开启科学探索之旅吧！
          </p>
        </div>

        {/* 底部按钮区域 */}
        <div className={styles.footer}>
          <Button
            onClick={handleStartExperiment}
            disabled={isNavigating}
            loading={isNavigating}
            variant="primary"
            ariaLabel="下一页"
          >
            下一页
          </Button>
        </div>
      </div>
    </PageLayout>
  );
};

export default Page09_Transition;
