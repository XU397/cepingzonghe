import { encrypt } from '../../utils/jsencrypt.ts';
import { buildApiUrl, getFetchOptions } from '../../config/apiConfig.js';
import { orderMarkFields } from './submission/createMarkObject.js';

/**
 * 过滤字符串中的 emoji 和其他 4 字节 UTF-8 字符
 * MySQL utf8 字符集只支持 3 字节字符，需要过滤掉 4 字节字符（Unicode > 0xFFFF）
 * @param {string} str - 输入字符串
 * @returns {string} 过滤后的字符串
 */
const filterEmoji = (str) => {
  if (typeof str !== 'string') return str;
  // 匹配所有 4 字节 UTF-8 字符（Unicode 码点 > 0xFFFF）
  // 包括 emoji、特殊符号等
  return str.replace(/[\u{10000}-\u{10FFFF}]/gu, '');
};

/**
 * 递归过滤对象中所有字符串的 emoji
 * @param {any} obj - 输入对象
 * @returns {any} 过滤后的对象
 */
const filterEmojiDeep = (obj) => {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return filterEmoji(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => filterEmojiDeep(item));
  }

  if (typeof obj === 'object') {
    const result = {};
    for (const key of Object.keys(obj)) {
      result[key] = filterEmojiDeep(obj[key]);
    }
    return result;
  }

  return obj;
};

/**
 * 提交页面标记数据
 * 将页面的操作和答案数据提交到后端
 * 使用 saveHcMark API 端点和 FormData 格式
 * 
 * @param {Object} payload - 提交数据对象
 * @param {string} payload.batchCode - 测评批次号
 * @param {string} payload.examNo - 学生考号
 * @param {Object} payload.mark - 页面标记数据
 * @param {string} payload.mark.pageNumber - 页面序号
 * @param {string} payload.mark.pageDesc - 页面描述
 * @param {Array} payload.mark.operationList - 操作记录列表
 * @param {Array} payload.mark.answerList - 答案列表
 * @param {string} payload.mark.beginTime - 开始时间
 * @param {string} payload.mark.endTime - 结束时间
 * @param {Array} payload.mark.imgList - 图片列表（通常为空）
 * @returns {Promise<Object>} 后端响应数据
 */
export const submitPageMarkData = async (payload) => {
  try {
    console.log('提交页面数据:', payload);
    
    // 🔑 修复1: 使用正确的API端点 saveHcMark
    const apiUrl = buildApiUrl('/saveHcMark');
    console.log('使用正确的API端点:', apiUrl);
    
    // 🔑 修复2: 使用FormData格式而不是JSON
    const formData = new FormData();
    formData.append('batchCode', payload.batchCode);
    formData.append('examNo', payload.examNo);

    // 🔑 修复3: 过滤 emoji 等 4 字节字符，避免 MySQL utf8 字符集报错
    const filteredMark = filterEmojiDeep(payload.mark);
    // 确保字段顺序和全字段输出符合规范
    const orderedMark = orderMarkFields(filteredMark);

    // DEBUG: 验证字段顺序
    const markJson = JSON.stringify(orderedMark);
    console.log('[apiService] mark字段顺序验证:', Object.keys(orderedMark).join(' → '));
    console.log('[apiService] JSON前50字符:', markJson.substring(0, 50));

    // 将mark对象转换为JSON字符串添加到FormData
    formData.append('mark', markJson);

    console.log('FormData内容:');
    // Note: Sensitive data not logged for security
    console.log('- mark (已过滤emoji，已排序):', markJson);
    
    // 使用配置文件中的fetch选项，但移除Content-Type让浏览器自动设置（FormData需要）
    const fetchOptions = getFetchOptions({
      method: 'POST',
      body: formData
    });
    
    // FormData请求不应设置Content-Type头，让浏览器自动处理boundary
    delete fetchOptions.headers['Content-Type'];
    
    console.log('提交数据使用的fetch配置:', fetchOptions);
    
    const response = await fetch(apiUrl, fetchOptions);

    // 处理HTTP响应
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (parseError) {
        errorData = { message: response.statusText };
      }
      
      // 创建包含状态码和错误信息的错误对象
      const errorMessage = errorData.msg || errorData.message || response.statusText;
      throw new Error(`API错误 ${response.status}: ${errorMessage}`);
    }

    // 解析响应数据
    const responseData = await response.json();
    console.log('数据提交成功:', responseData);
    
    // 检查业务层面的错误，特别是session过期
    if (responseData.code && responseData.code !== 200) {
      console.log('业务层面错误:', responseData);
      
      // 特别处理401 session过期错误
      if (responseData.code === 401) {
        const sessionError = new Error(`session已过期: ${responseData.msg || '请重新登录'}`);
        sessionError.isSessionExpired = true;
        sessionError.code = 401;
        throw sessionError;
      }
      
      // 其他业务错误
      throw new Error(`业务错误 ${responseData.code}: ${responseData.msg || '未知错误'}`);
    }
    
    return responseData;
  } catch (error) {
    console.error('提交页面数据失败:', error);
    
    // 增强错误信息，确保包含session过期标识
    if (error.message && (
      error.message.includes('401') || 
      error.message.includes('session已过期') ||
      error.message.includes('请重新登录')
    )) {
      error.isSessionExpired = true;
    }
    
    throw error; // 重新抛出错误，以便上层组件捕获和处理
  }
};

