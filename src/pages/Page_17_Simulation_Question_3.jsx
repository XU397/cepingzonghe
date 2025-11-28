/**
 * @file Page_17_Simulation_Question_3.jsx
 * @description P17: 蒸馒头:模拟实验 - 问题3
 * PRD User_Step_Number_PDF_Ref: 11
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import EventTypes from '@shared/services/submission/eventTypes.js';
import { usePageSubmissionContext } from '@shared/ui/PageFrame/AssessmentPageFrame.jsx';
import { useAppContext } from '../context/AppContext';
import NavigationButton from '../components/common/NavigationButton';
import InteractiveSimulationEnvironment from '../components/simulation/InteractiveSimulationEnvironment';
import RadioButtonGroup from '../components/common/RadioButtonGroup';

const P17_Q3_OPTIONS = [
  { label: '20°C', value: '20' },
  { label: '25°C', value: '25' },
  { label: '30°C', value: '30' },
  { label: '35°C', value: '35' },
  { label: '40°C', value: '40' },
];

const Page_17_Simulation_Question_3 = () => {
  const {
    navigateToPage,
    currentPageId,
    setPageEnterTime,
  } = useAppContext();
  const { submitPage, logOperation } = usePageSubmissionContext();

  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timingSelection, setTimingSelection] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const alertMessage = '请先选择一个选项。';

  // 使用ref防止重复执行
  const pageLoadedRef = useRef(false);
  const prevAnswerRef = useRef(null);
  const operationsRef = useRef([]);
  const recordOperation = useCallback((operation) => {
    const normalizedOperation = { ...operation };
    logOperation(normalizedOperation);
    operationsRef.current = [...operationsRef.current, normalizedOperation];
  }, [logOperation]);

  // 页面进入记录 - 只执行一次
  useEffect(() => {
    if (pageLoadedRef.current) return;
    pageLoadedRef.current = true;
    operationsRef.current = [];
    setPageEnterTime(new Date());
  }, [setPageEnterTime]);

  // 缓存是否禁用下一页按钮的计算
  const isDisabled = useMemo(() => {
    return selectedAnswer === null;
  }, [selectedAnswer]);

  const handleAnswerChange = useCallback((value) => {
    // 使用缓存机制避免重复处理相同答案
    if (value !== prevAnswerRef.current) {
      setSelectedAnswer(value);
      prevAnswerRef.current = value;
      
      recordOperation({
        eventType: EventTypes.SELECT_CHANGE,
        targetElement: 'simulation_q3_option',
        value: `${value}°C`,
      });
      
      if (showAlert) setShowAlert(false);
    }
  }, [recordOperation, showAlert]);

  const handleNextPage = useCallback(async () => {
    if (selectedAnswer === null) {
      setShowAlert(true);
      recordOperation({
        eventType: EventTypes.CLICK_BLOCKED,
        targetElement: 'btn_next',
        value: { reason: '未选择答案', missing: ['simulation_q3'] },
      });
      return false;
    }

    setShowAlert(false);
    recordOperation({
      eventType: EventTypes.CLICK,
      targetElement: 'btn_next',
      value: '提交模拟实验问题3',
    });

    const answers = [
      { targetElement: '发酵缓慢的温度', value: `${selectedAnswer}°C` },
    ];
    if (timingSelection !== null) {
      answers.push({
        targetElement: '模拟发酵时长选择_Q3',
        value: `${timingSelection}小时`,
      });
    }

    const submissionSuccess = await submitPage({
      answers,
      operations: operationsRef.current,
    });
    if (submissionSuccess) {
      await navigateToPage('Page_18_Solution_Selection', { skipSubmit: true });
      return true;
    }

    alert('数据提交失败，请重试。');
    return false;
  }, [navigateToPage, recordOperation, selectedAnswer, submitPage, timingSelection]);
  
  /**
   * 当模拟器开始计时时，记录所选时间
   */
  const handleTimingStart = useCallback((timeInHours) => {
    setTimingSelection(timeInHours);
    setShowAlert(false);
  }, []);

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
          <InteractiveSimulationEnvironment
            onTimingStart={handleTimingStart}
            onTimingStarted={handleTimingStart}
            onLogOperation={recordOperation}
          />
        </div>

        <div className="question-panel" style={{
          backgroundColor: '#e3f2fd',
          padding: '25px',
          borderRadius: '12px',
          border: '2px dashed #64b5f6',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <p style={{ fontSize: '1.1em', lineHeight: '1.6', color: '#01579b', fontWeight:'bold', marginTop: 0}}>
            问题3: 通过模拟实验表明，在下列哪个温度下，发酵一直在进行，但比较缓慢？
          </p>
          <RadioButtonGroup
            name="simulation_q3"
            options={P17_Q3_OPTIONS}
            selectedValue={selectedAnswer}
            onChange={handleAnswerChange}
            elementDesc="P17_Q3_选项组"
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

export default Page_17_Simulation_Question_3; 
