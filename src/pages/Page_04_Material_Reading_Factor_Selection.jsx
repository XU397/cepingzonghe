import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import EventTypes from '@shared/services/submission/eventTypes.js';
import { usePageSubmissionContext } from '@shared/ui/PageFrame/AssessmentPageFrame.jsx';
import { useAppContext } from '../context/AppContext';
import Modal from '../components/common/Modal';
import NavigationButton from '../components/common/NavigationButton';
import {
  MaterialProcess,
  MaterialPrinciple,
  MaterialTechniques,
  MaterialDiscussion,
  MaterialYeastDosage
} from '../components/materials';

/**
 * P4：资料阅读与因素选择页面组件
 * 包含五个可点击的资料链接和六个复选框选项
 *
 * @returns {React.ReactElement} 资料阅读与因素选择页面
 */
const Page_04_Material_Reading_Factor_Selection = () => {
  const { 
    navigateToPage,
    currentPageId,
    setPageEnterTime,
  } = useAppContext();
  const { submitPage, logOperation } = usePageSubmissionContext();
  
  const [openModalId, setOpenModalId] = useState(null);
  const [modalOpenTime, setModalOpenTime] = useState(null);
  const [factorSelections, setFactorSelections] = useState({
    fermentationTime: false,
    yeastAmount: false,
    fermentationTemp: false,
    sugarAmount: false,
    kneadingForce: false,
    oilAmount: false
  });
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // 使用ref防止重复执行
  const pageLoadedRef = useRef(false);
  const operationsRef = useRef([]);
  const recordOperation = useCallback((operation) => {
    const normalizedOperation = { ...operation };
    logOperation(normalizedOperation);
    operationsRef.current = [...operationsRef.current, normalizedOperation];
  }, [logOperation]);

  // 页面进入记录 - 只执行一次
  useEffect(() => {
    if (!pageLoadedRef.current) {
      pageLoadedRef.current = true;
      operationsRef.current = [];
      setPageEnterTime(new Date());
    }
  }, [setPageEnterTime]);

  // 缓存是否禁用下一页按钮的计算
  const isNextButtonDisabled = useMemo(() => {
    return Object.values(factorSelections).every(v => !v);
  }, [factorSelections]);

  /**
   * 获取模态框标题
   */
  const getModalTitle = useCallback((modalId) => {
    switch(modalId) {
      case 'process': return '蒸馒头全流程';
      case 'principle': return '发酵原理趣话';
      case 'techniques': return '发酵技巧讲堂';
      case 'discussion': return '发酵问题讨论';
      case 'yeastDosage': return '酵母用量秘籍';
      default: return '';
    }
  }, []);

  /**
   * 获取因素的显示名称
   */
  const getFactorDisplayName = useCallback((factorKey) => {
    const factorMap = {
      fermentationTime: '发酵时长',
      yeastAmount: '酵母用量',
      fermentationTemp: '发酵温度',
      sugarAmount: '白糖用量',
      kneadingForce: '揉面力度',
      oilAmount: '食用油用量'
    };
    return factorMap[factorKey] || '';
  }, []);

  /**
   * 打开资料模态框
   */
  const openModal = useCallback((modalId) => {
    setOpenModalId(modalId);
    const currentTime = new Date();
    setModalOpenTime(currentTime);
    
    recordOperation({
      eventType: EventTypes.MODAL_OPEN,
      targetElement: `material_modal_${modalId}`,
      value: getModalTitle(modalId)
    });
  }, [getModalTitle, recordOperation]);
  
  /**
   * 关闭资料模态框
   */
  const closeModal = useCallback(() => {
    if (modalOpenTime && openModalId) {
      const viewDuration = Math.floor((new Date().getTime() - modalOpenTime.getTime()) / 1000);
      
      recordOperation({
        eventType: EventTypes.MODAL_CLOSE,
        targetElement: `material_modal_${openModalId}`,
        value: { duration: viewDuration, modalId: openModalId }
      });
    }
    
    setOpenModalId(null);
    setModalOpenTime(null);
  }, [modalOpenTime, openModalId, recordOperation]);
  
  /**
   * 处理因素选择变更
   */
  const handleFactorChange = useCallback((factorKey) => {
    const newSelections = {
      ...factorSelections,
      [factorKey]: !factorSelections[factorKey]
    };
    
    setFactorSelections(newSelections);
    
    const factorDisplayName = getFactorDisplayName(factorKey);
    recordOperation({
      eventType: newSelections[factorKey] ? EventTypes.CHECKBOX_CHECK : EventTypes.CHECKBOX_UNCHECK,
      targetElement: `factor_${factorKey}`,
      value: factorDisplayName
    });
  }, [factorSelections, getFactorDisplayName, recordOperation]);
  
  /**
   * 处理下一页按钮点击
   */
  const handleNextPage = useCallback(async () => {
    const selectedFactorKeys = Object.keys(factorSelections).filter(
      (key) => factorSelections[key]
    );

    recordOperation({
      eventType: EventTypes.CLICK,
      targetElement: 'btn_next',
      value: selectedFactorKeys.length === 0 ? '未选择任何因素' : '提交因素选择'
    });

    if (selectedFactorKeys.length === 0) {
      setAlertMessage('请至少选择一个可能的因素');
      setShowAlert(true);
      return false;
    }
    
    const answers = selectedFactorKeys.map((key) => ({
      targetElement: `影响因素选择:${getFactorDisplayName(key)}`,
      value: getFactorDisplayName(key)
    })).filter((answer) => answer.value);
    
    const submissionSuccess = await submitPage({
      answers,
      operations: operationsRef.current,
    });
    if (submissionSuccess) {
      navigateToPage('Page_10_Hypothesis_Focus', { skipSubmit: true });
      return true;
    } else {
      setAlertMessage('数据提交失败，请重试');
      setShowAlert(true);
      return false; 
    }
  }, [factorSelections, getFactorDisplayName, navigateToPage, recordOperation, submitPage]);

  // 缓存模态框内容渲染
  const modalContent = useMemo(() => {
    if (!openModalId) {
      return <div style={{ textAlign: 'center', color: '#666' }}>请选择要查看的资料</div>;
    }
    
    switch(openModalId) {
      case 'process': 
        return <MaterialProcess />;
      case 'principle': 
        return <MaterialPrinciple />;
      case 'techniques': 
        return <MaterialTechniques />;
      case 'discussion': 
        return <MaterialDiscussion />;
      case 'yeastDosage': 
        return <MaterialYeastDosage />;
      default: 
        return <div style={{ textAlign: 'center', color: '#666' }}>未找到相关资料内容</div>;
    }
  }, [openModalId]);

  // 缓存资料链接数据
  const materialLinks = useMemo(() => [
    { id: 'process', text: '📖 蒸馒头全流程' },
    { id: 'principle', text: '🧪 发酵原理趣话' },
    { id: 'techniques', text: '💡 发酵技巧讲堂' },
    { id: 'discussion', text: '💬 发酵问题讨论' },
    { id: 'yeastDosage', text: '⚖️ 酵母用量秘籍' },
  ], []);

  // 缓存因素数据
  const factors = useMemo(() => [
    { key: 'fermentationTime', label: '发酵时长' },
    { key: 'yeastAmount', label: '酵母用量' },
    { key: 'fermentationTemp', label: '发酵温度' },
    { key: 'sugarAmount', label: '白糖用量' },
    { key: 'kneadingForce', label: '揉面力度' },
    { key: 'oilAmount', label: '食用油用量' },
  ], []);

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
    <div className="page-container page-fade-in material-reading-page" style={{ padding: '20px',  margin: '0 auto'}}>
      {showAlert && <AlertBox message={alertMessage} onClose={() => setShowAlert(false)} />}
      
      <h1 className="page-title" style={{ textAlign: 'center', color: '#333', marginBottom: '25px' }}>蒸馒头: 资料阅读</h1>
      
      <div className="content-wrapper" style={{ display: 'flex', gap: '30px' }}>
        <div className="info-center" style={{ 
          flex: 1, 
          padding: '20px', 
          backgroundColor: '#e9f5ff', 
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
        }}>
          <h2 style={{ marginTop: 0, color: '#0056b3', borderBottom: '2px solid #0056b3', paddingBottom: '10px', marginBottom: '15px' }}>信息中心</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {materialLinks.map(link => (
              <li key={link.id} style={{ marginBottom: '12px' }}>
                <button 
                  onClick={() => openModal(link.id)}
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    backgroundColor: '#4a90e2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    transition: 'background-color 0.2s ease',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = '#357abd'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = '#4a90e2'}
                >
                  
                  {link.text}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="factor-selection" style={{ 
          flex: 2, 
          padding: '20px', 
          backgroundColor: '#fff8e1', 
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
        }}>
          <p style={{ marginTop: 0, fontSize: '1.1em', color: '#5d4037', lineHeight: '1.6', marginBottom: '20px', textIndent: '2em' }}>
            为探索影响面团过度发酵的因素，小明搜集了左侧的五条资料。请点击并查看资料，思考面团过度发酵(膨胀松弛)可能与以下哪些因素有关？单击选择你认为正确的选项，再次点击可取消选择 (可多选)。
          </p>
          <div className="checkbox-group" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
            {factors.map(factor => (
              <label 
                key={factor.key} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: factorSelections[factor.key] ? '#c8e6c9' : '#f1f8e9',
                  border: '2px solid',
                  borderColor: factorSelections[factor.key] ? '#4caf50' : '#a5d6a7',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: factorSelections[factor.key] ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <input
                  type="checkbox"
                  checked={factorSelections[factor.key]}
                  onChange={() => handleFactorChange(factor.key)}
                  style={{ marginRight: '10px', transform: 'scale(1.3)', accentColor: '#4caf50' }}
                />
                <span style={{ color: '#388e3c', fontWeight: factorSelections[factor.key] ? 'bold' : 'normal' }}>
                  {factor.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <NavigationButton
          currentPageId={currentPageId}
          onClick={handleNextPage}
          buttonText="下一页"
          disabled={isNextButtonDisabled}
        />
      </div>

      <Modal 
        isOpen={!!openModalId}
        onClose={closeModal} 
        title={openModalId ? getModalTitle(openModalId) : ''}
        width="70%"
        height="80vh"
      >
        {modalContent} 
      </Modal>
    </div>
  );
};

export default Page_04_Material_Reading_Factor_Selection; 
