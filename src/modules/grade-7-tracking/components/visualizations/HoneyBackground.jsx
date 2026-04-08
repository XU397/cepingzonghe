const HoneyBackground = () => {
  return (
    <svg
      viewBox="0 0 960 640"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 25%, #fbbf24 50%, #d97706 100%)',
      }}
    >
      <defs>
        <linearGradient id="honeyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#fbbf24', stopOpacity: 0.9 }} />
          <stop offset="50%" style={{ stopColor: '#f59e0b', stopOpacity: 0.95 }} />
          <stop offset="100%" style={{ stopColor: '#d97706', stopOpacity: 1 }} />
        </linearGradient>

        <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'rgba(255,255,255,0.4)' }} />
          <stop offset="100%" style={{ stopColor: 'rgba(255,255,255,0.1)' }} />
        </linearGradient>

        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#fde68a' }} />
          <stop offset="50%" style={{ stopColor: '#fbbf24' }} />
          <stop offset="100%" style={{ stopColor: '#f59e0b' }} />
        </linearGradient>

        <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
          <feOffset dx="1" dy="2" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 左上角：温度计 */}
      <g transform="translate(50, 30) scale(1.8)" filter="url(#dropShadow)">
        <rect
          x="0"
          y="0"
          width="22"
          height="120"
          rx="11"
          fill="url(#glassGradient)"
          stroke="#92400e"
          strokeWidth="1.5"
        />
        <g stroke="#92400e" strokeWidth="1" opacity="0.5">
          <line x1="5" y1="12" x2="17" y2="12" />
          <line x1="5" y1="24" x2="17" y2="24" />
          <line x1="5" y1="36" x2="13" y2="36" />
          <line x1="5" y1="48" x2="17" y2="48" />
          <line x1="5" y1="60" x2="13" y2="60" />
          <line x1="5" y1="72" x2="17" y2="72" />
          <line x1="5" y1="84" x2="13" y2="84" />
        </g>
        <rect x="8" y="35" width="6" height="65" rx="3" fill="#dc2626">
          <animate
            attributeName="height"
            values="55;62;58;65;52;60"
            dur="4s"
            repeatCount="indefinite"
          />
          <animate attributeName="y" values="45;35;40;30;48;38" dur="4s" repeatCount="indefinite" />
        </rect>
        <circle cx="11" cy="105" r="7" fill="#dc2626" />
      </g>

      {/* 左下角：锥形瓶 */}
      <g transform="translate(60, 400) scale(1.6)" filter="url(#dropShadow)">
        <path
          d="M 0,0 L 28,0 L 38,50 L 38,68 L -10,68 L -10,50 Z"
          fill="url(#glassGradient)"
          stroke="#92400e"
          strokeWidth="1.5"
          transform="translate(0, -68)"
        />
        <path
          d="M -7,50 L 35,50 L 33,63 L -3,63 Z"
          fill="url(#honeyGradient)"
          opacity="0.8"
          transform="translate(0, -68)"
        >
          <animate
            attributeName="d"
            values="M -7,50 L 35,50 L 33,63 L -3,63 Z;M -7,50 L 35,50 L 34,63 L -4,63 Z;M -7,50 L 35,50 L 33,63 L -3,63 Z"
            dur="3s"
            repeatCount="indefinite"
          />
        </path>
        <circle cx="11" cy="-6" r="2" fill="#fbbf24" opacity="0.8">
          <animate attributeName="cy" values="18;-18" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* 中下方：蜂蜜罐 */}
      <g transform="translate(480, 570) scale(1.5)" filter="url(#dropShadow)">
        <rect
          x="-30"
          y="-42"
          width="60"
          height="72"
          rx="8"
          fill="url(#glassGradient)"
          stroke="#92400e"
          strokeWidth="1.5"
        />
        <rect x="-24" y="-36" width="48" height="60" rx="6" fill="url(#honeyGradient)" />
        <rect x="-18" y="-32" width="8" height="38" rx="4" fill="white" opacity="0.3" />
        <rect x="-34" y="-46" width="68" height="14" rx="3" fill="#78350f" />
        <rect x="-30" y="-44" width="60" height="8" rx="2" fill="#92400e" />
      </g>

      {/* 右上角：天平 */}
      <g transform="translate(820, 60) scale(1.5)" filter="url(#dropShadow)">
        <rect x="-3" y="0" width="6" height="80" fill="#78350f" />
        <rect x="-9" y="80" width="18" height="7" rx="2" fill="#92400e" />
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="-2 0 7; 2 0 7; -2 0 7"
            dur="5s"
            repeatCount="indefinite"
          />
          <rect
            x="-45"
            y="5"
            width="90"
            height="4"
            rx="2"
            fill="#f59e0b"
            stroke="#92400e"
            strokeWidth="1"
          />
          <circle cx="0" cy="8" r="3" fill="#dc2626" />
          <line x1="-38" y1="8" x2="-38" y2="32" stroke="#92400e" strokeWidth="1" />
          <ellipse
            cx="-38"
            cy="35"
            rx="15"
            ry="3"
            fill="url(#goldGradient)"
            stroke="#92400e"
            strokeWidth="1"
          />
          <line x1="38" y1="8" x2="38" y2="32" stroke="#92400e" strokeWidth="1" />
          <ellipse
            cx="38"
            cy="35"
            rx="15"
            ry="3"
            fill="url(#goldGradient)"
            stroke="#92400e"
            strokeWidth="1"
          />
        </g>
      </g>

      {/* 右下角：烧杯 */}
      <g transform="translate(830, 400) scale(1.8)" filter="url(#dropShadow)">
        <path
          d="M -18,-30 L 18,-30 L 15,16 L -15,16 Z"
          fill="url(#glassGradient)"
          stroke="#92400e"
          strokeWidth="1.5"
        />
        <ellipse cx="0" cy="-30" rx="18" ry="3" fill="none" stroke="#92400e" strokeWidth="1.5" />
        <ellipse cx="0" cy="-30" rx="14" ry="2" fill="rgba(255,255,255,0.3)" />
        <path d="M -12,-6 L 12,-6 L 11,13 L -11,13 Z" fill="url(#honeyGradient)" opacity="0.85">
          <animate
            attributeName="d"
            values="M -12,-6 L 12,-6 L 11,13 L -11,13 Z;M -12,-6 L 12,-6 L 12,13 L -10,13 Z;M -12,-6 L 12,-6 L 11,13 L -11,13 Z"
            dur="4s"
            repeatCount="indefinite"
          />
        </path>
        <line x1="-10" y1="-2" x2="-5" y2="-2" stroke="white" strokeWidth="1" opacity="0.6" />
        <line x1="-10" y1="5" x2="-5" y2="5" stroke="white" strokeWidth="1" opacity="0.6" />
      </g>

      {/* 左下角花朵 */}
      <g transform="translate(25, 560)">
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0; 4; 0"
            dur="4s"
            repeatCount="indefinite"
          />
          <ellipse cx="0" cy="-8" rx="4" ry="8" fill="#f59e0b" opacity="0.7" />
          <ellipse
            cx="7"
            cy="-4"
            rx="4"
            ry="8"
            fill="#fbbf24"
            opacity="0.7"
            transform="rotate(60)"
          />
          <ellipse
            cx="7"
            cy="4"
            rx="4"
            ry="8"
            fill="#f59e0b"
            opacity="0.7"
            transform="rotate(120)"
          />
          <ellipse
            cx="0"
            cy="8"
            rx="4"
            ry="8"
            fill="#fbbf24"
            opacity="0.7"
            transform="rotate(180)"
          />
          <ellipse
            cx="-7"
            cy="4"
            rx="4"
            ry="8"
            fill="#f59e0b"
            opacity="0.7"
            transform="rotate(240)"
          />
          <ellipse
            cx="-7"
            cy="-4"
            rx="4"
            ry="8"
            fill="#fbbf24"
            opacity="0.7"
            transform="rotate(300)"
          />
          <circle cx="0" cy="0" r="4" fill="#92400e" />
        </g>
      </g>

      {/* 右下角花朵 */}
      <g transform="translate(920, 580)">
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0; -3; 0"
            dur="5s"
            repeatCount="indefinite"
          />
          <ellipse cx="0" cy="-6" rx="3" ry="6" fill="#fbbf24" opacity="0.6" />
          <ellipse
            cx="5"
            cy="-3"
            rx="3"
            ry="6"
            fill="#f59e0b"
            opacity="0.6"
            transform="rotate(60)"
          />
          <ellipse
            cx="5"
            cy="3"
            rx="3"
            ry="6"
            fill="#fbbf24"
            opacity="0.6"
            transform="rotate(120)"
          />
          <ellipse
            cx="0"
            cy="6"
            rx="3"
            ry="6"
            fill="#f59e0b"
            opacity="0.6"
            transform="rotate(180)"
          />
          <ellipse
            cx="-5"
            cy="3"
            rx="3"
            ry="6"
            fill="#fbbf24"
            opacity="0.6"
            transform="rotate(240)"
          />
          <ellipse
            cx="-5"
            cy="-3"
            rx="3"
            ry="6"
            fill="#f59e0b"
            opacity="0.6"
            transform="rotate(300)"
          />
          <circle cx="0" cy="0" r="3" fill="#78350f" />
        </g>
      </g>

      {/* 左上角分子符号 */}
      <g opacity="0.25">
        <text x="80" y="40" fontFamily="Arial" fontSize="24" fill="#92400e">
          H₂O
          <animate attributeName="y" values="40;32;40" dur="5s" repeatCount="indefinite" />
        </text>
      </g>

      {/* 右上角分子符号 */}
      <g opacity="0.25">
        <text x="800" y="30" fontFamily="Arial" fontSize="24" fill="#92400e">
          C₆H₁₂O₆
          <animate attributeName="y" values="30;38;30" dur="6s" repeatCount="indefinite" />
        </text>
      </g>

      {/* 右下角分子符号 */}
      <g opacity="0.2">
        <text x="810" y="600" fontFamily="Arial" fontSize="20" fill="#92400e">
          H₂O
          <animate
            attributeName="opacity"
            values="0.2;0.35;0.2"
            dur="4s"
            repeatCount="indefinite"
          />
        </text>
      </g>

      {/* 左下角分子符号 */}
      <g opacity="0.2">
        <text x="100" y="500" fontFamily="Arial" fontSize="28" fill="#92400e">
          O₂
          <animate attributeName="opacity" values="0.2;0.3;0.2" dur="5s" repeatCount="indefinite" />
        </text>
      </g>
    </svg>
  );
};

export default HoneyBackground;
