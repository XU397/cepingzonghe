import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';

/**
 * 通用模态框组件
 * 
 * @param {Object} props - 组件属性
 * @param {boolean} props.isOpen - 控制模态框是否打开
 * @param {Function} props.onClose - 关闭模态框的回调函数
 * @param {string} props.title - 模态框标题
 * @param {React.ReactNode} props.children - 模态框内容
 * @param {string} [props.width='80%'] - 模态框宽度
 * @param {string} [props.height='auto'] - 模态框高度
 * @param {string} [props.closeButtonText='退出'] - 关闭按钮文本
 * @returns {React.ReactPortal|null} 模态框组件或null
 */
const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  width = '80%', 
  height = 'auto',
  closeButtonText = '退出'
}) => {
  useEffect(() => {
    if (isOpen) {
      // 当模态框打开时，禁止背景滚动
      document.body.style.overflow = 'hidden';
    } else {
      // 当模态框关闭时，恢复背景滚动
      document.body.style.overflow = 'unset';
    }

    // 组件卸载时恢复背景滚动
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // 如果模态框未打开，则不渲染任何内容
  if (!isOpen) return null;

  // 使用createPortal将模态框内容渲染到body末尾，避免被父组件的样式影响
  return createPortal(
    <div 
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
      onClick={onClose} // 点击遮罩层关闭模态框
    >
      <div 
        className="modal-content"
        style={{
          width,
          maxWidth: '90vw',
          height,
          maxHeight: '90vh',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '3px solid #4a90e2', // 卡通风格边框
        }}
        onClick={e => e.stopPropagation()} // 防止点击内容区域时关闭模态框
      >
        <div 
          className="modal-header"
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '15px',
            borderBottom: '2px dashed #4a90e2', // 卡通风格分隔线
            paddingBottom: '10px'
          }}
        >
          <h2 
            style={{ 
              margin: 0, 
              color: '#4a90e2',
              fontSize: '1.5rem',
              fontWeight: 'bold'
            }}
          >
            {title}
          </h2>
        </div>
        
        <div 
          className="modal-body"
          style={{ 
            flexGrow: 1,
            overflowY: 'auto',
            marginBottom: '15px',
            padding: '5px'
          }}
        >
          {children || <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>内容加载中...</div>}
        </div>
        
        <div 
          className="modal-footer"
          style={{ 
            display: 'flex', 
            justifyContent: 'center' 
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 24px',
              backgroundColor: '#FF9500',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 0 #D97B00',
              transition: 'all 0.2s ease',
              outline: 'none'
            }}
            onMouseOver={e => {
              e.currentTarget.style.backgroundColor = '#FFB347';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.backgroundColor = '#FF9500';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onMouseDown={e => {
              e.currentTarget.style.boxShadow = '0 2px 0 #D97B00';
              e.currentTarget.style.transform = 'translateY(2px)';
            }}
            onMouseUp={e => {
              e.currentTarget.style.boxShadow = '0 4px 0 #D97B00';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {closeButtonText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
  width: PropTypes.string,
  height: PropTypes.string,
  closeButtonText: PropTypes.string
};

export default Modal; 