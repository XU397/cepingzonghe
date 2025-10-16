/**
 * BallDropAnimation - 小球下落动画组件
 *
 * 功能:
 * - 使用CSS3 @keyframes实现小球从量筒顶部匀速下落到底部的动画
 * - 动态时长:根据计算出的下落时间(fallTime)调整动画持续时间
 * - 降级方案:浏览器不支持CSS动画时显示静态图片和文字说明
 * - 动画结束时触发回调(onAnimationEnd)
 *
 * T041 - BallDropAnimation组件
 * T095 - 实现小球动画降级方案
 */

import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import styles from '../../styles/BallDropAnimation.module.css';

const BallDropAnimation = ({
  fallTime,
  isAnimating,
  onAnimationEnd,
  beakerHeight = 300,
  ballSize = 20
}) => {
  const [animationKey, setAnimationKey] = useState(0);
  const [supportsAnimation, setSupportsAnimation] = useState(true);
  const ballRef = useRef(null);

  // 检测CSS动画支持
  useEffect(() => {
    const checkAnimationSupport = () => {
      // 方法1: 使用CSS.supports API (现代浏览器)
      if (typeof window !== 'undefined' && window.CSS && typeof window.CSS.supports === 'function') {
        const hasAnimation = window.CSS.supports('animation', 'test 1s');
        console.log('[BallDropAnimation] CSS.supports检测动画支持:', hasAnimation);
        return hasAnimation;
      }

      // 方法2: 特性检测 (降级方案)
      const testElement = document.createElement('div');
      const animationProps = [
        'animation',
        'webkitAnimation',
        'MozAnimation',
        'OAnimation',
        'msAnimation'
      ];

      const hasSupport = animationProps.some(prop => {
        return typeof testElement.style[prop] !== 'undefined';
      });

      console.log('[BallDropAnimation] 特性检测动画支持:', hasSupport);
      return hasSupport;
    };

    const supported = checkAnimationSupport();
    setSupportsAnimation(supported);

    if (!supported) {
      console.warn('[BallDropAnimation] ⚠️ 浏览器不支持CSS动画，使用降级方案');
    }
  }, []);

  // 启动动画时重置key以强制重新渲染
  useEffect(() => {
    if (isAnimating) {
      setAnimationKey((prev) => prev + 1);
    }
  }, [isAnimating]);

  // 监听动画结束事件
  const handleAnimationEnd = (event) => {
    if (event.animationName === styles.ballFall || event.animationName.includes('ballFall')) {
      console.log('[BallDropAnimation] 动画结束');
      if (onAnimationEnd) {
        onAnimationEnd();
      }
    }
  };

  // 降级方案:不支持CSS动画
  if (!supportsAnimation) {
    return (
      <div className={styles.fallbackContainer}>
        <div className={styles.fallbackBeaker}>
          <div
            className={styles.fallbackBall}
            style={{
              bottom: isAnimating ? '10px' : `${beakerHeight - 30}px`,
              transition: isAnimating ? 'none' : 'bottom 0.3s ease'
            }}
          />
        </div>
        <div className={styles.fallbackText}>
          {isAnimating ? (
            <>
              实验进行中...
              <br />
              小球下落时间: {fallTime.toFixed(2)} 秒
              <br />
              (您的浏览器不支持动画效果)
            </>
          ) : (
            <>
              准备就绪
              <br />
              点击&quot;开始实验&quot;开始测试
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div
        className={styles.beakerContainer}
        style={{ height: `${beakerHeight}px` }}
        aria-label="量筒实验区域"
      >
        {/* 量筒外框(装饰性) */}
        <div className={styles.beakerWalls}>
          <div className={styles.leftWall} />
          <div className={styles.rightWall} />
        </div>

        {/* 下落的小球 */}
        {isAnimating && (
          <div
            key={animationKey}
            ref={ballRef}
            className={styles.ball}
            style={{
              width: `${ballSize}px`,
              height: `${ballSize}px`,
              animation: `${styles.ballFall} ${fallTime}s linear forwards`,
              '--fall-distance': `${beakerHeight - ballSize - 20}px`
            }}
            onAnimationEnd={handleAnimationEnd}
            role="img"
            aria-label="下落的小钢球"
          />
        )}

        {/* 起始位置指示器(动画开始前显示) */}
        {!isAnimating && (
          <div
            className={styles.ballPlaceholder}
            style={{
              width: `${ballSize}px`,
              height: `${ballSize}px`
            }}
            aria-hidden="true"
          />
        )}

        {/* 底部刻度线 */}
        <div className={styles.bottomLine} aria-hidden="true" />
      </div>

      {/* 动画状态提示 */}
      <div className={styles.statusArea}>
        {isAnimating ? (
          <div className={styles.animatingHint} role="status" aria-live="polite">
            <span className={styles.spinner} />
            小球正在下落中...
          </div>
        ) : (
          <div className={styles.idleHint}>
            点击&quot;开始实验&quot;查看小球下落
          </div>
        )}
      </div>
    </div>
  );
};

BallDropAnimation.propTypes = {
  /** 小球下落时间(秒) */
  fallTime: PropTypes.number.isRequired,

  /** 是否正在播放动画 */
  isAnimating: PropTypes.bool.isRequired,

  /** 动画结束回调 */
  onAnimationEnd: PropTypes.func,

  /** 量筒高度(像素) */
  beakerHeight: PropTypes.number,

  /** 小球直径(像素) */
  ballSize: PropTypes.number
};

export default BallDropAnimation;
