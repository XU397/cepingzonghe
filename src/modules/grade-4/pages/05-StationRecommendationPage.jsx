/**
 * 站点推荐页面 - 四年级火车购票测评
 * Story 2.5: 决策制定与信息回顾
 * 实现PDF第12页的"站点推荐"页面，包含站点选择、理由输入和路线回顾功能
 * [BMAD 指挥部注]：已根据四象限布局要求重构JSX结构，并补全所有代码。
 */

import { useEffect, useState } from 'react';
import { useGrade4Context } from '../context/Grade4Context';
import AssessmentPageLayout from '../components/layout/AssessmentPageLayout';
import InteractiveMap from '../components/InteractiveMap';
import styles from './05-StationRecommendationPage.module.css';

// 从2.4页面复用的地图数据
const NODES = {
  NCN_STATION: { name: '南充北站', x: 40, y: 20, style: 'station' },
  XIAOMING_HOME: { name: '小明家', x: 140, y: 95, style: 'home' },
  NC_STATION: { name: '南充站', x: 270, y: 180, style: 'station' },
  J1: { name: 'J1', x: 110, y: 60, style: 'junction' },
  J2: { name: 'J2', x: 170, y: 50, style: 'junction' },
  J3: { name: 'J3', x: 180, y: 110, style: 'junction' },
  J4: { name: 'J4', x: 200, y: 130, style: 'junction' },
  J5: { name: 'J5', x: 160, y: 140, style: 'junction' },
  J6: { name: 'J6', x: 190, y: 160, style: 'junction' },
  J7: { name: 'J7', x: 230, y: 165, style: 'junction' }
};

const BASE_SEGMENTS = [
  { id: 'path_XMH_J2', from: 'XIAOMING_HOME', to: 'J2', routes: [1] },
  { id: 'path_J2_NCN', from: 'J2', to: 'NCN_STATION', routes: [1] },
  { id: 'path_XMH_J1', from: 'XIAOMING_HOME', to: 'J1', routes: [2] },
  { id: 'path_J1_NCN', from: 'J1', to: 'NCN_STATION', routes: [2] },
  { id: 'path_XMH_J3', from: 'XIAOMING_HOME', to: 'J3', routes: [3] },
  { id: 'path_J3_J4', from: 'J3', to: 'J4', routes: [3] },
  { id: 'path_XMH_J5', from: 'XIAOMING_HOME', to: 'J5', routes: [4, 5] },
  { id: 'path_J5_J4', from: 'J5', to: 'J4', routes: [4] },
  { id: 'path_J5_J6', from: 'J5', to: 'J6', routes: [5] },
  { id: 'path_J6_J7', from: 'J6', to: 'J7', routes: [5] },
  { id: 'path_J4_J7', from: 'J4', to: 'J7', routes: [3, 4] },
  { id: 'path_J7_NCS', from: 'J7', to: 'NC_STATION', routes: [3, 4, 5] }
];

