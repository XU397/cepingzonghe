import { useMemo } from 'react';
import { ROUTES } from '../../constants/routeData';
import RouteButton from './RouteButton';
import styles from './MapInteractive.module.css';

const ROUTE_COLORS = {
  1: '#3b82f6',
  2: '#22c55e',
  3: '#f97316',
  4: '#a855f7',
  5: '#ef4444',
  default: 'var(--cartoon-primary)',
};

const ROUTE_PATHS = {
  1: 'M60 240 C200 210 300 170 440 140',
  2: 'M60 240 C200 260 320 230 440 210',
  3: 'M60 240 C190 200 290 230 440 260',
  4: 'M60 240 C200 250 300 250 440 230',
  5: 'M60 240 C180 215 300 185 440 170',
  default: 'M60 240 C190 210 300 190 440 180',
};

function MapInteractive({ routes = ROUTES, selectedRouteId, onRouteSelect }) {
  const routeList = Array.isArray(routes) && routes.length ? routes : ROUTES;

  const activeRoute = useMemo(() => {
    const found = routeList.find((route) => route.id === selectedRouteId);
    return found || routeList[0];
  }, [routeList, selectedRouteId]);

  const handleSelect = (routeId) => {
    if (typeof onRouteSelect === 'function') {
      onRouteSelect(routeId);
    }
  };

  const activeColor = ROUTE_COLORS[activeRoute?.id] || ROUTE_COLORS.default;
  const pathD = ROUTE_PATHS[activeRoute?.id] || ROUTE_PATHS.default;
  const segments = activeRoute?.segments || [];

  return (
    <div className={styles.container}>
      <div className={styles.routeButtons}>
        {routeList.map((route) => (
          <RouteButton
            key={route.id}
            routeId={route.id}
            label={`路线${route.id}`}
            isSelected={activeRoute?.id === route.id}
            onClick={handleSelect}
          />
        ))}
      </div>

      <div className={styles.mapCard}>
        <div className={styles.mapHeader}>
          <div>
            <div className={styles.mapTitle}>地图交互</div>
            <div className={styles.mapSubtitle}>
              从小明家前往 {activeRoute?.station} · 路线{activeRoute?.id}
            </div>
          </div>
          <div className={styles.distanceBadge}>总路程 {activeRoute?.totalDistance}km</div>
        </div>

        <div className={styles.canvasWrapper}>
          <svg
            className={styles.mapSvg}
            viewBox='0 0 520 320'
            preserveAspectRatio='xMidYMid meet'
            aria-label='路线预览'
          >
            <defs>
              <linearGradient id='routeGradient' x1='0%' y1='0%' x2='100%' y2='0%'>
                <stop offset='0%' stopColor={activeColor} stopOpacity='0.12' />
                <stop offset='100%' stopColor={activeColor} stopOpacity='0.4' />
              </linearGradient>
              <filter id='glow'>
                <feGaussianBlur stdDeviation='4' result='coloredBlur' />
                <feMerge>
                  <feMergeNode in='coloredBlur' />
                  <feMergeNode in='SourceGraphic' />
                </feMerge>
              </filter>
            </defs>
            <rect x='0' y='0' width='520' height='320' rx='14' className={styles.mapBackdrop} />
            <path
              d={pathD}
              fill='none'
              stroke='url(#routeGradient)'
              strokeWidth='14'
              strokeLinecap='round'
              filter='url(#glow)'
            />
            <path
              d={pathD}
              fill='none'
              stroke={activeColor}
              strokeWidth='4'
              strokeLinecap='round'
              strokeDasharray='8 6'
            />
          </svg>

          <div className={`${styles.marker} ${styles.home}`}>小明家</div>
          <div className={`${styles.marker} ${styles.northStation}`}>南充北站</div>
          <div className={`${styles.marker} ${styles.station}`}>南充站</div>
        </div>

        <div className={styles.segmentPanel}>
          {segments.length ? (
            segments.map((segment, index) => (
              <span key={`${segment}-${index}`} className={styles.segmentChip}>
                分段{index + 1}：{segment}
              </span>
            ))
          ) : (
            <span className={styles.segmentChip}>总路程：{activeRoute?.totalDistance}km</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default MapInteractive;
