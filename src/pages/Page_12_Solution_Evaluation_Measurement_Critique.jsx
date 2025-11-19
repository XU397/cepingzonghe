import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { useDataLogging } from '../hooks/useDataLogging';
import TextInput from '../components/common/TextInput';
import NavigationButton from '../components/common/NavigationButton';

// 导入图片
import method1Image from '../assets/images/06-1.jpg';
import method2Image from '../assets/images/06-2.jpeg';
import method3Image from '../assets/images/06-3.png';

/**
 * P12：蒸馒头:方案评估 - 测量方法评价页面
 * 让用户对三种不同的测量面团体积的方法进行评价
 * 
 * @returns {React.ReactElement} 方案评估测量方法评价页面
 */
const Page_12_Solution_Evaluation_Measurement_Critique = () => {
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
  } = useDataLogging('Page_12_Solution_Evaluation_Measurement_Critique');
  
  const [critiques, setCritiques] = useState({
    method1: { advantages: '', disadvantages: '' },
    method2: { advantages: '', disadvantages: '' },
    method3: { advantages: '', disadvantages: '' }
  });
  const [isNextEnabled, setIsNextEnabled] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // 使用ref防止重复执行
  const pageLoadedRef = useRef(false);
  const prevCritiquesRef = useRef({});

  // 页面进入记录 - 只执行一次
  useEffect(() => {
    if (!pageLoadedRef.current) {
      pageLoadedRef.current = true;
      setPageEnterTime(new Date());
      logPageEnter('方案评估测量方法评价页面');
    }
  }, []);

  // 缓存是否所有字段都填写完成的计算
  const allFieldsFilled = useMemo(() => {
    return Object.values(critiques).every(methodCritiques => 
      methodCritiques.advantages.trim().length > 0 && methodCritiques.disadvantages.trim().length > 0
    );
  }, [critiques]);

  // 更新按钮状态 - 使用缓存避免不必要的状态更新
  useEffect(() => {
    if (isNextEnabled !== allFieldsFilled) {
      setIsNextEnabled(allFieldsFilled);
    }
  }, [allFieldsFilled, isNextEnabled]);

  /**
   * 处理评价输入变化
   */
  const handleCritiqueChange = useCallback((key, fieldType, value) => {
    setCritiques(prevCritiques => ({
      ...prevCritiques,
      [key]: {
        ...prevCritiques[key],
        [fieldType]: value
      }
    }));
    
    // 记录输入操作
    const methodNumber = key.replace('method', '');
    const fieldName = fieldType === 'advantages' ? '优点' : '缺点';
    logInput(`方法${methodNumber}${fieldName}输入框`, value);
  }, [logInput]);

  /**
   * 处理输入框失焦
   */
  const handleInputBlur = useCallback((methodKey, fieldType) => {
    const value = critiques[methodKey][fieldType];
    const methodNumber = methodKey.replace('method', '');
    const fieldName = fieldType === 'advantages' ? '优点' : '缺点';
    
    // 使用缓存机制避免重复提交相同答案
    const currentCritiques = JSON.stringify(critiques);
    const prevCritiques = JSON.stringify(prevCritiquesRef.current);
    
    if (currentCritiques !== prevCritiques) {
      prevCritiquesRef.current = { ...critiques };
      logInputBlur(`方法${methodNumber}${fieldName}输入框`, value, `方法${methodNumber}${fieldName}答案`);
    }
  }, [critiques, logInputBlur]);

  const handleNextPage = useCallback(async () => {
    if (!isNextEnabled) {
      setAlertMessage('请对每种方法的优点和缺点都进行评价。');
      setShowAlert(true);
      logButtonClick('下一页', '点击失败 - 未完成所有评价');
      return false;
    }

    logButtonClick('下一页', '点击成功');
    
    // 收集所有评价作为答案
    Object.entries(critiques).forEach(([methodKey, fields], index) => {
      const methodNumber = index + 1;
      if (fields.advantages.trim()) { 
        collectDirectAnswer(`测量方法${methodNumber}优点`, fields.advantages.trim());
      }
      if (fields.disadvantages.trim()) {
        collectDirectAnswer(`测量方法${methodNumber}缺点`, fields.disadvantages.trim());
      }
    });
    
    const submissionSuccess = await submitPageData();
    if (submissionSuccess) {
      navigateToPage('Page_13_Transition_To_Simulation', { skipSubmit: true });
      return true;
    } else {
      setAlertMessage('数据提交失败，请重试。');
      setShowAlert(true);
      return false;
    }
  }, [isNextEnabled, logButtonClick, critiques, collectDirectAnswer, submitPageData, navigateToPage]);
  
  // 缓存方法数据
  const methodsData = useMemo(() => [
    {
      key: 'method1',
      title: '方法一: 标记法',
      imageSrc: method1Image,
      description: '将面团近似看成长方体，测量发酵前、后面团的长度、宽度和高度。运用长方体体积公式，算出面团体积。',
      advantagesPlaceholder: '请在此处写下方法一的优点。',
      disadvantagesPlaceholder: '请在此处写下方法一的缺点。',
      advantagesInputDesc: '方法1优点输入框',
      disadvantagesInputDesc: '方法1缺点输入框'
    },
    {
      key: 'method2',
      title: '方法二: 排水法',
      imageSrc: method2Image,
      description: '将一杯盛满水的水杯事先放在水盆中，将面团放入水杯，通过测量水盆中收集的溢出水体积，算出面团体积。',
      advantagesPlaceholder: '请在此处写下方法二的优点。',
      disadvantagesPlaceholder: '请在此处写下方法二的缺点。',
      advantagesInputDesc: '方法2优点输入框',
      disadvantagesInputDesc: '方法2缺点输入框'
    },
    {
      key: 'method3',
      title: '方法三: 烧杯法',
      imageSrc: method3Image,
      description: '将面团放入带有刻度的烧杯中发酵，直接读取发酵前、后面团的体积。',
      advantagesPlaceholder: '请在此处写下方法三的优点。',
      disadvantagesPlaceholder: '请在此处写下方法三的缺点。',
      advantagesInputDesc: '方法3优点输入框',
      disadvantagesInputDesc: '方法3缺点输入框'
    },
  ], []);

  const AlertBox = ({ message, onClose }) => (
    <div style={{
      position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
      backgroundColor: '#f8d7da', color: '#721c24', padding: '5px 20px',
      borderRadius: '5px', border: '1px solid #f5c6cb', zIndex: 1050,
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
    }}>
      <span>{message}</span>
      <button onClick={onClose} style={{ marginLeft: '15px', border: 'none', background: 'transparent', color: '#721c24', fontWeight: 'bold', cursor: 'pointer' }}>X</button>
    </div>
  );

  return (
    <div className="page-container page-fade-in solution-evaluation-critique-page" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {showAlert && <AlertBox message={alertMessage} onClose={() => setShowAlert(false)} />}

      <h1 className="page-title" style={{ textAlign: 'center', color: '#333', marginBottom: '8px' }}>蒸馒头: 方案评估</h1>
      
      <div style={{
        backgroundColor: '#e3f2fd', 
        padding: '8px',
        borderRadius: '12px',
        marginBottom: '10px',
        border: '2px dashed #64b5f6',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <p style={{ fontSize: '1.05em', lineHeight: '1.5', color: '#01579b', margin: 0, textIndent: '2em' }}>
        小明提出了以下三种测量面团体积的方法，请对三种方法的优缺点分别进行评价，并写在相应方框内。
        </p>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '15px',
        marginBottom: '5px'
      }}>
        {methodsData.map((method) => (
          <div key={method.key} style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            overflow: 'hidden',
            border: '1px solid #b3e5fc',
            height: 'fit-content'
          }}>
            <div style={{
              backgroundColor: '#4fc3f7',
              color: 'white',
              padding: '8px 12px',
              fontWeight: 'bold',
              fontSize: '1em',
              textAlign: 'center'
            }}>
              {method.title}
            </div>
            <div style={{ padding: '5px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{
                minWidth: '100px', 
                height: '140px', 
                backgroundColor: '#e0f7fa', 
                borderRadius: '6px', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                color: '#00796b', 
                textAlign: 'center', 
                padding: '8px', 
                border: '2px dashed #4dd0e1',
                margin: '0 auto'
              }}>
                <img src={method.imageSrc} alt={method.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <p style={{ 
                margin: '2px 0', 
                fontSize: '0.9em', 
                lineHeight: '1.4', 
                color: '#37474f',
                height: '45px',
                overflow: 'auto',
                textIndent: '2em'
              }}>
                {method.description}
              </p>
              <label style={{ fontSize: '0.9em', color: '#333', marginTop: '-10px',fontWeight: 'bold', display: 'block' }}>优点：</label>
              <TextInput
                value={critiques[method.key].advantages}
                onChange={(value) => handleCritiqueChange(method.key, 'advantages', value)}
                placeholder={method.advantagesPlaceholder}
                isMultiline={true}
                elementDesc={method.advantagesInputDesc}
                rows={3}
                onBlur={() => handleInputBlur(method.key, 'advantages')}
                style={{
                  width: '100%',
                  padding: '4px',
                  border: '1px solid #81d4fa',
                  borderRadius: '6px',
                  fontSize: '0.9em',
                  boxSizing: 'border-box',
                  lineHeight: '1.4',
                  height: '50px',
                  resize: 'none',
                }}
              />
              <label style={{ fontSize: '0.9em', color: '#333', marginTop: '-10px', fontWeight: 'bold', display: 'block' }}>缺点：</label>
              <TextInput
                value={critiques[method.key].disadvantages}
                onChange={(value) => handleCritiqueChange(method.key, 'disadvantages', value)}
                placeholder={method.disadvantagesPlaceholder}
                isMultiline={true}
                elementDesc={method.disadvantagesInputDesc}
                rows={3}
                onBlur={() => handleInputBlur(method.key, 'disadvantages')}
                style={{
                  width: '100%',
                  padding: '4px',
                  border: '1px solid #81d4fa',
                  borderRadius: '6px',
                  fontSize: '0.9em',
                  boxSizing: 'border-box',
                  lineHeight: '1.4',
                  height: '50px',
                  resize: 'none'
                }}
              />
            </div>
          </div>
        ))}
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '-10px' }}>
        <NavigationButton
          currentPageId={currentPageId}
          onClick={handleNextPage}
          buttonText="下一页"
          disabled={!isNextEnabled}
        />
      </div>
    </div>
  );
};

export default Page_12_Solution_Evaluation_Measurement_Critique; 
