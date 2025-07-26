import PropTypes from 'prop-types';
import processImage from '../../assets/images/P4.png';

/**
 * 蒸馒头全流程资料内容组件
 * 对应PRD中的P5资料
 * 
 * @param {Object} props - 组件属性
 * @param {boolean} props.isModal - 是否在模态框中显示，控制样式
 * @returns {React.ReactElement} 资料内容组件
 */
const MaterialProcess = ({ isModal = true }) => {
  const containerStyle = {
    padding: isModal ? '0' : '20px',
    maxWidth: '100%',
    margin: '0 auto',
  };

  const titleStyle = {
    color: '#333',
    fontSize: '1.5rem',
    textAlign: 'center',
    marginBottom: '20px',
    fontWeight: 'bold',
  };

  const imageContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    margin: '20px 0',
  };

  const imageStyle = {
    maxWidth: '80%',
    width: '80%',
    height: 'auto',
    borderRadius: '10px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
    border: '2px solid #ddd',
  };

  return (
    <div style={containerStyle}>
      
      
      <div style={imageContainerStyle}>
        <img 
          src={processImage} 
          alt="蒸馒头全流程图" 
          style={imageStyle}
        />
      </div>
    </div>
  );
};

MaterialProcess.propTypes = {
  isModal: PropTypes.bool
};

export default MaterialProcess; 