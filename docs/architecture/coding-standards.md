# 编码规范文档 (Coding Standards)

本文档基于现有代码库的深入分析，定义了项目的编码规范、文件结构、命名约定和组件模式。所有新代码必须严格遵循这些规范以确保代码库的一致性和可维护性。

## 文件命名规范 (File Naming Conventions)

### 组件文件命名

#### 页面组件 (Page Components)
**格式**: `Page_XX_Description.jsx`
```
✅ 正确示例:
- Page_03_Dialogue_Question.jsx
- Page_15_Simulation_Question_1.jsx  
- Page_28_Effort_Submit.jsx

❌ 错误示例:
- DialoguePage.jsx
- page-03.jsx
- Simulation1.jsx
```

#### 通用组件 (Common Components)
**格式**: `ComponentName.jsx` (PascalCase)
```
✅ 正确示例:
- Button.jsx
- Modal.jsx
- TextInput.jsx
- NavigationButton.jsx

❌ 错误示例:
- button.jsx
- nav-button.jsx
- text_input.jsx
```

#### 专用组件 (Specialized Components)
按功能分组，使用描述性名称
```
✅ 正确示例:
- materials/MaterialDiscussion.jsx
- questionnaire/EffortScale.jsx
- simulation/InteractiveSimulationEnvironment.jsx

❌ 错误示例:
- Discussion.jsx
- Scale.jsx
- Environment.jsx
```

### 非组件文件命名

#### 工具函数 (Utility Files)
**格式**: `camelCase.js`
```
✅ 正确示例:
- pageMappings.js
- errorHandler.js
- pageTransitionUtils.js
- questionnaireData.js

❌ 错误示例:
- PageMappings.js
- error-handler.js
- page_transition_utils.js
```

#### Context 和服务文件
```
✅ Context 文件: PascalCaseContext.jsx
- AppContext.jsx
- DataLoggerContext.jsx

✅ Service 文件: camelCase.js
- apiService.js
- dataLogger.js

✅ Hook 文件: use + PascalCase.js
- useDataLogging.js
- useBrowserCloseHandler.js
```

#### CSS 文件
```
✅ CSS Modules: ComponentName.module.css
- Button.module.css
- QuestionnaireTimer.module.css
- StepNavigation.module.css

✅ 全局样式: descriptive.css
- global.css
- LoginPage.css
- Pages.module.css
```

## 目录结构规范 (Directory Structure)

**严格遵循以下目录结构**:

```
src/
├── components/                 # 可复用 UI 组件
│   ├── common/                # 通用组件 (Button, Modal, TextInput)
│   ├── materials/             # 材料阅读相关组件
│   ├── questionnaire/         # 问卷调查相关组件
│   ├── simulation/            # 仿真实验相关组件
│   └── debug/                 # 开发调试组件
├── pages/                     # 页面级组件
│   └── questionnaire/         # 问卷页面分组
├── modules/                   # 模块系统 (新架构)
│   ├── ModuleRegistry.js      # 模块注册中心
│   ├── ModuleRouter.jsx       # 模块路由组件
│   └── grade-*/              # 年级模块目录
├── shared/                    # 跨模块共享代码
│   ├── components/            # 共享组件
│   ├── services/              # 共享服务
│   ├── utils/                 # 共享工具
│   └── hooks/                 # 共享钩子
├── context/                   # React Context 提供者
├── hooks/                     # 自定义 React 钩子
├── services/                  # API 和外部服务集成
├── utils/                     # 工具函数和助手
├── styles/                    # 全局和共享 CSS 文件
├── config/                    # 配置文件
└── assets/                    # 静态资源
    └── images/                # 图片资源
```

### 目录使用规则