/**
 * 登录用户
 * 发送用户凭证到后端进行认证
 * 
 * @param {Object} credentials - 登录凭证
 * @param {string} credentials.userId - 用户账号/学号
 * @param {string} credentials.password - 用户密码（明文）
 * @returns {Promise<Object>} 后端响应数据
 */
export const loginUser = async (credentials) => {
  try {
    // 对密码进行公钥加密
    const encryptedPassword = encrypt(credentials.password);
    
    // 检查加密是否成功
    if (!encryptedPassword || encryptedPassword === 'false') {
      throw new Error('密码加密失败，请检查密码格式');
    }
    
    // 使用后端要求的参数名称：accountName 和 accountPass
    const params = new URLSearchParams({
      accountName: credentials.userId,
      accountPass: encryptedPassword,
      type: 2
    });

    const fullUrl = `${buildApiUrl('/login')}?${params.toString()}`;
    console.log('发起登录请求 (敏感信息已隐藏)');

    // 使用配置文件中的fetch选项
    const fetchOptions = getFetchOptions({
      method: 'GET'
    });

    console.log('使用的fetch配置:', fetchOptions);

    const response = await fetch(fullUrl, fetchOptions);

    console.log('响应状态:', response.status, response.statusText);
    console.log('响应头:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      // 如果HTTP状态码表示错误，尝试解析错误信息
      let errorText;
      try {
        errorText = await response.text();
        console.log('错误响应内容:', errorText);
        
        // 尝试解析为JSON
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.message || errorData.msg || `HTTP错误 ${response.status}: ${response.statusText}`);
      } catch (parseError) {
        // 如果不是JSON，检查是否是HTML（通常表示404或服务器错误）
        if (errorText && errorText.trim().startsWith('<!DOCTYPE')) {
          throw new Error(`API端点不存在或服务器配置错误。请求URL: ${fullUrl}，返回了HTML页面而不是JSON响应。`);
        }
        throw new Error(`网络错误 ${response.status}: ${response.statusText}。响应内容: ${errorText || '无内容'}`);
      }
    }

    let responseData;
    let responseText;
    try {
      responseText = await response.text();
      console.log('原始响应内容:', responseText);
      responseData = JSON.parse(responseText);
      console.log('服务器响应数据:', responseData);
    } catch (parseError) {
      console.error('JSON解析失败:', parseError);
      const responseTextPreview = responseText ? responseText.substring(0, 200) : '无内容';
      throw new Error(`服务器返回了非JSON格式的响应。响应预览: ${responseTextPreview}${responseText && responseText.length > 200 ? '...' : ''}`);
    }
    
    // 检查业务层面的成功/失败
    if (responseData.code !== 200) {
      console.log('业务逻辑失败:', responseData.msg);
      throw new Error(responseData.msg || '登录失败');
    }

    console.log('登录成功:', responseData);
    return responseData;
  } catch (error) {
    console.error('登录API错误:', error);
    
    // 如果是CORS错误，提供更友好的错误信息和解决建议
    if (error.message && error.message.includes('Failed to fetch')) {
      const corsHelpMessage = '网络请求失败，可能的原因和解决方案：\n\n' +
        '1. 网络连接问题 - 请检查网络连接\n' +
        '2. 服务器CORS配置问题 - 请联系管理员配置CORS\n' +
        '3. 服务器暂时不可用 - 请稍后重试\n\n' +
        '临时解决方案：\n' +
        '- 尝试在URL后添加 ?apiMode=proxy 使用代理模式\n' +
        '- 或添加 ?apiMode=sameOrigin 如果API已部署在同一服务器';
      throw new Error(corsHelpMessage);
    }
    
    // 重新抛出错误，以便UI层可以捕获并显示给用户
    throw error;
  }
};

/**
 * 模拟登录接口
 * 在开发环境下模拟登录，获取测评批次号和学生考号
 * 在实际项目中，这通常由外部系统提供，或通过真实API调用
 * 
 * @param {Object} credentials - 登录凭证（可选）
 * @returns {Promise<Object>} 模拟的登录响应数据
 */
export const mockLogin = async (credentials = {}) => {
  // 仅在开发环境使用模拟数据
  console.log('模拟登录接口被调用，凭证:', credentials);
  
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        code: 200,
        msg: '成功',
        obj: {
          batchCode: '250619',
          examNo: '1001',
          pageNum: '13',
          pwd: '1234',
          schoolCode: '24146',
          schoolName: '成都市新都区龙安小学校（中心）',
          studentCode: '',
          studentName: '7年级测试71',
          url: '/seven-grade'
        }
      });
    }, 500);
  });
};
