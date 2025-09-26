/**
 * 路线分析页面 - 四年级火车购票测评
 * Story 2.4: 交互式地图与数据录入
 * 实现高度交互的地图页面，支持路线选择、地图高亮和里程计算
 */

import { useEffect, useState } from 'react';
import { useGrade4Context } from '../context/Grade4Context';
import AssessmentPageLayout from '../components/layout/AssessmentPageLayout';
import styles from './04-RouteAnalysisPage.module.css';
import InteractiveMap from '../components/InteractiveMap';

// 修正后的地图数据 - 唯一事实来源
// 1. 节点定义 (根据开发说明)
// 最终版节点坐标 v4 (架构师Winston - 基于文字描述重构)
const NODES = {
  NCN_STATION: { name: '南充北站', x: 40, y: 20, style: 'station' },
  XIAOMING_HOME: { name: '小明家', x: 140, y: 95, style: 'home' },
  NC_STATION: { name: '南充站', x: 270, y: 180, style: 'station' },
  J1: { name: 'J1', x: 110, y: 60, style: 'junction' },  // For Route 2
  J2: { name: 'J2', x: 170, y: 50, style: 'junction' },  // For Route 1
  J3: { name: 'J3', x: 180, y: 110, style: 'junction' }, // For Route 3
  J4: { name: 'J4', x: 200, y: 130, style: 'junction' }, // For Route 3, 4
  J5: { name: 'J5', x: 160, y: 140, style: 'junction' }, // For Route 4, 5
  J6: { name: 'J6', x: 190, y: 160, style: 'junction' }, // For Route 5
  J7: { name: 'J7', x: 230, y: 165, style: 'junction' }  // Final junction for Routes 3, 4, 5
};

// 2. 基础路径段定义 (灰色底图)
// 最终版基础路网 v4 (架构师Winston - 基于文字描述重构)
const BASE_SEGMENTS = [
  // Northern Routes
  { id: 'path_XMH_J2', from: 'XIAOMING_HOME', to: 'J2', routes: [1] },
  { id: 'path_J2_NCN', from: 'J2', to: 'NCN_STATION', routes: [1] },
  { id: 'path_XMH_J1', from: 'XIAOMING_HOME', to: 'J1', routes: [2] },
  { id: 'path_J1_NCN', from: 'J1', to: 'NCN_STATION', routes: [2] },

  // Southern Routes Segments
  { id: 'path_XMH_J3', from: 'XIAOMING_HOME', to: 'J3', routes: [3] },
  { id: 'path_J3_J4', from: 'J3', to: 'J4', routes: [3] },
  { id: 'path_XMH_J5', from: 'XIAOMING_HOME', to: 'J5', routes: [4, 5] },
  { id: 'path_J5_J4', from: 'J5', to: 'J4', routes: [4] },
  { id: 'path_J5_J6', from: 'J5', to: 'J6', routes: [5] },
  { id: 'path_J6_J7', from: 'J6', to: 'J7', routes: [5] },
  
  // Shared Southern Segments
  { id: 'path_J4_J7', from: 'J4', to: 'J7', routes: [3, 4] },
  { id: 'path_J7_NCS', from: 'J7', to: 'NC_STATION', routes: [3, 4, 5] }
];