1. **components/**: 仅放置可复用的 UI 组件
2. **pages/**: 仅放置页面级组件，按功能分组
3. **shared/**: 跨模块共享的代码，新架构的核心
4. **utils/**: 纯函数工具，无副作用
5. **services/**: 外部 API 调用和数据服务
6. **assets/**: 静态资源，按类型分组

## 导入/导出规范 (Import/Export Patterns)

### 导入顺序 (Import Order)
**严格按以下顺序导入**:

```javascript
// 1. React 相关导入 (最优先)
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// 2. 第三方库导入
import PropTypes from 'prop-types';

// 3. Context 和 Hooks
import { useAppContext } from '../context/AppContext';
import { useDataLogging } from '../hooks/useDataLogging';

// 4. 组件导入
import NavigationButton from '../components/common/NavigationButton';
import TextInput from '../components/common/TextInput';

// 5. 工具函数和配置
import { formatDateTime } from '../utils/pageTransitionUtils';
import { buildApiUrl } from '../config/apiConfig';

// 6. 静态资源导入 (最后)
import backgroundImage from '../assets/images/P2.png';
import styles from './ComponentName.module.css';
```

### 导出规范 (Export Patterns)

```javascript
// ✅ 默认导出 - 用于主要组件
export default ComponentName;

// ✅ 命名导出 - 用于工具函数、常量
export const utilityFunction = () => {};
export const CONSTANT_VALUE = 'value';

// ✅ 重导出 - 用于服务文件的向后兼容
export * from './shared/services/apiService.js';
```

## 组件结构规范 (Component Structure)

### 标准组件模板

**所有组件必须遵循以下结构顺序**:

```javascript
/**
 * @file ComponentName.jsx
 * @description 组件功能描述和用途说明
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { useAppContext } from '../context/AppContext';
import styles from './ComponentName.module.css';

/**
 * 组件功能描述
 * @param {Object} props - 组件属性
 * @param {string} props.prop1 - 属性1描述
 * @param {function} props.prop2 - 属性2描述
 * @returns {JSX.Element} React 组件
 */
const ComponentName = ({ 
  prop1, 
  prop2 = defaultValue,
  ...restProps 
}) => {
  // 1. 状态声明 (State Declarations)
  const [localState, setLocalState] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  
  // 2. Context 使用 (Context Usage)
  const { 
    contextMethod, 
    contextValue 
  } = useAppContext();
  
  // 3. 自定义钩子 (Custom Hooks)
  const { customMethod, customValue } = useCustomHook();
  
  // 4. Refs (用于防止重复执行和 DOM 引用)
  const preventDuplicateRef = useRef(false);
  const elementRef = useRef(null);
  
  // 5. 记忆化值 (Memoized Values)
  const memoizedValue = useMemo(() => {
    return expensiveComputation(prop1);
  }, [prop1]);
  
  // 6. 回调函数 (Callback Functions)
  const handleAction = useCallback(async (event) => {
    try {
      setLoading(true);
      await performAction(event);
    } catch (error) {
      console.error('操作失败:', error);
    } finally {
      setLoading(false);
    }
  }, [dependencies]);
  
  const handleInputChange = useCallback((value) => {
    setLocalState(value);
    prop2?.(value); // 可选回调
  }, [prop2]);
  
  // 7. 副作用 (Effects)
  useEffect(() => {
    // 组件挂载时的副作用
    const cleanup = setupComponent();
    
    return () => {
      // 清理函数
      cleanup?.();
    };
  }, []);
  
  useEffect(() => {
    // 依赖变化时的副作用
    if (prop1) {
      updateComponentState(prop1);
    }
  }, [prop1]);
  
  // 8. 渲染 (Render)
  return (
    <div className={styles.container} {...restProps}>
      <div className={styles.header}>
        <h2>{prop1}</h2>
      </div>
      
      <div className={styles.content}>
        {loading ? (
          <div className={styles.loading}>加载中...</div>
        ) : (
          <div className={styles.mainContent}>
            {/* 主要内容 */}
          </div>
        )}
      </div>
      
      <div className={styles.actions}>
        <button 
          onClick={handleAction}
          disabled={loading}
          className={styles.actionButton}
        >
          执行操作
        </button>
      </div>
    </div>
  );
};

// PropTypes 定义
ComponentName.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.func,
  prop3: PropTypes.oneOf(['option1', 'option2']),
  prop4: PropTypes.shape({
    nestedProp: PropTypes.string
  })
};

// 默认属性
ComponentName.defaultProps = {
  prop2: undefined,
  prop3: 'option1'
};

