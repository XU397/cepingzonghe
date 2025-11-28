/**
 * Page 01 - 任务背景介绍页
 *
 * 介绍薇甘菊入侵问题和菟丝子防治方法
 */

import { useEffect, useMemo } from 'react';
import { EventTypes } from '@shared/services/submission/eventTypes';
import { getPageSubNum } from '../mapping';
import { useMikaniaExperiment } from '../Component';
import styles from '../styles/Page01_Intro.module.css';
import mikaniaImage from '../assets/images/薇甘菊.jpg';
import cuscutaImage from '../assets/images/菟丝子.jpg';

function Page01Intro() {
  const { state, logOperation, flowContext } = useMikaniaExperiment();

  const subPageNum = getPageSubNum(state.currentPageId);
  const flowStepIndex = flowContext?.stepIndex;
  const pageNumber = useMemo(() => {
    return typeof flowStepIndex === 'number' ? `${flowStepIndex}.${subPageNum}` : String(subPageNum);
  }, [flowStepIndex, subPageNum]);
  const targetPrefix = useMemo(() => `P${pageNumber}_`, [pageNumber]);
  const pageTarget = `${targetPrefix}页面`;
  const nextButtonTarget = `${targetPrefix}下一页按钮`;

  // 记录页面进入
  useEffect(() => {
    logOperation({
      targetElement: pageTarget,
      eventType: EventTypes.PAGE_ENTER,
      value: 'page_01_intro',
    });

    return () => {
      logOperation({
        targetElement: pageTarget,
        eventType: EventTypes.PAGE_EXIT,
        value: 'page_01_intro',
      });
    };
  }, [logOperation, pageTarget]);

  // 处理下一页点击（由 Frame 调用）
  const handleNext = () => {
    logOperation({
      targetElement: nextButtonTarget,
      eventType: EventTypes.NEXT_CLICK,
      value: 'navigate_to_step_q1',
    });

    // 触发 Frame 的下一页按钮
    const frameNextButton = document.querySelector('[data-testid="frame-next-button"]');
    if (frameNextButton) {
      frameNextButton.click();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>薇甘菊防治实验</h1>

        <div className={styles.mainLayout}>
          {/* 左侧文字区域 */}
          <div className={styles.textSection}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.icon}>🌿</span>
              实验背景
            </h2>

            <p className={styles.description}>
              薇甘菊是一种侵略性极强的喜光藤本植物，原产于南美洲，现已在我国华南地区广泛蔓延。它能通过种子和茎节快速繁殖，攀附在其他植物上形成厚密的覆盖层，阻挡阳光，导致被覆盖植物因无法进行光合作用而死亡，严重威胁本地生态系统的平衡。
            </p>

            <div className={styles.highlightBox}>
              <h3 className={styles.highlightTitle}>
                <span className={styles.icon}>🔬</span>
                防治方案
              </h3>
              <p className={styles.highlightText}>
                在研究其生物防治方法时，科学家们发现可以引入菟丝子（一种寄生植物）来抑制薇甘菊的生长。菟丝子会寄生在薇甘菊上，吸取其养分，从而达到控制薇甘菊蔓延的目的。让我们通过实验来探究菟丝子对薇甘菊种子萌发的影响。
              </p>
            </div>
          </div>

          {/* 右侧图片区域 */}
          <div className={styles.imageSection}>
            <div className={styles.imageItem}>
              <div className={styles.imageWrapper}>
                <img
                  src={mikaniaImage}
                  alt="薇甘菊"
                  className={styles.plantImage}
                />
                <span className={`${styles.imageBadge} ${styles.badgeDanger}`}>
                  入侵物种
                </span>
              </div>
              <p className={styles.imageLabel}>薇甘菊（Kunth in Humb. & al.）</p>
            </div>

            <div className={styles.imageItem}>
              <div className={styles.imageWrapper}>
                <img
                  src={cuscutaImage}
                  alt="菟丝子"
                  className={styles.plantImage}
                />
                <span className={`${styles.imageBadge} ${styles.badgeSuccess}`}>
                  生物防治
                </span>
              </div>
              <p className={styles.imageLabel}>菟丝子（Cuscutachinensis Lam.）</p>
            </div>
          </div>
        </div>
      </div>

      {/* 隐藏的下一页按钮，用于 Frame 回调 */}
      <button
        type="button"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: 0,
          opacity: 0,
          pointerEvents: 'none',
          border: 0,
        }}
        tabIndex={-1}
        onClick={handleNext}
        data-testid="next-button"
        aria-hidden="true"
      >
        下一页
      </button>
    </div>
  );
}

export default Page01Intro;
