import { useEffect, useMemo, useState } from 'react';
import EventTypes from '@shared/services/submission/eventTypes.js';
import MapInteractive from '../components/MapInteractive';
import { ROUTES } from '../constants/routeData';
import { useG4Context } from '../context/G4Context';
import useG4Navigation from '../hooks/useG4Navigation';
import styles from './Page05_RouteAnalysis.module.css';

const isPositiveNumber = (value) => {
  const text = String(value ?? '').trim();
  if (!text) return false;
  const parsed = Number(text);
  return Number.isFinite(parsed) && parsed > 0;
};

function Page05_RouteAnalysis() {
  const {
    state,
    updateRouteInput,
    logOperation,
    collectAnswer,
    flowContext,
  } = useG4Context();
  const { handleNextPage, isSubmitting, subPageNum } = useG4Navigation();
  const initialRouteId = useMemo(() => ROUTES[0]?.id || 1, []);
  const [selectedRouteId, setSelectedRouteId] = useState(initialRouteId);

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

  const handleRouteSelect = (routeId) => {
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
    logOperation({
      targetElement: `${routeId}_input`,
      eventType: EventTypes.INPUT_CHANGE,
      value,
    });
  };

  const route1Value = state.routeInputs?.route1 ?? '';
  const route5Value = state.routeInputs?.route5 ?? '';
  const route1Error = route1Value.trim().length > 0 && !isPositiveNumber(route1Value);
  const route5Error = route5Value.trim().length > 0 && !isPositiveNumber(route5Value);
  const canProceed = isPositiveNumber(route1Value) && isPositiveNumber(route5Value);

  const handleNext = async () => {
    const validRoute1 = isPositiveNumber(route1Value);
    const validRoute5 = isPositiveNumber(route5Value);
    if (!validRoute1 || !validRoute5) {
      logOperation({
        targetElement: 'next_button',
        eventType: EventTypes.CLICK_BLOCKED,
        value: !validRoute1 ? 'route1_invalid' : 'route5_invalid',
      });
      return;
    }

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
        <h1 className={styles.title}>出发站交互</h1>
        <p className={styles.subtitle}>查看5条路线并填写路线1和路线5的路程</p>
      </div>

      <div className={styles.layout}>
        <div className={styles.mapColumn}>
          <MapInteractive
            routes={ROUTES}
            selectedRouteId={selectedRouteId}
            onRouteSelect={handleRouteSelect}
          />
        </div>

        <div className={styles.tableColumn}>
          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>路线路程表</div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>路线</th>
                  <th>路程</th>
                </tr>
              </thead>
              <tbody>
                {ROUTES.map((route) => {
                  const isRoute1 = route.id === 1;
                  const isRoute5 = route.id === 5;
                  const isEditable = route.isEditable;
                  const value = isRoute1 ? route1Value : isRoute5 ? route5Value : '';
                  const hasError = (isRoute1 && route1Error) || (isRoute5 && route5Error);

                  return (
                    <tr
                      key={route.id}
                      className={`${styles.tableRow} ${
                        selectedRouteId === route.id ? styles.activeRow : ''
                      }`}
                    >
                      <td className={styles.routeCell}>
                        <div className={styles.routeName}>路线{route.id}</div>
                        <div className={styles.stationName}>{route.station}</div>
                        {route.segments.length ? (
                          <div className={styles.segmentHint}>
                            分段：{route.segments.join(' + ')}
                          </div>
                        ) : (
                          <div className={styles.segmentHint}>总路程：{route.totalDistance}km</div>
                        )}
                      </td>
                      <td>
                        {isEditable ? (
                          <div className={styles.inputGroup}>
                            <input
                              type='number'
                              min='0'
                              step='0.01'
                              value={value}
                              onChange={(event) =>
                                handleInputChange(isRoute1 ? 'route1' : 'route5', event)
                              }
                              placeholder='请输入路程'
                              className={`${styles.inputField} ${
                                hasError ? styles.inputError : ''
                              }`}
                            />
                            <div className={styles.helperRow}>
                              <span className={styles.helperText}>请输入大于0的数字</span>
                              {hasError ? <span className={styles.errorText}>格式不正确</span> : null}
                            </div>
                          </div>
                        ) : (
                          <div className={styles.readonlyValue}>
                            <span className={styles.readonlyText}>{route.totalDistance}km</span>
                            <span className={styles.readonlyTag}>只读</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className={styles.tip}>路线1和路线5需填写，其余路线仅供参考。</div>
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          type='button'
          className={styles.nextButton}
          onClick={handleNext}
          disabled={!canProceed || isSubmitting}
        >
          下一页
        </button>
      </div>
    </div>
  );
}

export default Page05_RouteAnalysis;