export default ComponentName;
```

### 页面组件特殊要求

页面组件必须包含以下标准功能:

```javascript
const PageComponent = () => {
  const {
    logOperation,           // 记录用户操作
    collectAnswer,          // 收集答案
    submitPageData,         // 提交页面数据
    navigateToPage,         // 页面导航
    setPageEnterTime        // 设置页面进入时间
  } = useAppContext();
  
  // 页面进入记录 (必需)
  useEffect(() => {
    setPageEnterTime(new Date());
    logOperation({
      targetElement: '页面',
      eventType: 'page_enter',
      value: `进入页面${pageId}`
    });
  }, []);
  
  // 页面退出时提交数据 (必需)
  const handleNavigation = useCallback(async (nextPageId) => {
    try {
      await submitPageData();
      navigateToPage(nextPageId);
    } catch (error) {
      console.error('页面数据提交失败:', error);
    }
  }, [submitPageData, navigateToPage]);
  
  // 其余组件逻辑...
};
```

## CSS/样式规范 (CSS/Styling Standards)

### CSS Modules 使用规范

```css
/* ComponentName.module.css */

/* 1. 根容器样式 */
.container {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-medium);
  background: var(--background-primary);
  border-radius: var(--border-radius-large);
  box-shadow: var(--shadow-card);
}

/* 2. 语义化类名 */
.header {
  margin-bottom: var(--spacing-medium);
}

.content {
  flex: 1;
  overflow-y: auto;
}

.actions {
  display: flex;
  justify-content: space-between;
  margin-top: var(--spacing-medium);
}

/* 3. 状态类名 */
.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  color: var(--text-secondary);
}

.disabled {
  opacity: 0.6;
  pointer-events: none;
}

/* 4. 交互元素样式 */
.actionButton {
  padding: var(--spacing-small) var(--spacing-medium);
  background: var(--cartoon-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius-medium);
  cursor: pointer;
  transition: all 0.2s ease;
}

.actionButton:hover:not(:disabled) {
  background: var(--cartoon-primary-dark);
  transform: translateY(-1px);
}

.actionButton:disabled {
  background: var(--button-disabled);
  cursor: not-allowed;
}
```

### CSS 变量使用

**必须使用项目定义的 CSS 变量**:

```css
/* 颜色变量 */
--cartoon-primary: #59c1ff;
--cartoon-secondary: #ffce6b;
--cartoon-accent: #ff7eb6;
--cartoon-success: #4ade80;
--cartoon-warning: #fbbf24;
--cartoon-error: #f87171;

/* 间距变量 */
--spacing-xs: 4px;
--spacing-small: 8px;
--spacing-medium: 16px;
--spacing-large: 24px;
--spacing-xl: 32px;

/* 边框半径 */
--border-radius-small: 4px;
--border-radius-medium: 8px;
--border-radius-large: 12px;

/* 阴影 */
--shadow-card: 0 4px 6px rgba(0, 0, 0, 0.1);
--shadow-hover: 0 8px 15px rgba(0, 0, 0, 0.15);
```

## 本地存储规范 (localStorage Standards)

### localStorage 键命名约定

**必须遵循 camelCase 格式，与状态变量名保持一致**:

```javascript
// ✅ 正确的键命名格式
const LOCALSTORAGE_KEYS = {
  // 用户认证相关
  IS_AUTHENTICATED: 'isAuthenticated',
  CURRENT_USER: 'currentUser',
  BATCH_CODE: 'batchCode',
  EXAM_NO: 'examNo',
  MODULE_URL: 'moduleUrl',          // 新增：模块路由URL
  
  // 任务状态相关
  CURRENT_PAGE_ID: 'currentPageId',
  TASK_START_TIME: 'taskStartTime',
  REMAINING_TIME: 'remainingTime',
  IS_TASK_FINISHED: 'isTaskFinished',
  
  // 问卷相关
  QUESTIONNAIRE_ANSWERS: 'questionnaireAnswers',
  QUESTIONNAIRE_START_TIME: 'questionnaireStartTime',
  IS_QUESTIONNAIRE_STARTED: 'isQuestionnaireStarted',
  IS_QUESTIONNAIRE_COMPLETED: 'isQuestionnaireCompleted'
};

