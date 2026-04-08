import { useEffect, useMemo, useState } from 'react';
import EventTypes from '@shared/services/submission/eventTypes.js';
import TrainRouteMap from '../components/TrainRouteMap';
import { ROUTES } from '../constants/routeData';
import { useG4Context } from '../context/G4Context';
import useG4Navigation from '../hooks/useG4Navigation';
import styles from './Page05_RouteAnalysis.module.css';

const isPositiveNumber = value => {
  const text = String(value ?? '').trim();
  if (!text) return false;
  const parsed = Number(text);
  return Number.isFinite(parsed) && parsed > 0;
};

function Page05_RouteAnalysis() {
  const { state, updateRouteInput, logOperation, collectAnswer, flowContext } = useG4Context();
  const { handleNextPage, subPageNum } = useG4Navigation();
  const initialRouteId = useMemo(() => ROUTES[0]?.id || 1, []);
  const [selectedRouteId, setSelectedRouteId] = useState(initialRouteId);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    logOperation({
      targetElement: 'page_route_analysis',
      eventType: EventTypes.PAGE_ENTER,
      value: 'Page_05_出发站交互',
    });
  }, [logOperation]);

  useEffect(() => {
    if (flowContext?.updateModuleProgress && subPageNum) {
      flowContext.updateModuleProgress(String(subPageNum));
    }
  }, [flowContext, subPageNum]);

  const handleRouteSelect = routeId => {
    setSelectedRouteId(routeId);
    logOperation({
      targetElement: 'route_button',
      eventType: EventTypes.CLICK,
      value: `route_${routeId}`,
    });
  };

  const handleInputChange = (routeId, event) => {
    const value = event.target.value;
    updateRouteInput(routeId, value);
    if (validationError) {
      setValidationError('');
    }
    logOperation({
      targetElement: `${routeId}_input`,
      eventType: EventTypes.INPUT_CHANGE,
      value,
    });
  };

  const route1Value = state.routeInputs?.route1 ?? '';
  const route5Value = state.routeInputs?.route5 ?? '';
  const canProceed = isPositiveNumber(route1Value) && isPositiveNumber(route5Value);

  const handleNext = async () => {
    const validRoute1 = isPositiveNumber(route1Value);
    const validRoute5 = isPositiveNumber(route5Value);
    if (!validRoute1 || !validRoute5) {
      const route1Empty = String(route1Value ?? '').trim().length === 0;
      const route5Empty = String(route5Value ?? '').trim().length === 0;
      setValidationError(
        route1Empty || route5Empty ? '请填写线路1、线路5里程' : '请输入线路1、线路5的有效数字里程'
      );
      logOperation({
        targetElement: 'next_button',
        eventType: EventTypes.CLICK_BLOCKED,
        value: 'route_inputs_invalid',
      });
      return;
    }

    setValidationError('');

    collectAnswer({ targetElement: 'route1_total', value: String(route1Value).trim() });
    collectAnswer({ targetElement: 'route5_total', value: String(route5Value).trim() });

    logOperation({
      targetElement: 'next_button',
      eventType: EventTypes.NEXT_CLICK,
      value: 'route_analysis_next',
    });
    logOperation({
      targetElement: 'page_route_analysis',
      eventType: EventTypes.PAGE_EXIT,
      value: 'Page_05_出发站交互',
    });

    await handleNextPage({
      validate: () => canProceed,
      nextPageId: 'station-recommendation',
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.badge}>4</span>
          <h1 className={styles.title}>出发站交互</h1>
        </div>
        <p className={styles.description}>
          买火车票首先要考虑出发站。小明家附近有2个火车站：南充站和南充北站。
        </p>
        <p className={styles.description}>
          小明家到这2个火车站共有5条路线。请依次点击左下图【路线】按钮，查看这5条路线，计算【路线1】和【路线5】的路程，并将结果填在右侧表格相应的空格内。
        </p>
      </div>

      <div className={styles.content}>
        <TrainRouteMap
          selectedRouteId={selectedRouteId}
          onRouteSelect={handleRouteSelect}
          route1Value={route1Value}
          route5Value={route5Value}
          onInputChange={handleInputChange}
        />
        {validationError && (
          <p className={styles.inlineError} role="alert" data-testid="route-analysis-error">
            {validationError}
          </p>
        )}
      </div>

      <button
        type="button"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: 0,
          opacity: 0,
          pointerEvents: 'none',
          border: 0,
        }}
        tabIndex={-1}
        onClick={handleNext}
        data-testid="next-button"
        aria-hidden="true"
      >
        下一页
      </button>
    </div>
  );
}

export default Page05_RouteAnalysis;
