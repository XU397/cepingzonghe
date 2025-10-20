/**
 * Page14_Solution - 方案选择页面 (映射为第12页)
 */

import { useState, useCallback, useEffect } from 'react';
import { useTrackingContext } from '../context/TrackingContext';
import { useDataLogger } from '../hooks/useDataLogger';
import LineChart from '../components/visualizations/LineChart';
import PageLayout from '../components/layout/PageLayout.jsx';
import { WATER_CONTENT_OPTIONS, TEMPERATURE_OPTIONS, PAGE_MAPPING } from '../config';
import styles from '../styles/Page14_Solution.module.css';

const Page14_Solution = () => {
  const {
    session,
    logOperation,
    collectAnswer,
    clearOperations,
    buildMarkObject,
    navigateToPage
  } = useTrackingContext();

  const { submitPageData } = useDataLogger();
  const [isNavigating, setIsNavigating] = useState(false);

  // 动态表格数据（每行包含: id, temperature, waterContent, isBest）
  const [tableRows, setTableRows] = useState([{ id: 1, temperature: null, waterContent: null, isBest: false }]);
  const [nextId, setNextId] = useState(2);

  // 理由输入
  const [reasonText, setReasonText] = useState('');

  // 页面进入/离开日志
  useEffect(() => {
    logOperation({ action: 'page_enter', target: '页面', value: 'Page14_Solution', time: new Date().toISOString() });
    return () => {
      logOperation({ action: 'page_exit', target: '页面', value: 'Page14_Solution', time: new Date().toISOString() });
    };
  }, [logOperation]);

  // 新增一行
  const handleAddRow = useCallback(() => {
    const newRow = { id: nextId, temperature: null, waterContent: null, isBest: false };
    setTableRows(prev => [...prev, newRow]);
    setNextId(prev => prev + 1);

    logOperation({ action: '点击', target: '动态表格', value: '新增', time: new Date().toISOString() });
  }, [nextId, logOperation]);

  // 删除一行（至少保留1行）
  const handleDeleteRow = useCallback((rowId) => {
    if (tableRows.length === 1) {
      alert('至少需要保留一行数据');
      return;
    }

    setTableRows(prev => prev.filter(row => row.id !== rowId));
    logOperation({ action: '点击', target: '动态表格', value: `删除行_${rowId}`, time: new Date().toISOString() });
  }, [tableRows.length, logOperation]);

  // 选择温度
  const handleTemperatureChange = useCallback((rowId, temperature) => {
    setTableRows(prev => prev.map(row =>
      row.id === rowId ? { ...row, temperature: parseInt(temperature, 10) } : row
    ));
    logOperation({ action: '下拉框选择', target: `温度下拉菜单_${rowId}`, value: temperature, time: new Date().toISOString() });
  }, [logOperation]);

  // 选择含水量
  const handleWaterContentChange = useCallback((rowId, waterContent) => {
    setTableRows(prev => prev.map(row =>
      row.id === rowId ? { ...row, waterContent: parseInt(waterContent, 10) } : row
    ));
    logOperation({ action: '下拉框选择', target: `含水量下拉菜单_${rowId}`, value: waterContent, time: new Date().toISOString() });
  }, [logOperation]);

  // 理由输入
  const handleReasonChange = useCallback((event) => {
    const value = event.target.value;
    setReasonText(value);
    logOperation({ action: '文本域输入', target: '理由输入框', value, time: new Date().toISOString() });
  }, [logOperation]);

  // 切换最佳方案标记
  const handleToggleBest = useCallback((rowId) => {
    setTableRows(prev => prev.map(row =>
      row.id === rowId ? { ...row, isBest: !row.isBest } : row
    ));
    const row = tableRows.find(r => r.id === rowId);
    const newStatus = !row?.isBest;
    logOperation({
      action: '点击',
      target: `最佳方案星标_${rowId}`,
      value: newStatus ? '标记为最佳' : '取消标记',
      time: new Date().toISOString()
    });
  }, [tableRows, logOperation]);

  // 是否可以提交
  const canSubmit = useCallback(() => {
    const hasValidRow = tableRows.some(row => row.temperature !== null && row.waterContent !== null);
    const hasValidReason = reasonText.trim().length >= 10;
    return hasValidRow && hasValidReason;
  }, [tableRows, reasonText]);

  // 下一页（跳转到第13页：任务总结）
  const handleNextPage = useCallback(async () => {
    if (!canSubmit() || isNavigating) return;
    setIsNavigating(true);

    try {
      logOperation({ action: '点击', target: '下一页按钮', value: '完成方案选择,进入问卷', time: new Date().toISOString() });

      const validCombinations = tableRows
        .filter(row => row.temperature !== null && row.waterContent !== null)
        .map(row => ({
          temperature: row.temperature,
          waterContent: row.waterContent,
          isBest: row.isBest
        }));

      collectAnswer({ targetElement: 'solution_combinations', value: JSON.stringify(validCombinations) });
      collectAnswer({ targetElement: 'solution_reason', value: reasonText.trim() });

      // 单独记录被标记为最佳的方案
      const bestSolutions = validCombinations.filter(c => c.isBest);
      if (bestSolutions.length > 0) {
        collectAnswer({ targetElement: 'best_solutions', value: JSON.stringify(bestSolutions) });
      }

      const pageInfo = PAGE_MAPPING[session.currentPage];
      const markObject = buildMarkObject(String(session.currentPage), pageInfo?.desc || '方案选择');
      const success = await submitPageData(markObject);

      if (success) {
        clearOperations();
        await navigateToPage(13);
      } else {
        throw new Error('数据提交失败');
      }
    } catch (error) {
      console.error('[Page14_Solution] 导航失败:', error);
      alert(error.message || '页面跳转失败，请重试');
      setIsNavigating(false);
    }
  }, [canSubmit, isNavigating, tableRows, reasonText, logOperation, collectAnswer, buildMarkObject, submitPageData, clearOperations, navigateToPage, session]);

  return (
    <PageLayout showNavigation={true} showTimer={true}>
      <div className={styles.container}>
        <div className={styles.pageTitle}>
          <h2>选择最佳方案</h2>
          <p className={styles.subtitle}>
            经实验，小明绘制了温度、含水量与落球时间的关系图（见左下角图）。
            若小钢球在小明家变稀后的蜂蜜中下落时间为2秒，请根据折线图，将所有可能的温度和含水量的组合选入右下方表格中。
            选择完成后，在你认为最可能的存放环境前点亮⭐，并在下方方框内，简要说明选择该组合的理由。
          </p>
        </div>

        <div className={styles.contentLayout}>
          {/* 左侧：折线图 */}
          <div className={styles.leftPanel}>
            <LineChart
              temperatureRange={TEMPERATURE_OPTIONS}
              waterContentOptions={WATER_CONTENT_OPTIONS}
              height={450}
              showLegend
              showGrid
            />
          </div>

          {/* 右侧：动态表格 + 理由输入 */}
          <div className={styles.rightPanel}>
            <div className={styles.tableCard}>
              <h3 className={styles.tableTitle}>方案选择</h3>
              <p className={styles.tableHint}>点击“新增”按钮可以添加多个方案进行对比</p>

              <div className={styles.tableContainer}>
                <table className={styles.dynamicTable}>
                  <thead>
                    <tr>
                      <th className={styles.iconColumn}>序号</th>
                      <th className={styles.selectColumn}>温度</th>
                      <th className={styles.selectColumn}>含水量</th>
                      <th className={styles.bestColumn}>最佳方案</th>
                      <th className={styles.actionColumn}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((row, index) => (
                      <tr key={row.id} className={styles.tableRow}>
                        <td className={styles.iconCell}>
                          <div className={styles.sequenceNumber}>
                            {index + 1}
                          </div>
                        </td>
                        <td className={styles.selectCell}>
                          <select
                            value={row.temperature || ''}
                            onChange={(e) => handleTemperatureChange(row.id, e.target.value)}
                            className={styles.selectInput}
                            aria-label={`组合${index + 1}温度选择`}
                          >
                            <option value="">下拉菜单</option>
                            {TEMPERATURE_OPTIONS.map((temp) => (
                              <option key={temp} value={temp}>{temp}°C</option>
                            ))}
                          </select>
                        </td>
                        <td className={styles.selectCell}>
                          <select
                            value={row.waterContent || ''}
                            onChange={(e) => handleWaterContentChange(row.id, e.target.value)}
                            className={styles.selectInput}
                            aria-label={`组合${index + 1}含水量选择`}
                          >
                            <option value="">下拉菜单</option>
                            {WATER_CONTENT_OPTIONS.map((wc) => (
                              <option key={wc} value={wc}>{wc}%</option>
                            ))}
                          </select>
                        </td>
                        <td className={styles.bestCell}>
                          <button
                            type="button"
                            onClick={() => handleToggleBest(row.id)}
                            className={`${styles.starButton} ${row.isBest ? styles.starActive : ''}`}
                            aria-label={`${row.isBest ? '取消标记' : '标记'}组合${index + 1}为最佳方案`}
                            title={row.isBest ? '点击取消标记为最佳方案' : '点击标记为最佳方案'}
                          >
                            {row.isBest ? '⭐' : '☆'}
                          </button>
                        </td>
                        <td className={styles.actionCell}>
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(row.id)}
                            className={styles.deleteButton}
                            disabled={tableRows.length === 1}
                            aria-label={`删除组合${index + 1}`}
                          >
                            ❌删除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={styles.tableActions}>
                <button type="button" onClick={handleAddRow} className={styles.addButton}>
                  + 新增
                </button>
              </div>
            </div>

            <div className={styles.reasonCard}>
              <h4 className={styles.reasonTitle}>说明理由</h4>
              <p className={styles.reasonHint}>请解释你为什么选择这些温度和含水量组合（至少10个字）</p>
              <textarea
                value={reasonText}
                onChange={handleReasonChange}
                className={styles.reasonTextarea}
                placeholder="例如：我选择40°C、21%含水量，因为在这个条件下小球下落时间最短，说明蜂蜜黏度最低。"
                rows={4}
                maxLength={500}
              />
              <div className={styles.characterCount}>
                <span className={reasonText.length >= 10 ? styles.valid : styles.invalid}>
                  {reasonText.length}/500 字符
                </span>
                {reasonText.length < 10 && (
                  <span className={styles.countHint}>(至少10个字)</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.navigationFooter}>
          <button
            type="button"
            className={styles.nextButton}
            onClick={handleNextPage}
            disabled={!canSubmit() || isNavigating}
          >
            {canSubmit() ? (isNavigating ? '跳转中...' : '完成实验，进入问卷') : '请完成方案选择和理由说明'}
          </button>
        </div>
      </div>
    </PageLayout>
  );
};

export default Page14_Solution;

