import { useEffect } from 'react';
import EventTypes from '@shared/services/submission/eventTypes.js';
import { useG4Context } from '../context/G4Context';
import useG4Navigation from '../hooks/useG4Navigation';
import styles from './Page06_StationRec.module.css';

const ROUTE_ROWS = [
  { id: 'route1', station: '南充北站', route: '路线1', distance: '7.9km' },
  { id: 'route2', station: '南充北站', route: '路线2', distance: '8.65km' },
  { id: 'route3', station: '南充站', route: '路线3', distance: '10.2km' },
  { id: 'route4', station: '南充站', route: '路线4', distance: '9.63km' },
  { id: 'route5', station: '南充站', route: '路线5', distance: '7.88km' },
];

const STATION_OPTIONS = [
  { id: '南充北站', label: '南充北站' },
  { id: '南充站', label: '南充站' },
];

function Page06_StationRec() {
  const { state, setSelectedStation, setStationReason, logOperation, collectAnswer, flowContext } = useG4Context();
  const { handleNextPage, isSubmitting, subPageNum } = useG4Navigation();

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

  const handleStationChange = (stationId) => {
    setSelectedStation(stationId);
    logOperation({
      targetElement: 'station_radio',
      eventType: EventTypes.RADIO_SELECT,
      value: stationId,
    });
  };

  const handleReasonChange = (event) => {
    const value = event.target.value;
    setStationReason(value);
    logOperation({
      targetElement: 'station_reason',
      eventType: EventTypes.INPUT_CHANGE,
      value,
    });
  };

  const reasonFilled = (state.stationReason || '').trim().length > 0;
  const canProceed = Boolean(state.selectedStation) && reasonFilled;

  const handleNext = async () => {
    if (!state.selectedStation || !reasonFilled) {
      logOperation({
        targetElement: 'next_button',
        eventType: EventTypes.CLICK_BLOCKED,
        value: !state.selectedStation ? 'station_not_selected' : 'station_reason_missing',
      });
      return;
    }
    // 收集选中的出发站和理由
    collectAnswer({
      targetElement: '推荐出发站',
      value: state.selectedStation,
    });
    collectAnswer({
      targetElement: '推荐理由',
      value: state.stationReason || '',
    });
    logOperation({
      targetElement: 'next_button',
      eventType: EventTypes.NEXT_CLICK,
      value: 'station_recommendation_next',
    });
    logOperation({
      targetElement: 'page_station_recommendation',
      eventType: EventTypes.PAGE_EXIT,
      value: 'Page_06_出发站结论',
    });
    await handleNextPage({
      validate: () => canProceed,
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>出发站推荐</h1>
        <span className={styles.subtitle}>可查看路线表格并选择推荐的出发站</span>
      </div>

      <div className={styles.grid}>
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>路线数据</div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>出发站</th>
                <th>路线</th>
                <th>路程</th>
              </tr>
            </thead>
            <tbody>
              {ROUTE_ROWS.map((row) => (
                <tr key={row.id}>
                  <td>{row.station}</td>
                  <td>{row.route}</td>
                  <td>{row.distance}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className={styles.mapPlaceholder}>地图交互占位（复用Page 5）</div>
          <p className={styles.note}>提示：可结合地图再次查看路线详情。</p>
        </div>

        <div className={styles.formCard}>
          <div className={styles.radioGroup}>
            <div className={styles.label}>选择推荐的出发站</div>
            {STATION_OPTIONS.map((option) => (
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

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.nextButton}
              onClick={handleNext}
              disabled={isSubmitting || !canProceed}
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Page06_StationRec;
