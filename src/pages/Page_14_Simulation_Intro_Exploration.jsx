/**
 * @file Page_14_Simulation_Intro_Exploration.jsx
 * @description P14: 模拟实验界面介绍与自由探索。
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { useDataLogging } from '../hooks/useDataLogging';
import NavigationButton from '../components/common/NavigationButton';
import InteractiveSimulationEnvironment from '../components/simulation/InteractiveSimulationEnvironment'; // 模拟实验环境组件

// 导入图片资源
import jiaImg from '../assets/images/jia.jpg';
import jianImg from '../assets/images/jian.jpg';
import jishiImg from '../assets/images/jishi.jpg';
import chongzhiImg from '../assets/images/chongzhi.jpg';
import tijiImg from '../assets/images/tiji.jpg';

/**
 * P14: 蒸馒头:模拟实验 - 界面介绍与自由探索
 * PRD User_Step_Number_PDF_Ref: 8
 * 
 * @returns {React.ReactElement} P14页面组件
 */
const Page_14_Simulation_Intro_Exploration = () => {
  const {
    navigateToPage,
    submitPageData,
    currentPageId,
    currentPageData,
    setPageEnterTime,
    collectAnswer,
  } = useAppContext();

  // 数据记录Hook
  const {
    logButtonClick,
    logPageEnter
  } = useDataLogging('Page_14_Simulation_Intro_Exploration');

  const [hasTimingStartedOnce, setHasTimingStartedOnce] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const alertMessage = '请至少进行一次"计时开始"操作以熟悉界面。';

  // 使用ref防止重复执行
  const pageLoadedRef = useRef(false);
  const timeoutHandledRef = useRef(false);

  // 页面进入记录 - 只执行一次
  useEffect(() => {
    if (!pageLoadedRef.current) {
      pageLoadedRef.current = true;
      setPageEnterTime(new Date());
      logPageEnter('模拟实验界面介绍与自由探索页面');
    }
  }, []);

  // 检查是否已经进行过计时操作 - 使用缓存避免频繁检查
  useEffect(() => {
    if (currentPageData && currentPageData.operationList && !timeoutHandledRef.current) {
      const hasTimingOperation = currentPageData.operationList.some(op => 
        op.eventType === 'timer_start' || op.eventType === 'simulation_timing_started'
      );
      
      if (hasTimingOperation && !hasTimingStartedOnce) {
        setHasTimingStartedOnce(true);
        timeoutHandledRef.current = true;
      }
    }
  }, [currentPageData, hasTimingStartedOnce]); 

  /**
   * 处理下一页按钮点击
   */
  const handleNextPage = useCallback(async () => {
    if (!hasTimingStartedOnce) {
      setShowAlert(true);
      logButtonClick('下一页', '点击失败 - 未进行模拟计时开始操作');
      return false;
    }

    setShowAlert(false);
    logButtonClick('下一页', '点击成功');

    const submissionSuccess = await submitPageData();
    if (submissionSuccess) {
      navigateToPage('Page_15_Simulation_Question_1');
      return true;
    } else {
      alert('数据提交失败，请稍后再试。');
      return false;
    }
  }, [hasTimingStartedOnce, logButtonClick, submitPageData, navigateToPage]);
  
  /**
   * 当模拟器开始计时时，记录所选时间
   */
  const handleTimingStart = useCallback((timeInHours) => {
    setHasTimingStartedOnce(true);
    collectAnswer({
      targetElement: `模拟发酵时长选择`,
      value: `${timeInHours}小时`,
    });
  }, [collectAnswer]);

  // 简单的提示框组件
  const AlertBox = ({ message, onClose }) => (
    <div style={{
      position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
      backgroundColor: '#f8d7da', color: '#721c24', padding: '10px 20px',
      borderRadius: '5px', border: '1px solid #f5c6cb', zIndex: 1050,
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
    }}>
      <span>{message}</span>
      <button onClick={onClose} style={{ marginLeft: '15px', border: 'none', background: 'transparent', color: '#721c24', fontWeight: 'bold', cursor: 'pointer' }}>X</button>
    </div>
  );

  return (
    <div className="page-container page-fade-in simulation-intro-page" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {showAlert && <AlertBox message={alertMessage} onClose={() => setShowAlert(false)} />}

      <h1 className="page-title" style={{ textAlign: 'center', color: '#333', marginBottom: '10px' }}>蒸馒头: 模拟实验</h1>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 2fr', // 左侧说明，右侧模拟器
        gap: '30px',
        alignItems: 'flex-start'
      }}>
        <div className="instructions-panel" style={{
          backgroundColor: '#e3f2fd',
          padding: '25px',
          borderRadius: '12px',
          border: '2px dashed #64b5f6',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <h2 style={{ marginTop: 0, color: '#01579b', borderBottom: '2px solid #00796b', paddingBottom: '2px', marginBottom: '15px' }}>模拟实验步骤如下：</h2>
          <ol style={{ paddingLeft: '20px', fontSize: '0.8em', lineHeight: '1.8', color: '#37474f' }}>
            <li style={{ marginBottom: '2px' }}>将揉好的面团分成5份等质量的小面团（初始体积均为70mL），分别放在5个250ml的量筒中；</li>
            <li style={{ marginBottom: '2px' }}>准备5个恒温箱，分别设其温度为 20°C、 25°C、 30°C、 35°C、 40°C；</li>
            <li>将量筒放入恒温箱，每隔1小时(1-8小时)记录恒温箱中量筒的读数。</li>
          </ol>
          <hr style={{ margin: '20px 0', borderColor: '#90caf9'}} />
          <h3 style={{ color: '#00796b', marginTop: '15px' }}>【说明】右侧为实验互动界面:</h3> 
          {/* 指向的是下一列的模拟器，如果布局变化，此文本需修改 */}
          <ul style={{ paddingLeft: '20px', fontSize: '0.95em', lineHeight: '1.7', color: '#37474f'}}>
            <li style={{ marginBottom: '8px' }}>单击<img src={jiaImg} alt="+" style={{height: '1.5em', verticalAlign: 'middle', margin: '0 2px'}} />或者<img src={jianImg} alt="-" style={{height: '1.5em', verticalAlign: 'middle', margin: '0 2px'}} />可调整发酵时间。</li>
            <li style={{ marginBottom: '8px' }}>设好时间后，单击 <img src={jishiImg} alt="计时开始" style={{height: '1.8em', verticalAlign: 'middle', margin: '0 2px'}} />，面团会在量筒中发酵，体积不断膨胀。</li>
            <li style={{ marginBottom: '8px' }}>发酵结束后，量筒下方体积框内 <img src={tijiImg} alt="0.0" style={{height: '1.5em', verticalAlign: 'middle', margin: '0 2px'}} /> 显示面团体积。</li> {/* PRD中是0.0，但实际应显示结果 */}
            <li>单击 <img src={chongzhiImg} alt="重置" style={{height: '1.8em', verticalAlign: 'middle', margin: '0 2px'}} /> 可重新开始。</li>
          </ul>
        </div>

        <div className="simulation-environment-panel" style={{
            border: '2px solid #81c784', 
            borderRadius: '12px', 
            padding: '0px', 
            backgroundColor: '#f1f8e9',
            boxShadow: '0 3px 10px rgba(0,0,0,0.08)'
        }}>
          <InteractiveSimulationEnvironment 
            onTimingStarted={handleTimingStart}
          />
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '-10px',display: 'block' }}>
        <NavigationButton
          currentPageId={currentPageId}
          onClick={handleNextPage}
          buttonText="下一页"
          disabled={!hasTimingStartedOnce}
        />
      </div>
    </div>
  );
};

export default Page_14_Simulation_Intro_Exploration; 