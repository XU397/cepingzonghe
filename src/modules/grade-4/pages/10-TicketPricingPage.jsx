/**
 * 故事 2.8：最终推荐与计价（PDF 第18页）
 * - 展示上页被选且符合约束的车次
 * - 推荐理由（必填）
 * - 屏幕小键盘 + 公式编辑 + 自动回填总价
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AssessmentPageLayout from '../components/layout/AssessmentPageLayout';
import { useGrade4Context } from '../context/Grade4Context';
import styles from './10-TicketPricingPage.module.css';

const ALL_TRAINS = [
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

const safeEval = (expr) => {
  if (typeof expr !== 'string') return null;
  const normalized = expr.replace(/×/g, '*').replace(/÷/g, '/');
  const allowed = /^[0-9+\-*/().\s]+$/;
  if (!allowed.test(normalized)) return null;
  try {
     
    const fn = new Function(`"use strict"; return (${normalized})`);
    const v = fn();
    return Number.isFinite(v) ? Number(v) : null;
  } catch (_) {
    return null;
  }
};

const KEYS = [
  '7','8','9','÷',
  '4','5','6','×',
  '1','2','3','-',
  '0','(',')','+',
];

const TicketPricingPage = () => {
  const { setNavigationStep, ticketSelections, logOperation, collectAnswer, setPricingData, navigateToPage } = useGrade4Context();
  const [reason, setReason] = useState('');
  const [formula, setFormula] = useState('');
  const [computed, setComputed] = useState(null);
  const [totalPrice, setTotalPrice] = useState('');

  useEffect(() => { setNavigationStep('10'); }, [setNavigationStep]);

  const meetsConstraints = useCallback((t) => {
    const arriveOk = parseTimeToMinutes(t.arrive) < parseTimeToMinutes('18:30');
    const seatsOk = (t.first.left >= 3) || (t.second.left >= 3);
    return arriveOk && seatsOk;
  }, []);

  const selectedValidTrains = useMemo(() => {
    const set = new Set(ticketSelections || []);
    return ALL_TRAINS.filter(t => set.has(t.id) && meetsConstraints(t));
  }, [ticketSelections, meetsConstraints]);

  const append = (txt) => {
    setFormula((prev) => (prev || '') + txt);
  };
  const handleKey = (key) => {
    logOperation({ targetElement: 'keypad', eventType: 'key_press', value: key });
    if (key === 'AC') { setFormula(''); setComputed(null); setTotalPrice(''); return; }
    if (key === '⌫') { setFormula((p) => p ? p.slice(0, -1) : ''); return; }
    if (key === '=') {
      const v = safeEval(formula);
      setComputed(v);
      if (v !== null) setTotalPrice(String(v));
      return;
    }
    if (key === '↵') { append('\n'); return; }
    append(key);
  };

  // 禁用物理键盘输入：公式区域只读，所有字符通过小键盘录入
  const canNext = (selectedValidTrains.length >= 1) && reason.trim().length > 0 && (safeEval(formula) === Number(totalPrice));

  const onNext = () => {
    const payload = { reason: reason.trim(), formula, totalPrice: Number(totalPrice) };
    setPricingData(payload);
    collectAnswer({ targetElement: 'ticket-pricing', value: { ...payload, selectedValid: selectedValidTrains.map(t => t.id) } });
    navigateToPage('task-completion');
  };

  return (
    <AssessmentPageLayout isNextButtonEnabled={canNext} onNextClick={onNext}>
      <div className={styles._page}>
        <div className={styles.tableWrap}>
          <table className={styles.trainTable}>
            <thead>
              <tr>
                <th>车次</th>
                <th>出发时间 (到达时间)</th>
                <th>乘车时长</th>
                <th>一等座票价 (剩余)</th>
                <th>二等座票价 (剩余)</th>
              </tr>
            </thead>
            <tbody>
              {selectedValidTrains.map(t => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.depart} ({t.arrive})</td>
                  <td>{t.duration}</td>
                  <td>{t.first.price}¥ ({t.first.left})</td>
                  <td>{t.second.price}¥ ({t.second.left})</td>
                </tr>
              ))}
              {selectedValidTrains.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ color:'#dc2626', fontWeight:700, padding:'14px' }}>未有符合条件的车次，请返回上页重新选择。</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.rightPanel}>
          <div className={styles.card}>
            <label className={styles.label}>推荐理由（必填）</label>
            <textarea className={`${styles.textarea}`} value={reason} onChange={(e) => { setReason(e.target.value); }} placeholder="请填写推荐此方案的理由" />
          </div>

          <div className={styles.card}>
            <label className={styles.label}>票价计算公式（仅可通过右侧键盘录入）</label>
            <textarea className={`${styles.textarea} ${styles.readOnly}`} value={formula} readOnly placeholder="例如：148×2 + 96×1" />
            <div style={{ marginTop: 6 }}>
              计算结果：{computed === null ? <span className={styles.statusBad}>无效</span> : <span className={styles.statusOk}>{computed}</span>}
            </div>
          </div>

          <div className={styles.card}>
            <label className={styles.label}>屏幕小键盘</label>
            <div className={styles.keypad}>
              {KEYS.map(k => (
                <button key={k} type="button" className={styles.key} onClick={() => handleKey(k)}>{k}</button>
              ))}
              <button type="button" className={`${styles.key} ${styles.keyWide}`} onClick={() => handleKey('↵')}>↵ 换行</button>
              <button type="button" className={`${styles.key} ${styles.keyWide}`} onClick={() => handleKey('=')}>= 计算</button>
              <button type="button" className={`${styles.key} ${styles.keyDanger}`} onClick={() => handleKey('⌫')}>⌫ 退格</button>
              <button type="button" className={`${styles.key} ${styles.keyDanger}`} onClick={() => handleKey('AC')}>AC 清空</button>
            </div>
          </div>

          <div className={styles.card}>
            <label className={styles.label}>总票价（必填，等于公式结果）</label>
            <input className={`${styles.input} ${styles.readOnly}`} value={totalPrice} readOnly placeholder="点击 = 自动回填" />
          </div>
        </div>
      </div>
    </AssessmentPageLayout>
  );
};

export default TicketPricingPage;

