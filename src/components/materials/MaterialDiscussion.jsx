import PropTypes from 'prop-types';

/**
 * 发酵问题讨论资料内容组件
 * 对应PRD中的P8资料
 * 
 * @param {Object} props - 组件属性
 * @param {boolean} props.isModal - 是否在模态框中显示，控制样式
 * @returns {React.ReactElement} 资料内容组件
 */
const MaterialDiscussion = ({ isModal = true }) => {
  const containerStyle = {
    padding: isModal ? '0' : '20px',
    maxWidth: '100%',
    margin: '0 auto',
  };





  const avatarStyle = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#e6e6e6',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '10px',
    fontSize: '1.2rem',
    color: '#666',
  };

  const usernameStyle = {
    fontWeight: 'bold',
    color: '#333',
  };








  return (
    <div style={containerStyle}>
      <img 
        src="/src/assets/images/P4-4.jpg" 
        alt="发酵问题讨论区" 
        style={{
          maxWidth: '85%',
          width: '85%',
          height: 'auto',
          borderRadius: '10px',
          boxShadow: '0 3px 10px rgba(0, 0, 0, 0.1)',
          margin: '20px auto',
          display: 'block'
        }}
      />
    </div>
  );
};

MaterialDiscussion.propTypes = {
  isModal: PropTypes.bool
};

export default MaterialDiscussion; 