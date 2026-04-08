import { useEffect, useState, useMemo } from 'react';
import EventTypes from '@shared/services/submission/eventTypes.js';
import TrainRouteMap from '../components/TrainRouteMap';
import { ROUTES } from '../constants/routeData';
import { useG4Context } from '../context/G4Context';
import useG4Navigation from '../hooks/useG4Navigation';
import styles from './Page06_StationRec.module.css';

const STATION_OPTIONS = [
  { id: '南充北站', label: '南充北站' },
  { id: '南充站', label: '南充站' },
];

function Page06_StationRec() {
  const {
    state,
    setSelectedStation,
    setStationReason,
    logOperation,
    flowContext,
    validateCurrentPage,
    getCurrentMissingFields,
  } = useG4Context();
  const { subPageNum } = useG4Navigation();
  const initialRouteId = useMemo(() => ROUTES[0]?.id || 1, []);
  const [selectedRouteId, setSelectedRouteId] = useState(initialRouteId);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    logOperation({
      targetElement: 'page_station_recommendation',
      eventType: EventTypes.PAGE_ENTER,
      value: 'Page_06_出发站结论',
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

  const handleStationChange = stationId => {
    setSelectedStation(stationId);
    if (validationError) setValidationError('');
    logOperation({
      targetElement: 'station_radio',
      eventType: EventTypes.RADIO_SELECT,
      value: stationId,
    });
  };

  const handleReasonChange = event => {
    const value = event.target.value;
    setStationReason(value);
    if (validationError) setValidationError('');
    logOperation({
      targetElement: 'station_reason',
      eventType: EventTypes.INPUT_CHANGE,
      value,
    });
  };

  const handleBlockedNext = () => {
    if (validateCurrentPage()) {
      setValidationError('');
      return;
    }

    const missing = getCurrentMissingFields();
    const message =
      missing.includes('推荐出发站') && missing.includes('推荐理由')
        ? '请先选择推荐出发站，并填写推荐理由。'
        : missing.includes('推荐出发站')
          ? '请先选择推荐出发站。'
          : '请先填写推荐理由。';

    setValidationError(message);
    logOperation({
      targetElement: 'next_button',
      eventType: EventTypes.CLICK_BLOCKED,
      value: JSON.stringify({ reason: 'validation_failed', missing }),
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <div className={styles.leftColumn}>
          <div className={styles.titleRow}>
            <span className={styles.badge}>5</span>
            <h1 className={styles.title}>火车购票：出发站</h1>
          </div>

          <p className={styles.summary}>
            小明也正确算出了【路线1】和【路线5】的路程，右表是他的计算结果。你建议小明选择哪个车站作为出发站？
          </p>

          <div className={styles.radioGroup}>
            <div className={styles.label}>选择推荐的出发站</div>
            {STATION_OPTIONS.map(option => (
              <label key={option.id} className={styles.radioOption}>
                <input
                  type="radio"
                  name="station"
                  value={option.id}
                  checked={state.selectedStation === option.id}
                  onChange={() => handleStationChange(option.id)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>

          <div className={styles.formField}>
            <label className={styles.label} htmlFor="stationReason">
              推荐理由
            </label>
            <textarea
              id="stationReason"
              rows={4}
              value={state.stationReason || ''}
              onChange={handleReasonChange}
              placeholder="说明你选择该出发站的理由"
            />
          </div>

          {validationError && (
            <p className={styles.errorMessage} role="alert" data-testid="station-rec-error">
              {validationError}
            </p>
          )}
        </div>

        <div className={styles.rightColumn}>
          <div className={styles.tipLine}>
            <span className={styles.tipLead}>提示：</span>
            <span>可点击下方路线按钮，重新查看路线哦！</span>
          </div>
          <div className={styles.mapPanel}>
            <TrainRouteMap
              selectedRouteId={selectedRouteId}
              onRouteSelect={handleRouteSelect}
              tablePlacement="top"
              readOnlyTable={true}
              compact={true}
            />
          </div>
        </div>
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
        onClick={handleBlockedNext}
        data-testid="next-button"
        aria-hidden="true"
      >
        下一页
      </button>
    </div>
  );
}

export default Page06_StationRec;
