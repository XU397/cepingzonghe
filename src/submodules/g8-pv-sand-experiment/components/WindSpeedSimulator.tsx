import React, { useEffect, useState, useRef } from 'react';
import { WindSpeedDataEntry } from '../types';
import styles from './WindSpeedSimulator.module.css';

interface WindSpeedSimulatorProps {
  height: 20 | 50 | 100;
  isAnimating: boolean;
  animationProgress: number; // 0-1
  windData: WindSpeedDataEntry;
}

interface WindParticle {
  id: number;
  x: number;
  y: number;
  speed: number;
  opacity: number;
  size: number;
}

// 设备性能检测
const detectDevicePerformance = (): 'high' | 'medium' | 'low' => {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  if (!gl) return 'low';
  
  const cores = navigator.hardwareConcurrency || 4;
  const memory = (navigator as any).deviceMemory || 4;
  
  if (cores >= 8 && memory >= 8) return 'high';
  if (cores >= 4 && memory >= 4) return 'medium';
  return 'low';
};

const WindSpeedSimulator: React.FC<WindSpeedSimulatorProps> = ({
  height,
  isAnimating,
  animationProgress,
  windData
}) => {
  const [particles, setParticles] = useState<WindParticle[]>([]);
  const [devicePerformance] = useState(() => detectDevicePerformance());
  const animationRef = useRef<number>();
  const lastUpdateTime = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 根据设备性能调整粒子数量
  const getParticleCount = () => {
    switch (devicePerformance) {
      case 'high': return 40;
      case 'medium': return 25;
      case 'low': return 15;
      default: return 25;
    }
  };

  // 初始化粒子
  const initializeParticles = (region: 'withPanel' | 'noPanel') => {
    const count = getParticleCount();
    const regionWidth = 180; // SVG中每个区域的宽度
    const offsetX = region === 'withPanel' ? 40 : 260;
    
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: offsetX + Math.random() * regionWidth,
      y: 50 + Math.random() * 200,
      speed: region === 'withPanel' ? windData.withPanel : windData.noPanel,
      opacity: 0.3 + Math.random() * 0.7,
      size: 2 + Math.random() * 3
    }));
  };

  // 更新粒子位置
  const updateParticles = (particles: WindParticle[], deltaTime: number, region: 'withPanel' | 'noPanel') => {
    const regionWidth = 180;
    const offsetX = region === 'withPanel' ? 40 : 260;
    const speed = region === 'withPanel' ? windData.withPanel : windData.noPanel;
    
    return particles.map(particle => {
      let newX = particle.x + speed * deltaTime * 0.02; // 调整速度系数
      
      // 粒子超出右边界时重新从左边开始
      if (newX > offsetX + regionWidth) {
        newX = offsetX;
      }
      
      return {
        ...particle,
        x: newX,
        speed: speed,
        // 添加轻微的垂直摆动
        y: particle.y + Math.sin(newX * 0.01) * 0.5
      };
    });
  };

  // 动画循环
  const animate = (currentTime: number) => {
    if (!isAnimating) return;
    
    const deltaTime = currentTime - lastUpdateTime.current;
    
    // 限制帧率到60FPS
    if (deltaTime >= 16.67) { // ~60FPS
      setParticles(prevParticles => {
        const withPanelParticles = prevParticles.slice(0, getParticleCount());
        const noPanelParticles = prevParticles.slice(getParticleCount());
        
        const updatedWithPanel = updateParticles(withPanelParticles, deltaTime, 'withPanel');
        const updatedNoPanel = updateParticles(noPanelParticles, deltaTime, 'noPanel');
        
        return [...updatedWithPanel, ...updatedNoPanel];
      });
      
      lastUpdateTime.current = currentTime;
    }
    
    animationRef.current = requestAnimationFrame(animate);
  };

  // 启动动画
  useEffect(() => {
    if (isAnimating) {
      const withPanelParticles = initializeParticles('withPanel');
      const noPanelParticles = initializeParticles('noPanel');
      setParticles([...withPanelParticles, ...noPanelParticles]);
      
      lastUpdateTime.current = performance.now();
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating, windData]);

  // 清理动画
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.heightIndicator}>
        <span className={styles.heightText}>测量高度: {height}cm</span>
      </div>
      
      <div className={styles.simulatorCanvas}>
        <svg 
          width="480" 
          height="320" 
          viewBox="0 0 480 320"
          className={styles.svg}
          style={{
            willChange: isAnimating ? 'transform' : 'auto',
            transform: 'translateZ(0)' // 启用硬件加速
          }}
        >
          {/* 背景网格 */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="480" height="320" fill="url(#grid)" />
          
          {/* 地面 */}
          <rect x="0" y="280" width="480" height="40" fill="#8b4513" />
          
          {/* 有光伏板区域 */}
          <g className={styles.withPanelRegion}>
            {/* 光伏板 */}
            <rect x="40" y="240" width="180" height="40" fill="#1e3a8a" rx="4" />
            <rect x="50" y="248" width="160" height="4" fill="#3b82f6" />
            <rect x="50" y="256" width="160" height="4" fill="#3b82f6" />
            <rect x="50" y="264" width="160" height="4" fill="#3b82f6" />
            
            {/* 区域标签 */}
            <text x="130" y="235" textAnchor="middle" className={styles.regionLabel}>
              有光伏板区域
            </text>
            
            {/* 风速数据显示 */}
            <text x="130" y="305" textAnchor="middle" className={styles.speedValue}>
              {windData.withPanel} m/s
            </text>
          </g>
          
          {/* 无光伏板区域 */}
          <g className={styles.noPanelRegion}>
            {/* 空旷地面 */}
            <rect x="260" y="240" width="180" height="40" fill="#22c55e" opacity="0.3" />
            
            {/* 区域标签 */}
            <text x="350" y="235" textAnchor="middle" className={styles.regionLabel}>
              无光伏板区域
            </text>
            
            {/* 风速数据显示 */}
            <text x="350" y="305" textAnchor="middle" className={styles.speedValue}>
              {windData.noPanel} m/s
            </text>
          </g>
          
          {/* 测量高度指示线 */}
          <line 
            x1="30" 
            y1={280 - height * 1.2} 
            x2="450" 
            y2={280 - height * 1.2} 
            stroke="#ef4444" 
            strokeWidth="2" 
            strokeDasharray="5,5"
          />
          <text 
            x="20" 
            y={280 - height * 1.2 - 5} 
            className={styles.heightMarker}
          >
            {height}cm
          </text>
          
          {/* 风向箭头 */}
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" 
              refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
            </marker>
          </defs>
          <line 
            x1="10" 
            y1={280 - height * 1.2} 
            x2="25" 
            y2={280 - height * 1.2} 
            stroke="#6b7280" 
            strokeWidth="2" 
            markerEnd="url(#arrowhead)"
          />
          
          {/* 风力粒子效果 */}
          {isAnimating && particles.map(particle => (
            <circle
              key={particle.id}
              cx={particle.x}
              cy={particle.y}
              r={particle.size}
              fill="#60a5fa"
              opacity={particle.opacity}
              style={{
                transform: 'translateZ(0)', // 硬件加速
                willChange: 'transform'
              }}
            />
          ))}
        </svg>
      </div>
      
      {/* 实验状态指示 */}
      <div className={styles.statusBar}>
        <div className={`${styles.statusDot} ${isAnimating ? styles.active : ''}`} />
        <span className={styles.statusText}>
          {isAnimating ? '实验进行中...' : '等待开始实验'}
        </span>
        
        {/* 性能指示 */}
        <span className={styles.performanceIndicator}>
          {devicePerformance === 'high' && '🚀'}
          {devicePerformance === 'medium' && '⚡'}
          {devicePerformance === 'low' && '🔋'}
        </span>
      </div>
    </div>
  );
};

export default WindSpeedSimulator;