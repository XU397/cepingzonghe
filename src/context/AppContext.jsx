import { createContext, useState, useEffect, useContext, useCallback, useMemo, useRef } from 'react';
import { pageInfoMapping, TOTAL_USER_STEPS } from '../utils/pageMappings'; // 鍋囪杩欎釜宸ュ叿鍑芥暟瀛樺湪涓旇矾寰勬纭?
import { usePageSubmission } from '@shared/services/submission/usePageSubmission.js';
import { TimerService, useTimer } from '@shared/services/timers';
import STORAGE_KEYS, {
  removeStorageItem,
  getStorageItem,
  setStorageItem,
  getFlowKey,
} from '@shared/services/storage/storageKeys.js';
import { handlePageTransition } from '../utils/pageTransitionUtils';
import { useBrowserCloseHandler } from '../hooks/useBrowserCloseHandler';
import { apiClient } from '@shared/services/api';
import EventTypes, { EventTypeValues } from '@shared/services/submission/eventTypes.js';

/**
 * 搴旂敤鍏ㄥ眬涓婁笅鏂?
 * 鐢ㄤ簬绠＄悊鍏ㄥ眬鐘舵€侊紝濡傚綋鍓嶉〉闈D銆佸墿浣欐椂闂淬€佷换鍔″紑濮嬫椂闂寸瓑
 */
const AppContext = createContext();
const debugLog = () => {};

/**
 * 鎬讳换鍔℃椂闀匡紙绉掞級
 * 40鍒嗛挓 = 2400绉?
 */
const TOTAL_TASK_DURATION = 40 * 60;

/**
 * 榛樿闂嵎鏃堕暱锛堢锛?
 * 10鍒嗛挓 = 600绉?
 * 娉ㄦ剰锛氳繖鏄叏灞€榛樿鍊硷紝妯″潡鍙互閫氳繃 startQuestionnaireTimer(customDuration) 浼犲叆鑷畾涔夋椂闀?
 */
const DEFAULT_QUESTIONNAIRE_DURATION = 10 * 60;
const G7_TASK_TIMER_SCOPE = 'module.grade-7.task';
const G7_QUESTIONNAIRE_TIMER_SCOPE = 'module.grade-7.questionnaire';

// 杈呭姪鍑芥暟锛氭牸寮忓寲鏃ユ湡鏃堕棿涓?"YYYY-MM-DD HH:mm:ss"

