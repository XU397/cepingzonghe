import PropTypes from 'prop-types';
import techniquesImage from '../../assets/images/P4-3.png';

/**
 * 发酵技巧讲堂资料内容组件
 * 对应PRD中的P7资料
 * 
 * @param {Object} props - 组件属性
 * @param {boolean} props.isModal - 是否在模态框中显示，控制样式
 * @returns {React.ReactElement} 资料内容组件
 */
const MaterialTechniques = ({ isModal = true }) => {
  const containerStyle = {
    padding: isModal ? '0' : '20px',
    maxWidth: '100%',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  return (
    <div style={containerStyle}>
      <img 
        src={techniquesImage} 
        alt="发酵技巧讲堂" 
        style={{
          maxWidth: '90%',
          width: '90%',
          height: 'auto',
          borderRadius: '10px',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
        }}
      />
    </div>
  );
};

MaterialTechniques.propTypes = {
  isModal: PropTypes.bool
};

export default MaterialTechniques; 