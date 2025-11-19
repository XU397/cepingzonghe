/**
 * @file Page_15_Simulation_Question_1.jsx
 * @description P15: 蒸馒头:模拟实验 - 问题1
 * PRD User_Step_Number_PDF_Ref: 9
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { useDataLogging } from '../hooks/useDataLogging';
import NavigationButton from '../components/common/NavigationButton';
import InteractiveSimulationEnvironment from '../components/simulation/InteractiveSimulationEnvironment';
import RadioButtonGroup from '../components/common/RadioButtonGroup'; // 通用单选按钮组

const P15_Q1_OPTIONS = [
  { label: '20°C', value: '20' },
  { label: '25°C', value: '25' },
  { label: '30°C', value: '30' },
  { label: '35°C', value: '35' },
  { label: '40°C', value: '40' },
];

const Page_15_Simulation_Question_1 = () => {
  const {
    navigateToPage,
    submitPageData,
    currentPageId,
    setPageEnterTime,
    collectAnswer,
  } = useAppContext();

  // 数据记录Hook
  const {
    logRadioSelect,
    logButtonClick,
    logPageEnter,
    collectDirectAnswer
  } = useDataLogging('Page_15_Simulation_Question_1');

  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const alertMessage = '请先选择一个选项。';

  // 使用ref防止重复执行
  const pageLoadedRef = useRef(false);
  const prevAnswerRef = useRef(null);

  // 页面进入记录 - 只执行一次
  useEffect(() => {
    if (!pageLoadedRef.current) {
      pageLoadedRef.current = true;
      setPageEnterTime(new Date());
      logPageEnter('模拟实验问题1页面');
    }
  }, []);

  // 缓存是否禁用下一页按钮的计算
  const isDisabled = useMemo(() => {
    return selectedAnswer === null;
  }, [selectedAnswer]);

  /**
   * 处理单选按钮答案变化
   */
  const handleAnswerChange = useCallback((value) => {
    // 使用缓存机制避免重复处理相同答案
    if (value !== prevAnswerRef.current) {
      setSelectedAnswer(value);
      prevAnswerRef.current = value;
      
      logRadioSelect('模拟实验问题1', `${value}°C`, '发酵3小时后体积最大温度');
      
      if (showAlert) setShowAlert(false);
    }
  }, [logRadioSelect, showAlert]);

  /**
   * 处理下一页按钮点击
   */
  const handleNextPage = useCallback(async () => {
    if (selectedAnswer === null) {
      setShowAlert(true);
      logButtonClick('下一页', '点击失败 - 未选择答案');
      return false;
    }

    setShowAlert(false);
    logButtonClick('下一页', '点击成功');

    // 收集答案
    collectDirectAnswer('发酵3小时后体积最大的温度', `${selectedAnswer}°C`);

    const submissionSuccess = await submitPageData();
    if (submissionSuccess) {
      navigateToPage('Page_16_Simulation_Question_2', { skipSubmit: true });
      return true;
    } else {
      alert('数据提交失败，请重试。'); 
      return false;
    }
  }, [selectedAnswer, logButtonClick, collectDirectAnswer, submitPageData, navigateToPage]);

  /**
   * 当模拟器开始计时时，记录所选时间
   */
  const handleTimingStart = useCallback((timeInHours) => {
    collectAnswer({
      targetElement: `模拟发酵时长选择_Q1`,
      value: `${timeInHours}小时`,
    });
  }, [collectAnswer]);
  
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
    <div className="page-container page-fade-in simulation-question-page" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {showAlert && <AlertBox message={alertMessage} onClose={() => setShowAlert(false)} />}
      <h1 className="page-title" style={{ textAlign: 'center', color: '#333', marginBottom: '10px' }}>蒸馒头: 模拟实验</h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr', // 左侧模拟器，右侧问题与选项
        gap: '30px',
        alignItems: 'flex-start'
      }}>
        <div className="simulation-environment-panel" style={{
            border: '2px solid #81c784', 
            borderRadius: '12px', 
            padding: '0px', 
            backgroundColor: '#f1f8e9',
            boxShadow: '0 3px 10px rgba(0,0,0,0.08)'
        }}>
          <InteractiveSimulationEnvironment onTimingStarted={handleTimingStart} /> 
        </div>

        <div className="question-panel" style={{
          backgroundColor: '#e3f2fd',
          padding: '25px',
          borderRadius: '12px',
          border: '2px dashed #64b5f6',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <p style={{ fontSize: '1.1em', lineHeight: '1.6', color: '#01579b', fontWeight:'bold', marginTop: 0}}>
            问题1: 通过模拟实验表明，发酵3小时后， 在下列哪个温度条件下，面团发酵后的体积最大？
          </p>
          <RadioButtonGroup
            name="simulation_q1"
            options={P15_Q1_OPTIONS}
            selectedValue={selectedAnswer}
            onChange={handleAnswerChange}
            elementDesc="P15_Q1_选项组"
          />
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '-10px',display: 'block' }}>
        <NavigationButton
          currentPageId={currentPageId}
          onClick={handleNextPage}
          buttonText="下一页"
          disabled={isDisabled}
        />
      </div>
    </div>
  );
};

export default Page_15_Simulation_Question_1; 
