import PropTypes from 'prop-types';

/**
 * 酵母用量秘籍资料内容组件
 * 对应PRD中的P9资料
 * 
 * @param {Object} props - 组件属性
 * @param {boolean} props.isModal - 是否在模态框中显示，控制样式
 * @returns {React.ReactElement} 资料内容组件
 */
const MaterialYeastDosage = ({ isModal = true }) => {
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
    padding: '10px',
    borderRadius: '10px',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
    border: '2px dashed #4a90e2',
    margin: '10px 0',
  };

  const formulaContainerStyle = {
    backgroundColor: '#fff8e1',
    padding: '5px',
    borderRadius: '10px',
    
    textAlign: 'center',
    border: '2px solid #ffc107',
    maxWidth: '400px',
    margin: '5px auto',
    boxShadow: '0 3px 8px rgba(0, 0, 0, 0.1)',
  };

  const formulaStyle = {
    fontWeight: 'bold',
    fontSize: '1.2rem',
    color: '#f57f17',
    margin: '10px 0',
  };

  const imageContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '5px 0',
  };

  const exampleContainerStyle = {
    backgroundColor: '#f1f8ff',
    padding: '10px',
    borderRadius: '10px',
    border: '2px solid #4a90e2',
    maxWidth: '500px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  };

  const ingredientStyle = {
    display: 'flex',
    alignItems: 'center',
    margin: '5px 0',
  };

  const ingredientIconStyle = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#f0f0f0',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '10px',
    border: '2px solid #ddd',
    fontSize: '1.2rem',
  };

  const plusSignStyle = {
    margin: '0 10px',
    fontSize: '1.5rem',
    color: '#4a90e2',
    fontWeight: 'bold',
  };

  const equalsSignStyle = {
    margin: '5px 0',
    fontSize: '1.5rem',
    color: '#4a90e2',
    fontWeight: 'bold',
  };

  const resultStyle = {
    backgroundColor: '#e3f2fd',
    padding: '5px 10px',
    borderRadius: '20px',
    fontWeight: 'bold',
    color: '#0d47a1',
    border: '2px solid #90caf9',
  };

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <p style={{textIndent: '2em'}}>
        酵母粉建议用量说明：发酵过程受酵母菌多少影响。在一定范围内，酵母菌越多，发酵速度越快，产生的二氧化碳越多。
          但当酵母菌过多时，产生的二氧化碳会使面团体积过度膨胀，甚至破坏面团的形状和结构。
          日常普通酵母粉(主要成分为酵母菌)的建议用量如下:
        </p>
      </div>
      
      <div style={formulaContainerStyle}>
        <p style={formulaStyle}>
          酵母粉用量 = 面粉量×1%
        </p>
      </div>
      
      <div style={imageContainerStyle}>
        <div style={exampleContainerStyle}>
          <h3 style={{ color: '#4a90e2', marginBottom: '15px' }}>酵母粉用量示例</h3>
          
          <img 
            src="/src/assets/images/P4-5.jpg" 
            alt="酵母粉用量示例" 
            style={{
              maxWidth: '100%',
              height: 'auto',
              borderRadius: '8px',
              margin: '3px 0'
            }}
          />
        </div>
      </div>
            
    </div>
  );
};

MaterialYeastDosage.propTypes = {
  isModal: PropTypes.bool
};

export default MaterialYeastDosage; 