// ❌ 错误的键命名格式
// 'module_url'     - 使用下划线
// 'module-url'     - 使用连字符
// 'ModuleUrl'      - 使用 PascalCase
// 'MODULEURL'      - 全大写
```

### localStorage 操作模式

```javascript
// ✅ 标准存储操作 - 带错误处理
const setLocalStorageItem = (key, value) => {
  try {
    const serializedValue = typeof value === 'object' 
      ? JSON.stringify(value) 
      : String(value);
    localStorage.setItem(key, serializedValue);
    console.log(`[localStorage] 成功存储: ${key}`);
  } catch (error) {
    console.error(`[AppContext] localStorage operation failed: set - ${key}:`, error);
    // 不抛出错误，允许应用继续运行
  }
};

// ✅ 标准读取操作 - 带默认值处理
const getLocalStorageItem = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item !== null ? item : defaultValue;
  } catch (error) {
    console.error(`[AppContext] localStorage operation failed: get - ${key}:`, error);
    return defaultValue;
  }
};

// ✅ JSON 对象存储和读取
const setLocalStorageObject = (key, object) => {
  try {
    localStorage.setItem(key, JSON.stringify(object));
  } catch (error) {
    console.error(`[AppContext] localStorage operation failed: setObject - ${key}:`, error);
  }
};

const getLocalStorageObject = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`[AppContext] localStorage operation failed: getObject - ${key}:`, error);
    return defaultValue;
  }
};
```

### localStorage 清理模式

```javascript
// ✅ 批量清理键
const clearLocalStorageKeys = (keys) => {
  keys.forEach(key => {
    try {
      localStorage.removeItem(key);
      console.log(`[localStorage] 清除成功: ${key}`);
    } catch (error) {
      console.error(`[AppContext] localStorage operation failed: remove - ${key}:`, error);
    }
  });
};

// ✅ 登出时的完整清理
const handleLogout = () => {
  const keysToRemove = [
    LOCALSTORAGE_KEYS.IS_AUTHENTICATED,
    LOCALSTORAGE_KEYS.CURRENT_USER,
    LOCALSTORAGE_KEYS.BATCH_CODE,
    LOCALSTORAGE_KEYS.EXAM_NO,
    LOCALSTORAGE_KEYS.MODULE_URL,  // 清理模块URL
    LOCALSTORAGE_KEYS.CURRENT_PAGE_ID,
    LOCALSTORAGE_KEYS.TASK_START_TIME,
    LOCALSTORAGE_KEYS.REMAINING_TIME
  ];
  
  clearLocalStorageKeys(keysToRemove);
  console.log('[AppContext] 用户登出，localStorage已清理');
};
```

## 错误处理与日志规范 (Error Handling & Logging)

### 错误消息标准格式

**所有错误消息必须遵循统一格式**: `[模块名] 错误类型: 具体描述`

```javascript
// ✅ AppContext 相关错误格式
const ERROR_MESSAGES = {
  // 登录相关错误
  LOGIN_FAILED: '[AppContext] Login error: {错误描述}',
  LOGIN_VALIDATION: '[AppContext] Login validation failed: {验证失败原因}',
  
  // URL 处理错误
  URL_EXTRACTION_FAILED: '[AppContext] URL extraction failed: {错误原因}',
  URL_VALIDATION_FAILED: '[AppContext] URL validation failed: {验证失败详情}',
  
  // localStorage 操作错误
  LOCALSTORAGE_SET_FAILED: '[AppContext] localStorage operation failed: set - {错误详情}',
  LOCALSTORAGE_GET_FAILED: '[AppContext] localStorage operation failed: get - {错误详情}',
  LOCALSTORAGE_REMOVE_FAILED: '[AppContext] localStorage operation failed: remove - {错误详情}',
  
  // 状态恢复错误
  STATE_RECOVERY_FAILED: '[AppContext] State recovery failed: {恢复失败原因}',
  
  // 默认值应用提示
  USING_DEFAULT_VALUE: '[AppContext] Using default {参数名}: {默认值} ({原因})'
};

