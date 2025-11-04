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
import { PAGE_MAPPING } from '../config.js';
import Button from '../components/ui/Button.jsx';
import PageLayout from '../components/layout/PageLayout.jsx';
import styles from '../styles/Page09_Transition.module.css';

// 引入小明图片
import xiaoMingImage from '../../../assets/images/小明.png';

const Page09_Transition = () => {
  const { session, logOperation, clearOperations, buildMarkObject, navigateToPage, submitPageData } = useTrackingContext();
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
                  src={xiaoMingImage}
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

          {/* 引导文字和量筒图示 */}
          <div className={styles.bottomSection}>
            <p className={styles.guideText}>
              接下来，就让我们一起加入小明的实验，开启科学探索之旅吧！
            </p>

            {/* 量筒图示 */}
            <div className={styles.beakerContainer}>
              <svg viewBox="0 0 200 300" className={styles.beakerSvg}>
                {/* 灰色小球 */}
                <circle cx="100" cy="30" r="15" fill="#95a5a6" stroke="#7f8c8d" strokeWidth="2">
                  <animate attributeName="cy" values="30;35;30" dur="2s" repeatCount="indefinite"/>
                </circle>

                {/* 量筒主体 */}
                <g className={styles.beaker}>
                  {/* 量筒外壁 */}
                  <rect x="60" y="70" width="80" height="180"
                        fill="none" stroke="#34495e" strokeWidth="3" rx="5"/>

                  {/* 量筒底部 */}
                  <rect x="60" y="250" width="80" height="10"
                        fill="#34495e" rx="5"/>

                  {/* 量筒顶部开口 */}
                  <rect x="55" y="60" width="90" height="15"
                        fill="#ecf0f1" stroke="#34495e" strokeWidth="2" rx="3"/>

                  {/* 蜂蜜填充 */}
                  <rect x="65" y="85" width="70" height="160"
                        fill="#f39c12" opacity="0.9" rx="3"/>

                  {/* 蜂蜜表面光泽 */}
                  <ellipse cx="100" cy="85" rx="35" ry="5"
                           fill="#f1c40f" opacity="0.6"/>

                  {/* 刻度线 - 10条均匀分布在右侧 */}
                  <line x1="125" y1="90" x2="140" y2="90" stroke="#34495e" strokeWidth="1.5"/>
                  <line x1="125" y1="107" x2="140" y2="107" stroke="#34495e" strokeWidth="1.5"/>
                  <line x1="125" y1="124" x2="140" y2="124" stroke="#34495e" strokeWidth="1.5"/>
                  <line x1="125" y1="141" x2="140" y2="141" stroke="#34495e" strokeWidth="1.5"/>
                  <line x1="125" y1="158" x2="140" y2="158" stroke="#34495e" strokeWidth="2"/>
                  <line x1="125" y1="175" x2="140" y2="175" stroke="#34495e" strokeWidth="1.5"/>
                  <line x1="125" y1="192" x2="140" y2="192" stroke="#34495e" strokeWidth="1.5"/>
                  <line x1="125" y1="209" x2="140" y2="209" stroke="#34495e" strokeWidth="1.5"/>
                  <line x1="125" y1="226" x2="140" y2="226" stroke="#34495e" strokeWidth="1.5"/>
                  <line x1="125" y1="243" x2="140" y2="243" stroke="#34495e" strokeWidth="1.5"/>

                  {/* 刻度数字 - 放在右侧 */}
                  <text x="145" y="95" fontSize="10" fill="#34495e" fontWeight="600">100</text>
                  <text x="145" y="163" fontSize="10" fill="#34495e" fontWeight="600">50</text>
                  <text x="145" y="248" fontSize="10" fill="#34495e" fontWeight="600">0</text>
                </g>

                {/* 量筒反光效果 */}
                <rect x="67" y="85" width="8" height="150"
                      fill="white" opacity="0.2" rx="2"/>

                {/* 电子计时器 */}
                <g className={styles.timer}>
                  {/* 计时器外壳 */}
                  <rect x="50" y="270" width="100" height="25"
                        fill="#2c3e50" stroke="#34495e" strokeWidth="2" rx="4"/>

                  {/* 显示屏 */}
                  <rect x="55" y="274" width="90" height="17"
                        fill="#1a1a1a" rx="2"/>

                  {/* 数字显示 - 00:00.00 */}
                  <text x="100" y="286" fontSize="10" fill="#00ff00"
                        fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                    00:00.00
                  </text>

                  {/* 计时器按钮装饰 */}
                  <circle cx="60" cy="282" r="1.5" fill="#e74c3c" opacity="0.8"/>
                  <circle cx="140" cy="282" r="1.5" fill="#27ae60" opacity="0.8"/>
                </g>
              </svg>
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
