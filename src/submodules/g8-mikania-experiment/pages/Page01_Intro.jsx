/**
 * Page 01 - 任务背景介绍页
 *
 * 介绍薇甘菊入侵问题和菟丝子防治方法
 */

import { useEffect } from 'react';
import { useMikaniaExperiment } from '../Component';
import styles from '../styles/Page01_Intro.module.css';
import mikaniaImage from '../assets/images/薇甘菊.jpg';
import cuscutaImage from '../assets/images/菟丝子.jpg';

function Page01Intro() {
  const { logOperation } = useMikaniaExperiment();

  // 记录页面进入
  useEffect(() => {
    logOperation({
      targetElement: '页面',
      eventType: 'page_enter',
      value: 'page_01_intro',
    });

    return () => {
      logOperation({
        targetElement: '页面',
        eventType: 'page_exit',
        value: 'page_01_intro',
      });
    };
  }, [logOperation]);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>薇甘菊防治</h1>

        <p className={styles.description}>
          薇甘菊是一种侵略性极强的喜光藤本植物，能通过种子和茎节快速繁殖，严重威胁本地生态系统。在研究其生物防治时，同学们发现可以引入日本菟丝子（一种寄生植物）进行抑制，并为此展开了实验探究。
        </p>

        <div className={styles.imageGrid}>
          <div className={styles.imageItem}>
            <img
              src={mikaniaImage}
              alt="薇甘菊"
              className={styles.plantImage}
            />
            <p className={styles.imageLabel}>• 薇甘菊</p>
          </div>
          <div className={styles.imageItem}>
            <img
              src={cuscutaImage}
              alt="菟丝子"
              className={styles.plantImage}
            />
            <p className={styles.imageLabel}>• 菟丝子</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Page01Intro;
