import React, { useEffect, useRef } from 'react';
import EventTypes from '@shared/services/submission/eventTypes.js';
import { useG8BananaBrowningContext } from '../context/G8BananaBrowningContext';
import styles from '../styles/Page08BananaBrowning.module.css';

import xmqsImage from '@assets/images/XMQS.png';

const Page08BananaBrowning: React.FC = () => {
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

  const bananaSvgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = bananaSvgRef.current;
    if (!svg) return;
    const resetLoop = setInterval(() => {
      svg.setCurrentTime(0);
    }, 14000);
    return () => clearInterval(resetLoop);
  }, []);

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.badge}>7</div>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>香蕉变黑：开启探索之旅</h1>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.dialogSection}>
          <div className={styles.characterSection}>
            <div className={styles.imageContainer}>
              <img
                src={xmqsImage}
                alt="小明"
                className={styles.characterImage}
                onError={e => {
                  e.currentTarget.style.display = 'none';
                  const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                  if (placeholder) placeholder.style.display = 'flex';
                }}
              />
              <div className={styles.imagePlaceholder}>
                <div className={styles.placeholderIcon}>👦</div>
              </div>
            </div>
            <p className={styles.characterName}>小明</p>
          </div>

          <div className={styles.speechBubble}>
            <p className={styles.bubbleText}>
              我想利用图像法测量香蕉黑变比例，并探究品种和储存温度对香蕉黑变比例的影响。
            </p>
          </div>
        </div>

        <div className={styles.bottomSection}>
          <p className={styles.guideText}>接下来，让我们一起加入小明的实验，开启科学探索之旅吧！</p>

          <div className={styles.bananaContainer}>
            <svg
              ref={bananaSvgRef}
              viewBox="100 100 640 520"
              className={styles.bananaSvg}
              aria-label="香蕉变黑动画"
              role="img"
            >
              <defs>
                <clipPath id="bb-clip">
                  <path d="M 150,370 C 280,600 540,560 650,300 Q 655,250 620,220 C 480,410 300,420 160,330 Q 140,350 150,370 Z" />
                </clipPath>
                <linearGradient id="bb-skin" x1="0%" y1="0%" x2="80%" y2="100%">
                  <stop offset="0%" stopColor="#FEF08A" />
                  <stop offset="40%" stopColor="#FACC15" />
                  <stop offset="90%" stopColor="#CA8A04" />
                </linearGradient>
              </defs>

              {/* 茎 */}
              <path d="M 620,220 Q 645,160 665,140 L 700,155 Q 680,210 645,295 Z" fill="#84CC16" />
              <path
                d="M 620,220 Q 645,160 665,140 L 700,155 Q 680,210 645,295 Z"
                fill="#65A30D"
                opacity="0.6"
              />
              <polygon points="665,140 700,155 695,165 655,150" fill="#3F2723" />

              {/* 尖端 */}
              <path d="M 150,370 L 125,375 L 130,325 L 160,330 Z" fill="#3F2723" />

              {/* 香蕉主体 — clipPath 内逐级变黑 */}
              <g clipPath="url(#bb-clip)">
                <rect x="0" y="0" width="800" height="600" fill="url(#bb-skin)" />

                {/* 棱线 */}
                <path
                  d="M 155,360 C 300,530 530,510 645,280"
                  fill="none"
                  stroke="#A16207"
                  strokeWidth="4"
                  opacity="0.6"
                />
                <path
                  d="M 160,345 C 310,440 500,430 635,240"
                  fill="none"
                  stroke="#FEF08A"
                  strokeWidth="6"
                  opacity="0.7"
                />

                {/* 阶段1: 小雀斑 */}
                <circle cx="280" cy="440" r="0" fill="#5D4037">
                  <animate attributeName="r" to="5" begin="0.5s" dur="1s" fill="freeze" />
                </circle>
                <circle cx="350" cy="480" r="0" fill="#5D4037">
                  <animate attributeName="r" to="6" begin="1s" dur="1s" fill="freeze" />
                </circle>
                <circle cx="480" cy="400" r="0" fill="#5D4037">
                  <animate attributeName="r" to="4" begin="1.5s" dur="1s" fill="freeze" />
                </circle>
                <circle cx="550" cy="320" r="0" fill="#5D4037">
                  <animate attributeName="r" to="7" begin="1.8s" dur="1s" fill="freeze" />
                </circle>
                <circle cx="400" cy="430" r="0" fill="#5D4037">
                  <animate attributeName="r" to="5" begin="2s" dur="1s" fill="freeze" />
                </circle>
                <circle cx="220" cy="390" r="0" fill="#5D4037">
                  <animate attributeName="r" to="5" begin="2.2s" dur="1s" fill="freeze" />
                </circle>

                {/* 阶段2: 中等斑块扩散 */}
                <circle cx="250" cy="450" r="0" fill="#3E2723">
                  <animate attributeName="r" to="35" begin="2.5s" dur="3s" fill="freeze" />
                </circle>
                <circle cx="360" cy="490" r="0" fill="#3E2723">
                  <animate attributeName="r" to="45" begin="3s" dur="3s" fill="freeze" />
                </circle>
                <circle cx="470" cy="420" r="0" fill="#3E2723">
                  <animate attributeName="r" to="50" begin="3.5s" dur="3s" fill="freeze" />
                </circle>
                <circle cx="550" cy="360" r="0" fill="#3E2723">
                  <animate attributeName="r" to="30" begin="4s" dur="3s" fill="freeze" />
                </circle>

                {/* 阶段3: 大面积深黑椭圆蔓延 */}
                <ellipse
                  cx="230"
                  cy="440"
                  rx="0"
                  ry="0"
                  fill="#1C1917"
                  transform="rotate(20 230 440)"
                >
                  <animate attributeName="rx" to="120" begin="4.5s" dur="4s" fill="freeze" />
                  <animate attributeName="ry" to="90" begin="4.5s" dur="4s" fill="freeze" />
                </ellipse>
                <ellipse
                  cx="340"
                  cy="490"
                  rx="0"
                  ry="0"
                  fill="#1C1917"
                  transform="rotate(10 340 490)"
                >
                  <animate attributeName="rx" to="140" begin="5s" dur="4s" fill="freeze" />
                  <animate attributeName="ry" to="100" begin="5s" dur="4s" fill="freeze" />
                </ellipse>
                <ellipse
                  cx="460"
                  cy="460"
                  rx="0"
                  ry="0"
                  fill="#1C1917"
                  transform="rotate(-15 460 460)"
                >
                  <animate attributeName="rx" to="150" begin="5.5s" dur="4s" fill="freeze" />
                  <animate attributeName="ry" to="110" begin="5.5s" dur="4s" fill="freeze" />
                </ellipse>
                <ellipse
                  cx="570"
                  cy="340"
                  rx="0"
                  ry="0"
                  fill="#1C1917"
                  transform="rotate(-35 570 340)"
                >
                  <animate attributeName="rx" to="130" begin="6s" dur="4s" fill="freeze" />
                  <animate attributeName="ry" to="90" begin="6s" dur="4s" fill="freeze" />
                </ellipse>
                <ellipse
                  cx="630"
                  cy="260"
                  rx="0"
                  ry="0"
                  fill="#1C1917"
                  transform="rotate(-50 630 260)"
                >
                  <animate attributeName="rx" to="100" begin="6.5s" dur="4s" fill="freeze" />
                  <animate attributeName="ry" to="70" begin="6.5s" dur="4s" fill="freeze" />
                </ellipse>
                <ellipse
                  cx="170"
                  cy="370"
                  rx="0"
                  ry="0"
                  fill="#1C1917"
                  transform="rotate(40 170 370)"
                >
                  <animate attributeName="rx" to="90" begin="6.8s" dur="4s" fill="freeze" />
                  <animate attributeName="ry" to="60" begin="6.8s" dur="4s" fill="freeze" />
                </ellipse>

                {/* 阶段4: 全黑覆盖 */}
                <rect x="0" y="0" width="800" height="600" fill="#151312" opacity="0">
                  <animate attributeName="opacity" to="0.95" begin="8s" dur="3s" fill="freeze" />
                </rect>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page08BananaBrowning;