// 使用示例
const handleLoginSuccess = (userData) => {
  try {
    const moduleUrl = userData.url || '/seven-grade';
    
    if (!userData.url) {
      console.warn(
        ERROR_MESSAGES.USING_DEFAULT_VALUE
          .replace('{参数名}', 'moduleUrl')
          .replace('{默认值}', '/seven-grade')
          .replace('{原因}', 'API response missing url field')
      );
    }
    
    // 存储到 localStorage
    setLocalStorageItem(LOCALSTORAGE_KEYS.MODULE_URL, moduleUrl);
    
  } catch (error) {
    console.error(
      ERROR_MESSAGES.URL_EXTRACTION_FAILED
        .replace('{错误原因}', error.message)
    );
    throw error;
  }
};
```

### 错误等级分类

```javascript
// ✅ 错误等级标准
const LOG_LEVELS = {
  ERROR: 'error',     // 阻塞性错误，需要立即处理
  WARN: 'warn',       // 警告，使用默认值或降级处理
  INFO: 'info',       // 信息性日志，正常操作记录
  DEBUG: 'debug'      // 调试信息，开发环境使用
};

// 错误处理示例
const processApiResponse = (response) => {
  try {
    // 正常处理逻辑
    if (!response.url) {
      // 警告级别：缺少可选字段，使用默认值
      console.warn('[AppContext] Using default moduleUrl: /seven-grade (API response missing url field)');
      return { ...response, url: '/seven-grade' };
    }
    
    // 信息级别：正常操作
    console.info('[AppContext] URL extraction successful:', response.url);
    return response;
    
  } catch (error) {
    // 错误级别：严重问题
    console.error('[AppContext] URL extraction failed:', error.message);
    throw error;
  }
};
```

### 认证流程错误处理规范

```javascript
// ✅ 认证相关错误处理模式
const handleAuthenticationError = (error) => {
  // Session 过期检测
  if (error.status === 401 || error.message?.includes('session已过期')) {
    console.warn('[AppContext] Session expired, redirecting to login');
    
    // 清理认证相关状态但保留任务数据
    const authKeys = [
      LOCALSTORAGE_KEYS.IS_AUTHENTICATED,
      LOCALSTORAGE_KEYS.CURRENT_USER,
      LOCALSTORAGE_KEYS.MODULE_URL
    ];
    clearLocalStorageKeys(authKeys);
    
    // 显示用户友好的提示
    alert('登录会话已过期，请重新登录以继续使用');
    return;
  }
  
  // 网络错误处理
  if (error.name === 'NetworkError' || !navigator.onLine) {
    console.error('[AppContext] Network error detected:', error.message);
    alert('网络连接异常，请检查网络设置后重试');
    return;
  }
  
  // 其他未知错误
  console.error('[AppContext] Authentication error:', error.message);
  alert('登录过程中发生错误，请稍后重试');
};
```

## 状态管理规范 (State Management)

### Context 使用模式

```javascript
// Context 提供者模式
const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [state, setState] = useState(initialState);
  
  // 认证流程增强：添加 moduleUrl 状态管理
  const [moduleUrl, setModuleUrl] = useState('');
  
  /**
   * 处理登录成功 - 增强版本支持 URL 提取
   * @param {Object} userData - 用户数据
   * @param {string} [userData.url] - 可选的模块路由URL
   */
  const handleLoginSuccess = useCallback((userData) => {
    try {
      // 提取 URL 字段，提供默认值
      const userModuleUrl = userData.url || '/seven-grade';
      
      // 记录默认值使用情况
      if (!userData.url) {
        console.warn('[AppContext] Using default moduleUrl: /seven-grade (API response missing url field)');
      }
      
      // 更新状态
      setModuleUrl(userModuleUrl);
      
      // 持久化存储（使用标准键名）
      try {
        localStorage.setItem('moduleUrl', userModuleUrl);
        console.log('[AppContext] moduleUrl 已成功存储到 localStorage');
      } catch (storageError) {
        console.error('[AppContext] localStorage operation failed: set - moduleUrl:', storageError);
        // 不阻塞认证流程，允许应用继续运行
      }
      
      // 其他登录成功逻辑...
      setIsAuthenticated(true);
      setCurrentUser(userData);
      
    } catch (error) {
      console.error('[AppContext] Login error:', error.message);
      throw error;
    }
  }, []);
  
  const contextValue = useMemo(() => ({
    // 状态值
    currentPageId: state.currentPageId,
    isAuthenticated: state.isAuthenticated,
    moduleUrl,  // 新增：暴露 moduleUrl 状态
    
    // 操作方法
    handleLoginSuccess,  // 新增：暴露增强的登录处理函数
    logOperation: useCallback((operation) => {
      // 实现逻辑
    }, []),
    
    collectAnswer: useCallback((answer) => {
      // 实现逻辑
    }, []),
  }), [state, moduleUrl, handleLoginSuccess]);
  
  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// 自定义钩子
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
```

### 本地状态管理

```javascript
// ✅ 正确的状态管理模式
const Component = () => {
  // 简单状态
  const [loading, setLoading] = useState(false);
  
  // 复杂状态使用 useReducer
  const [formState, dispatch] = useReducer(formReducer, initialFormState);
  
  // 记忆化的派生状态
  const isFormValid = useMemo(() => {
    return validateForm(formState);
  }, [formState]);
  
  // 防抖的状态更新
  const debouncedSearch = useMemo(
    () => debounce((term) => {
      performSearch(term);
    }, 300),
    []
  );
};
```

## 错误处理规范 (Error Handling)

### 全局错误处理

```javascript
// 错误分类和过滤
const HARMLESS_ERROR_PATTERNS = [
  /ResizeObserver loop limit exceeded/,
  /Non-passive event listener/,
];