const ROUTE_DATA = {
  1: {
    name: '路线1', totalDistance: 7.9, color: '#FFA500',
    paths: ['path_XMH_J2', 'path_J2_NCN'],
    labels: [
      { segment: 'path_XMH_J2', text: '3.64km', offset: { x: 20, y: -8 } },
      { segment: 'path_J2_NCN', text: '4.26km', offset: { x: 0, y: -12 } }
    ]
  },
  2: {
    name: '路线2', totalDistance: 8.65, color: '#FFD700',
    paths: ['path_XMH_J1', 'path_J1_NCN'],
    labels: [
      { segment: 'path_XMH_J1', text: '5.32km', offset: { x: -25, y: 15 } },
      { segment: 'path_J1_NCN', text: '3.33km', offset: { x: 25, y: -10 } }
    ]
  },
  3: {
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
      { segment: 'path_XMH_J5', text: '2km', offset: { x: 10, y: 15 } },
      { segment: 'path_J5_J4', text: '2.93km', offset: { x: 15, y: 15 } },
      { segment: 'path_J4_J7', text: '2.4km', offset: { x: 28, y: 5 } },
      { segment: 'path_J7_NCS', text: '2.3km', offset: { x: 28, y: 0 } }
    ]
  },
  5: {
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

const StationRecommendationPage = () => {
  const { 
    logOperation, 
    collectAnswer,
    setNavigationStep,
    navigateToPage
  } = useGrade4Context();

  const [selectedStation, setSelectedStation] = useState('');
  const [reasonText, setReasonText] = useState('');
  const [activeRoute, setActiveRoute] = useState(null);
  const [isNextButtonEnabled, setIsNextButtonEnabled] = useState(false);

  useEffect(() => {
    setNavigationStep('5');
    logOperation({
      targetElement: '页面',
      eventType: 'page_enter',
      value: '进入站点推荐页面'
    });
  }, [logOperation, setNavigationStep]);

  useEffect(() => {
    const isStationSelected = selectedStation !== '';
    const isReasonValid = reasonText.trim().length > 0;
    setIsNextButtonEnabled(isStationSelected && isReasonValid);
  }, [selectedStation, reasonText]);

  const handleStationSelect = (station) => {
    setSelectedStation(station);
    logOperation({
      targetElement: `${station}单选框`,
      eventType: 'radio_select',
      value: `选择出发站: ${station}`
    });
  };

  const handleReasonChange = (value) => {
    setReasonText(value);
    logOperation({
      targetElement: '理由输入框',
      eventType: 'input_change',
      value: `输入理由: ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`
    });
  };

  const handleRouteButtonClick = (routeNumber) => {
    setActiveRoute(routeNumber);
    logOperation({
      targetElement: `路线${routeNumber}按钮`,
      eventType: 'button_click',
      value: `查看路线${routeNumber}详情`
    });
  };
  
  const handlePathClick = (pathId) => {
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

  const handleNextClick = () => {
    // 1. 收集当前页面答案（标准结构）
    collectAnswer({
      targetElement: 'station-recommendation',
      value: {
        selected_station: selectedStation,
        recommendation_reason: reasonText,
        viewed_routes: activeRoute ? [activeRoute] : []
      }
    });

    // 2. 记录操作并导航到下一页
    logOperation({
      targetElement: '下一页按钮',
      eventType: 'button_click',
      value: '完成站点推荐，进入时间规划教程页面'
    });
    
    // 3. 调用导航函数，使用正确页面ID
    navigateToPage('timeline-planning-tutorial'); 
  };

  return (
    <AssessmentPageLayout
      showNextButton={true}
      isNextButtonEnabled={isNextButtonEnabled}
      onNextClick={handleNextClick}
      className={styles.stationRecommendationPage}
    >
      <div className={styles.pageHeader}>
        <div className={styles.stepIndicator}>
          <span className={styles.stepNumber}>5</span>
          <span className={styles.stepTitle}>火车购票：出发站</span>
        </div>
      </div>
      
      <div className={styles.pageContainer}>
        
         {/* 新增：左列容器 */}
         <div className={styles.leftColumn}>

        {/* 内容块1：问题选择 */}
        <div className={styles.quadrant}>
          <div className={styles.introText}>
            小明也正确算出了【路线1】和【路线5】的路程，右表是他的计算结果。你建议小明选择哪个车站作为出发站？
          </div>
          <div className={styles.stationOptions}>
            <label className={styles.radioOption}>
              <input
                type="radio"
                name="station"
                value="南充北站"
                checked={selectedStation === '南充北站'}
                onChange={(e) => handleStationSelect(e.target.value)}
              />
              <span className={styles.radioLabel}>南充北站</span>
            </label>
            <label className={styles.radioOption}>
              <input
                type="radio"
                name="station"
                value="南充站"
                checked={selectedStation === '南充站'}
                onChange={(e) => handleStationSelect(e.target.value)}
              />
              <span className={styles.radioLabel}>南充站</span>
            </label>
          </div>
        </div>

        {/* 内容块2：地图模块 (从原右下方移至此) */}
        <div className={styles.quadrant}>
          <div className={styles.mapTip}>
            <span className={styles.tipText}>提示：可点击下方路线按钮，重新查看路线哦！</span>
          </div>
          <div className={styles.routeButtons}>
            {[1, 2, 3, 4, 5].map(routeNum => (
              <button
                key={routeNum}
                className={`${styles.routeButton} ${activeRoute === routeNum ? styles.active : ''}`}
                onClick={() => handleRouteButtonClick(routeNum)}
                style={{ backgroundColor: ROUTE_DATA[routeNum].color }}
              >
                路线{routeNum}
              </button>
            ))}
          </div>
          <div className={styles.mapContainer}>
            <InteractiveMap 
              activeRoute={activeRoute}
              nodes={NODES}
              segments={BASE_SEGMENTS}
              routeData={ROUTE_DATA}
              onPathClick={handlePathClick}
              isCompact={true}
            />
          </div>
        </div>
        </div>

        {/* 新增：右列容器 */}
        <div className={styles.rightColumn}>

        {/* 内容块3：数据表格 */}
        <div className={styles.quadrant}>
          <div className={styles.comparisonTable}>
            <div className={styles.tableHeader}>
              <div className={styles.headerCell}>出发站</div>
              <div className={styles.headerCell}>路线</div>
              <div className={styles.headerCell}>路程</div>
            </div>
            <div className={styles.tableBody}>
              <div className={styles.tableRow}> <div className={styles.tableCell}>南充北站</div> <div className={styles.tableCell}>路线1</div> <div className={styles.tableCell}>7.9 km</div> </div>
              <div className={styles.tableRow}> <div className={styles.tableCell}>南充北站</div> <div className={styles.tableCell}>路线2</div> <div className={styles.tableCell}>8.65 km</div> </div>
              <div className={styles.tableRow}> <div className={styles.tableCell}>南充站</div> <div className={styles.tableCell}>路线3</div> <div className={styles.tableCell}>10.2 km</div> </div>
              <div className={styles.tableRow}> <div className={styles.tableCell}>南充站</div> <div className={styles.tableCell}>路线4</div> <div className={styles.tableCell}>9.63 km</div> </div>
              <div className={styles.tableRow}> <div className={styles.tableCell}>南充站</div> <div className={styles.tableCell}>路线5</div> <div className={styles.tableCell}>7.88 km</div> </div>
            </div>
          </div>
        </div>

        {/* 内容块4：理由输入框 (从原左下方移至此) */}
        <div className={styles.quadrant}>
          <div className={styles.reasonSection}>
            <label className={styles.reasonLabel}>请简要说明理由：</label>
            <textarea
              value={reasonText}
              onChange={(e) => handleReasonChange(e.target.value)}
              className={styles.reasonInput}
              placeholder="请在此处输入你的回答。"
              rows={6}
            />
         </div>
          </div>
        </div>
        </div>
    </AssessmentPageLayout>
  );
};

export default StationRecommendationPage;