// 3. 路线高亮与里程数据 (根据截图验证)
// 最终版路线数据 v7 (UX Expert Sally - 根据红线框终极定位)
const ROUTE_DATA = {
  1: {
    name: '路线1', totalDistance: 7.9, color: '#FFA500',
    paths: ['path_XMH_J2', 'path_J2_NCN'],
    labels: [
      // [Final Tweak] 最终根据红线框，将标签移动到路段右侧
      { segment: 'path_XMH_J2', text: '3.64km', offset: { x: 20, y: -8 } },
      // 保持不变
      { segment: 'path_J2_NCN', text: '4.26km', offset: { x: 0, y: -12 } }
    ]
  },
  2: { // 无改动
    name: '路线2', totalDistance: 8.65, color: '#FFD700',
    paths: ['path_XMH_J1', 'path_J1_NCN'],
    labels: [
      { segment: 'path_XMH_J1', text: '5.32km', offset: { x: -25, y: 15 } },
      { segment: 'path_J1_NCN', text: '3.33km', offset: { x: 25, y: -10 } }
    ]
  },
  3: { // 无改动
    name: '路线3', totalDistance: 10.2, color: '#90EE90',
    paths: ['path_XMH_J3', 'path_J3_J4', 'path_J4_J7', 'path_J7_NCS'],
    labels: [
      { segment: 'path_XMH_J3', text: '2.5km', offset: { x: 25, y: -3 } },
      { segment: 'path_J3_J4', text: '3km', offset: { x: 15, y: -10 } },
      { segment: 'path_J4_J7', text: '2.4km', offset: { x: 20, y: 5 } },
      { segment: 'path_J7_NCS', text: '2.3km', offset: { x: 15, y: -8 } }
    ]
  },
  4: {
    name: '路线4', totalDistance: 9.63, color: '#40E0D0',
    paths: ['path_XMH_J5', 'path_J5_J4', 'path_J4_J7', 'path_J7_NCS'],
    labels: [
      // [Final Tweak] 根据红线框，移动前两个标签到路段右下方
      { segment: 'path_XMH_J5', text: '2km', offset: { x: 10, y: 15 } },
      { segment: 'path_J5_J4', text: '2.93km', offset: { x: 15, y: 15 } },
      // 保持不变
      { segment: 'path_J4_J7', text: '2.4km', offset: { x: 28, y: 5 } }, 
      { segment: 'path_J7_NCS', text: '2.3km', offset: { x: 28, y: 0 } }
    ]
  },
  5: { // 无改动
    name: '路线5', totalDistance: 7.88, color: '#FFB6C1',
    paths: ['path_XMH_J5', 'path_J5_J6', 'path_J6_J7', 'path_J7_NCS'],
    labels: [
      { segment: 'path_XMH_J5', text: '2km', offset: { x: -2, y: 18 } },
      { segment: 'path_J5_J6', text: '2.09km', offset: { x: -25, y: 8 } },
      { segment: 'path_J6_J7', text: '1.49km', offset: { x: -25, y: 8 } },
      { segment: 'path_J7_NCS', text: '2.3km', offset: { x: -2, y: 18 } }
    ]
  }
};