const isHarmlessError = (message) => {
  return HARMLESS_ERROR_PATTERNS.some(pattern => pattern.test(message));
};

// 全局错误处理器
export const globalErrorHandler = (event) => {
  if (isHarmlessError(event.message)) {
    console.debug('[Filtered] 已过滤无害错误:', event.message);
    return;
  }
  console.error('[Global Error]', event);
};
```

### API 错误处理

```javascript
// ✅ 标准 API 错误处理模式
const apiCall = async (payload) => {
  try {
    const response = await fetch(apiUrl, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.msg || response.statusText;
      throw new Error(`API错误 ${response.status}: ${errorMessage}`);
    }
    
    const responseData = await response.json();
    
    // 业务层错误检查
    if (responseData.code !== 200) {
      if (responseData.code === 401) {
        const sessionError = new Error(`session已过期: ${responseData.msg}`);
        sessionError.isSessionExpired = true;
        throw sessionError;
      }
      throw new Error(`业务错误 ${responseData.code}: ${responseData.msg}`);
    }
    
    return responseData;
  } catch (error) {
    console.error('API调用失败:', error);
    
    // 增强错误信息
    if (error.message?.includes('401') || error.isSessionExpired) {
      error.isSessionExpired = true;
    }
    
    throw error;
  }
};
```

## 命名约定规范 (Naming Conventions)

### 函数命名

```javascript
// ✅ 事件处理器: handle + Action
const handleInputChange = (value) => {};
const handleSubmit = async (event) => {};
const handleModalClose = () => {};

// ✅ 工具函数: 动词 + 名词
const formatDateTime = (date) => {};
const validateForm = (formData) => {};
const parseQueryString = (query) => {};

// ✅ API 函数: 动作 + 对象
const loginUser = async (credentials) => {};
const submitPageData = async (data) => {};
const fetchUserProfile = async (userId) => {};

// ✅ 判断函数: is/has/should + 形容词
const isAuthenticated = () => {};
const hasPermission = (user, permission) => {};
const shouldShowModal = (condition) => {};
```

### 变量命名

```javascript
// ✅ 常量: UPPER_SNAKE_CASE
const TOTAL_TASK_DURATION = 40 * 60 * 1000;
const DEFAULT_PAGE_SIZE = 10;
const API_ENDPOINTS = {
  LOGIN: '/login',
  SUBMIT: '/saveHcMark'
};

// ✅ 状态变量: camelCase (与 localStorage 键名保持一致)
const [currentPageId, setCurrentPageId] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [userProfile, setUserProfile] = useState(null);
const [moduleUrl, setModuleUrl] = useState('');  // 新增：模块URL状态

// ✅ 布尔变量: is/has/should 前缀
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [hasError, setHasError] = useState(false);
const [shouldShowWarning, setShouldShowWarning] = useState(false);

// ✅ 映射对象: 描述性后缀
const pageInfoMapping = {};
const questionnaireStepMapping = {};
const errorMessageMapping = {};

