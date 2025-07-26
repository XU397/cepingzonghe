import PropTypes from 'prop-types';
import principleImage from '../../assets/images/P4-2.png';

/**
 * 发酵原理趣话资料内容组件
 * 对应PRD中的P6资料
 * 
 * @param {Object} props - 组件属性
 * @param {boolean} props.isModal - 是否在模态框中显示，控制样式
 * @returns {React.ReactElement} 资料内容组件
 */
const MaterialPrinciple = ({ isModal = true }) => {
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

  const contentStyle = {
    fontSize: '1rem',
    lineHeight: '1.6',
    color: '#333',
    backgroundColor: '#f9f9f9',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
    border: '2px dashed #4a90e2',
    margin: '20px 0',
  };



  const imageContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '25px 0',
  };

  const imageStyle = {
    maxWidth: '90%',
    border: '3px solid #ddd',
    borderRadius: '10px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
  };

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>面团发酵原理</h2>
      
      <div style={contentStyle}>
        <p style={{textIndent: '2em'}}>
          面团发酵主要是酵母菌将面粉中的糖类物质转化为二氧化碳气体和酒精的过程。
          产生的二氧化碳气体在面团中被面筋网络包裹，使面团膨胀，形成松软的结构。
          酒精则在后续的蒸制过程中挥发掉，不会对馒头口感产生显著影响。
        </p>
      </div>
      
      <div style={imageContainerStyle}>
        <img 
          src={principleImage} 
          alt="酵母菌发酵原理图" 
          style={{
            maxWidth: '70%',
            width: '70%',
            height: 'auto',
            border: '2px solid #ddd',
            borderRadius: '10px',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
          }}
        />
      </div>
      
      
    </div>
  );
};

MaterialPrinciple.propTypes = {
  isModal: PropTypes.bool
};

export default MaterialPrinciple; 