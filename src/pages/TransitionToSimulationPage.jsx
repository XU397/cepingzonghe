import React, { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useDataLogging } from '../hooks/useDataLogging';
import NavigationButton from '../components/common/NavigationButton';
// 导入小明图片
import xiaomingImage from '../assets/images/04-2.png';

/**
 * 蒸馒头过渡到模拟实验页面组件
 * 引导用户进入模拟实验阶段
 */
const TransitionToSimulationPage = () => {
  const { 
    currentPageId, 
    setPageEnterTime,
    navigateToPage,
    submitPageData
  } = useAppContext();
  
  // 数据记录Hook
  const {
    logButtonClick,
    logPageEnter
  } = useDataLogging('Page_13_Transition_To_Simulation');
  
  // 页面进入记录
  useEffect(() => {
    setPageEnterTime(new Date());
    logPageEnter('过渡到模拟实验页面');
  }, [setPageEnterTime, logPageEnter]);
  
  /**
   * 处理下一页按钮点击
   * @async
   * @returns {Promise<boolean>} 返回true表示操作成功，false表示失败
   */
  const handleNextPage = async () => {
    // 记录按钮点击操作
    logButtonClick('下一页', '跳转到模拟实验页面');
    
    // 提交页面数据
    const submissionSuccess = await submitPageData();

    if (submissionSuccess) {
      navigateToPage('Page_14_Simulation_Intro_Exploration', { skipSubmit: true }); 
    } else {
      console.error('TransitionToSimulationPage: 提交页面数据失败');
      alert('数据提交失败，请稍后再试。');
      return false;
    }
    
    return submissionSuccess;
  };

  return (
    <div className="page-content page-fade-in">
      <h1 className="page-title">蒸馒头</h1>
      
      {/* 小明卡通形象和对话 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        marginBottom: '10px',
        gap: '20px'
      }}>
        {/* 小明卡通形象 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            backgroundColor: '#fff3e0',
            border: '3px solid #ff9800',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(255, 152, 0, 0.2)',
            overflow: 'hidden'
          }}>
            <img 
              src={xiaomingImage} 
              alt="小明"
              style={{
                width: '100px',
                height: '100px',
                objectFit: 'contain'
              }}
            />
          </div>
          
          {/* 小明标识文字 */}
          <div style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#ff9800',
            textAlign: 'center'
          }}>
            小明
          </div>
        </div>
        
        {/* 对话气泡 */}
        <div style={{
          position: 'relative',
          backgroundColor: '#e3f2fd',
          border: '2px solid #2196f3',
          borderRadius: '20px',
          padding: '15px 20px',
          maxWidth: '400px',
          boxShadow: '0 4px 12px rgba(33, 150, 243, 0.2)'
        }}>
          {/* 气泡尖角 */}
          <div style={{
            position: 'absolute',
            left: '-10px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '0',
            height: '0',
            borderTop: '10px solid transparent',
            borderBottom: '10px solid transparent',
            borderRight: '10px solid #2196f3'
          }}/>
          <div style={{
            position: 'absolute',
            left: '-7px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '0',
            height: '0',
            borderTop: '8px solid transparent',
            borderBottom: '8px solid transparent',
            borderRight: '8px solid #e3f2fd'
          }}/>
          
          <p style={{ 
            margin: '0',
            fontSize: '16px',
            color: '#1565c0',
            fontWeight: '500',
            lineHeight: '1.4'
          }}>
            我想借助量筒测量面团发酵前、后的体积。
          </p>
        </div>
      </div>
      
      {/* 主要内容区域 - 左右布局 */}
      <div style={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '60px',
        marginBottom: '40px',
        flexWrap: 'wrap'
      }}>
        {/* 左侧文字内容 */}
        <div style={{ 
          flex: '1',
          minWidth: '300px',
          maxWidth: '500px'
        }}>
          <p style={{ 
            fontSize: '16px', 
            lineHeight: '1.8', 
            margin: '0',
            color: '#333',
            textAlign: 'left',
            textIndent: '2em'
          }}>
            小明最终选择借助量筒测量面团发酵前、后的体积。接下来，请你和小明一起通过模拟实验，探究温度和时间对面团发酵程度的影响吧!
          </p>
        </div>
        
        {/* 右侧量筒图像 */}
        <div style={{ 
          flex: '0 0 auto'
        }}>
          <div style={{ 
            width: '100px',
            height: '230px',
            position: 'relative',
            backgroundColor: '#e6f7ff',
            borderRadius: '20px 20px 0px 0px',
            overflow: 'hidden',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
            border: '8px solid #59c1ff',
            borderTop: 'none'
          }}>
            {/* 量筒刻度线 */}
            {[...Array(10)].map((_, index) => (
              <div 
                key={index}
                style={{
                  position: 'absolute',
                  width: index % 5 === 0 ? '50px' : '30px',
                  height: '2px',
                  backgroundColor: '#2d5b8e',
                  left: index % 5 === 0 ? '20px' : '30px',
                  top: `${35 + index * 30}px`
                }}
              />
            ))}
            
            {/* 量筒内部面团 */}
            <div style={{
              position: 'absolute',
              bottom: '0',
              left: '0',
              width: '100%',
              height: '120px',
              backgroundColor: '#ffce6b',
              borderRadius: '0 0 0px 0px'
            }}/>
            
            {/* 刻度数值 */}
            {[0, 5].map(index => (
              <div 
                key={index}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: `${35 + index * 5 * 30 - 25}px`,
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#2d5b8e'
                }}
              >
                {150 - index * 50}ml
              </div>
            ))}
          </div>
        </div>
      </div>
      
              <div style={{ marginTop: '40px' }}>
          <NavigationButton 
            currentPageId={currentPageId}
            onClick={handleNextPage}
            buttonText="下一页"
          />
        </div>
    </div>
  );
};

export default TransitionToSimulationPage; 
