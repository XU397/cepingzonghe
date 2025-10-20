import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import imgBefore from '../assets/images/05-1.png';
import imgAfter from '../assets/images/05-2.png';
import { useAppContext } from '../context/AppContext';
import { useDataLogging } from '../hooks/useDataLogging';
import TextInput from '../components/common/TextInput';
import NavigationButton from '../components/common/NavigationButton';

/**
 * P11：蒸馒头:方案设计 - 测量方法构思页面
 * 让用户输入三种不同的测量面团体积的方法构思
 * 
 * @returns {React.ReactElement} 方案设计测量方法构思页面
 */
const Page_11_Solution_Design_Measurement_Ideas = () => {
  const {
    navigateToPage,
    submitPageData,
    currentPageId,
    setPageEnterTime
  } = useAppContext();
  
  // 数据记录Hook
  const {
    logInput,
    logInputBlur,
    logButtonClick,
    logPageEnter,
    collectDirectAnswer
  } = useDataLogging('Page_11_Solution_Design_Measurement_Ideas');
  
  const [ideas, setIdeas] = useState({
    idea1: '',
    idea2: '',
    idea3: ''
  });
  const [isNextEnabled, setIsNextEnabled] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // 使用ref防止重复执行
  const pageLoadedRef = useRef(false);
  const prevIdeasRef = useRef({});

  // 页面进入记录 - 只执行一次
  useEffect(() => {
    if (!pageLoadedRef.current) {
      pageLoadedRef.current = true;
      setPageEnterTime(new Date());
      logPageEnter('方案设计测量方法构思页面');
    }
  }, []);

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
    setIdeas(prev => ({
      ...prev,
      [key]: value
    }));
    
    // 记录输入操作
    const ideaNumber = key.replace('idea', '');
    logInput(`想法${ideaNumber}输入框`, value);
  }, [logInput]);

  /**
   * 处理输入框失焦
   */
  const handleInputBlur = useCallback((inputKey) => {
    const value = ideas[inputKey];
    const ideaNumber = inputKey.replace('idea', '');
    
    // 使用缓存机制避免重复提交相同答案
    const currentIdeas = JSON.stringify(ideas);
    const prevIdeas = JSON.stringify(prevIdeasRef.current);
    
    if (currentIdeas !== prevIdeas) {
      prevIdeasRef.current = { ...ideas };
      logInputBlur(`想法${ideaNumber}输入框`, value, `想法${ideaNumber}答案`);
    }
  }, [ideas, logInputBlur]);
  
  const handleNextPage = useCallback(async () => {
    if (!isNextEnabled) {
      setAlertMessage('请至少输入一种测量方法构思。');
      setShowAlert(true);
      logButtonClick('下一页', '点击失败 - 未至少输入一个想法');
      return false;
    }

    logButtonClick('下一页', '点击成功');
    
    // 收集所有非空想法作为答案
    Object.entries(ideas).forEach(([key, value], index) => {
      if (value.trim()) {
        collectDirectAnswer(`测量方法想法${index + 1}`, value.trim());
      }
    });
    
    const submissionSuccess = await submitPageData();
    if (submissionSuccess) {
      navigateToPage('Page_12_Solution_Evaluation_Measurement_Critique');
      return true;
    } else {
      setAlertMessage('数据提交失败，请重试。');
      setShowAlert(true);
      return false;
    }
  }, [isNextEnabled, logButtonClick, ideas, collectDirectAnswer, submitPageData, navigateToPage]);
  
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
          为验证小明的猜想，首先要确定评估<strong>面团发酵程度</strong>的方法。通过查阅资料，小明发现可以通过<strong>比较发酵前后面团体积变化</strong>来进行评估。
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
          请你帮小明想一想，有哪些可以<span style={{ color: '#d32f2f' }}>测量面团体积</span>的方法。请提出三个可能的想法，将其简要陈述在下方方框内。
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
