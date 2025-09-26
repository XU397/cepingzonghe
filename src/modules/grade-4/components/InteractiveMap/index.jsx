/**
 * @file InteractiveMap.jsx
 * @description SVG动画地图组件 (UX Expert Sally v3 - 精准定位最终版)
 */

import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import './InteractiveMap.css';

const InteractiveMap = ({ activeRoute, nodes, segments, routeData, onPathClick, isCompact = false }) => {
  const [animationState, setAnimationState] = useState('idle');
  
  useEffect(() => {
    if (activeRoute) {
      setAnimationState('highlighting');
      const timer = setTimeout(() => {
        setAnimationState('highlighted');
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setAnimationState('idle');
    }
  }, [activeRoute]);
  
  const currentRouteConfig = useMemo(() => {
    return activeRoute ? routeData[activeRoute] : null;
  }, [activeRoute, routeData]);
  
  const renderPathSegment = (segment, isHighlighted = false) => {
    const fromPoint = nodes[segment.from];
    const toPoint = nodes[segment.to];
    
    if (!fromPoint || !toPoint) return null;
    
    const midX = (fromPoint.x + toPoint.x) / 2;
    const midY = (fromPoint.y + toPoint.y) / 2;
    const pathId = segment.id;
    const strokeColor = isHighlighted ? currentRouteConfig?.color : '#ddd';
    const strokeWidth = isHighlighted ? 6 : 2;
    const opacity = animationState === 'highlighting' && isHighlighted ? 0.7 : 1;
    
    return (
      <g key={pathId}>
        <line
          x1={fromPoint.x}
          y1={fromPoint.y}
          x2={toPoint.x}
          y2={toPoint.y}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          opacity={opacity}
          className={isHighlighted ? 'route-segment highlighted' : 'route-segment'}
          onClick={() => onPathClick && onPathClick(pathId)}
        />
        {isHighlighted && animationState === 'highlighted' && currentRouteConfig && (
           (() => {
             const label = currentRouteConfig.labels?.find(l => l.segment === pathId);
             if (!label || !label.text.trim()) return null;

             // [UX修改-V3] 使用新的offset属性进行精确定位
             const offsetX = label.offset?.x || 0;
             const offsetY = label.offset?.y || -6; // 保留默认向上偏移

             return (
               <text
                 x={midX + offsetX}
                 y={midY + offsetY}
                 textAnchor="middle"
                 className="distance-label animated"
                 fill="#333"
                 fontSize="11"
                 fontWeight="bold"
                 stroke="white"
                 strokeWidth="0.4px"
                 paintOrder="stroke"
               >
                 {label.text}
               </text>
             );
           })()
         )}
      </g>
    );
  };
  
  const renderStationMarker = (key, point) => {
    const isStation = point.style === 'station';
    const isHome = point.style === 'home';
    const radius = isStation || isHome ? 8 : 4;
    const fill = isStation ? '#ff6b6b' : isHome ? '#4ecdc4' : '#999';
    
    // [UX修改-V3] 特殊处理南充站(NC_STATION)的标签位置
    const yOffset = key === 'NC_STATION' ? 20 : -15;
    
    return (
      <g key={key}>
        <circle
          cx={point.x}
          cy={point.y}
          r={radius}
          fill={fill}
          stroke="white"
          strokeWidth="2"
          className="station-marker"
        />
        {point.name && point.style !== 'junction' && (
          <text
            x={point.x}
            y={point.y + yOffset} // 应用计算后的Y轴偏移
            textAnchor="middle"
            className="station-label"
            fontSize="12"
            fontWeight="bold"
            fill="#333"
          >
            {point.name}
          </text>
        )}
      </g>
    );
  };
  
  return (
    <div className={`interactive-map ${isCompact ? 'compact' : ''}`}>
     <svg className="map-svg" viewBox="0 0 300 200" preserveAspectRatio="xMidYMid meet">
        <g className="background-network">
          {segments.map(segment => 
            renderPathSegment(segment, false)
          )}
        </g>
        
         {currentRouteConfig && (
           <g className="highlighted-route">
             {currentRouteConfig.paths.map(pathId => {
               const segment = segments.find(s => s.id === pathId);
               return segment ? renderPathSegment(segment, true) : null;
             })}
           </g>
         )}
        
        <g className="network-nodes">
          {Object.entries(nodes).map(([key, point]) => 
            renderStationMarker(key, point)
          )}
        </g>
      </svg>
    </div>
  );
};

InteractiveMap.propTypes = {
  activeRoute: PropTypes.number,
  nodes: PropTypes.object.isRequired,
  segments: PropTypes.array.isRequired,
  routeData: PropTypes.object.isRequired,
  onPathClick: PropTypes.func.isRequired,
  isCompact: PropTypes.bool
};

InteractiveMap.defaultProps = {
  activeRoute: null,
  isCompact: false
};

export default InteractiveMap;