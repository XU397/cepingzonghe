import React, { useEffect, useCallback, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { useDataLogging } from '../hooks/useDataLogging';
import NavigationButton from '../components/common/NavigationButton';
import xiaomingImage from '../assets/images/04-2.png';
import mamaImage from '../assets/images/04-1.png';

/**
 * P10: 蒸馒头聚焦猜想页面组件 (PRD User_Step_Number_PDF_Ref: 4)
 * 展示过度发酵的原因猜想和参数对比，引导用户进入实验设计阶段。
 */
const HypothesisFocusPage = () => {
  const {
    navigateToPage,
    logOperation,
    submitPageData,
    currentPageId,
    setPageEnterTime
  } = useAppContext();
  
  // 数据记录Hook
  const {
    logButtonClick,
    logPageEnter
  } = useDataLogging('Page_10_Hypothesis_Focus');
  
  // 使用ref防止重复执行
  const pageLoadedRef = useRef(false);
  
  // 页面进入记录 - 只执行一次
  useEffect(() => {
    if (!pageLoadedRef.current) {
      pageLoadedRef.current = true;
      console.log('[HypothesisFocusPage] 页面挂载，设置页面进入时间');
      setPageEnterTime(new Date());
      logPageEnter('假设聚焦页面');
      console.log('[HypothesisFocusPage] 页面进入记录完成');
    }
  }, []);

  /**
   * 处理下一页按钮点击
   */
  const handleNextPage = useCallback(async () => {
    // 记录按钮点击操作
    logButtonClick('下一页', '跳转到方案设计页面');
    
    // 提交页面数据
    const submissionSuccess = await submitPageData();

    if (submissionSuccess) {
      navigateToPage('Page_11_Solution_Design_Measurement_Ideas', { skipSubmit: true }); 
    } else {
      console.error('HypothesisFocusPage: 提交页面数据失败');
      alert('数据提交失败，请稍后再试。');
      return false;
    }
    
    return submissionSuccess;
  }, [logButtonClick, submitPageData, navigateToPage]);

  return (
    <div className="page-container page-fade-in hypothesis-focus-page" style={{ padding: '20px',  margin: '0 auto' }}>
      <h1 className="page-title" style={{ textAlign: 'center', color: '#333', marginBottom: '25px' }}>蒸馒头</h1>
      
      <div className="hypothesis-content" style={{ backgroundColor: '#fdfdfe', padding: '25px', borderRadius: '12px', boxShadow: '0 3px 15px rgba(0,0,0,0.07)' }}>
        <p style={{ fontSize: '1.05em', lineHeight: '1.8', marginBottom: '20px', color: '#455a64', textIndent: '2em' }}>
        过度发酵和许多因素有关。通过对比自己和妈妈做馒头的流程，小明发现他们在面粉配比、酵母用量和环境湿度等因素上保持一致，唯独在面团的<strong>发酵温度</strong>和<strong>时间</strong>上存在差异（如下所示）。据此，小明推测发酵温度和时间控制不当可能是导致自己蒸馒头失败的原因。
        </p>
        
       

        {/* 人物卡片部分 */}
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'flex-start',
          gap: '20px',
          flexWrap: 'wrap',
          marginBottom: '0px'
        }}>
          {/* 妈妈卡片 */}
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flex: '1',
            minWidth: '250px',
            maxWidth: '300px'
          }}>
            
            
            <div style={{
              border: '2px solid #f8bbd9',
              borderRadius: '10px',
              padding: '15px',
              backgroundColor: '#fff',
              textAlign: 'center',
              fontSize: '1.1em',
              lineHeight: '1.6',
              minWidth: '180px'
            }}>
              <div style={{ marginBottom: '8px', textAlign: 'left' }}>
                <strong>发酵温度：</strong> <span style={{ color: '#e91e63' }}>35°C</span>
              </div>
              <div style={{ textAlign: 'left' }}>
                <strong>发酵时间：</strong> <span style={{ color: '#e91e63' }}>4小时</span>
              </div>
            </div>
            <img 
              src={mamaImage} 
              alt="妈妈" 
              style={{
                width: '80px',
                height: 'auto',
                marginTop: '15px',
                maxHeight: '150px',
                objectFit: 'contain'
              }}
            />
            <h3 style={{ 
              margin: '0 0 15px 0',
              fontSize: '1.2em',
              color: '#333'
            }}>妈妈</h3>
          </div>

          {/* 小明卡片 */}
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flex: '1',
            minWidth: '250px',
            maxWidth: '300px'
          }}>
            
           
            <div style={{
              border: '2px solid #64b5f6',
              borderRadius: '10px',
              padding: '15px',
              backgroundColor: '#fff',
              textAlign: 'center',
              fontSize: '1.1em',
              lineHeight: '1.6',
              minWidth: '180px'
            }}>
              <div style={{ marginBottom: '8px', textAlign: 'left' }}>
                <strong>发酵温度：</strong> <span style={{ color: '#1976d2' }}>30°C</span>
              </div>
              <div style={{textAlign: 'left' }}>
                <strong>发酵时间：</strong> <span style={{ color: '#1976d2' }}>6小时</span>
              </div>
            </div>
            <img 
              src={xiaomingImage} 
              alt="小明" 
              style={{
                width: '80px',
                height: 'auto',
                marginTop: '15px',
                maxHeight: '150px',
                objectFit: 'contain'
              }}
            />
             <h3 style={{ 
              margin: '0 0 15px 0',
              fontSize: '1.2em',
              color: '#333'
            }}>小明</h3>
          </div>
        </div>
        
        <p style={{ 
          fontSize: '1.1em', 
          lineHeight: '1.8', 
          textAlign: 'center',
          fontWeight: 'bold',
          color: '#007bff',
          padding: '10px',
          backgroundColor: '#e7f3ff',
          borderRadius: '8px'
        }}>
          接下来，请你通过实验，探究小明的猜想是否正确吧!
        </p>
      </div>
      
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0px' }}>
          <NavigationButton 
            currentPageId={currentPageId}
            onClick={handleNextPage}
            buttonText="下一页"
          />
        </div>
    </div>
  );
};

export default HypothesisFocusPage; 
