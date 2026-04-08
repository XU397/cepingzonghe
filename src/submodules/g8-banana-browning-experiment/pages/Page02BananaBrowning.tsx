import React, { useEffect } from 'react';
import EventTypes from '@shared/services/submission/eventTypes.js';
import { useG8BananaBrowningContext } from '../context/G8BananaBrowningContext';
import styles from '../styles/Page02BananaBrowning.module.css';

const Page02BananaBrowning: React.FC = () => {
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
    <div className={styles.pageContainer}>
      <svg
        viewBox="0 0 960 640"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none',
          background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 25%, #fde68a 50%, #f59e0b 100%)',
        }}
      >
        <defs>
          <linearGradient id="banana-skin-grad" x1="0%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="40%" stopColor="#FACC15" />
            <stop offset="90%" stopColor="#CA8A04" />
          </linearGradient>
          <filter id="banana-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="15" />
          </filter>
          <clipPath id="banana-clip-bg">
            <path d="M 150,370 C 280,600 540,560 650,300 Q 655,250 620,220 C 480,410 300,420 160,330 Q 140,350 150,370 Z" />
          </clipPath>
        </defs>

        <ellipse
          cx="790"
          cy="430"
          rx="92"
          ry="15"
          fill="#D97706"
          opacity="0.15"
          filter="url(#banana-shadow)"
        />

        <ellipse
          cx="220"
          cy="248"
          rx="74"
          ry="12"
          fill="#D97706"
          opacity="0.12"
          filter="url(#banana-shadow)"
        />

        <g transform="translate(-5, 62) scale(0.32) rotate(105 400 300)">
          <path
            d="M 620,220 Q 645,160 665,140 L 700,155 Q 680,210 645,295 Z"
            fill="#84CC16"
            opacity="0.72"
          />
          <polygon points="665,140 700,155 695,165 655,150" fill="#3F2723" opacity="0.72" />
          <path d="M 150,370 L 125,375 L 130,325 L 160,330 Z" fill="#3F2723" opacity="0.72" />

          <g clipPath="url(#banana-clip-bg)">
            <rect
              x="0"
              y="0"
              width="800"
              height="600"
              fill="url(#banana-skin-grad)"
              opacity="0.94"
            />
            <path
              d="M 155,360 C 300,530 530,510 645,280"
              fill="none"
              stroke="#A16207"
              strokeWidth="4"
              opacity="0.42"
            />
            <path
              d="M 160,345 C 310,440 500,430 635,240"
              fill="none"
              stroke="#FEF08A"
              strokeWidth="6"
              opacity="0.5"
            />
          </g>
        </g>

        <g transform="translate(585, 95) scale(0.42) rotate(-75 400 300)">
          <path
            d="M 620,220 Q 645,160 665,140 L 700,155 Q 680,210 645,295 Z"
            fill="#84CC16"
            opacity="0.6"
          />
          <polygon points="665,140 700,155 695,165 655,150" fill="#3F2723" opacity="0.6" />
          <path d="M 150,370 L 125,375 L 130,325 L 160,330 Z" fill="#3F2723" opacity="0.6" />

          <g clipPath="url(#banana-clip-bg)">
            <rect
              x="0"
              y="0"
              width="800"
              height="600"
              fill="url(#banana-skin-grad)"
              opacity="0.7"
            />
            <path
              d="M 155,360 C 300,530 530,510 645,280"
              fill="none"
              stroke="#A16207"
              strokeWidth="4"
              opacity="0.3"
            />
            <path
              d="M 160,345 C 310,440 500,430 635,240"
              fill="none"
              stroke="#FEF08A"
              strokeWidth="6"
              opacity="0.3"
            />

            <circle cx="280" cy="440" r="5" fill="#111111" opacity="0.9">
              <animate attributeName="r" values="0;5" begin="0.5s" dur="1s" fill="freeze" />
            </circle>
            <circle cx="350" cy="480" r="6" fill="#111111" opacity="0.92">
              <animate attributeName="r" values="0;6" begin="1s" dur="1s" fill="freeze" />
            </circle>
            <circle cx="480" cy="400" r="4" fill="#111111" opacity="0.9">
              <animate attributeName="r" values="0;4" begin="1.5s" dur="1s" fill="freeze" />
            </circle>
            <circle cx="550" cy="320" r="7" fill="#111111" opacity="0.94">
              <animate attributeName="r" values="0;7" begin="1.8s" dur="1s" fill="freeze" />
            </circle>
            <circle cx="400" cy="430" r="5" fill="#111111" opacity="0.92">
              <animate attributeName="r" values="0;5" begin="2s" dur="1s" fill="freeze" />
            </circle>

            <circle cx="250" cy="450" r="0" fill="#050505" opacity="0.96">
              <animate attributeName="r" to="35" begin="2.5s" dur="3s" fill="freeze" />
            </circle>
            <circle cx="360" cy="490" r="0" fill="#050505" opacity="0.96">
              <animate attributeName="r" to="45" begin="3s" dur="3s" fill="freeze" />
            </circle>
            <circle cx="470" cy="420" r="0" fill="#050505" opacity="0.98">
              <animate attributeName="r" to="50" begin="3.5s" dur="3s" fill="freeze" />
            </circle>
            <circle cx="550" cy="360" r="0" fill="#050505" opacity="0.96">
              <animate attributeName="r" to="30" begin="4s" dur="3s" fill="freeze" />
            </circle>
          </g>
        </g>

        <g opacity="0.12">
          <text x="820" y="40" fontFamily="Arial" fontSize="20" fill="#92400e">
            O₂
            <animate attributeName="y" values="40;48;40" dur="6s" repeatCount="indefinite" />
          </text>
        </g>
        <g opacity="0.1">
          <text x="100" y="580" fontFamily="Arial" fontSize="18" fill="#92400e">
            H₂O
            <animate
              attributeName="opacity"
              values="0.1;0.2;0.1"
              dur="4s"
              repeatCount="indefinite"
            />
          </text>
        </g>
        <g opacity="0.1">
          <text x="810" y="560" fontFamily="Arial" fontSize="16" fill="#92400e">
            CO₂
            <animate
              attributeName="opacity"
              values="0.1;0.18;0.1"
              dur="5s"
              repeatCount="indefinite"
            />
          </text>
        </g>
      </svg>

      <div className={styles.glassCard}>
        <h1 className={styles.title}>
          香蕉变黑
          <span className={styles.titleIcon}>🍌</span>
        </h1>
        <p className={styles.contentText}>
          香蕉是世界上产量最多的水果之一，其味道甜美，深受大众喜爱。
          <span className={styles.highlight}>小明</span>
          一家也不例外，日常采购清单里总少不了它。但小明发现最近买来的香蕉很快就坏了，这是怎么回事呢？
        </p>
        <p className={styles.contentText}>请你和他一起探索吧！</p>
      </div>

    </div>
  );
};

export default Page02BananaBrowning;
