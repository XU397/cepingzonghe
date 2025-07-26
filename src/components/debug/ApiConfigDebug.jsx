import { getApiConfig, buildApiUrl } from '../../config/apiConfig';

/**
 * API配置调试组件
 * 显示当前环境的API配置信息，用于调试部署问题
 */
const ApiConfigDebug = () => {
  const config = getApiConfig();
  const currentHost = window.location.origin;
  const isDev = import.meta.env.DEV;
  const isProd = import.meta.env.PROD;

  const styles = {
    container: {
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: '#f0f0f0',
      border: '1px solid #ccc',
      borderRadius: '5px',
      padding: '10px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px',
      fontFamily: 'monospace'
    },
    title: {
      fontWeight: 'bold',
      marginBottom: '5px',
      color: '#333'
    },
    item: {
      margin: '2px 0',
      wordBreak: 'break-all'
    },
    env: {
      color: isDev ? 'green' : 'blue',
      fontWeight: 'bold'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.title}>🔧 API配置调试</div>
      <div style={styles.item}>
        <strong>环境:</strong> <span style={styles.env}>{isDev ? '开发' : '生产'}</span>
      </div>
      <div style={styles.item}>
        <strong>当前域名:</strong> {currentHost}
      </div>
      <div style={styles.item}>
        <strong>API基础URL:</strong> {config.baseURL}
      </div>
      <div style={styles.item}>
        <strong>登录API:</strong> {buildApiUrl('/login')}
      </div>
      <div style={styles.item}>
        <strong>提交API:</strong> {buildApiUrl('/saveHcMark')}
      </div>
      <div style={styles.item}>
        <strong>超时时间:</strong> {config.timeout}ms
      </div>
      <div style={styles.item}>
        <strong>模式:</strong> {import.meta.env.MODE}
      </div>
    </div>
  );
};

export default ApiConfigDebug; 