const RouteAnalysisPage = () => {
  const { 
    logOperation, 
    collectAnswer,
    setNavigationStep,
    navigateToPage
  } = useGrade4Context();

  // 状态管理
  const [activeRoute, setActiveRoute] = useState(null);
  const [route1Distance, setRoute1Distance] = useState('');
  const [route5Distance, setRoute5Distance] = useState('');
  const [isNextButtonEnabled, setIsNextButtonEnabled] = useState(false);

  useEffect(() => {
    // 设置导航栏高亮状态
    setNavigationStep('4');
    
    // 记录页面进入
    logOperation({
      targetElement: '页面',
      eventType: 'page_enter',
      value: '进入交互式地图与路线计算页面'
    });
  }, [logOperation, setNavigationStep]);

  // 监听输入框状态，控制下一页按钮
  useEffect(() => {
    const isRoute1Valid = route1Distance.trim() !== '';
    const isRoute5Valid = route5Distance.trim() !== '';
    setIsNextButtonEnabled(isRoute1Valid && isRoute5Valid);
  }, [route1Distance, route5Distance]);

  // 处理路线按钮点击
  const handleRouteButtonClick = (routeNumber) => {
    setActiveRoute(routeNumber);
    
    logOperation({
      targetElement: `路线${routeNumber}按钮`,
      eventType: 'button_click',
      value: `选择路线${routeNumber}`
    });
  };

  // 处理路径点击事件 - 根据pathId激活对应路线
  const handlePathClick = (pathId) => {
    // 查找包含此路径的路线，激活编号最小的路线
    const segment = BASE_SEGMENTS.find(seg => seg.id === pathId);
    if (segment && segment.routes.length > 0) {
      const minRoute = Math.min(...segment.routes);
      setActiveRoute(minRoute);
      
      logOperation({
        targetElement: `地图路径${pathId}`,
        eventType: 'path_click',
        value: `点击路径激活路线${minRoute}`
      });
    }
  };

  // 处理输入框变化
  const handleDistanceInput = (routeNumber, value) => {
    if (routeNumber === 1) {
      setRoute1Distance(value);
    } else if (routeNumber === 5) {
      setRoute5Distance(value);
    }
    
    logOperation({
      targetElement: `路线${routeNumber}输入框`,
      eventType: 'input_change',
      value: `输入里程: ${value}`
    });
  };

  // 处理下一页点击
  const handleNextClick = () => {
    // 收集答案数据（标准结构）
    collectAnswer({
      targetElement: 'route-analysis',
      value: {
        route1_distance: route1Distance,
        route5_distance: route5Distance,
        selected_routes: activeRoute ? [activeRoute] : []
      }
    });
    
    // 导航到下一页：站点推荐页面
    navigateToPage('station-recommendation'); 
  };

  return (
    <AssessmentPageLayout
      showNextButton={true}
      isNextButtonEnabled={isNextButtonEnabled}
      onNextClick={handleNextClick}
      className={styles.routeAnalysisPage}
    >
      {/* 页面标题和描述 */}
      <div className={styles.pageHeader}>
        <div className={styles.stepIndicator}>
          <span className={styles.stepNumber}>4</span>
          <span className={styles.stepTitle}>火车购票：出发站</span>
        </div>
        <div className={styles.pageDescription}>
          买火车票首先要考虑出发站。小明家附近有2个火车站：南充站和南充北站。
          小明家到这2个火车站共有5条路线。请依次点击左下图【路线】按钮，查看这5条
          路线，计算【路线1】和【路线5】的路程，并将结果填在右侧表格相应的空格内。
        </div>
      </div>
      
      <div className={styles.pageContainer}>
        {/* 左列：路线按钮 */}
        <div className={styles.leftColumn}>
          <div className={styles.routeButtons}>
            {[1, 2, 3, 4, 5].map(routeNum => (
              <button
                key={routeNum}
                className={`${styles.routeButton} ${
                  activeRoute === routeNum ? styles.active : ''
                }`}
                onClick={() => handleRouteButtonClick(routeNum)}
                style={{ backgroundColor: ROUTE_DATA[routeNum].color }}
              >
                路线{routeNum}
              </button>
            ))}
          </div>
        </div>
        
        {/* 中列：地图区域 */}
        <div className={styles.middleColumn}>
          <div className={styles.mapContainer}>
            <div className={styles.mapArea}>
              <InteractiveMap 
                activeRoute={activeRoute}
                nodes={NODES}
                segments={BASE_SEGMENTS}
                routeData={ROUTE_DATA}
                onPathClick={handlePathClick}
              />    
            </div>
          </div>
        </div>
        
        {/* 右列：路程表格 */}
        <div className={styles.rightColumn}>
          <div className={styles.distanceTable}>
            <div className={styles.tableHeader}>
              <div className={styles.headerCell}>路线</div>
              <div className={styles.headerCell}>路程</div>
            </div>
            <div className={styles.tableBody}>
              <div className={styles.tableRow}>
                <div className={styles.tableCell}>路线1</div>
                <div className={styles.tableCell}>
                  <input
                    type="text"
                    value={route1Distance}
                    onChange={(e) => handleDistanceInput(1, e.target.value)}
                    className={styles.distanceInput}
                    placeholder=""
                  />
                  <span className={styles.unit}>km</span>
                </div>
              </div>
              <div className={styles.tableRow}>
                <div className={styles.tableCell}>路线2</div>
                <div className={styles.tableCell}>8.65 km</div>
              </div>
              <div className={styles.tableRow}>
                <div className={styles.tableCell}>路线3</div>
                <div className={styles.tableCell}>10.2 km</div>
              </div>
              <div className={styles.tableRow}>
                <div className={styles.tableCell}>路线4</div>
                <div className={styles.tableCell}>9.63 km</div>
              </div>
              <div className={styles.tableRow}>
                <div className={styles.tableCell}>路线5</div>
                <div className={styles.tableCell}>
                  <input
                    type="text"
                    value={route5Distance}
                    onChange={(e) => handleDistanceInput(5, e.target.value)}
                    className={styles.distanceInput}
                    placeholder=""
                  />
                  <span className={styles.unit}>km</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AssessmentPageLayout>
  );
};

export default RouteAnalysisPage;
