import React, { useEffect } from 'react';
import EventTypes from '@shared/services/submission/eventTypes.js';
import { useG8BananaBrowningContext } from '../context/G8BananaBrowningContext';
import styles from '../styles/Page05BananaBrowning.module.css';

import xmImage from '@assets/images/04-2.png';
import mmImage from '@assets/images/04-1.png';

const Page05BananaBrowning: React.FC = () => {
  const { logOperation, setPageStartTime, getPagePrefix } = useG8BananaBrowningContext();
  const targetPrefix = getPagePrefix();

  useEffect(() => {
    setPageStartTime(new Date());
    logOperation({
      targetElement: `${targetPrefix}页面进入`,
      eventType: EventTypes.PAGE_ENTER,
      value: '页面加载完成',
      time: new Date().toISOString(),
    });
  }, [logOperation, setPageStartTime, targetPrefix]);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <header className={styles.header}>
          <div className={styles.badge}>4</div>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>香蕉变黑</h1>
          </div>
        </header>

        <p className={styles.bodyText}>
          香蕉变黑与多种因素有关。通过对比，小明发现自己和妈妈买的香蕉在储存湿度等条件上一致，唯独品种和储存温度不同（如下所示）。据此推测，品种差异和温度不当可能是导致自己买的香蕉更快变黑的原因。
        </p>

        <div className={styles.comparisonRow}>
          <div className={styles.compareCard}>
            <img src={xmImage} alt="小明" className={styles.avatar} />
            <div className={styles.cardName}>小明</div>
            <div className={styles.cardDetail}>
              <span className={styles.detailLabel}>香蕉品种：</span>
              <span className={styles.detailValue}>海南香蕉</span>
            </div>
            <div className={styles.cardDetail}>
              <span className={styles.detailLabel}>存储温度：</span>
              <span className={styles.detailValue}>2℃</span>
            </div>
          </div>

          <div className={styles.vsDivider}>
            <span className={styles.vsText}>VS</span>
          </div>

          <div className={styles.compareCard}>
            <img src={mmImage} alt="妈妈" className={styles.avatar} />
            <div className={styles.cardName}>妈妈</div>
            <div className={styles.cardDetail}>
              <span className={styles.detailLabel}>香蕉品种：</span>
              <span className={styles.detailValue}>菲律宾香蕉</span>
            </div>
            <div className={styles.cardDetail}>
              <span className={styles.detailLabel}>存储温度：</span>
              <span className={styles.detailValue}>10℃</span>
            </div>
          </div>
        </div>

        <div className={styles.bottomTip}>接下来，请你通过实验，探究小明的猜想是否正确吧！</div>
      </div>
    </div>
  );
};

export default Page05BananaBrowning;
