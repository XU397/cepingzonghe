/**
 * @file Page_16_Simulation_Question_2.jsx
 * @description P16: 蒸馒头:模拟实验 - 问题2
 * PRD User_Step_Number_PDF_Ref: 10
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { useDataLogging } from '../hooks/useDataLogging';
import NavigationButton from '../components/common/NavigationButton';
import InteractiveSimulationEnvironment from '../components/simulation/InteractiveSimulationEnvironment';
import RadioButtonGroup from '../components/common/RadioButtonGroup';

const P16_Q2_OPTIONS = [
  { label: '1小时', value: '1' },
  { label: '2小时', value: '2' },
  { label: '3小时', value: '3' },
  { label: '4小时', value: '4' },
  { label: '5小时', value: '5' },
  { label: '6小时', value: '6' },
  { label: '7小时', value: '7' },
  { label: '8小时', value: '8' },
];

const Page_16_Simulation_Question_2 = () => {
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
  } = useDataLogging('Page_16_Simulation_Question_2');

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
      logPageEnter('模拟实验问题2页面');
    }
  }, []);

  // 缓存是否禁用下一页按钮的计算
  const isDisabled = useMemo(() => {
    return selectedAnswer === null;
  }, [selectedAnswer]);

  const handleAnswerChange = useCallback((value) => {
    // 使用缓存机制避免重复处理相同答案
    if (value !== prevAnswerRef.current) {
      setSelectedAnswer(value);
      prevAnswerRef.current = value;
      
      logRadioSelect('模拟实验问题2', `${value}小时`, '35度达到95ml所需时间');
      
      if (showAlert) setShowAlert(false);
    }
  }, [logRadioSelect, showAlert]);

  const handleNextPage = useCallback(async () => {
    if (selectedAnswer === null) {
      setShowAlert(true);
      logButtonClick('下一页', '点击失败 - 未选择答案');
      return false;
    }

    setShowAlert(false);
    logButtonClick('下一页', '点击成功');

    // 收集答案
    collectDirectAnswer('35°C时发酵到95ml所需时间', `${selectedAnswer}小时`);

    const submissionSuccess = await submitPageData();
    if (submissionSuccess) {
      navigateToPage('Page_17_Simulation_Question_3');
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
      targetElement: `模拟发酵时长选择_Q2`,
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
        gridTemplateColumns: '2fr 1fr',
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
          padding: '10px',
          borderRadius: '12px',
          border: '2px dashed #64b5f6',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <p style={{ fontSize: '1.1em', lineHeight: '1.5', color: '#01579b', fontWeight:'bold', marginTop: 0}}>
            问题2: 通过模拟实验表明，在 35°C 时，面团需要多长时间，能够发酵到95ml？
          </p>
          <RadioButtonGroup
            name="simulation_q2"
            options={P16_Q2_OPTIONS}
            selectedValue={selectedAnswer}
            onChange={handleAnswerChange}
            elementDesc="P16_Q2_选项组"
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

export default Page_16_Simulation_Question_2; 