// ✅ localStorage 键名常量 (与状态变量名保持一致)
const STORAGE_KEYS = {
  MODULE_URL: 'moduleUrl',           // 对应 moduleUrl 状态
  IS_AUTHENTICATED: 'isAuthenticated', // 对应 isAuthenticated 状态
  CURRENT_USER: 'currentUser'        // 对应 currentUser 状态
};
```

## 注释规范 (Comment Standards)

### JSDoc 注释

**所有导出的函数必须有 JSDoc 注释**:

```javascript
/**
 * 提交页面标记数据到后端
 * @param {Object} payload - 提交数据对象
 * @param {string} payload.batchCode - 测评批次号
 * @param {string} payload.examNo - 学生考号
 * @param {Object} payload.mark - 页面标记数据
 * @param {string} payload.mark.pageNumber - 页面序号
 * @param {Array} payload.mark.operationList - 操作记录列表
 * @returns {Promise<Object>} 后端响应数据
 * @throws {Error} 当网络请求失败或业务逻辑错误时抛出异常
 */
export const submitPageMarkData = async (payload) => {
  // 实现逻辑
};

/**
 * React 组件用于显示用户信息栏
 * @param {Object} props - 组件属性
 * @param {Object} props.userInfo - 用户信息对象
 * @param {string} props.userInfo.studentName - 学生姓名
 * @param {string} props.userInfo.schoolName - 学校名称
 * @param {function} [props.onLogout] - 可选的登出回调函数
 * @returns {JSX.Element} 用户信息栏组件
 */
const UserInfoBar = ({ userInfo, onLogout }) => {
  // 组件实现
};
```

### 文件头注释

**所有文件必须包含文件头注释**:

```javascript
/**
 * @file ComponentName.jsx
 * @description 组件功能的详细描述，包括主要用途和交互方式
 * @author 开发者姓名
 * @created 2025-07-26
 * @updated 2025-07-26
 */
```

### 行内注释

```javascript
// ✅ 中文注释用于解释业务逻辑
const handleSubmit = async () => {
  // 🔑 关键修复: 提交前必须验证表单数据完整性
  if (!validateFormData(formData)) {
    return;
  }
  
  try {
    // 提交数据并记录操作日志
    await submitData(formData);
    logOperation({
      targetElement: '提交按钮',
      eventType: 'form_submit',
      value: '表单提交成功'
    });
  } catch (error) {
    // TODO: 添加更详细的错误处理和用户反馈
    console.error('提交失败:', error);
  }
};
```

## 性能优化规范 (Performance Standards)

### 组件优化

```javascript
// ✅ 使用 memo 防止不必要的重渲染
const ExpensiveComponent = React.memo(({ data, onUpdate }) => {
  // 组件实现
}, (prevProps, nextProps) => {
  // 自定义比较函数 (可选)
  return prevProps.data.id === nextProps.data.id;
});

// ✅ 使用 useCallback 缓存函数
const Component = ({ onItemClick }) => {
  const handleClick = useCallback((item) => {
    onItemClick(item);
  }, [onItemClick]);
  
  // 使用 useMemo 缓存计算结果
  const expensiveValue = useMemo(() => {
    return performExpensiveCalculation(data);
  }, [data]);
};

// ✅ 使用 useRef 防止重复执行
const Component = () => {
  const hasInitialized = useRef(false);
  
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    
    // 只执行一次的初始化逻辑
    initializeComponent();
  }, []);
};
```

## 数据流规范 (Data Flow Standards)

### 用户操作记录

**所有用户交互必须记录**:

```javascript
const handleUserAction = useCallback((actionType, targetElement, value) => {
  // 记录用户操作
  logOperation({
    targetElement,
    eventType: actionType,
    value: value || '',
    elementId: targetElement.toLowerCase().replace(/\s+/g, '_')
  });
  
  // 如果是答案，还需要收集答案
  if (isAnswerAction(actionType)) {
    collectAnswer({
      targetElement,
      value
    });
  }
}, [logOperation, collectAnswer]);

// 使用示例
<button onClick={() => handleUserAction('button_click', '下一页按钮', '导航到下一页')}>
  下一页
