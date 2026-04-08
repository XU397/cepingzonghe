import { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import { encodeCompositePageNum } from '@shared/utils/pageMapping';
import { getPageNumByPageId } from '../mapping';

const ACTIONS = {
  NAVIGATE: 'NAVIGATE',
  LOG_OPERATION: 'LOG_OPERATION',
  COLLECT_ANSWER: 'COLLECT_ANSWER',
  CLEAR_OPERATIONS: 'CLEAR_OPERATIONS',
  SET_NOTICE_CONFIRMED: 'SET_NOTICE_CONFIRMED',
  TICK_NOTICE_COUNTDOWN: 'TICK_NOTICE_COUNTDOWN',
  TOGGLE_FACTOR: 'TOGGLE_FACTOR',
  UPDATE_ROUTE_INPUT: 'UPDATE_ROUTE_INPUT',
  SET_SELECTED_STATION: 'SET_SELECTED_STATION',
  SET_STATION_REASON: 'SET_STATION_REASON',
  UPDATE_SOLUTION: 'UPDATE_SOLUTION',
  SET_SOLUTION_TIME: 'SET_SOLUTION_TIME',
  SET_IS_OPTIMAL: 'SET_IS_OPTIMAL',
  TOGGLE_TRAIN_SELECTION: 'TOGGLE_TRAIN_SELECTION',
  SET_RECOMMENDED_TRAIN: 'SET_RECOMMENDED_TRAIN',
  SET_RECOMMEND_REASON: 'SET_RECOMMEND_REASON',
  SET_CALCULATION_PROCESS: 'SET_CALCULATION_PROCESS',
  SET_TOTAL_PRICE: 'SET_TOTAL_PRICE',
  SET_PROBLEM_ANSWER: 'SET_PROBLEM_ANSWER',
  PLAY_DIALOGUE: 'PLAY_DIALOGUE',
  RESET_DIALOGUE: 'RESET_DIALOGUE',
};

const timestamp = () => new Date().toISOString();

const isPositiveNumber = value => {
  const text = String(value ?? '').trim();
  if (!text) return false;
  const parsed = Number(text);
  return Number.isFinite(parsed) && parsed > 0;
};

const NOTICE_COUNTDOWN_SECONDS = 40;

const createEmptySolution = id => ({
  id,
  tasks: [],
  userInputTime: null,
});

const createInitialState = (initialPageId = 'notices') => {
  const pageNum = parseInt(getPageNumByPageId(initialPageId) || '1', 10);
  return {
    currentPageId: initialPageId,
    currentPageNum: Number.isNaN(pageNum) ? 1 : pageNum,
    operations: [],
    answers: [],
    pageBeginTime: timestamp(),
    noticeConfirmed: false,
    noticeCountdown: NOTICE_COUNTDOWN_SECONDS,
    selectedFactors: [],
    routeInputs: { route1: '', route5: '' },
    selectedStation: null,
    stationReason: '',
    solutions: {
      solution1: createEmptySolution('solution-1'),
      solution2: createEmptySolution('solution-2'),
    },
    improvedSolution: null,
    isOptimal: null,
    selectedTrains: [],
    recommendedTrain: null,
    recommendReason: '',
    calculationProcess: '',
    totalPrice: '',
    problemAnswer: '',
    dialogueIndex: 0,
    isDialoguePlaying: false,
  };
};

function g4Reducer(state, action) {
  switch (action.type) {
    case ACTIONS.NAVIGATE: {
      const nextPageId = action.pageId;
      if (!nextPageId) return state;
      const nextPageNum = parseInt(
        getPageNumByPageId(nextPageId) || String(state.currentPageNum),
        10
      );
      return {
        ...state,
        currentPageId: nextPageId,
        currentPageNum: Number.isNaN(nextPageNum) ? state.currentPageNum : nextPageNum,
        pageBeginTime: timestamp(),
      };
    }

    case ACTIONS.LOG_OPERATION: {
      const operation = action.operation || {};
      const code = state.operations.length + 1;
      return {
        ...state,
        operations: [
          ...state.operations,
          {
            ...operation,
            code,
            time: operation.time || timestamp(),
          },
        ],
      };
    }

    case ACTIONS.COLLECT_ANSWER: {
      const answer = action.answer || {};
      const code = state.answers.length + 1;
      return {
        ...state,
        answers: [
          ...state.answers,
          {
            ...answer,
            code,
          },
        ],
      };
    }

    case ACTIONS.CLEAR_OPERATIONS:
      return {
        ...state,
        operations: [],
        answers: [],
        pageBeginTime: timestamp(),
        noticeCountdown: NOTICE_COUNTDOWN_SECONDS,
      };

    case ACTIONS.SET_NOTICE_CONFIRMED:
      return { ...state, noticeConfirmed: Boolean(action.confirmed) };

    case ACTIONS.TICK_NOTICE_COUNTDOWN:
      return {
        ...state,
        noticeCountdown: Math.max(0, state.noticeCountdown - 1),
      };

    case ACTIONS.TOGGLE_FACTOR: {
      const factor = action.factor;
      if (!factor) return state;
      const exists = state.selectedFactors.includes(factor);
      const updated = exists
        ? state.selectedFactors.filter(item => item !== factor)
        : [...state.selectedFactors, factor];
      return { ...state, selectedFactors: updated };
    }

    case ACTIONS.UPDATE_ROUTE_INPUT: {
      const { routeId, value } = action.payload || {};
      if (!routeId || !['route1', 'route5'].includes(routeId)) return state;
      return {
        ...state,
        routeInputs: {
          ...state.routeInputs,
          [routeId]: value ?? '',
        },
      };
    }

    case ACTIONS.SET_SELECTED_STATION:
      return { ...state, selectedStation: action.station ?? null };

    case ACTIONS.SET_STATION_REASON:
      return { ...state, stationReason: action.reason ?? '' };

    case ACTIONS.UPDATE_SOLUTION: {
      const { solutionId, tasks } = action.payload || {};
      if (!solutionId) return state;
      const normalizedTasks = Array.isArray(tasks) ? tasks : [];
      if (solutionId === 'solution-improved') {
        const base = state.improvedSolution || createEmptySolution('solution-improved');
        return { ...state, improvedSolution: { ...base, tasks: normalizedTasks } };
      }
      const current = state.solutions[solutionId] || createEmptySolution(solutionId);
      return {
        ...state,
        solutions: {
          ...state.solutions,
          [solutionId]: { ...current, tasks: normalizedTasks },
        },
      };
    }

    case ACTIONS.SET_SOLUTION_TIME: {
      const { solutionId, time } = action.payload || {};
      if (!solutionId) return state;
      const parsedTime = typeof time === 'number' ? time : Number(time);
      const normalizedTime = Number.isFinite(parsedTime) ? parsedTime : null;
      if (solutionId === 'solution-improved') {
        const base = state.improvedSolution || createEmptySolution('solution-improved');
        return { ...state, improvedSolution: { ...base, userInputTime: normalizedTime } };
      }
      const current = state.solutions[solutionId] || createEmptySolution(solutionId);
      return {
        ...state,
        solutions: {
          ...state.solutions,
          [solutionId]: { ...current, userInputTime: normalizedTime },
        },
      };
    }

    case ACTIONS.SET_IS_OPTIMAL: {
      const isOptimal = action.isOptimal ?? null;
      return {
        ...state,
        isOptimal,
        improvedSolution: isOptimal === true ? null : state.improvedSolution,
      };
    }

    case ACTIONS.TOGGLE_TRAIN_SELECTION: {
      const trainNo = action.trainNo;
      if (!trainNo) return state;
      const exists = state.selectedTrains.includes(trainNo);
      const nextList = exists
        ? state.selectedTrains.filter(item => item !== trainNo)
        : [...state.selectedTrains, trainNo];
      return { ...state, selectedTrains: nextList };
    }

    case ACTIONS.SET_RECOMMENDED_TRAIN:
      return { ...state, recommendedTrain: action.trainNo ?? null };

    case ACTIONS.SET_RECOMMEND_REASON:
      return { ...state, recommendReason: action.reason ?? '' };

    case ACTIONS.SET_CALCULATION_PROCESS:
      return { ...state, calculationProcess: action.process ?? '' };

    case ACTIONS.SET_TOTAL_PRICE:
      return { ...state, totalPrice: action.price ?? '' };

    case ACTIONS.SET_PROBLEM_ANSWER:
      return { ...state, problemAnswer: action.answer ?? '' };

    case ACTIONS.PLAY_DIALOGUE:
      return {
        ...state,
        isDialoguePlaying: true,
        dialogueIndex: state.dialogueIndex + 1,
      };

    case ACTIONS.RESET_DIALOGUE:
      return { ...state, isDialoguePlaying: false, dialogueIndex: 0 };

    default:
      return state;
  }
}

const G4Context = createContext(null);

export function G4Provider({ children, initialPageId = 'notices', userContext = {}, flowContext }) {
  const [state, dispatch] = useReducer(g4Reducer, null, () => createInitialState(initialPageId));

  const navigateToPage = useCallback(
    pageId => dispatch({ type: ACTIONS.NAVIGATE, pageId }),
    [dispatch]
  );
  const logOperation = useCallback(
    operation => dispatch({ type: ACTIONS.LOG_OPERATION, operation }),
    [dispatch]
  );
  const collectAnswer = useCallback(
    answer => dispatch({ type: ACTIONS.COLLECT_ANSWER, answer }),
    [dispatch]
  );
  const clearOperations = useCallback(
    () => dispatch({ type: ACTIONS.CLEAR_OPERATIONS }),
    [dispatch]
  );
  const setNoticeConfirmed = useCallback(
    confirmed => dispatch({ type: ACTIONS.SET_NOTICE_CONFIRMED, confirmed }),
    [dispatch]
  );
  const tickNoticeCountdown = useCallback(
    () => dispatch({ type: ACTIONS.TICK_NOTICE_COUNTDOWN }),
    [dispatch]
  );
  const confirmNotice = useCallback(
    confirmed => dispatch({ type: ACTIONS.SET_NOTICE_CONFIRMED, confirmed }),
    [dispatch]
  );
  const toggleFactor = useCallback(
    factor => dispatch({ type: ACTIONS.TOGGLE_FACTOR, factor }),
    [dispatch]
  );
  const updateRouteInput = useCallback(
    (routeId, value) => dispatch({ type: ACTIONS.UPDATE_ROUTE_INPUT, payload: { routeId, value } }),
    [dispatch]
  );
  const setSelectedStation = useCallback(
    station => dispatch({ type: ACTIONS.SET_SELECTED_STATION, station }),
    [dispatch]
  );
  const setStationReason = useCallback(
    reason => dispatch({ type: ACTIONS.SET_STATION_REASON, reason }),
    [dispatch]
  );
  const updateSolution = useCallback(
    (solutionId, tasks) =>
      dispatch({ type: ACTIONS.UPDATE_SOLUTION, payload: { solutionId, tasks } }),
    [dispatch]
  );
  const setSolutionTime = useCallback(
    (solutionId, time) =>
      dispatch({ type: ACTIONS.SET_SOLUTION_TIME, payload: { solutionId, time } }),
    [dispatch]
  );
  const setIsOptimal = useCallback(
    isOptimal => dispatch({ type: ACTIONS.SET_IS_OPTIMAL, isOptimal }),
    [dispatch]
  );
  const toggleTrainSelection = useCallback(
    trainNo => dispatch({ type: ACTIONS.TOGGLE_TRAIN_SELECTION, trainNo }),
    [dispatch]
  );
  const setRecommendedTrain = useCallback(
    trainNo => dispatch({ type: ACTIONS.SET_RECOMMENDED_TRAIN, trainNo }),
    [dispatch]
  );
  const setRecommendReason = useCallback(
    reason => dispatch({ type: ACTIONS.SET_RECOMMEND_REASON, reason }),
    [dispatch]
  );
  const setCalculationProcess = useCallback(
    process => dispatch({ type: ACTIONS.SET_CALCULATION_PROCESS, process }),
    [dispatch]
  );
  const setTotalPrice = useCallback(
    price => dispatch({ type: ACTIONS.SET_TOTAL_PRICE, price }),
    [dispatch]
  );
  const setProblemAnswer = useCallback(
    answer => dispatch({ type: ACTIONS.SET_PROBLEM_ANSWER, answer }),
    [dispatch]
  );
  const playDialogue = useCallback(() => dispatch({ type: ACTIONS.PLAY_DIALOGUE }), [dispatch]);
  const resetDialogue = useCallback(() => dispatch({ type: ACTIONS.RESET_DIALOGUE }), [dispatch]);

  const subPageNum = useMemo(
    () =>
      parseInt(getPageNumByPageId(state.currentPageId) || String(state.currentPageNum), 10) || 1,
    [state.currentPageId, state.currentPageNum]
  );
  const pageNumber = useMemo(() => {
    const stepIndex = typeof flowContext?.stepIndex === 'number' ? flowContext.stepIndex : 0;
    return encodeCompositePageNum(stepIndex + 1, subPageNum);
  }, [flowContext?.stepIndex, subPageNum]);
  const targetPrefix = useMemo(() => (pageNumber ? `P${pageNumber}_` : ''), [pageNumber]);

  const validateCurrentPage = useCallback(() => {
    switch (state.currentPageId) {
      case 'notices':
        return state.noticeCountdown <= 0 && state.noticeConfirmed;
      case 'route-analysis': {
        const route1 = state.routeInputs?.route1;
        const route5 = state.routeInputs?.route5;
        return isPositiveNumber(route1) && isPositiveNumber(route5);
      }
      case 'station-recommendation': {
        const reasonFilled = String(state.stationReason || '').trim().length > 0;
        return Boolean(state.selectedStation) && reasonFilled;
      }
      case 'ticket-filter': {
        return state.selectedTrains?.length > 0;
      }
      case 'ticket-pricing': {
        const hasRecommendedTrain = Boolean(state.recommendedTrain);
        const hasRecommendReason = String(state.recommendReason || '').trim().length > 0;
        const hasCalculationProcess = String(state.calculationProcess || '').trim().length > 0;
        const priceText = String(state.totalPrice || '').trim();
        const priceValue = parseInt(priceText, 10);
        const hasValidTotalPrice =
          priceText && !Number.isNaN(priceValue) && priceValue > 0 && Number.isInteger(priceValue);
        return (
          hasRecommendedTrain && hasRecommendReason && hasCalculationProcess && hasValidTotalPrice
        );
      }
      default:
        return true;
    }
  }, [
    state.currentPageId,
    state.noticeCountdown,
    state.noticeConfirmed,
    state.routeInputs?.route1,
    state.routeInputs?.route5,
    state.selectedStation,
    state.stationReason,
    state.selectedTrains,
    state.recommendedTrain,
    state.recommendReason,
    state.calculationProcess,
    state.totalPrice,
  ]);

  const getCurrentMissingFields = useCallback(() => {
    switch (state.currentPageId) {
      case 'notices': {
        const missing = [];
        if (state.noticeCountdown > 0) missing.push('阅读倒计时未结束');
        if (!state.noticeConfirmed) missing.push('注意事项确认');
        return missing;
      }
      case 'route-analysis': {
        const missing = [];
        if (!isPositiveNumber(state.routeInputs?.route1)) missing.push('路线1路程');
        if (!isPositiveNumber(state.routeInputs?.route5)) missing.push('路线5路程');
        return missing;
      }
      case 'station-recommendation': {
        const missing = [];
        if (!state.selectedStation) missing.push('推荐出发站');
        if (String(state.stationReason || '').trim().length === 0) missing.push('推荐理由');
        return missing;
      }
      case 'ticket-filter': {
        const missing = [];
        if (!state.selectedTrains?.length) missing.push('车次选择');
        return missing;
      }
      case 'ticket-pricing': {
        const missing = [];
        if (!state.recommendedTrain) missing.push('推荐车次');
        if (String(state.recommendReason || '').trim().length === 0) missing.push('推荐理由');
        if (String(state.calculationProcess || '').trim().length === 0) missing.push('计算过程');
        const priceText = String(state.totalPrice || '').trim();
        const priceValue = parseInt(priceText, 10);
        if (
          !priceText ||
          Number.isNaN(priceValue) ||
          priceValue <= 0 ||
          !Number.isInteger(priceValue)
        ) {
          missing.push('总票价');
        }
        return missing;
      }
      default:
        return [];
    }
  }, [
    state.currentPageId,
    state.noticeCountdown,
    state.noticeConfirmed,
    state.routeInputs?.route1,
    state.routeInputs?.route5,
    state.selectedStation,
    state.stationReason,
    state.selectedTrains,
    state.recommendedTrain,
    state.recommendReason,
    state.calculationProcess,
    state.totalPrice,
  ]);

  const value = useMemo(
    () => ({
      state,
      userContext,
      flowContext,
      navigateToPage,
      logOperation,
      collectAnswer,
      clearOperations,
      setNoticeConfirmed,
      confirmNotice,
      tickNoticeCountdown,
      toggleFactor,
      updateRouteInput,
      setSelectedStation,
      setStationReason,
      updateSolution,
      setSolutionTime,
      setIsOptimal,
      toggleTrainSelection,
      setRecommendedTrain,
      setRecommendReason,
      setCalculationProcess,
      setTotalPrice,
      setProblemAnswer,
      playDialogue,
      resetDialogue,
      subPageNum,
      pageNumber,
      targetPrefix,
      validateCurrentPage,
      getCurrentMissingFields,
    }),
    [
      state,
      userContext,
      flowContext,
      navigateToPage,
      logOperation,
      collectAnswer,
      clearOperations,
      setNoticeConfirmed,
      confirmNotice,
      tickNoticeCountdown,
      toggleFactor,
      updateRouteInput,
      setSelectedStation,
      setStationReason,
      updateSolution,
      setSolutionTime,
      setIsOptimal,
      toggleTrainSelection,
      setRecommendedTrain,
      setRecommendReason,
      setCalculationProcess,
      setTotalPrice,
      setProblemAnswer,
      playDialogue,
      resetDialogue,
      subPageNum,
      pageNumber,
      targetPrefix,
      validateCurrentPage,
      getCurrentMissingFields,
    ]
  );

  return <G4Context.Provider value={value}>{children}</G4Context.Provider>;
}

export function useG4Context() {
  const context = useContext(G4Context);
  if (!context) {
    throw new Error('useG4Context must be used within G4Provider');
  }
  return context;
}
