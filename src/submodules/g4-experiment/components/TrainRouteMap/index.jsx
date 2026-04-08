import { useEffect, useMemo, useState } from 'react';
import { ROUTES, STATIONS, BASE_LINES } from '../../constants/routeData';
import styles from './TrainRouteMap.module.css';

const TrainIcon = ({ size = 24 }) => (
  <svg
    aria-hidden="true"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <title>火车</title>
    <rect x="4" y="6" width="16" height="12" rx="2" />
    <path d="M4 11h16" />
    <path d="M12 6v5" />
    <circle cx="9" cy="16" r="1" />
    <circle cx="15" cy="16" r="1" />
  </svg>
);

const HomeIcon = ({ size = 24 }) => (
  <svg
    aria-hidden="true"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <title>家</title>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const MapPinIcon = ({ size = 24 }) => (
  <svg
    aria-hidden="true"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <title>站点</title>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

function getStationPos(id) {
  const s = STATIONS.find(station => station.id === id);
  return s ? { x: s.x, y: s.y } : { x: 0, y: 0 };
}

function TrainRouteMap({
  selectedRouteId,
  onRouteSelect,
  route1Value,
  route5Value,
  onInputChange,
  tablePlacement = 'overlay',
  readOnlyTable = false,
  compact = false,
}) {
  const [trainProgress, setTrainProgress] = useState(0);

  const activeRoute = useMemo(() => {
    const found = ROUTES.find(route => route.id === selectedRouteId);
    return found || ROUTES[0];
  }, [selectedRouteId]);

  useEffect(() => {
    if (selectedRouteId) {
      setTrainProgress(0);
    }
  }, [selectedRouteId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTrainProgress(prev => {
        if (prev >= 100) return 0;
        return prev + 0.3;
      });
    }, 20);
    return () => clearInterval(interval);
  }, []);

  const activePathPoints = useMemo(() => {
    if (!activeRoute?.path) return [];
    return activeRoute.path.map(id => getStationPos(id));
  }, [activeRoute]);

  const getTrainPosition = progress => {
    if (activePathPoints.length < 2) {
      return activePathPoints[0] || { x: 0, y: 0 };
    }

    const totalSegments = activePathPoints.length - 1;
    const segmentSize = 100 / totalSegments;
    const currentSegmentIndex = Math.min(Math.floor(progress / segmentSize), totalSegments - 1);
    const segmentPercent = (progress - currentSegmentIndex * segmentSize) / segmentSize;
    const p1 = activePathPoints[currentSegmentIndex];
    const p2 = activePathPoints[currentSegmentIndex + 1];

    return {
      x: p1.x + (p2.x - p1.x) * segmentPercent,
      y: p1.y + (p2.y - p1.y) * segmentPercent,
    };
  };

  const trainPos = getTrainPosition(trainProgress);
  const activeColor = activeRoute?.color || '#3B82F6';

  const isLineActive = (fromId, toId) => {
    if (!activeRoute?.path) return false;
    const path = activeRoute.path;
    for (let i = 0; i < path.length - 1; i++) {
      if (
        (path[i] === fromId && path[i + 1] === toId) ||
        (path[i] === toId && path[i + 1] === fromId)
      ) {
        return true;
      }
    }
    return false;
  };

  const distanceLabels = useMemo(() => {
    if (!activeRoute?.path || !activeRoute?.segments) return [];
    const labels = [];
    for (let i = 0; i < activeRoute.path.length - 1; i++) {
      const startPos = getStationPos(activeRoute.path[i]);
      const endPos = getStationPos(activeRoute.path[i + 1]);
      const midX = (startPos.x + endPos.x) / 2;
      const midY = (startPos.y + endPos.y) / 2;
      labels.push({
        id: `dist-${i}`,
        x: midX,
        y: midY,
        distance: activeRoute.segments[i],
      });
    }
    return labels;
  }, [activeRoute]);

  const handleRouteClick = routeId => {
    if (typeof onRouteSelect === 'function') {
      onRouteSelect(routeId);
    }
  };

  const handleInput = (routeId, event) => {
    if (typeof onInputChange === 'function') {
      onInputChange(routeId, event);
    }
  };

  const renderTable = className => (
    <div className={className}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>路线</th>
            <th>路程(km)</th>
          </tr>
        </thead>
        <tbody>
          {ROUTES.map(route => {
            const isRoute1 = route.id === 1;
            const isRoute5 = route.id === 5;
            const isEditable = route.isEditable && !readOnlyTable;
            const value = isRoute1 ? route1Value : isRoute5 ? route5Value : '';
            const isActive = selectedRouteId === route.id;

            return (
              <tr key={route.id} className={isActive ? styles.activeRow : ''}>
                <td className={styles.routeCell}>路线{route.id}</td>
                <td>
                  {isEditable ? (
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={value}
                      onChange={e => handleInput(isRoute1 ? 'route1' : 'route5', e)}
                      placeholder="请输入"
                      className={styles.tableInput}
                    />
                  ) : (
                    <span className={styles.readonlyValue}>{route.totalDistance}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!readOnlyTable && <div className={styles.tableTip}>路线1和路线5需填写</div>}
    </div>
  );

  const containerClassName = `${styles.container} ${compact ? styles.compact : ''}`;

  return (
    <div className={containerClassName}>
      {tablePlacement === 'top' && renderTable(styles.tableTop)}

      <div className={styles.mapArea}>
        <div className={styles.routeButtonsOverlay}>
          <div className={styles.routeButtons}>
            {ROUTES.map(route => {
              const isActive = activeRoute?.id === route.id;
              return (
                <button
                  key={route.id}
                  type="button"
                  onClick={() => handleRouteClick(route.id)}
                  className={`${styles.routeButton} ${isActive ? styles.active : ''}`}
                  style={{
                    backgroundColor: isActive ? route.color : '#F1F5F9',
                    color: isActive ? 'white' : '#64748B',
                  }}
                >
                  <span className={styles.routeNumber}>{route.id}</span>
                  <span className={styles.routeName}>路线</span>
                </button>
              );
            })}
          </div>
        </div>

        <svg
          aria-label="路线地图"
          className={styles.mapSvg}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <title>路线地图</title>
          {BASE_LINES.map((line, idx) => {
            const s = getStationPos(line.from);
            const e = getStationPos(line.to);
            const active = isLineActive(line.from, line.to);
            const lineKey = `${line.from}-${line.to}-${idx}`;

            return (
              <g key={lineKey}>
                <line
                  x1={`${s.x}%`}
                  y1={`${s.y}%`}
                  x2={`${e.x}%`}
                  y2={`${e.y}%`}
                  stroke={active ? activeColor : '#E2E8F0'}
                  strokeWidth="1"
                  strokeLinecap="round"
                  className={styles.trackLine}
                />
              </g>
            );
          })}
        </svg>

        {distanceLabels.map(label => (
          <div
            key={label.id}
            className={styles.distanceLabel}
            style={{ left: `${label.x}%`, top: `${label.y}%` }}
          >
            <span style={{ color: activeColor, borderColor: activeColor }}>{label.distance}km</span>
          </div>
        ))}

        {STATIONS.map(station => {
          const isActive = activeRoute?.path?.includes(station.id);
          const isTerminal = station.id === 'nanchong_north' || station.id === 'nanchong';
          const showLabel = station.isCore;

          return (
            <div
              key={station.id}
              className={`${styles.station} ${isActive ? styles.stationActive : ''}`}
              style={{ left: `${station.x}%`, top: `${station.y}%` }}
            >
              <div
                className={`${styles.stationDot} ${showLabel ? styles.stationLarge : ''}`}
                style={{ borderColor: isActive ? activeColor : '#CBD5E1' }}
              >
                {station.id === 'xiaoming' && <HomeIcon size={22} className={styles.stationIcon} />}
                {isTerminal && <MapPinIcon size={22} className={styles.stationIcon} />}
                {!showLabel && isActive && (
                  <div className={styles.stationInner} style={{ backgroundColor: activeColor }} />
                )}
              </div>
              {showLabel && (
                <div
                  className={`${styles.stationLabel} ${isActive ? styles.labelActive : ''}`}
                  style={{ borderColor: isActive ? activeColor : '#E2E8F0' }}
                >
                  {station.name}
                </div>
              )}
            </div>
          );
        })}

        <div className={styles.train} style={{ left: `${trainPos.x}%`, top: `${trainPos.y}%` }}>
          <div className={styles.trainBody} style={{ backgroundColor: activeColor }}>
            <TrainIcon size={16} />
          </div>
        </div>

        {tablePlacement === 'overlay' && renderTable(styles.tableOverlay)}
      </div>
    </div>
  );
}

export default TrainRouteMap;
