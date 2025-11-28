/**
 * @file Page_16_Simulation_Question_2.jsx
 * @description P16: 蒸馒头:模拟实验 - 问题2
 * PRD User_Step_Number_PDF_Ref: 10
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import EventTypes from '@shared/services/submission/eventTypes.js';
import { usePageSubmissionContext } from '@shared/ui/PageFrame/AssessmentPageFrame.jsx';
import { useAppContext } from '../context/AppContext';
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
        targetElement: 'simulation_q2_option',
        value: `${value}小时`,
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
        value: { reason: '未选择答案', missing: ['simulation_q2'] },
      });
      return false;
    }

    setShowAlert(false);
    recordOperation({
      eventType: EventTypes.CLICK,
      targetElement: 'btn_next',
      value: '提交模拟实验问题2',
    });

    const answers = [
      { targetElement: '35°C时发酵到95ml所需时间', value: `${selectedAnswer}小时` },
    ];
    if (timingSelection !== null) {
      answers.push({
        targetElement: '模拟发酵时长选择_Q2',
        value: `${timingSelection}小时`,
      });
    }

    const submissionSuccess = await submitPage({
      answers,
      operations: operationsRef.current,
    });
    if (submissionSuccess) {
      await navigateToPage('Page_17_Simulation_Question_3', { skipSubmit: true });
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