// 从 url 中提取 flowId（兼容绝对/相对路径）
const extractFlowIdFromUrl = (url) => {
  if (typeof url !== 'string' || !url) return null;
  let pathname = url;
  try {
    if (url.includes('://')) {
      pathname = new URL(url).pathname;
    }
  } catch {
    // ignore parse failures
  }
  const match = pathname.match(/\\/flow\\/([^/?#]+)/i);
  return match ? decodeURIComponent(match[1]) : null;
};

// 将登录返回的 progress 写入 flow 缓存，便于 FlowOrchestrator 恢复
const persistFlowProgressFromLogin = (flowId, progress) => {
  if (!flowId || !progress) return;
  const stepIndexRaw = progress.stepIndex ?? progress.step_index ?? progress.step ?? null;
  const modulePageNumRaw =
    progress.modulePageNum ?? progress.module_page_num ?? progress.pageNum ?? null;

  const hasStepIndex = Number.isFinite(Number(stepIndexRaw));
  const hasModulePageNum = modulePageNumRaw !== null && modulePageNumRaw !== undefined;
  if (!hasStepIndex && !hasModulePageNum) return;

  try {
    if (hasStepIndex) {
      localStorage.setItem(getFlowKey(flowId, 'stepIndex'), String(Number(stepIndexRaw)));
    }
    const modulePageKey = getFlowKey(flowId, 'modulePageNum');
    if (!hasModulePageNum || modulePageNumRaw === '') {
      localStorage.removeItem(modulePageKey);
    } else {
      localStorage.setItem(modulePageKey, String(modulePageNumRaw));
    }
  } catch (err) {
    console.warn('[AppContext] Failed to persist flow progress from login', err);
  }
};

const internalFormatDateTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const pad = (num) => String(num).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

/**
 * 搴旂敤鍏ㄥ眬涓婁笅鏂囨彁渚涜€呯粍浠?
 * @param {Object} props - 缁勪欢灞炴€?
 * @param {React.ReactNode} props.children - 瀛愮粍浠?
 */
export const AppProvider = ({ children }) => {
  // 褰撳墠椤甸潰ID锛岄粯璁や负鐧诲綍椤?
  const [currentPageId, setCurrentPageIdInternal] = useState('Page_Login');

  // 鍓╀綑鏃堕棿锛堢锛?
  const [remainingTime, setRemainingTime] = useState(TOTAL_TASK_DURATION);

  // 浠诲姟寮€濮嬫椂闂?
  const [taskStartTime, setTaskStartTime] = useState(null);

  // Flow 涓婁笅鏂囷紙鐢?FlowAppContextBridge 娉ㄥ叆锛?
  const flowContextRef = useRef(null);
  const setFlowContext = useCallback((newFlowContext) => {
    const currentValue = flowContextRef.current;
    // 娣卞害姣旇緝锛岄伩鍏嶄笉蹇呰鐨勬洿鏂?
    if (JSON.stringify(currentValue) === JSON.stringify(newFlowContext)) {
      debugLog('[AppContext] setFlowContext skipped (value unchanged)');
      return;
    }
    debugLog('[AppContext] setFlowContext called:', newFlowContext);
    flowContextRef.current = newFlowContext;
  }, []);
  
  // 娴嬭瘎鎵规鍙?
  const [batchCode, setBatchCode] = useState('');
  
  // 瀛︾敓鑰冨彿
  const [examNo, setExamNo] = useState('');
  
  // 鐢ㄦ埛瀹屾垚鐨勯〉闈㈢紪鍙凤紙浠庡悗绔幏鍙栵級
  const [pageNum, setPageNum] = useState(null);
  
  // 褰撳墠椤甸潰鏁版嵁
  const [currentPageData, setCurrentPageData] = useState({
    operationList: [],
    answerList: []
  });
  
  // 椤甸潰杩涘叆鏃堕棿
  const [pageEnterTime, setPageEnterTime] = useState(null);
  
  // 鐧诲綍鐘舵€?
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // 璁よ瘉鐘舵€?- 鏂板
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // 璁よ瘉浠ょ墝 - 鏂板
  const [authToken, setAuthToken] = useState(null);
  
  // 褰撳墠鐢ㄦ埛淇℃伅 - 鏂板
  const [currentUser, setCurrentUser] = useState(null);

  // 妯″潡URL鐘舵€?- 鐢ㄤ簬澶氭ā鍧楄矾鐢?
  const [moduleUrl, setModuleUrl] = useState('');

  // 浠诲姟鏄惁宸茬粨鏉燂紙渚嬪锛岄€氳繃P19瀹屾垚鎴栬秴鏃讹級
  const [isTaskFinished, setIsTaskFinished] = useState(false);

  // 鏍囪鏃堕棿鏄惁宸茶€楀敖
  const [isTimeUp, setIsTimeUp] = useState(false);

  // 闂嵎鐩稿叧鐘舵€?
  const [questionnaireStartTime, setQuestionnaireStartTime] = useState(null);
  const [questionnaireRemainingTime, setQuestionnaireRemainingTime] = useState(DEFAULT_QUESTIONNAIRE_DURATION);
  const [isQuestionnaireStarted, setIsQuestionnaireStarted] = useState(false);
  const [isQuestionnaireTimeUp, setIsQuestionnaireTimeUp] = useState(false);
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState({});
  const [isQuestionnaireCompleted, setIsQuestionnaireCompleted] = useState(false); // 鏂板锛氶棶鍗锋槸鍚﹀凡瀹屾垚

  // 璁＄畻褰撳墠姝ラ鍙?
  const currentStepNumber = pageInfoMapping[currentPageId]?.stepNumber || 0;
  const totalUserSteps = TOTAL_USER_STEPS;

  const formatDateTime = useCallback((date) => {
    return internalFormatDateTime(date);
  }, []);

  // 椤甸潰鍔犺浇鏃朵粠localStorage鎭㈠鐘舵€?
  // 浣跨敤瑙勮寖閿悕 core.module/url 鍜?core.page/pageNum
  useEffect(() => {
    const savedModuleUrl = getStorageItem(STORAGE_KEYS.CORE_MODULE_URL);
    const savedPageNum = getStorageItem(STORAGE_KEYS.CORE_PAGE_NUM);
    const savedBatchCode = getStorageItem(STORAGE_KEYS.CORE_BATCH_CODE);
    const savedExamNo = getStorageItem(STORAGE_KEYS.CORE_EXAM_NO);

    debugLog('[AppContext] 馃攧 浠巐ocalStorage鎭㈠鐘舵€?, {
      moduleUrl: savedModuleUrl,
      pageNum: savedPageNum,
      batchCode: savedBatchCode,
      examNo: savedExamNo
    });

    if (savedModuleUrl) {
      setModuleUrl(savedModuleUrl);
    }

    if (savedPageNum) {
      setPageNum(savedPageNum);
    }

    if (savedBatchCode) {
      setBatchCode(savedBatchCode);
    }

    if (savedExamNo) {
      setExamNo(savedExamNo);
    }
  }, []);

  /**
   * 璁板綍鐢ㄦ埛浜や簰鎿嶄綔
   * @param {object} operationData - 鎿嶄綔鏁版嵁
   * @param {string} operationData.targetElement - 浜や簰鐨刄I鍏冪礌鎻忚堪
   * @param {string} operationData.eventType - 浜嬩欢绫诲瀷 (e.g., 'click', 'input', '鏌ョ湅璧勬枡')
   * @param {string} [operationData.value] - 鐩稿叧鍊?(e.g., 杈撳叆鍐呭)
   * @param {string} [operationData.elementId] - 鍏冪礌ID (鍙€? 鑻argetElement涓嶈冻浠ユ弿杩版椂浣跨敤)
   * @param {string} [operationData.pageId] - 鎿嶄綔鍙戠敓鐨勯〉闈D (鍙€? 榛樿涓哄綋鍓嶉〉)
   */
  const logOperation = useCallback(({ targetElement, eventType, value = '', elementId = null, pageId: operationPageId }) => {
    const now = new Date();
    let added = false;
    
    // 鐩存帴鑾峰彇褰撳墠椤甸潰ID锛岄伩鍏嶄緷璧栭棶棰?
    const finalPageId = operationPageId || currentPageId;
    const finalTargetElement = targetElement || elementId;
    
    debugLog(`[AppContext.logOperation] 璁板綍鎿嶄綔:`, {
      targetElement: finalTargetElement,
      eventType,
      value,
      pageId: finalPageId,
      currentPageId: currentPageId
    });
    
    debugLog('[AppContext.logOperation] value type:', typeof value, value);

    // 浠呭皢鏍囧噯浜嬩欢绫诲瀷鍐欏叆褰撳墠椤甸潰鐨?operationList锛岄潪鏍囧噯浜嬩欢淇濈暀涓鸿繍琛屾棩蹇椾絾涓嶈繘鍏?Mark 鎻愪氦
    const isStandardEventType =
      typeof eventType === 'string' && EventTypeValues.includes(eventType);
    if (!isStandardEventType) {
      debugLog('[AppContext.logOperation] 闈炴爣鍑嗕簨浠剁被鍨嬶紝浠呰褰曟棩蹇椾笉鍐欏叆 operationList:', {
        eventType,
        targetElement: finalTargetElement,
        value,
      });
      return false;
    }
    
    setCurrentPageData(prevData => {
      // 馃敡 闃查噸澶嶉€昏緫锛氭鏌ユ槸鍚﹀瓨鍦ㄧ浉鍚岀殑鎿嶄綔璁板綍
      const existingOperations = prevData.operationList || [];
      const isDuplicate = existingOperations.some(op => {
        const isSameOperation = (
          op.targetElement === finalTargetElement &&
          op.eventType === eventType &&
          op.value === value
        );
        
        // 瀵逛簬椤甸潰杩涘叆浜嬩欢锛岃繘琛岄澶栫殑鏃堕棿妫€鏌ワ紙1绉掑唴鐨勯噸澶嶈涓烘槸React涓ユ牸妯″紡瀵艰嚧鐨勶級
        if (isSameOperation && eventType === 'page_enter') {
          const timeDiff = Math.abs(now.getTime() - new Date(op.time.replace(/\-/g, '/')).getTime());
          return timeDiff < 1000; // 1绉掑唴鐨勯噸澶峱age_enter浜嬩欢
        }
        
        return isSameOperation;
      });
      
      if (isDuplicate) {
        debugLog(`[AppContext.logOperation] 鈿狅笍 妫€娴嬪埌閲嶅鎿嶄綔锛岃烦杩囪褰?`, {
          targetElement: finalTargetElement,
          eventType,
          value
        });
        return prevData; // 杩斿洖鍘熸暟鎹紝涓嶆坊鍔犻噸澶嶈褰?
      }
      
      const newOperation = {
        code: (existingOperations.length || 0) + 1, // 纭繚鍦ㄥ綋鍓嶉〉闈㈡暟鎹腑鍞竴
        targetElement: finalTargetElement,
        eventType,
        value,
        time: internalFormatDateTime(now), // 鐩存帴浣跨敤鍐呴儴鍑芥暟閬垮厤渚濊禆
        pageId: finalPageId, 
      };
      
      const newOperationList = [...existingOperations, newOperation];
      
      debugLog(`[AppContext.logOperation] 鎿嶄綔璁板綍宸叉坊鍔狅紝褰撳墠operationList闀垮害:`, newOperationList.length);
      debugLog(`[AppContext.logOperation] 鏈€鏂版搷浣?`, newOperation);
      
      added = true;
      return {
        ...prevData,
        operationList: newOperationList,
      };
    });

    return added;
  }, []); // 瀹屽叏绉婚櫎渚濊禆锛屼娇鍏剁ǔ瀹?

  /**
   * 鏀堕泦鐢ㄦ埛绛旀
   * @param {object} answerData - 绛旀鏁版嵁
   * @param {string} answerData.targetElement - 绛旀瀵瑰簲鐨刄I鍏冪礌鎴栭棶棰樻弿杩?
   * @param {*} answerData.value - 绛旀鐨勫€?
   * @param {number} [answerData.code] - 绛旀鐨勭紪鍙?(鍙€? 鑻ヤ笉鎻愪緵鍒欒嚜鍔ㄧ敓鎴?
   * @param {string} [answerData.elementId] - 鍏冪礌ID (鍙€? 鑻argetElement涓嶈冻浠ユ弿杩版椂浣跨敤)
   */
  const collectAnswer = useCallback(({ targetElement, value, code = null, elementId = null }) => {
    setCurrentPageData(prevData => {
      const answerCode = code || (prevData.answerList?.length || 0) + 1;
      const existingAnswerIndex = prevData.answerList?.findIndex(a => a.targetElement === (targetElement || elementId));
      const newAnswer = {
        code: answerCode,
        targetElement: targetElement || elementId,
        value,
        // time: formatDateTime(now), // 鏍规嵁瑙勮寖锛宎nswerList娌℃湁time瀛楁锛屾敞閲婃帀
      };

      let newAnswerList;
      if (existingAnswerIndex !== -1 && existingAnswerIndex !== undefined) {
        // 鏇存柊鐜版湁绛旀
        newAnswerList = [...(prevData.answerList || [])];
        newAnswerList[existingAnswerIndex] = { ...newAnswerList[existingAnswerIndex], ...newAnswer}; //淇濈暀鏃ode锛屾洿鏂皏alue
      } else {
        // 娣诲姞鏂扮瓟妗?
        newAnswerList = [...(prevData.answerList || []), newAnswer];
      }
      
      return {
        ...prevData,
        answerList: newAnswerList,
      };
    });
  }, []); // 绉婚櫎鎵€鏈変緷璧栵紝鍥犱负浣跨敤鐨勬槸prevData

  /**
   * 鍑嗗褰撳墠椤甸潰鐨勬彁浜ゆ暟鎹?(mark 瀵硅薄)
   * @returns {object | null} 鍖呭惈褰撳墠椤甸潰鎵€鏈夊緟鎻愪氦鏁版嵁鐨?mark 瀵硅薄锛屾垨鍦ㄤ俊鎭笉鍏ㄦ椂杩斿洖 null
   */
  const preparePageSubmissionData = useCallback(() => {
    const pageDetails = pageInfoMapping[currentPageId];
    if (!pageDetails) {
      console.error(`[DataLoggerContext] preparePageSubmissionData: Cannot find page details for ${currentPageId}`);
      return null;
    }

    const beginTimeFormatted = formatDateTime(pageEnterTime);
    const endTimeFormatted = formatDateTime(new Date());

    if (!beginTimeFormatted) {
        console.warn(`[DataLoggerContext] preparePageSubmissionData: pageEnterTime for ${currentPageId} is not set or invalid.`);
        // 鍙互鍦ㄨ繖閲屽喅瀹氭槸鍚﹂樆姝㈡彁浜わ紝鎴栬€呯敤涓€涓爣璁板€?
    }

    return {
      pageNumber: pageDetails.number,
      pageDesc: pageDetails.desc,
      operationList: currentPageData.operationList || [],
      answerList: currentPageData.answerList || [],
      beginTime: beginTimeFormatted,
      endTime: endTimeFormatted,
      imgList: [], // 閫氬父涓虹┖
    };
  }, [currentPageId, currentPageData, pageEnterTime, formatDateTime]);

  /**
   * 澶勭悊閫€鍑虹櫥褰?
   * 娓呴櫎璁よ瘉鐘舵€佸拰鐢ㄦ埛淇℃伅
   */
  const handleLogout = useCallback(() => {
    debugLog('[AppContext] 鎵ц鐧诲嚭鎿嶄綔...');
    
    // 娓呴櫎璁よ瘉鐘舵€?
    setIsAuthenticated(false);
    setIsLoggedIn(false);
    setAuthToken(null);
    setCurrentUser(null);
    
    // 娓呴櫎浠诲姟鐩稿叧鐘舵€?
    setBatchCode('');
    setExamNo('');
    setPageNum(null);
    setTaskStartTime(null);
    setRemainingTime(TOTAL_TASK_DURATION);
    setCurrentPageIdInternal('Page_Login');
    setIsTaskFinished(false);
    setIsTimeUp(false);
    setCurrentPageData({ operationList: [], answerList: [] });
    setPageEnterTime(null);
    setModuleUrl('');
    
    // 娓呴櫎闂嵎鐩稿叧鐘舵€?
    setIsQuestionnaireCompleted(false);
    setQuestionnaireAnswers({});
    setIsQuestionnaireStarted(false);
    setIsQuestionnaireTimeUp(false);
    setQuestionnaireRemainingTime(DEFAULT_QUESTIONNAIRE_DURATION);
    setQuestionnaireStartTime(null);

    // 娓呴櫎缁熶竴璁℃椂鍣ㄧ姸鎬?
    TimerService.resetAll();
    
    // 娓呴櫎鏈湴瀛樺偍 - 瀹屾暣娓呴櫎鎵€鏈夌紦瀛樻暟鎹?
    const keysToRemove = [
      'isAuthenticated',
      'currentUser',
      'batchCode',
      'examNo',
      'pageNum',
      'isTaskFinished',
      'taskStartTime',
      'remainingTime',
      'currentPageId',
      'isQuestionnaireCompleted',
      'questionnaireAnswers',
      'isQuestionnaireStarted',
      'questionnaireStartTime',
      'questionnaireRemainingTime',
      'moduleUrl', // 娓呴櫎妯″潡URL鐘舵€?
      'lastUserId', // 涔熸竻闄や繚瀛樼殑鐢ㄦ埛鍚嶏紙鐢ㄤ簬session杩囨湡鑷姩濉厖锛?
      'lastSessionEndTime', // 娓呴櫎浼氳瘽缁撴潫鏃堕棿
      'shouldClearOnNextSession', // 娓呴櫎鏃х殑缂撳瓨娓呴櫎鏍囧織
      'cacheCleared', // 娓呴櫎鏃х殑缂撳瓨娓呴櫎鏍囧織
      'lastClearTime', // 娓呴櫎鏃х殑缂撳瓨娓呴櫎鏍囧織
      // 杩借釜娴嬭瘎锛坓rade-7-tracking锛夋寔涔呭寲閿紝纭繚閲嶆柊杩涘叆涓哄叏鏂颁細璇?
      'tracking_sessionId',
      'tracking_session',
      'tracking_experimentTrials',
      'tracking_chartData',
      'tracking_textResponses',
      'tracking_questionnaireAnswers'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    // 娓呯悊缁熶竴鐨勬ā鍧楄矾鐢辨寔涔呭寲閿?
    removeStorageItem(STORAGE_KEYS.CORE_MODULE_URL);
    removeStorageItem(STORAGE_KEYS.CORE_PAGE_NUM);
    
    debugLog('[AppContext] 鐧诲嚭瀹屾垚锛屾墍鏈夌姸鎬佸拰缂撳瓨宸叉竻闄?);
  }, []);

  /**
   * 娓呴櫎鎵€鏈夌紦瀛樻暟鎹殑鍑芥暟
   * 鐢ㄤ簬娴忚鍣ㄥ叧闂椂鐨勬竻鐞嗘搷浣?
   */
  const clearAllCache = useCallback(() => {
    debugLog('[AppContext] 娓呴櫎鎵€鏈夌紦瀛樻暟鎹?..');
    
    // 璋冪敤鐜版湁鐨勭櫥鍑洪€昏緫鏉ユ竻鐞嗙姸鎬?
    handleLogout();
    
    // 棰濆娓呯悊涓€浜涘彲鑳界殑娈嬬暀鏁版嵁
    try {
      // 娓呴櫎鎵€鏈夊彲鑳界殑localStorage閿?
      const additionalKeys = [
        'cacheCleared',
        'lastClearTime',
        'pageHiddenTime'
      ];
      
      additionalKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // 娓呴櫎sessionStorage
      sessionStorage.clear();
      
      debugLog('[AppContext] 鎵€鏈夌紦瀛樻竻闄ゅ畬鎴?);
    } catch (error) {
      console.error('[AppContext] 娓呴櫎缂撳瓨鏃跺嚭閿?', error);
    }
  }, [handleLogout]);

  /**
   * 闆嗕腑寮廠ession杩囨湡澶勭悊鍑芥暟
   * 褰撴娴嬪埌session杩囨湡鏃讹紝鎵ц瀹屾暣鐨勬竻鐞嗗拰閲嶅畾鍚戞祦绋?
   */
  const handleSessionExpired = useCallback(() => {
    debugLog('[AppContext] 馃毇 Session宸茶繃鏈燂紝鎵ц瀹屾暣娓呯悊鍜岄噸瀹氬悜...');

    // 璁板綍session杩囨湡浜嬩欢
    try {
      logOperation({
        targetElement: '绯荤粺鎿嶄綔',
        eventType: '浼氳瘽杩囨湡',
        value: `褰撳墠椤甸潰: ${currentPageId}, Session杩囨湡鑷姩鐧诲嚭`
      });
    } catch (err) {
      console.warn('[AppContext] 鏃犳硶璁板綍session杩囨湡鎿嶄綔:', err);
    }

    // 鎻愮ず鐢ㄦ埛
    alert('鐧诲綍浼氳瘽宸茶繃鏈燂紝璇烽噸鏂扮櫥褰?);

    // 璋冪敤handleLogout娓呴櫎鎵€鏈夌姸鎬佸拰localStorage
    handleLogout();

    // 寮哄埗閲嶅畾鍚戝埌鏍硅矾寰勶紙鏄剧ず鐧诲綍椤碉級
    debugLog('[AppContext] 閲嶅畾鍚戝埌鐧诲綍椤?..');
    window.location.href = '/';
  }, [handleLogout, logOperation, currentPageId]);

  useEffect(() => {
    apiClient.setSessionExpiredHandler(handleSessionExpired);
  }, [handleSessionExpired]);

  const buildMarkFromContext = useCallback(() => {
    // preparePageSubmissionData() 鐩存帴杩斿洖 mark 瀵硅薄
    return preparePageSubmissionData() || null;
  }, [preparePageSubmissionData]);

  const getUserContextForSubmission = useCallback(() => ({
    batchCode: batchCode || getStorageItem(STORAGE_KEYS.CORE_BATCH_CODE) || '',
    examNo: examNo || getStorageItem(STORAGE_KEYS.CORE_EXAM_NO) || '',
  }), [batchCode, examNo]);

  const allowDevBypass = Boolean(import.meta.env?.DEV);

  const {
    submit: submitWithUnifiedHook,
    isSubmitting: isSubmittingPage,
    lastError: submissionError,
    getLastError: getSubmissionError,
  } = usePageSubmission({
    getUserContext: getUserContextForSubmission,
    buildMark: () => buildMarkFromContext(),
    getFlowContext: () => {
      const ctx = flowContextRef.current;
      debugLog('[AppContext] getFlowContext called, returning:', ctx);
      return ctx;
    },
    handleSessionExpired,
    allowProceedOnFailureInDev: allowDevBypass,
    logger: console,
  });

  // 浣跨敤娴忚鍣ㄥ叧闂洃鍚琀ook
  const { clearCache } = useBrowserCloseHandler(clearAllCache);

  /**
   * 浣跨敤鎸囧畾鐨勮璇佷俊鎭彁浜ら〉闈㈡暟鎹殑鍐呴儴鍑芥暟
   * @param {string} submitBatchCode - 鎵规鍙?
   * @param {string} submitExamNo - 鑰冨彿
   * @param {object} [customData] - 鍙€夌殑鑷畾涔夐〉闈㈡暟鎹紝濡傛灉涓嶆彁渚涘垯浣跨敤褰撳墠鐘舵€佹暟鎹?
   * @returns {Promise<boolean>} 鎻愪氦鏄惁鎴愬姛
   */
  const submitPageDataWithInfo = useCallback(async (submitBatchCode, submitExamNo, customData = null) => {
    let markData;
    
    if (customData) {
      const hasCompleteMark = customData.pageNumber && customData.pageDesc;
      if (hasCompleteMark) {
        markData = {
          pageNumber: String(customData.pageNumber),
          pageDesc: String(customData.pageDesc),
          operationList: Array.isArray(customData.operationList) ? customData.operationList : [],
          answerList: Array.isArray(customData.answerList) ? customData.answerList : [],
          beginTime: customData.beginTime || (pageEnterTime ? formatDateTime(pageEnterTime) : formatDateTime(new Date())),
          endTime: customData.endTime || formatDateTime(new Date()),
          imgList: Array.isArray(customData.imgList) ? customData.imgList : [],
        };
      } else {
        const pageDetails = pageInfoMapping[currentPageId] || { number: '0', desc: '鏈煡椤甸潰' };
        markData = {
          pageNumber: pageDetails.number,
          pageDesc: pageDetails.desc,
          operationList: customData.operationList || [],
          answerList: customData.answerList || [],
          beginTime: pageEnterTime ? formatDateTime(pageEnterTime) : formatDateTime(new Date()),
          endTime: formatDateTime(new Date()),
          imgList: [],
        };
      }
    } else {
      // preparePageSubmissionData() 鐩存帴杩斿洖 mark 瀵硅薄锛屼笉鏄?{ mark: {...} } 鏍煎紡
      markData = preparePageSubmissionData();
    }

    if (!markData) {
      console.error("[AppContext] submitPageData: Failed to prepare submission data.");
      return false;
    }

    try {
      logOperation({ 
        targetElement: '绯荤粺鎿嶄綔',
        eventType: '鍙戣捣椤甸潰鏁版嵁鎻愪氦',
        value: `Page: ${currentPageId} (${markData.pageDesc})`
      });
      
      debugLog("[AppContext] 姝ｅ湪鎻愪氦鏁版嵁:", {
        pageId: currentPageId,
        batchCode: submitBatchCode,
        examNo: submitExamNo,
        markData,
      });
      
      debugLog("[AppContext] operationList鍐呭璇︽儏:", markData.operationList);
      debugLog("[AppContext] operationList闀垮害:", markData.operationList?.length || 0);
      debugLog("[AppContext] answerList鍐呭璇︽儏:", markData.answerList);
      debugLog("[AppContext] answerList闀垮害:", markData.answerList?.length || 0);
      
      const success = await submitWithUnifiedHook({
        markOverride: markData,
        userContextOverride: {
          batchCode: submitBatchCode,
          examNo: submitExamNo,
        },
      });

      if (success) {
        logOperation({
          targetElement: '绯荤粺鎿嶄綔',
          eventType: '椤甸潰鏁版嵁鎻愪氦鎴愬姛',
          value: `Page: ${currentPageId}`,
        });

        localStorage.setItem('lastSessionEndTime', Date.now().toString());
        return true;
      }

      const error = getSubmissionError();
      throw error || new Error('unknown submission failure');
    } catch (error) {
      console.error("[AppContext] submitPageData: Error submitting page data:", error);

      if (error && !error.isSessionExpired && error.code !== 401) {
        logOperation({ 
          targetElement: '绯荤粺鎿嶄綔',
          eventType: '椤甸潰鏁版嵁鎻愪氦澶辫触',
          value: `Page: ${currentPageId}, Error: ${error?.message}`
        });
        console.error("鏁版嵁鎻愪氦澶辫触锛屽彲鑳芥槸缃戠粶闂锛岃绋嶅悗閲嶈瘯");
      }

      return false;
    }
  }, [
    formatDateTime,
    getSubmissionError,
    logOperation,
    pageEnterTime,
    preparePageSubmissionData,
    submitWithUnifiedHook,
    currentPageId,
  ]);

  /**
   * 鎻愪氦褰撳墠椤甸潰鐨勬暟鎹?
   * @async
   * @returns {Promise<boolean>} 鎻愪氦鎴愬姛杩斿洖 true锛屽け璐ヨ繑鍥?false
   */
  const submitPageData = useCallback(async (options = {}) => {
    const { isFromButton = false } = options; // New option parameter

    // Block automatic submission for Page_19_Task_Completion
    if (currentPageId === 'Page_19_Task_Completion' && !isFromButton) {
      console.warn("[AppContext] submitPageData: Auto-submission for Page_19_Task_Completion was blocked. This call was not from the P19 button.");
      // Return true to pretend submission happened, to avoid blocking calling logic (like navigateToPage)
      // but the actual data won't be sent. The P19 button click will do the real submission.
      return true; 
    }

    // 妫€鏌ョ櫥褰曠姸鎬佸拰蹇呰鐨勮璇佷俊鎭?
    // 棣栧厛灏濊瘯浠庡綋鍓嶇姸鎬佽幏鍙栵紝濡傛灉娌℃湁鍒欎粠localStorage鑾峰彇
    const currentBatchCode = batchCode || getStorageItem(STORAGE_KEYS.CORE_BATCH_CODE);
    const currentExamNo = examNo || getStorageItem(STORAGE_KEYS.CORE_EXAM_NO);
    const currentAuthStatus = (isLoggedIn && isAuthenticated) || getStorageItem(STORAGE_KEYS.CORE_AUTH) === 'true';
    
    if (!currentAuthStatus || !currentBatchCode || !currentExamNo) {
      console.error("[AppContext] submitPageData: Missing login info or not authenticated.", {
        isLoggedIn,
        isAuthenticated,
        currentAuthStatus,
        hasBatchCode: !!currentBatchCode,
        hasExamNo: !!currentExamNo
      });
      
      // 鏃犳硶鎭㈠璁よ瘉淇℃伅锛屽紩瀵肩敤鎴烽噸鏂扮櫥褰?
      console.error("[AppContext] 鏃犳硶鎭㈠璁よ瘉淇℃伅锛岄渶瑕侀噸鏂扮櫥褰?);
      alert('鐧诲綍鐘舵€佸凡澶辨晥锛岃閲嶆柊鐧诲綍');
      handleLogout();
      return false;
    }
    
    // 濡傛灉褰撳墠鐘舵€佸彉閲忎负绌轰絾localStorage鏈夊€硷紝鍚屾鐘舵€?
    if (!batchCode && currentBatchCode) {
      setBatchCode(currentBatchCode);
    }
    if (!examNo && currentExamNo) {
      setExamNo(currentExamNo);
    }
    if ((!isLoggedIn || !isAuthenticated) && currentAuthStatus) {
      setIsAuthenticated(true);
      setIsLoggedIn(true);
    }
    
    return await submitPageDataWithInfo(currentBatchCode, currentExamNo);
  }, [isLoggedIn, isAuthenticated, batchCode, examNo, handleLogout, submitPageDataWithInfo]);

  // 浠庢寔涔呭寲瀛樺偍涓仮澶嶆暟鎹?
  useEffect(() => {
    debugLog('[AppContext] 寮€濮嬪垵濮嬪寲锛屾鏌ョ姸鎬佹仮澶?..');
    
    debugLog('[AppContext] 鐘舵€佹鏌ョ粨鏋?', {
      localStorage_keys: Object.keys(localStorage),
      sessionStorage_keys: Object.keys(sessionStorage),
      sessionStartTime: sessionStorage.getItem('sessionStartTime'),
      lastSessionEndTime: localStorage.getItem('lastSessionEndTime'),
      isAuthenticated: localStorage.getItem('isAuthenticated'),
      currentPageId: localStorage.getItem('currentPageId')
    });
    
    // 绉婚櫎鏃х殑缂撳瓨娓呴櫎鐩稿叧閫昏緫
    // 鐜板湪榛樿鎬绘槸灏濊瘯鎭㈠鐢ㄦ埛鐘舵€?
    debugLog('[AppContext] 馃捑 鍚敤鐘舵€佹寔涔呭寲妯″紡锛屽皾璇曟仮澶嶇敤鎴风姸鎬?);
    
    // 娓呯悊鏃х殑缂撳瓨娓呴櫎鏍囧織锛堝悜鍚庡吋瀹癸級
    const shouldClearCache = sessionStorage.getItem('shouldClearCache');
    const cacheCleared = localStorage.getItem('cacheCleared');
    const shouldClearOnNextSession = localStorage.getItem('shouldClearOnNextSession');
    
    if (shouldClearCache === 'true' || cacheCleared === 'true' || shouldClearOnNextSession === 'true') {
      debugLog('[AppContext] 娓呯悊鏃х殑缂撳瓨娓呴櫎鏍囧織...');
      sessionStorage.removeItem('shouldClearCache');
      localStorage.removeItem('cacheCleared');
      localStorage.removeItem('lastClearTime');
      localStorage.removeItem('shouldClearOnNextSession');
    }

    // 鏂扮殑缁熶竴璁よ瘉鐘舵€佹仮澶嶉€昏緫
    try {
      // 棣栧厛妫€鏌ession鏈夋晥鏈燂紙鍩轰簬鏃堕棿锛?
      const lastSessionEndTime = localStorage.getItem('lastSessionEndTime');
      const SESSION_EXPIRY_MINUTES = 90; // Session鏈夋晥鏈燂細90鍒嗛挓

      if (lastSessionEndTime) {
        const sessionEndTimeMillis = parseInt(lastSessionEndTime, 10);
        const minutesSinceLastSession = (Date.now() - sessionEndTimeMillis) / (1000 * 60);

        debugLog('[AppContext] Session骞撮緞妫€鏌?', {
          lastSessionEndTime: new Date(sessionEndTimeMillis).toLocaleString(),
          minutesSinceLastSession: minutesSinceLastSession.toFixed(2),
          expiryThreshold: SESSION_EXPIRY_MINUTES
        });

        if (minutesSinceLastSession > SESSION_EXPIRY_MINUTES) {
          debugLog('[AppContext] 鈴?Session宸茶繃鏈燂紙瓒呰繃90鍒嗛挓锛夛紝娓呴櫎鎵€鏈夎璇佹暟鎹?);
          // 娓呴櫎鎵€鏈塴ocalStorage鏁版嵁
          handleLogout();
          // 涓嶅啀缁х画鎭㈠鐘舵€?
          return;
        }
      }

      const savedAuth = localStorage.getItem('isAuthenticated');
      const savedUser = localStorage.getItem('currentUser');
      const savedBatchCode = getStorageItem(STORAGE_KEYS.CORE_BATCH_CODE);
      const savedExamNo = getStorageItem(STORAGE_KEYS.CORE_EXAM_NO);
      const storedTaskStartTime = localStorage.getItem('taskStartTime');
      const storedRemainingTime = localStorage.getItem('remainingTime');
      const storedCurrentPageId = localStorage.getItem('currentPageId');
      const storedIsTaskFinished = localStorage.getItem('isTaskFinished') === 'true';
      // 鎭㈠闂嵎瀹屾垚鐘舵€?
      const storedIsQuestionnaireCompleted = localStorage.getItem('isQuestionnaireCompleted') === 'true';
      const storedIsQuestionnaireStarted = localStorage.getItem('isQuestionnaireStarted') === 'true';
      const storedQuestionnaireStartTime = localStorage.getItem('questionnaireStartTime');
      const storedQuestionnaireRemainingTime = localStorage.getItem('questionnaireRemainingTime');
      // 鎭㈠妯″潡URL鐘舵€?
      const storedModuleUrl = getStorageItem(STORAGE_KEYS.CORE_MODULE_URL);
      
      // 鎭㈠闂嵎鐩稿叧鐘舵€?
      if (storedIsQuestionnaireCompleted) {
        setIsQuestionnaireCompleted(true);
        debugLog('[AppContext] 浠庢湰鍦板瓨鍌ㄦ仮澶嶉棶鍗峰畬鎴愮姸鎬?);
      } else if (storedIsQuestionnaireStarted && storedQuestionnaireStartTime && storedQuestionnaireRemainingTime) {
        // 鎭㈠闂嵎璁℃椂鍣ㄧ姸鎬?
        const questionnaireStartTimeObj = new Date(storedQuestionnaireStartTime);
        const parsedQuestionnaireRemainingTime = parseInt(storedQuestionnaireRemainingTime, 10);
        
        // 璁＄畻闂嵎瀹為檯鍓╀綑鏃堕棿
        const now = new Date().getTime();
        const lastSessionEndTime = localStorage.getItem('lastSessionEndTime');
        
        let actualQuestionnaireRemainingTime;

        if (lastSessionEndTime) {
          const sessionEndTimeMillis = parseInt(lastSessionEndTime);
          const offlineTimeSeconds = Math.floor((now - sessionEndTimeMillis) / 1000);

          debugLog('[AppContext] 璁＄畻闂嵎鍊掕鏃舵仮澶?', {
            storedQuestionnaireRemainingTime: parsedQuestionnaireRemainingTime,
            offlineTimeSeconds,
            lastSessionEndTime: new Date(sessionEndTimeMillis).toLocaleString()
          });

          actualQuestionnaireRemainingTime = Math.max(0, parsedQuestionnaireRemainingTime - offlineTimeSeconds);
        } else {
          // 鐩存帴浣跨敤淇濆瓨鐨勫墿浣欐椂闂达紝涓嶉噸鏂拌绠?
          // 杩欐牱鍙互淇濇寔妯″潡鑷畾涔夌殑鍊掕鏃舵椂闀匡紙濡?grade-7-tracking 鐨?0绉掞級
          actualQuestionnaireRemainingTime = parsedQuestionnaireRemainingTime;
          debugLog('[AppContext] 浣跨敤淇濆瓨鐨勯棶鍗峰墿浣欐椂闂?', actualQuestionnaireRemainingTime, '绉?);
        }
        
        if (actualQuestionnaireRemainingTime <= 0) {
          setQuestionnaireRemainingTime(0);
          setIsQuestionnaireTimeUp(true);
          debugLog('[AppContext] 馃晲 闂嵎鏃堕棿宸插埌锛屽€掕鏃朵负0');
        } else {
          setQuestionnaireRemainingTime(actualQuestionnaireRemainingTime);
          setIsQuestionnaireStarted(true);
          setQuestionnaireStartTime(questionnaireStartTimeObj);
          debugLog('[AppContext] 鈴?鎭㈠闂嵎鍊掕鏃?', actualQuestionnaireRemainingTime, '绉?);
        }
      }

      // 妫€鏌ユ槸鍚︽湁鏈夋晥鐨勮璇佷俊鎭?
      if (savedAuth === 'true' && savedUser && savedBatchCode && savedExamNo) {
        const userData = JSON.parse(savedUser);
        
        setIsAuthenticated(true);
        setIsLoggedIn(true);
        setCurrentUser(userData);
        setBatchCode(savedBatchCode);
        setExamNo(savedExamNo);
        
        // 鎭㈠妯″潡URL鐘舵€侊紝鎻愪緵榛樿鍊?
        if (storedModuleUrl) {
          setModuleUrl(storedModuleUrl);
          debugLog('[AppContext] 浠巐ocalStorage鎭㈠moduleUrl:', storedModuleUrl);
        } else {
          // 濡傛灉娌℃湁瀛樺偍鐨刄RL锛屼娇鐢ㄩ粯璁ゅ€硷紙鍥涘勾绾фā鍧楋級
          const defaultUrl = '/four-grade';
          setModuleUrl(defaultUrl);
          setStorageItem(STORAGE_KEYS.CORE_MODULE_URL, defaultUrl, true);
          debugLog('[AppContext] 浣跨敤榛樿moduleUrl:', defaultUrl);
        }
        
        debugLog('浠庢湰鍦板瓨鍌ㄦ仮澶嶇櫥褰曠姸鎬?', userData);

        if (storedIsTaskFinished) {
          // setIsTaskFinished(true); // <--- TEMPORARILY COMMENT OUT
          debugLog("[AppContext] Initial load: storedIsTaskFinished was true, setIsTaskFinished(true) SKIPPED for testing.");
          if (storedCurrentPageId) setCurrentPageIdInternal(storedCurrentPageId);
          else setCurrentPageIdInternal('Page_19_Task_Completion');
          // return; // We might still want to proceed with timer logic if task wasn't actually finished by P19 button click
        }

        // 鎭㈠浠诲姟鐩稿叧鐘舵€?
        if (storedTaskStartTime && storedRemainingTime) {
          const parsedRemainingTime = parseInt(storedRemainingTime, 10);
          const taskStartTimeObj = new Date(storedTaskStartTime);
          
          // 璁＄畻瀹為檯鍓╀綑鏃堕棿锛岃€冭檻娴忚鍣ㄥ叧闂湡闂寸殑鏃堕棿娴侀€?
          const now = new Date().getTime();
          const lastSessionEndTime = localStorage.getItem('lastSessionEndTime');
          
          let actualRemainingTime;
          
          if (lastSessionEndTime) {
            // 濡傛灉鏈夎褰曠殑浼氳瘽缁撴潫鏃堕棿锛岃绠楃绾挎湡闂存祦閫濈殑鏃堕棿
            const sessionEndTimeMillis = parseInt(lastSessionEndTime);
            const offlineTimeSeconds = Math.floor((now - sessionEndTimeMillis) / 1000);
            
            debugLog('[AppContext] 璁＄畻鍊掕鏃舵仮澶?', {
              storedRemainingTime: parsedRemainingTime,
              offlineTimeSeconds,
              lastSessionEndTime: new Date(sessionEndTimeMillis).toLocaleString(),
              currentTime: new Date(now).toLocaleString()
            });
            
            // 浠庡瓨鍌ㄧ殑鍓╀綑鏃堕棿涓噺鍘荤绾挎椂闂?
            actualRemainingTime = Math.max(0, parsedRemainingTime - offlineTimeSeconds);
          } else {
            // 濡傛灉娌℃湁浼氳瘽缁撴潫鏃堕棿锛屼娇鐢ㄤ紶缁熺殑寮€濮嬫椂闂磋绠楁柟娉?
            const startTimeMillis = taskStartTimeObj.getTime();
            const expectedEndTimeMillis = startTimeMillis + TOTAL_TASK_DURATION * 1000;
            actualRemainingTime = Math.max(0, Math.floor((expectedEndTimeMillis - now) / 1000));
          }
          
          if (actualRemainingTime <= 0) {
            setRemainingTime(0);
            setIsTimeUp(true);
            debugLog('[AppContext] 馃晲 浠诲姟鏃堕棿宸插埌锛屽€掕鏃朵负0');
          } else {
            setRemainingTime(actualRemainingTime);
            debugLog('[AppContext] 鈴?鎭㈠鍊掕鏃?', actualRemainingTime, '绉?);
          }
          
          setTaskStartTime(taskStartTimeObj);
          
          if (storedCurrentPageId && storedCurrentPageId !== 'Page_00_Start') {
            setCurrentPageIdInternal(storedCurrentPageId);
            setPageEnterTime(new Date()); // 閲嶆柊杩涘叆椤甸潰鐨勬椂闂?
          }
        } else if (storedCurrentPageId && storedCurrentPageId !== 'Page_00_Start') {
          // 鏈夐〉闈D浣嗘病鏈夎鏃跺櫒淇℃伅锛岃鏄庡彲鑳藉湪P0椤甸潰
          setCurrentPageIdInternal(storedCurrentPageId);
        } else {
          // 鍒氱櫥褰曪紝杩樻病寮€濮嬩换鍔?
          setCurrentPageIdInternal('Page_01_Precautions');
        }
      } else {
        // 娌℃湁鏈夋晥鐨勮璇佷俊鎭紝纭繚璺宠浆鍒扮櫥褰曢〉
        setIsAuthenticated(false);
        setIsLoggedIn(false);
        setCurrentPageIdInternal('Page_Login');
        
        // 娓呴櫎鍙兘鎹熷潖鐨勬湰鍦板瓨鍌ㄦ暟鎹?
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('batchCode');
        localStorage.removeItem('examNo');
      }
    } catch (error) {
      console.error('鎭㈠鐧诲綍鐘舵€佹椂鍑洪敊:', error);
      // 鍑洪敊鏃舵竻闄ゆ墍鏈夋暟鎹苟璺宠浆鍒扮櫥褰曢〉
      handleLogout();
    }
  }, []); // 鍙湪缁勪欢鎸傝浇鏃舵墽琛屼竴娆?

  // This useEffect is responsible for managing localStorage items when isTaskFinished changes,
  // and for determining the correct localStorage.currentPageId when the task is finished.
  // It should be the primary handler for localStorage.currentPageId when isTaskFinished is true.
  // Dependencies should be [isTaskFinished, currentPageId, pageInfoMapping]
  useEffect(() => {
    if (isTaskFinished) {
      localStorage.setItem('isTaskFinished', 'true');
      localStorage.removeItem('taskStartTime');
      localStorage.removeItem('remainingTime');

      const pageDetails = pageInfoMapping[currentPageId];
      const isQuestionnairePage = pageDetails && pageDetails.number >= 20 && pageDetails.number <= 28;

      if (!isQuestionnairePage) {
        // Task is finished, but we are NOT on a questionnaire page.
        // This could be P19 itself, or an earlier page if task ended due to timeout.
        // localStorage should point to Page_19_Task_Completion.
        localStorage.setItem('currentPageId', 'Page_19_Task_Completion');
      }
      // 闂嵎椤甸潰鐨刢urrentPageId鎸佷箙鍖栫敱鍙︿竴涓猽seEffect澶勭悊
    } else {
      // Task is not finished. Remove the task finished flag.
      // The persistence of currentPageId for an active task is handled by another useEffect.
      localStorage.removeItem('isTaskFinished');
    }
  }, [isTaskFinished, currentPageId, pageInfoMapping]);

  // 鎸佷箙鍖栧綋鍓嶉〉闈D
  useEffect(() => {
    // 鎸佷箙鍖朿urrentPageId鐨勬潯浠讹細
    // 1. 鐢ㄦ埛宸茬櫥褰?
    // 2. 涓嶆槸鐧诲綍椤?
    // 3. 浠诲姟鏈畬鎴?OR 锛堜换鍔″凡瀹屾垚涓斿綋鍓嶆槸闂嵎椤甸潰锛?
    // 杩欑‘淇濅簡闂嵎闃舵鐨勯〉闈㈠垏鎹篃鑳借姝ｇ‘鎸佷箙鍖?
    const pageDetails = pageInfoMapping[currentPageId];
    const isQuestionnairePage = pageDetails && pageDetails.number >= 20 && pageDetails.number <= 28;
    
    if (isLoggedIn && currentPageId !== 'Page_Login' && 
        (!isTaskFinished || (isTaskFinished && isQuestionnairePage))) {
      localStorage.setItem('currentPageId', currentPageId);
      debugLog(`[AppContext] 鎸佷箙鍖栧綋鍓嶉〉闈D: ${currentPageId}`);
    }
  }, [currentPageId, isLoggedIn, isTaskFinished, pageInfoMapping]);

  const handleTaskTick = useCallback((remaining) => {
    setRemainingTime(remaining);
  }, []);

  const handleTaskTimeout = useCallback(() => {
    debugLog('[AppContext] 鈴?缁熶竴浠诲姟璁℃椂鍣ㄨЕ鍙戣秴鏃?);
    setRemainingTime(0);
    setIsTimeUp(true);
    try {
      logOperation({ pageId: currentPageId, targetElement: '绯荤粺浜嬩欢', eventType: '浠诲姟瓒呮椂' });
    } catch (error) {
      console.error('[AppContext] 璁板綍瓒呮椂鎿嶄綔澶辫触:', error);
    }
    removeStorageItem(STORAGE_KEYS.TIMER_TASK_REMAINING);
  }, [currentPageId, logOperation]);

  const {
    remaining: taskTimerRemaining,
    start: startTaskCountdown,
  } = useTimer('task', {
    onTimeout: handleTaskTimeout,
    onTick: handleTaskTick,
    scope: G7_TASK_TIMER_SCOPE,
  });

  useEffect(() => {
    if (typeof taskTimerRemaining === 'number' && !Number.isNaN(taskTimerRemaining)) {
      setRemainingTime(taskTimerRemaining);
    }
  }, [taskTimerRemaining]);

  useEffect(() => {
    const debug = TimerService.getInstance('task').getDebugInfo();
    if (typeof debug.remaining === 'number' && !Number.isNaN(debug.remaining)) {
      setRemainingTime(debug.remaining);
    }
    if (debug.startTime && !taskStartTime) {
      setTaskStartTime(new Date(debug.startTime));
    }
    if (debug.isTimeout) {
      setIsTimeUp(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQuestionnaireTick = useCallback((remaining) => {
    setQuestionnaireRemainingTime(remaining);
  }, []);

  const handleQuestionnaireTimeout = useCallback(() => {
    debugLog('[AppContext] 鈴?缁熶竴闂嵎璁℃椂鍣ㄨЕ鍙戣秴鏃?);
    setQuestionnaireRemainingTime(0);
    setIsQuestionnaireTimeUp(true);
    logOperation({
      targetElement: '闂嵎璁℃椂鍣?,
      eventType: '闂嵎瓒呮椂',
      value: '闂嵎浣滅瓟鏃堕棿宸茬粨鏉?
    });
    removeStorageItem(STORAGE_KEYS.TIMER_QUESTIONNAIRE_REMAINING);
  }, [logOperation]);

  const {
    remaining: questionnaireTimerRemaining,
    start: startQuestionnaireCountdown,
  } = useTimer('questionnaire', {
    onTimeout: handleQuestionnaireTimeout,
    onTick: handleQuestionnaireTick,
    scope: G7_QUESTIONNAIRE_TIMER_SCOPE,
  });

  useEffect(() => {
    if (typeof questionnaireTimerRemaining === 'number' && !Number.isNaN(questionnaireTimerRemaining)) {
      setQuestionnaireRemainingTime(questionnaireTimerRemaining);
    }
  }, [questionnaireTimerRemaining]);

  useEffect(() => {
    const debug = TimerService.getInstance('questionnaire').getDebugInfo();
    if (typeof debug.remaining === 'number' && !Number.isNaN(debug.remaining)) {
      setQuestionnaireRemainingTime(debug.remaining);
    }
    if (debug.startTime && !questionnaireStartTime) {
      setQuestionnaireStartTime(new Date(debug.startTime));
    }
    if (debug.isRunning || debug.isPaused || (typeof debug.remaining === 'number' && debug.remaining > 0)) {
      setIsQuestionnaireStarted(true);
    }
    if (debug.isTimeout) {
      setIsQuestionnaireTimeUp(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * 璁剧疆鐧诲綍淇℃伅骞舵爣璁颁负宸茬櫥褰?
   * @param {string} bCode - Batch Code
   * @param {string} eNo - Exam No
   */
  const login = useCallback((bCode, eNo) => {
    setBatchCode(bCode);
    setExamNo(eNo);
    setIsLoggedIn(true);
    // Reset task related states for a fresh start, in case of re-login (though not typical for this app)
    setTaskStartTime(null);
    setRemainingTime(TOTAL_TASK_DURATION);
    setCurrentPageIdInternal('Page_01_Precautions');  // 鏀逛负娉ㄦ剰浜嬮」椤甸潰
    setIsTaskFinished(false);
    setIsTimeUp(false);
    // 閲嶇疆闂嵎鐩稿叧鐘舵€?
    setIsQuestionnaireCompleted(false);
    setQuestionnaireAnswers({});
    setIsQuestionnaireStarted(false);
    setIsQuestionnaireTimeUp(false);
    setQuestionnaireRemainingTime(DEFAULT_QUESTIONNAIRE_DURATION);
    
    localStorage.removeItem('isTaskFinished');
    localStorage.removeItem('taskStartTime');
    localStorage.removeItem('remainingTime');
    localStorage.removeItem('currentPageId');
    // 娓呴櫎闂嵎鐩稿叧鐨刲ocalStorage
    localStorage.removeItem('isQuestionnaireCompleted');
    localStorage.removeItem('questionnaireAnswers');
    localStorage.removeItem('isQuestionnaireStarted');
    localStorage.removeItem('questionnaireStartTime');
    localStorage.removeItem('questionnaireRemainingTime');

    // 娓呴櫎缁熶竴璁℃椂鍣ㄧ殑娈嬬暀鐘舵€侊紝纭繚鏂颁細璇濅粠闆跺紑濮?
    TimerService.resetAll();
    
    // 鍒濆鐧诲綍鏃朵笉搴旇褰曟搷浣滐紝鍥犱负姝ゆ椂 logOperation 鍙兘渚濊禆灏氭湭瀹屽叏鍒濆鍖栫殑鐘舵€?
  }, []);
  
  /**
   * 鍚姩浠诲姟璁℃椂
   * 搴旇鍦ㄧ敤鎴风‘璁ゅ紑濮嬩换鍔″悗锛堜緥濡備粠P0椤甸潰鐐瑰嚮寮€濮嬶級璋冪敤
   */
  const startTaskTimer = useCallback(() => {
    if (!isLoggedIn) {
      return;
    }

    const timerInstance = TimerService.getInstance('task');
    const alreadyRunning = timerInstance.isRunning && !timerInstance.isTimeout();

    if (!alreadyRunning && (timerInstance.getRemaining() <= 0 || timerInstance.isTimeout())) {
      timerInstance.reset();
    }

    startTaskCountdown(TOTAL_TASK_DURATION, {
      onTimeout: handleTaskTimeout,
      scope: G7_TASK_TIMER_SCOPE,
    });

    if (!alreadyRunning) {
      const now = new Date();
      setTaskStartTime(now);
      setPageEnterTime(now);
      setIsTimeUp(false);
      setIsTaskFinished(false);
      setRemainingTime(TOTAL_TASK_DURATION);
      logOperation({ targetElement: '绯荤粺浜嬩欢', eventType: '浠诲姟寮€濮? });
    }
  }, [handleTaskTimeout, isLoggedIn, logOperation, startTaskCountdown]);

  /**
   * 鍚姩闂嵎璁℃椂
   * 鍦ㄧ敤鎴疯繘鍏ラ棶鍗疯鏄庨〉闈㈢偣鍑?寮€濮嬩綔绛?鏃惰皟鐢?
   *
   * @param {number} [duration] - 鍙€夌殑鑷畾涔夐棶鍗锋椂闀匡紙绉掞級锛屽鏋滀笉浼犲垯浣跨敤榛樿鍊?0鍒嗛挓
   */
  const startQuestionnaireTimer = useCallback((duration) => {
    if (!isLoggedIn) {
      return;
    }

    const questionnaireDuration = duration !== undefined ? duration : DEFAULT_QUESTIONNAIRE_DURATION;
    const timerInstance = TimerService.getInstance('questionnaire');
    const alreadyRunning = timerInstance.isRunning && !timerInstance.isTimeout();

    if (!alreadyRunning && (timerInstance.getRemaining() <= 0 || timerInstance.isTimeout())) {
      timerInstance.reset();
    }

    startQuestionnaireCountdown(questionnaireDuration, {
      onTimeout: handleQuestionnaireTimeout,
      scope: G7_QUESTIONNAIRE_TIMER_SCOPE,
    });

    if (!alreadyRunning) {
      const now = new Date();
      setQuestionnaireStartTime(now);
      setIsQuestionnaireTimeUp(false);
      setQuestionnaireRemainingTime(questionnaireDuration);
      logOperation({
        targetElement: '闂嵎璁℃椂鍣?,
        eventType: '闂嵎寮€濮?,
        value: '鐢ㄦ埛寮€濮嬩綔绛旈棶鍗?
      });
    }

    setIsQuestionnaireStarted(true);
  }, [handleQuestionnaireTimeout, isLoggedIn, logOperation, startQuestionnaireCountdown]);

  /**
   * 淇濆瓨闂嵎绛旀
   * @param {string} pageId - 椤甸潰ID (濡?'page21', 'page22')
   * @param {string} questionId - 闂ID (濡?'q1', 'q2')
   * @param {string} answer - 绛旀鍐呭
   */
  const saveQuestionnaireAnswer = useCallback((pageId, questionId, answer) => {
    setQuestionnaireAnswers(prev => ({
      ...prev,
      [pageId]: {
        ...prev[pageId],
        [questionId]: answer
      }
    }));
  }, []);

  /**
   * 鑾峰彇闂嵎绛旀
   * @param {string} pageId - 椤甸潰ID
   * @param {string} questionId - 闂ID
   * @returns {string} 绛旀鍐呭
   */
  const getQuestionnaireAnswer = useCallback((pageId, questionId) => {
    return questionnaireAnswers[pageId]?.[questionId] || '';
  }, [questionnaireAnswers]);

  /**
   * 鍒囨崲鍒颁笅涓€椤?
   * @param {string} nextPageId - 涓嬩竴椤电殑ID
   * @param {object} [options] - 鍙€夊弬鏁?
   * @param {boolean} [options.skipSubmit] - 鏄惁璺宠繃褰撳墠椤垫暟鎹彁浜?(榛樿涓篺alse)
   */
  const navigateToPage = useCallback(async (nextPageId, options = {}) => {
    const { skipSubmit = false } = options;
    let canNavigate = true;

    debugLog(`[AppContext] Attempting to navigate to: ${nextPageId}, skipSubmit: ${skipSubmit}, from: ${currentPageId}`);

    try {
      if (!skipSubmit && currentPageId !== 'Page_00_Start') { 
        debugLog(`[AppContext] 鍑嗗鎻愪氦褰撳墠椤甸潰鏁版嵁 - currentPageId: ${currentPageId}`);
        debugLog(`[AppContext] 褰撳墠椤甸潰鏁版嵁鐘舵€?`, currentPageData);
        debugLog(`[AppContext] 褰撳墠鎿嶄綔璁板綍鏁伴噺:`, currentPageData.operationList?.length || 0);
        debugLog(`[AppContext] 鎿嶄綔璁板綍璇︽儏:`, currentPageData.operationList);
        
        // 馃敡 淇鏃跺簭闂锛氬厛澶囦唤褰撳墠鏁版嵁锛岀劧鍚庡悓姝ユ坊鍔犻〉闈㈤€€鍑轰簨浠讹紝鍐嶆彁浜?
        const exitOperation = {
          code: (currentPageData.operationList?.length || 0) + 1,
          targetElement: '椤甸潰', 
          eventType: 'page_exit', 
          value: `绂诲紑椤甸潰${currentPageId}`,
          time: formatDateTime(new Date())
        };
        
        // 鍒涘缓鍖呭惈椤甸潰閫€鍑轰簨浠剁殑瀹屾暣鎿嶄綔鍒楄〃
        const completeOperationList = [...(currentPageData.operationList || []), exitOperation];
        
        // 涓存椂鏇存柊椤甸潰鏁版嵁鍖呭惈閫€鍑轰簨浠讹紝鐢ㄤ簬鎻愪氦
        const dataToSubmit = {
          ...currentPageData,
          operationList: completeOperationList
        };
        
        // 鐩存帴鎻愪氦鍖呭惈瀹屾暣鎿嶄綔璁板綍鐨勬暟鎹?
        const submissionSuccess = await submitPageDataWithInfo(
          batchCode || getStorageItem(STORAGE_KEYS.CORE_BATCH_CODE),
          examNo || getStorageItem(STORAGE_KEYS.CORE_EXAM_NO),
          dataToSubmit  // 浼犲叆瀹屾暣鏁版嵁鑰屼笉鏄娇鐢ㄥ綋鍓嶇姸鎬?
        );
        
        debugLog(`[AppContext] 椤甸潰鏁版嵁鎻愪氦缁撴灉: ${submissionSuccess}`);
        debugLog(`[AppContext] 鎻愪氦鐨勬搷浣滆褰曟暟閲?`, completeOperationList.length);
        
        if (!submissionSuccess) {
          console.warn(`[AppContext] Navigation to ${nextPageId} blocked due to submission failure of ${currentPageId}.`);
          canNavigate = false; 
        }
      }

      if (canNavigate) {
        // if (nextPageId === 'Page_19_Task_Completion') { // Temporarily comment out this block
        //   setIsTaskFinished(true);
        //   logOperation({ targetElement: '绯荤粺浜嬩欢', eventType: '浠诲姟瀹屾垚' });
        // }
        debugLog(`[AppContext] NOTE: Auto-setting isTaskFinished on navigate to P19 is temporarily disabled for testing.`);

        debugLog(`[AppContext] Navigating: Current: ${currentPageId}, Next: ${nextPageId}`);
        
        // 椤甸潰鍒囨崲锛氭暟鎹凡鎻愪氦锛岀幇鍦ㄥ彲浠ュ畨鍏ㄥ湴鍒囨崲椤甸潰鐘舵€?
        setCurrentPageIdInternal(targetPageId => {
          debugLog(`[AppContext] setCurrentPageIdInternal: old=${targetPageId}, new=${nextPageId}`);
          return nextPageId;
        });
        setPageEnterTime(new Date());
        
        // 閲嶇疆椤甸潰鏁版嵁涓烘柊椤甸潰鍋氬噯澶?
        setCurrentPageData({ operationList: [], answerList: [] });
        
        // 涓烘柊椤甸潰璁板綍杩涘叆浜嬩欢灏嗗湪椤甸潰缁勪欢鐨剈seEffect涓鐞?
        
        // 浣跨敤涓撻棬鐨勯〉闈㈠垏鎹㈠鐞嗗嚱鏁?
        handlePageTransition(); 
        
        if (nextPageId === 'Page_01_Precautions' && !taskStartTime && isLoggedIn) {
           // debugLog('[AppContext] Special logic for Page_01_Precautions');
        }
      }
    } catch (error) {
      console.error('[AppContext] Error during navigateToPage execution:', error);
      throw error; 
    }
  }, [currentPageId, logOperation, taskStartTime, isLoggedIn, setIsTaskFinished, setPageEnterTime, setCurrentPageData, setCurrentPageIdInternal, submitPageData, currentPageData, batchCode, examNo, submitPageDataWithInfo, formatDateTime]);

  /**
   * 鎭㈠浠诲姟鐘舵€侊紙璁℃椂鍣ㄥ拰椤甸潰鐘舵€侊級
   */
  const restoreTaskState = useCallback(() => {
    const storedTaskStartTime = localStorage.getItem('taskStartTime');
    const storedRemainingTime = localStorage.getItem('remainingTime');
    const storedCurrentPageId = localStorage.getItem('currentPageId');
    const storedIsTaskFinished = localStorage.getItem('isTaskFinished') === 'true';
    
    debugLog('[AppContext] 寮€濮嬫仮澶嶄换鍔＄姸鎬?..');
    debugLog('[AppContext] 瀛樺偍鐨勬暟鎹?', {
      taskStartTime: storedTaskStartTime,
      remainingTime: storedRemainingTime,
      currentPageId: storedCurrentPageId,
      isTaskFinished: storedIsTaskFinished
    });
    
    if (storedTaskStartTime && storedRemainingTime) {
      const parsedRemainingTime = parseInt(storedRemainingTime, 10);
      const taskStartTimeObj = new Date(storedTaskStartTime);
      
      // 璁＄畻瀹為檯鍓╀綑鏃堕棿
      const now = new Date().getTime();
      const startTimeMillis = taskStartTimeObj.getTime();
      const expectedEndTimeMillis = startTimeMillis + TOTAL_TASK_DURATION * 1000;
      
      if (now >= expectedEndTimeMillis) {
        setRemainingTime(0);
        setIsTimeUp(true);
        setIsTaskFinished(true);
        debugLog('[AppContext] 浠诲姟鏃堕棿宸插埌锛岃缃€掕鏃朵负0');
      } else {
        const newRemaining = Math.max(0, Math.floor((expectedEndTimeMillis - now) / 1000));
        setRemainingTime(newRemaining);
        setIsTimeUp(false);
        setIsTaskFinished(storedIsTaskFinished);
        debugLog(`[AppContext] 鎭㈠浠诲姟鍊掕鏃? ${newRemaining}绉抈);
      }
      
      setTaskStartTime(taskStartTimeObj);
      debugLog('[AppContext] 浠诲姟寮€濮嬫椂闂村凡鎭㈠:', taskStartTimeObj);
      
      if (storedCurrentPageId && storedCurrentPageId !== 'Page_00_Start' && storedCurrentPageId !== 'Page_Login') {
        setCurrentPageIdInternal(storedCurrentPageId);
        setPageEnterTime(new Date()); // 閲嶆柊杩涘叆椤甸潰鐨勬椂闂?
        debugLog(`[AppContext] 鎭㈠椤甸潰鐘舵€? ${storedCurrentPageId}`);
      }
    } else if (storedCurrentPageId && storedCurrentPageId !== 'Page_00_Start' && storedCurrentPageId !== 'Page_Login' && storedCurrentPageId !== 'Page_01_Precautions') {
      // 濡傛灉娌℃湁浠诲姟寮€濮嬫椂闂达紝浣嗙敤鎴峰凡缁忓湪浠诲姟椤甸潰涓紙涓嶆槸P0鍜孭1锛夛紝璇存槑浠诲姟搴旇宸茬粡寮€濮?
      debugLog('[AppContext] 妫€娴嬪埌鐢ㄦ埛鍦ㄤ换鍔¤繘琛岄〉闈絾鏃犺鏃跺櫒鏁版嵁锛屽惎鍔ㄨ鏃跺櫒');
      const now = new Date();
      setTaskStartTime(now);
      setRemainingTime(TOTAL_TASK_DURATION);
      setIsTimeUp(false);
      setIsTaskFinished(false);
      setCurrentPageIdInternal(storedCurrentPageId);
      setPageEnterTime(new Date());
      
      // 鎸佷箙鍖栦换鍔″紑濮嬬姸鎬?
      localStorage.setItem('taskStartTime', now.toISOString());
      localStorage.setItem('remainingTime', TOTAL_TASK_DURATION.toString());
      
      debugLog(`[AppContext] 浠诲姟璁℃椂鍣ㄥ凡鍚姩锛屾仮澶嶅埌椤甸潰: ${storedCurrentPageId}`);
    }
  }, []);

  /**
   * 澶勭悊鐧诲綍鎴愬姛
   * 鏇存柊璁よ瘉鐘舵€佸拰鐢ㄦ埛淇℃伅
   * @param {Object} userData - 鐢ㄦ埛鏁版嵁瀵硅薄
   * @param {string} userData.batchCode - 娴嬭瘎鎵规鍙?
   * @param {string} userData.examNo - 瀛︾敓鑰冨彿
   * @param {string} userData.studentName - 瀛︾敓濮撳悕
   * @param {string} userData.schoolName - 瀛︽牎鍚嶇О
   * @param {Object} userData - 瀹屾暣鐨勭敤鎴锋暟鎹?
   */
  const handleLoginSuccess = useCallback((userData) => {
    try {
      // 妫€鏌ユ槸鍚︿负閲嶆柊鐧诲綍锛堝凡鏈変换鍔℃暟鎹級
      const existingTaskStartTime = localStorage.getItem('taskStartTime');
      const existingCurrentPageId = localStorage.getItem('currentPageId');
      // 鍙鏈夐〉闈D涓斾笉鏄櫥褰曢〉闈紝灏辫涓烘槸閲嶆柊鐧诲綍锛岄渶瑕佹仮澶嶇姸鎬?
      const isRelogin = existingCurrentPageId && existingCurrentPageId !== 'Page_Login';
      const flowProgressFromLogin = userData?.progress || null;
      let flowIdFromLogin =
        extractFlowIdFromUrl(userData?.url || userData?.moduleUrl || '') ||
        flowProgressFromLogin?.flowId ||
        flowProgressFromLogin?.flow_id ||
        userData?.flowId ||
        userData?.flow_id ||
        null;

      
      // 鏇存柊璁よ瘉鐘舵€?
      setIsAuthenticated(true);
      setIsLoggedIn(true);
      
      // 瀛樺偍鐢ㄦ埛淇℃伅
      setCurrentUser(userData);
      
      // 澶勭悊妯″潡URL瀛楁
      try {
        const userModuleUrl = userData.url || '/four-grade'; // 榛樿鍊硷紙鍥涘勾绾фā鍧楋級
        setModuleUrl(userModuleUrl);
        setStorageItem(STORAGE_KEYS.CORE_MODULE_URL, userModuleUrl, true);
        debugLog('[AppContext] URL瀛楁澶勭悊瀹屾垚:', {
          receivedUrl: userData.url,
          appliedUrl: userModuleUrl,
          isDefault: !userData.url
        });
        
        if (!userData.url) {
          debugLog('[AppContext] Using default moduleUrl: /four-grade (API response missing url field)');
        }
      } catch (error) {
        console.error('[AppContext] URL extraction failed:', error.message);
        // 閿欒澶勭悊锛氫娇鐢ㄩ粯璁ゅ€硷紙鍥涘勾绾фā鍧楋級
        const defaultUrl = '/four-grade';
        setModuleUrl(defaultUrl);
        setStorageItem(STORAGE_KEYS.CORE_MODULE_URL, defaultUrl, true);
        debugLog('[AppContext] 閿欒鎭㈠ - 浣跨敤榛樿moduleUrl:', defaultUrl);
      }
      
      // 瀛樺偍蹇呰鐨勪换鍔′俊鎭?
      setBatchCode(userData.batchCode);
      setExamNo(userData.examNo);
      setPageNum(userData.pageNum || null);
      
      // 妫€鏌ユ槸鍚﹀凡瀹屾垚鎵€鏈変换鍔★紙鍖呮嫭闂嵎锛?
      if (userData.pageNum !== undefined && userData.pageNum !== null) {
        const pageNumInt = parseInt(userData.pageNum);
        if (pageNumInt >= 28) {
          // 濡傛灉宸插畬鎴愭墍鏈変换鍔★紝鏍囪闂嵎涓哄凡瀹屾垚
          setIsQuestionnaireCompleted(true);
          localStorage.setItem('isQuestionnaireCompleted', 'true');
          debugLog('[AppContext] 鐢ㄦ埛宸插畬鎴愭墍鏈変换鍔★紝鏍囪闂嵎涓哄凡瀹屾垚锛宲ageNum:', userData.pageNum);
        }
      }
      
      // 鎸佷箙鍖栧瓨鍌ㄨ璇佷俊鎭?
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('currentUser', JSON.stringify(userData));
      localStorage.setItem('batchCode', userData.batchCode);
      localStorage.setItem('examNo', userData.examNo);

      // 馃敡 淇锛氭棤璁?pageNum 鏄粈涔堝€硷紝閮借姝ｇ‘澶勭悊
      if (userData.pageNum !== undefined && userData.pageNum !== null) {
        setStorageItem(STORAGE_KEYS.CORE_PAGE_NUM, String(userData.pageNum), true);
      } else {
        // pageNum 涓?null 鎴?undefined 鏃讹紝娓呴櫎 localStorage 涓殑鏃у€?
        // 杩欐牱妯″潡鐨?getInitialPage 浼氭敹鍒?null锛岃繑鍥為粯璁ら〉闈?
        removeStorageItem(STORAGE_KEYS.CORE_PAGE_NUM);
        localStorage.removeItem('hci-pageNum');
        debugLog('[AppContext] pageNum 涓虹┖锛屽凡娓呴櫎 localStorage 涓殑鏃у€?);
      }

      // 鏇存柊session娲诲姩鏃堕棿鎴?
      localStorage.setItem('lastSessionEndTime', Date.now().toString());
      debugLog('[AppContext] Session鏃堕棿鎴冲凡鏇存柊锛堢櫥褰曟垚鍔燂級');

      // 娓呴櫎tracking妯″潡鐨勭紦瀛橈紙闃叉鏃ц处鍙锋暟鎹薄鏌擄級
      const trackingKeys = [
        'tracking_sessionId',
        'tracking_session',
        'tracking_experimentTrials',
        'tracking_chartData',
        'tracking_textResponses',
        'tracking_questionnaireAnswers'
      ];
      trackingKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      debugLog('[AppContext] 宸叉竻闄racking妯″潡缂撳瓨锛岀‘淇濇柊璐﹀彿浠庢纭〉闈㈠紑濮?);

      debugLog('[AppContext] 鐧诲綍鐘舵€佸垽鏂?', {
        existingTaskStartTime: !!existingTaskStartTime,
        existingCurrentPageId,
        isRelogin
      });
      
      if (isRelogin) {
        // 閲嶆柊鐧诲綍锛氫繚鎸佺幇鏈変换鍔＄姸鎬侊紝鎵嬪姩鎭㈠璁℃椂鍣?
        debugLog('[AppContext] 馃攧 妫€娴嬪埌閲嶆柊鐧诲綍锛屾仮澶嶇幇鏈変换鍔＄姸鎬?);
        
        // 绔嬪嵆鎭㈠浠诲姟鐘舵€?
        setTimeout(() => {
          debugLog('[AppContext] 馃殌 寮€濮嬫墽琛屾仮澶嶄换鍔＄姸鎬?..');
          restoreTaskState();
        }, 200); // 澧炲姞寤惰繜纭繚鐘舵€佹洿鏂板畬鎴?
      } else {
        // 棣栨鐧诲綍锛氶噸缃换鍔＄浉鍏崇姸鎬?
        debugLog('[AppContext] 棣栨鐧诲綍锛岄噸缃换鍔＄姸鎬?);
        
        setTaskStartTime(null);
        setRemainingTime(TOTAL_TASK_DURATION);
        setCurrentPageIdInternal('Page_01_Precautions');  // 鏀逛负娉ㄦ剰浜嬮」椤甸潰
        setIsTaskFinished(false);
        setIsTimeUp(false);
        
        // 娓呴櫎鍙兘瀛樺湪鐨勬棫浠诲姟鏁版嵁
        localStorage.removeItem('isTaskFinished');
        localStorage.removeItem('taskStartTime');
        localStorage.removeItem('remainingTime');
        localStorage.removeItem('currentPageId');
        // 娉ㄦ剰锛氫笉娓呴櫎moduleUrl锛屽洜涓哄畠闇€瑕佸湪棣栨鐧诲綍鏃朵篃淇濇寔
      }
      
      debugLog('鐧诲綍鎴愬姛锛岀敤鎴蜂俊鎭凡淇濆瓨:', userData);
    } catch (error) {
      console.error('澶勭悊鐧诲綍鎴愬姛鏃跺嚭閿?', error);
      throw error;
    }
  }, [restoreTaskState]);

  /**
   * 鏍囪闂嵎宸插畬鎴?
   */
  const completeQuestionnaire = useCallback(() => {
    setIsQuestionnaireCompleted(true);
    // 鎸佷箙鍖栭棶鍗峰畬鎴愮姸鎬?
    localStorage.setItem('isQuestionnaireCompleted', 'true');
    debugLog('[AppContext] 闂嵎宸插畬鎴愶紝鐘舵€佸凡鎸佷箙鍖栧埌localStorage');

    // 鍦ㄦ鍙互鑰冭檻鍋滄闂嵎璁℃椂鍣紝濡傛灉瀹冭繕鍦ㄨ繍琛岀殑璇?
    // 涔熷彲浠ユ竻闄?questionnaireAnswers锛屽鏋滀笉鍐嶉渶瑕?
    // localStorage.removeItem('questionnaireAnswers');
    // localStorage.removeItem('questionnaireRemainingTime');
    // localStorage.removeItem('isQuestionnaireStarted');
    // localStorage.removeItem('questionnaireStartTime');
    logOperation({targetElement: 'System', eventType: 'questionnaire_marked_complete'});
  }, [logOperation]);

  /**
   * 鏇存柊褰撳墠椤甸潰缂栧彿
   * 鐢ㄤ簬妯″潡鍐呴儴椤甸潰瀵艰埅鏃跺悓姝ユ洿鏂伴〉闈㈢姸鎬侊紝纭繚鍒锋柊鍚庤兘鎭㈠鍒版纭〉闈?
   * @param {string|number} newPageNum - 鏂扮殑椤甸潰缂栧彿
   */
  const handleUpdatePageNum = useCallback((newPageNum) => {
    const pageNumStr = String(newPageNum);
    debugLog('[AppContext] 鏇存柊 pageNum:', pageNumStr);

    // 鏇存柊鐘舵€?
    setPageNum(pageNumStr);

    // 鎸佷箙鍖栧埌 localStorage锛圫TORAGE_KEYS 璐熻矗鍐欏叆鏍囧噯/鏃ч敭鍚嶏級
    localStorage.setItem('hci-pageNum', pageNumStr);
    setStorageItem(STORAGE_KEYS.CORE_PAGE_NUM, pageNumStr, true);

    debugLog('[AppContext] 鉁?pageNum 宸叉洿鏂板苟鎸佷箙鍖?', pageNumStr);
  }, []);

  const contextValue = useMemo(() => ({
    currentPageId,
    setCurrentPageId: navigateToPage, // 浣跨敤 navigateToPage 杩涜椤甸潰鍒囨崲
    navigateToPage: navigateToPage, // 鏂板: 纭繚 navigateToPage 浠ユ閿悕瀵煎嚭
    remainingTime,
    taskStartTime,
    setTaskStartTime, //纭繚鏆撮湶
    batchCode,
    examNo,
    pageNum,
    handleUpdatePageNum, // 鏂板锛氭洿鏂伴〉闈㈢紪鍙风殑鍑芥暟
    currentPageData,
    setCurrentPageData, //纭繚鏆撮湶
    pageEnterTime,
    isLoggedIn,
    isTaskFinished,
    isTimeUp,
    login,
    startTaskTimer,
    logOperation,
    collectAnswer,
    preparePageSubmissionData,
    submitPageData,
    submitPageDataWithInfo, // 鏆撮湶鎵嬪姩閲嶈瘯鎻愪氦鍑芥暟
    isSubmittingPage,
    submissionError,
    formatDateTime, // 鏆撮湶鏍煎紡鍖栧嚱鏁?
    TOTAL_TASK_DURATION,
    setPageEnterTime,   // 鏆撮湶浠ヤ究鐗规畩椤甸潰鎴栭€昏緫鍙互鐩存帴璁剧疆
    setIsTaskFinished,  // 鏆撮湶浠ヤ究鐗规畩閫昏緫锛堝瓒呮椂鑷姩鎻愪氦鍚庯級鍙互璁剧疆
    setIsTimeUp,        // 涓昏鐢卞唴閮ㄨ鏃跺櫒鎺у埗锛屼絾鏆撮湶浠ュ涓嶆椂涔嬮渶
    currentStepNumber, // 鏂板锛氬綋鍓嶆楠ゅ彿
    totalUserSteps,   // 鏂板锛氭€荤敤鎴锋楠ゆ暟
    isAuthenticated,
    authToken,
    currentUser,
    moduleUrl,
    setModuleUrl,
    handleLoginSuccess,
    handleLogout,
    clearAllCache,      // 鏂板锛氭毚闇叉竻闄ゆ墍鏈夌紦瀛樼殑鍑芥暟
    clearCache,         // 鏂板锛氭毚闇叉墜鍔ㄦ竻闄ょ紦瀛樼殑鍑芥暟
    // 闂嵎鐩稿叧鐘舵€佸拰鍑芥暟
    questionnaireStartTime,
    questionnaireRemainingTime,
    isQuestionnaireStarted,
    isQuestionnaireTimeUp,
    questionnaireAnswers,
    startQuestionnaireTimer,
    saveQuestionnaireAnswer,
    getQuestionnaireAnswer,
    isQuestionnaireCompleted, // 鏆撮湶鏂扮姸鎬?
    completeQuestionnaire,    // 鏆撮湶鏂板嚱鏁?
    // Flow 涓婁笅鏂?
    setFlowContext,           // 璁剧疆 Flow 涓婁笅鏂囷紙鐢?FlowAppContextBridge 浣跨敤锛?
  }), [
    authToken,
    batchCode,
    clearAllCache,
    clearCache,
    collectAnswer,
    completeQuestionnaire,
    currentPageData,
    currentPageId,
    currentStepNumber,
    currentUser,
    examNo,
    formatDateTime,
    getQuestionnaireAnswer,
    handleLoginSuccess,
    handleLogout,
    handleUpdatePageNum,
    isAuthenticated,
    isLoggedIn,
    isQuestionnaireCompleted,
    isQuestionnaireStarted,
    isQuestionnaireTimeUp,
    isSubmittingPage,
    isTaskFinished,
    isTimeUp,
    login,
    logOperation,
    moduleUrl,
    navigateToPage,
    pageEnterTime,
    pageNum,
    preparePageSubmissionData,
    remainingTime,
    questionnaireAnswers,
    questionnaireRemainingTime,
    questionnaireStartTime,
    saveQuestionnaireAnswer,
    setCurrentPageData,
    setIsTaskFinished,
    setIsTimeUp,
    setModuleUrl,
    setPageEnterTime,
    setTaskStartTime,
    startQuestionnaireTimer,
    startTaskTimer,
    submitPageData,
    submitPageDataWithInfo,
    submissionError,
    taskStartTime,
    totalUserSteps,
  ]);

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

/**
 * 鑷畾涔塇ook锛岀敤浜庢柟渚垮湴浣跨敤AppContext
 * @returns {object} AppContext鐨勫€?
 * @throws {Error} 濡傛灉鍦ˋppContext.Provider涔嬪浣跨敤锛屽垯鎶涘嚭閿欒
 */
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export default AppContext;

