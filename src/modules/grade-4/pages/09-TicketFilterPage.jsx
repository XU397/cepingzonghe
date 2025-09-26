/**
 * 故事 2.8：车票筛选（PDF 第17页）
 * - 列表多选车次
 * - 展示约束说明
 * - 至少选择1条后可下一页
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import AssessmentPageLayout from '../components/layout/AssessmentPageLayout';
import { useGrade4Context } from '../context/Grade4Context';
import styles from './09-TicketFilterPage.module.css';

const TRAINS = [
  { id: 'C769', depart: '11:15', arrive: '12:58', duration: '1小时43分', first: { price: 96, left: 2 }, second: { price: 60, left: 0 } },
  { id: 'D175', depart: '12:36', arrive: '14:06', duration: '1小时30分', first: { price: 148, left: 5 }, second: { price: 112, left: 1 } },
  { id: 'C751', depart: '14:38', arrive: '16:25', duration: '1小时47分', first: { price: 96, left: 3 }, second: { price: 60, left: 6 } },
  { id: 'C757', depart: '16:36', arrive: '18:13', duration: '1小时37分', first: { price: 96, left: 1 }, second: { price: 60, left: 1 } },
  { id: 'D163', depart: '18:16', arrive: '19:50', duration: '1小时34分', first: { price: 148, left: 12 }, second: { price: 112, left: 8 } },
];

const parseTimeToMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const TicketFilterPage = () => {
  const { setNavigationStep, logOperation, collectAnswer, navigateToPage, setSelectedTrains, ticketSelections } = useGrade4Context();
  const [selected, setSelected] = useState(() => new Set(ticketSelections || []));

  useEffect(() => {
    setNavigationStep('9');
  }, [setNavigationStep]);

  const meetsConstraints = useCallback((train) => {
    // 约束：到达时间在18:30之前；且至少一个座席剩余>=3（同一车次可买3张）
    const arriveOk = parseTimeToMinutes(train.arrive) < parseTimeToMinutes('18:30');
    const seatsOk = (train.first.left >= 3) || (train.second.left >= 3);
    return arriveOk && seatsOk;
  }, []);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      logOperation({ targetElement: '车次选择', eventType: 'multi_select', value: `${id} => ${next.has(id) ? '选中' : '取消'}` });
      return next;
    });
  };

  const canNext = useMemo(() => selected.size >= 1, [selected.size]);

  const onNext = () => {
    const ids = Array.from(selected);
    setSelectedTrains(ids);
    collectAnswer({ targetElement: 'ticket-filter-selected', value: ids });
    navigateToPage('ticket-pricing');
  };

  return (
    <AssessmentPageLayout isNextButtonEnabled={canNext} onNextClick={onNext}>
      <div className={styles._page}>
        <div className={styles.constraints}>
          小明妈妈的要求：1）3张车票为同一车次；2）到达时间在18:30分前。
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.trainTable}>
            <thead>
              <tr>
                <th className={styles.selectCell}>选择</th>
                <th>车次</th>
                <th>出发时间 (到达时间)</th>
                <th>乘车时长</th>
                <th>一等座票价 (剩余)</th>
                <th>二等座票价 (剩余)</th>
                <th>是否符合约束</th>
              </tr>
            </thead>
            <tbody>
              {TRAINS.map(t => {
                const isSel = selected.has(t.id);
                const ok = meetsConstraints(t);
                return (
                  <tr key={t.id}>
                    <td className={styles.selectCell}>
                      <button type="button" aria-label={`选择 ${t.id}`} className={`${styles.selectBtn} ${isSel ? styles.selected : ''}`} onClick={() => toggleSelect(t.id)}>
                        {isSel ? '●' : '○'}
                      </button>
                    </td>
                    <td>{t.id}</td>
                    <td>{t.depart} ({t.arrive})</td>
                    <td>{t.duration}</td>
                    <td>{t.first.price}¥ ({t.first.left})</td>
                    <td>{t.second.price}¥ ({t.second.left})</td>
                    <td style={{ color: ok ? '#16a34a' : '#dc2626', fontWeight: 700 }}>{ok ? '符合' : '不符合'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className={styles.footerHint}>至少选择1条车次后，右下角“下一页”按钮可用。</div>
      </div>
    </AssessmentPageLayout>
  );
};

export default TicketFilterPage;

