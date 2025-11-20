import React from 'react';

// 风速仪颜色配置 - 使用文档中的标准颜色
const COLORS = {
  panelSurface: '#2c5282',    // 光伏板深蓝
  panelFrame: '#4a5568',      // 支架深灰
  poleColor: '#cbd5e0',       // 立柱银白色
  poleShadow: '#a0aec0',      // 立柱阴影
};

interface WindSpeedometerProps {
  /** X位置 */
  x: number;
  /** 风速 (影响转速) */
  speed: number;
  /** 是否旋转 */
  isSpinning: boolean;
  /** 高度百分比 (0-100) */
  heightPercent: number;
  /** 是否显示光伏板 */
  showPanel?: boolean;
  /** SVG尺寸 */
  size?: { width: number; height: number };
}

/**
 * 透视三杯风速仪组件 - 基于文档中的PerspectiveCupAnemometer
 * 采用文档中的精确设计和合理转速
 */
const WindSpeedometer: React.FC<WindSpeedometerProps> = ({
  x,
  speed,
  isSpinning,
  heightPercent,
  showPanel = false,
  size = { width: 200, height: 300 }
}) => {
  // [关键修改] 转速计算公式优化：平方反比
  // 使用平方 (speed * speed) 来放大差异。
  // 系数设为 4.5
  // 1.66 m/s -> 4.5 / 2.75 ≈ 1.63s / 圈 (很慢，肉眼可见的慢)
  // 2.09 m/s -> 4.5 / 4.36 ≈ 1.03s / 圈 (中等)
  // 2.77 m/s -> 4.5 / 7.67 ≈ 0.58s / 圈 (飞快)
  // 差异从之前的 0.4s 扩大到了 >1.0s，对比极其明显。
  const spinDuration = speed > 0 ? `${4.5 / (speed * speed)}s` : '0s';
  const groundY = 280; 
  
  // [关键调整] 安全像素移动范围 - 与文档保持一致
  // 0cm (最低点 - 收纳状态): 设为 Y=265 (紧贴底座上方)
  const yFor0cm = 265; 
  // 100cm (最高点): 设为 Y=150 (最高工作位)
  const yFor100cm = 150;

  // 线性插值计算当前高度对应的像素 Y 值
  // heightPercent 现在是从 0 到 100
  const headY = yFor0cm - (heightPercent / 100) * (yFor0cm - yFor100cm);

  return (
    <g transform={`translate(${x}, 0)`}>
      
      {/* A. 光伏板背景 (仅左侧显示) */}
      {showPanel && (
        <g>
           {/* 支架腿 */}
           <line x1="-70" y1="100" x2="-70" y2={groundY} stroke={COLORS.panelFrame} strokeWidth="4" opacity="0.8" />
           <line x1="70" y1="100" x2="70" y2={groundY} stroke={COLORS.panelFrame} strokeWidth="4" opacity="0.8" />
           {/* 板面 */}
           <g transform="translate(0, 60)">
              <path d="M -85 0 L 85 0 L 95 30 L -95 30 Z" fill={COLORS.panelSurface} />
              <rect x="-90" y="5" width="180" height="2" fill="rgba(255,255,255,0.2)" />
              <line x1="-45" y1="0" x2="-50" y2="30" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
              <line x1="45" y1="0" x2="50" y2="30" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
           </g>
        </g>
      )}

      {/* B. 地面底座 (固定) */}
      <g transform={`translate(0, ${groundY})`}>
        <path d="M -20 0 L 20 0 L 24 6 L -24 6 Z" fill="#000" />
        <rect x="-14" y="-10" width="28" height="10" fill="#1a202c" rx="2" />
      </g>

      {/* C. 运动主体 (头部 + 杆子) */}
      <g transform={`translate(0, ${headY})`} style={{ transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
        
        {/* 1. 银色杆子 (向下延伸) */}
        <rect x="-5" y="0" width="10" height="200" fill={COLORS.poleColor} rx="1" />
        {/* 杆子右侧阴影 */}
        <rect x="2" y="0" width="3" height="200" fill={COLORS.poleShadow} opacity="0.3" />
        
        {/* 杆身刻度 */}
        <line x1="-5" y1="50" x2="5" y2="50" stroke="#fff" strokeWidth="1" opacity="0.5" />
        <line x1="-5" y1="100" x2="5" y2="100" stroke="#fff" strokeWidth="1" opacity="0.5" />

        {/* 2. 头部连接块 (黑色) */}
        <rect x="-8" y="-15" width="16" height="25" fill="#1a202c" rx="2" />
        <rect x="-9" y="-8" width="18" height="4" fill="#2d3748" /> {/* 装饰环 */}

        {/* 3. 透视旋转风杯组 (横向旋转) */}
        <g transform="translate(0, -15)">
          {/* 透视变换容器：将垂直旋转压扁成水平椭圆轨迹 */}
          <g transform="scale(1, 0.25)"> 
            <g style={{ 
              animation: isSpinning ? `spin ${spinDuration} linear infinite` : 'none',
            }}>
              {[0, 120, 240].map((angle) => (
                <g key={angle} transform={`rotate(${angle})`}>
                  <line x1="0" y1="0" x2="60" y2="0" stroke="#1a202c" strokeWidth="4" strokeLinecap="round" />
                  <g transform="translate(60, 0)">
                    <circle cx="0" cy="0" r="12" fill="#000" />
                    <path d="M -5 -5 Q 0 0 -5 5" stroke="#333" strokeWidth="2" fill="none" />
                  </g>
                </g>
              ))}
              <circle cx="0" cy="0" r="8" fill="#2d3748" stroke="#000" strokeWidth="2" />
            </g>
          </g>
        </g>

      </g>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </g>
  );
};

export default WindSpeedometer;