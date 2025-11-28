import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import EventTypes from '@shared/services/submission/eventTypes.js';
import { usePageSubmissionContext } from '@shared/ui/PageFrame/AssessmentPageFrame.jsx';
import imgBefore from '../assets/images/05-1.png';
import imgAfter from '../assets/images/05-2.png';
import { useAppContext } from '../context/AppContext';
import TextInput from '../components/common/TextInput';
import NavigationButton from '../components/common/NavigationButton';

/**
 * P11：蒸馒头:方案设计 - 测量方法构思页面
 * 让用户输入三种不同的测量面团体积的方法构思
 * 
 * @returns {React.ReactElement} 方案设计测量方法构思页面
 */
const DEFAULT_IDEAS = {
  idea1: '',
  idea2: '',
  idea3: ''
};

const DEFAULT_INPUT_STATE = {
  idea1: { focused: false, lastValue: '' },
  idea2: { focused: false, lastValue: '' },
  idea3: { focused: false, lastValue: '' }
};

const Page_11_Solution_Design_Measurement_Ideas = () => {
  const {
    navigateToPage,
    currentPageId,
    setPageEnterTime
  } = useAppContext();
  const { submitPage, logOperation } = usePageSubmissionContext();
  
  const [ideas, setIdeas] = useState(() => ({ ...DEFAULT_IDEAS }));
  const [isNextEnabled, setIsNextEnabled] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // 使用ref防止重复执行
  const pageLoadedRef = useRef(false);
  const operationsRef = useRef([]);
  const inputStatesRef = useRef({ ...DEFAULT_INPUT_STATE });
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
    inputStatesRef.current = { ...DEFAULT_INPUT_STATE };
    setPageEnterTime(new Date());
  }, [setPageEnterTime]);

  // 缓存是否启用下一页按钮的计算
  const hasAtLeastOneIdea = useMemo(() => {
    return Object.values(ideas).some(idea => idea.trim().length > 0);
  }, [ideas]);

  // 更新按钮状态 - 使用缓存避免不必要的状态更新
  useEffect(() => {
    if (isNextEnabled !== hasAtLeastOneIdea) {
      setIsNextEnabled(hasAtLeastOneIdea);
    }
  }, [hasAtLeastOneIdea, isNextEnabled]);

  /**
   * 处理想法输入变化
   */
  const handleIdeaChange = useCallback((key, value) => {
    const prevValue = inputStatesRef.current[key]?.lastValue || '';
    const nextValue = value;

    setIdeas(prev => ({
      ...prev,
      [key]: nextValue
    }));
    
    if (nextValue.length < prevValue.length) {
      recordOperation({
        eventType: EventTypes.INPUT_DELETE,
        targetElement: `input_${key}`,
        value: { action: 'delete', prevLength: prevValue.length, nextLength: nextValue.length }
      });
    }

    recordOperation({
      eventType: EventTypes.INPUT_CHANGE,
      targetElement: `input_${key}`,
      value: { prev: prevValue, next: nextValue }
    });

    inputStatesRef.current[key] = {
      ...(inputStatesRef.current[key] || { focused: false, lastValue: '' }),
      lastValue: nextValue
    };
  }, [recordOperation]);

  /**
   * 处理输入框聚焦
   */
  const handleInputFocus = useCallback((inputKey) => {
    const currentState = inputStatesRef.current[inputKey] || { focused: false, lastValue: '' };

    if (!currentState.focused) {
      recordOperation({
        eventType: EventTypes.INPUT_FOCUS,
        targetElement: `input_${inputKey}`,
        value: '聚焦'
      });
    }

    inputStatesRef.current[inputKey] = {
      ...currentState,
      focused: true,
      lastValue: ideas[inputKey] || ''
    };
  }, [ideas, recordOperation]);

  /**
   * 处理输入框失焦
   */
  const handleInputBlur = useCallback((inputKey) => {
    const value = ideas[inputKey] || '';

    recordOperation({
      eventType: EventTypes.INPUT_BLUR,
      targetElement: `input_${inputKey}`,
      value
    });

    inputStatesRef.current[inputKey] = {
      ...(inputStatesRef.current[inputKey] || { focused: false, lastValue: '' }),
      focused: false,
      lastValue: value
    };
  }, [ideas, recordOperation]);
  
  const handleNextPage = useCallback(async () => {
    recordOperation({
      eventType: EventTypes.CLICK,
      targetElement: 'btn_next',
      value: isNextEnabled ? '提交测量方法构思' : '点击失败 - 未至少输入一个想法'
    });

    if (!isNextEnabled) {
      setAlertMessage('请至少输入一种测量方法构思。');
      setShowAlert(true);
      return false;
    }

    const answers = Object.entries(ideas).map(([key, value]) => {
      const trimmed = value.trim();
      if (!trimmed) return null;
      const index = parseInt(key.replace('idea', ''), 10);
      const targetElement = Number.isFinite(index) ? `measurement_idea_${index}` : `measurement_idea_${key}`;
      return { targetElement, value: trimmed };
    }).filter(Boolean);
    
    const submissionSuccess = await submitPage({
      answers,
      operations: operationsRef.current,
    });
    if (submissionSuccess) {
      navigateToPage('Page_12_Solution_Evaluation_Measurement_Critique', { skipSubmit: true });
      return true;
    } else {
      setAlertMessage('数据提交失败，请重试。');
      setShowAlert(true);
      return false;
    }
  }, [ideas, isNextEnabled, navigateToPage, recordOperation, submitPage]);
  
  // 缓存想法配置数据
  const ideasConfig = useMemo(() => [
    { key: 'idea1', title: '想法1:', placeholder: '请在此处输入你的想法', desc: '想法1输入框' },
    { key: 'idea2', title: '想法2:', placeholder: '请在此处输入你的想法', desc: '想法2输入框' },
    { key: 'idea3', title: '想法3:', placeholder: '请在此处输入你的想法', desc: '想法3输入框' },
  ], []);

  const AlertBox = ({ message, onClose }) => (
    <div style={{
      position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
      backgroundColor: '#f8d7da', color: '#721c24', padding: '10px 10px',
      borderRadius: '5px', border: '1px solid #f5c6cb', zIndex: 1050,
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
    }}>
      <span>{message}</span>
      <button onClick={onClose} style={{ marginLeft: '15px', border: 'none', background: 'transparent', color: '#721c24', fontWeight: 'bold', cursor: 'pointer' }}>X</button>
    </div>
  );

  return (
    <div className="page-container page-fade-in solution-design-ideas-page" style={{ padding: '10px',  margin: '0 auto' }}>
      {showAlert && <AlertBox message={alertMessage} onClose={() => setShowAlert(false)} />}

      <h1 className="page-title" style={{ textAlign: 'center', color: '#333', marginBottom: '5px' }}>蒸馒头: 方案设计</h1>
      
      <div style={{
        backgroundColor: '#e3f2fd',
        padding: '15px',
        borderRadius: '12px',
        marginBottom: '15px',
        border: '2px solid #64b5f6',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <p style={{ fontSize: '1em', lineHeight: '1.6', color: '#01579b', margin: '0 0 20px 0', textAlign: 'left', textIndent: '2em' }}>
          为验证小明的猜想，首先要确定评估<strong>面团发酵程度</strong>的方法。通过查阅资料，小明发现可以通过<strong>测量发酵后的面团体积</strong>来进行评估。
        </p>
        
        {/* 图片对比展示 */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '30px',
          marginBottom: '10px',
          flexWrap: 'wrap'
        }}>
          {/* 发酵前图片 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <img 
              src={imgBefore} 
              alt="发酵前面团" 
              style={{
                width: '180px',
                height: '120px',
                objectFit: 'cover',
                borderRadius: '8px',
                border: '2px solid #ddd',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
              }}
            />
            <p style={{
              margin: '5px 0 0 0',
              fontSize: '1em',
              fontWeight: 'bold',
              color: '#333'
            }}>发酵前</p>
          </div>
          
          {/* 箭头 */}
          <div style={{
            fontSize: '2em',
            color: '#64b5f6',
            fontWeight: 'bold'
          }}>→</div>
          
          {/* 发酵后图片 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <img 
              src={imgAfter} 
              alt="发酵后面团" 
              style={{
                width: '180px',
                height: '120px',
                objectFit: 'cover',
                borderRadius: '8px',
                border: '2px solid #ddd',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
              }}
            />
            <p style={{
              margin: '5px 0 0 0',
              fontSize: '1em',
              fontWeight: 'bold',
              color: '#333'
            }}>发酵后</p>
          </div>
        </div>
        
        <p style={{ 
          fontSize: '1.05em', 
          fontWeight: 'bold', 
          color: '#01579b', 
          margin: 0, 
          textAlign: 'left',
          textIndent: '2em',
          lineHeight: '1.6'
        }}>
          请你帮小明想一想，有哪些可以<span style={{ color: '#d32f2f' }}>测量面团发酵后体积</span>的方法。请提出三个可能的想法，将其简要陈述在下方方框内。
        </p>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'row', gap: '15px', flexWrap: 'wrap', width: '100%' ,justifyContent: 'center'}}>
        {ideasConfig.map((ideaItem) => (
          <div key={ideaItem.key} style={{
            backgroundColor: '#ffffff',
            width: '32%',
            padding: '4px 4px',
            borderRadius: '10px',
            border: '1px solid #cce5ff',
            boxShadow: '0 3px 10px rgba(0, 0, 0, 0.07)'
          }}>
            <h3 style={{ fontSize: '1.1em', fontWeight: 'bold', color: '#004d99', marginBottom: '4px', marginTop: 0 }}>
              {ideaItem.title}
            </h3>
            <TextInput
              value={ideas[ideaItem.key]}
              onChange={(value) => handleIdeaChange(ideaItem.key, value)}
              placeholder={ideaItem.placeholder}
              isMultiline={true}
              elementDesc={ideaItem.desc}
              rows={2}
              onFocus={() => handleInputFocus(ideaItem.key)}
              onBlur={() => handleInputBlur(ideaItem.key)}
              style={{
                width: '240px',
                padding: '4px 4px',
                border: '1px solid #b3d9ff',
                borderRadius: '8px',
                fontSize: '1em',
                boxSizing: 'border-box',
                lineHeight: '1.5',
                minHeight: '80px',
                maxHeight: '100px'
              }}
            />
          </div>
        ))}
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '15px' }}>
        <NavigationButton
          currentPageId={currentPageId}
          onClick={handleNextPage}
          buttonText="下一步"
          disabled={!isNextEnabled}
        />
      </div>
    </div>
  );
};

export default Page_11_Solution_Design_Measurement_Ideas; 