</button>
```

### 数据提交模式

```javascript
// ✅ 标准页面数据提交模式
const submitCurrentPageData = useCallback(async () => {
  try {
    // 构建 MarkObject 数据结构
    const markData = {
      pageNumber: String(currentPageNumber),
      pageDesc: currentPageDescription,
      operationList: getCollectedOperations(),
      answerList: getCollectedAnswers(),
      beginTime: formatTimestamp(pageEnterTime),
      endTime: formatTimestamp(new Date()),
      imgList: []
    };
    
    // 提交到后端
    await submitPageMarkData({
      batchCode: userContext.batchCode,
      examNo: userContext.examNo,
      mark: markData
    });
    
    console.log('页面数据提交成功');
  } catch (error) {
    console.error('页面数据提交失败:', error);
    
    // 特殊处理 session 过期
    if (error.isSessionExpired) {
      handleSessionExpiration();
    }
    
    throw error;
  }
}, [/* 依赖项 */]);
```

## 测试规范 (Testing Standards)

### 组件测试模式

```javascript
// ComponentName.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppProvider } from '../context/AppContext';
import ComponentName from './ComponentName';

// 测试工具函数
const renderWithContext = (component, contextValue = {}) => {
  return render(
    <AppProvider value={contextValue}>
      {component}
    </AppProvider>
  );
};

describe('ComponentName', () => {
  const defaultProps = {
    prop1: 'test value',
    prop2: jest.fn()
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('应该正确渲染组件', () => {
    renderWithContext(<ComponentName {...defaultProps} />);
    expect(screen.getByText('test value')).toBeInTheDocument();
  });
  
  test('应该处理用户交互', async () => {
    const mockProp2 = jest.fn();
    renderWithContext(
      <ComponentName {...defaultProps} prop2={mockProp2} />
    );
    
    fireEvent.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(mockProp2).toHaveBeenCalledWith(expect.any(String));
    });
  });
});
```

## 国际化规范 (Internationalization)

### 文本内容处理

```javascript
// ✅ 中文文本直接使用，英文文本使用常量
const UI_TEXT = {
  LOADING: '加载中...',
  ERROR: '操作失败',
  SUCCESS: '操作成功',
  CONFIRM: '确认',
  CANCEL: '取消'
};

// 在组件中使用
const Component = () => {
  return (
    <div>
      <h1>七年级科学探究任务</h1>
      <p>{UI_TEXT.LOADING}</p>
    </div>
  );
};
```

## 安全规范 (Security Standards)

### 数据处理安全

```javascript
// ✅ 输入验证
const validateInput = (input) => {
  if (typeof input !== 'string') return false;
  if (input.length > MAX_INPUT_LENGTH) return false;
  return /^[a-zA-Z0-9\u4e00-\u9fa5\s]*$/.test(input);
};

// ✅ 敏感数据处理
const handleSensitiveData = (data) => {
  // 不在控制台输出完整的敏感数据
  console.log('处理敏感数据:', {
    ...data,
    password: data.password ? '***' : undefined,
    token: data.token ? `${data.token.slice(0, 8)}...` : undefined
  });
};

// ✅ XSS 防护
const sanitizeHtml = (html) => {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
};
```

## 代码审查检查清单 (Code Review Checklist)

提交代码前，请确保通过以下检查:

### ✅ 文件和目录规范
- [ ] 文件命名遵循既定规范
- [ ] 文件放置在正确的目录中
- [ ] 导入路径正确且有序

### ✅ 组件规范
- [ ] 组件结构遵循标准模板
- [ ] 使用 PropTypes 进行类型检查
- [ ] 包含完整的 JSDoc 注释
- [ ] 错误处理完整

### ✅ 样式规范
- [ ] 使用 CSS Modules
- [ ] 使用项目 CSS 变量
- [ ] 类名语义化且一致

### ✅ 状态管理规范
- [ ] 正确使用 Context API
- [ ] 状态更新遵循不可变原则
- [ ] 使用合适的性能优化
- [ ] localStorage 键名遵循 camelCase 约定
- [ ] 错误处理遵循统一格式规范

### ✅ 数据流规范
- [ ] 用户操作正确记录
- [ ] 数据提交格式正确
- [ ] 错误处理完整

### ✅ 安全性检查
- [ ] 输入验证充分
- [ ] 敏感数据处理安全
- [ ] 无 XSS 风险

---

**本文档基于现有代码库深入分析制定，所有新代码必须严格遵循以上规范。如有疑问或需要更新规范，请联系技术负责人。**