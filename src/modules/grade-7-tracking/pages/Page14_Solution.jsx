/**
 * Page14_Solution - 方案选择页面
 *
 * 功能:
 * - 左侧:折线图显示温度、含水量与下落时间的关系
 * - 右侧:动态表格(可新增/删除行)+ 理由输入框
 * - 温度和含水量下拉菜单选择
 * - 至少选择1个组合并填写理由才能进入下一页
 *
 * T052 - Page14_Solution页面
 * FR-034 to FR-039
 */

import { useState, useCallback, useEffect } from 'react';
import { useTrackingContext } from '../context/TrackingContext';
import { useDataLogger } from '../hooks/useDataLogger';
import LineChart from '../components/visualizations/LineChart';
import { WATER_CONTENT_OPTIONS, TEMPERATURE_OPTIONS } from '../config';
import styles from '../styles/Page14_Solution.module.css';

const Page14_Solution = () => {
  const {
    logOperation,
    collectAnswer,
    clearOperations,
    buildMarkObject,
    navigateToPage
  } = useTrackingContext();

  const { submitPageData } = useDataLogger();
  const [isNavigating, setIsNavigating] = useState(false);

  // 动态表格数据:每行包含{id, temperature, waterContent}
  const [tableRows, setTableRows] = useState([{ id: 1, temperature: null, waterContent: null }]);
  const [nextId, setNextId] = useState(2);

  // 理由输入
  const [reasonText, setReasonText] = useState('');

  // 记录页面进入
  useEffect(() => {
    logOperation({
      action: 'page_enter',
      target: '页面',
      value: 'Page14_Solution',
      time: new Date().toISOString()
    });

    return () => {
      logOperation({
        action: 'page_exit',
        target: '页面',
        value: 'Page14_Solution',
        time: new Date().toISOString()
      });
    };
  }, [logOperation]);

  // 处理新增行
  const handleAddRow = useCallback(() => {
    const newRow = { id: nextId, temperature: null, waterContent: null };
    setTableRows((prev) => [...prev, newRow]);
    setNextId((prev) => prev + 1);

    logOperation({
      action: '点击',
      target: '动态表格',
      value: '新增行',
      time: new Date().toISOString()
    });
  }, [nextId, logOperation]);

  // 处理删除行
  const handleDeleteRow = useCallback((rowId) => {
    // 至少保留1行
    if (tableRows.length === 1) {
      alert('至少需要保留一行数据');
      return;
    }

    setTableRows((prev) => prev.filter((row) => row.id !== rowId));

    logOperation({
      action: '点击',
      target: '动态表格',
      value: `删除行-${rowId}`,
      time: new Date().toISOString()
    });
  }, [tableRows.length, logOperation]);

  // 处理温度选择
  const handleTemperatureChange = useCallback((rowId, temperature) => {
    setTableRows((prev) =>
      prev.map((row) =>
        row.id === rowId ? { ...row, temperature: parseInt(temperature, 10) } : row
      )
    );

    logOperation({
      action: '下拉框选择',
      target: `温度下拉菜单-行${rowId}`,
      value: temperature,
      time: new Date().toISOString()
    });
  }, [logOperation]);

  // 处理含水量选择
  const handleWaterContentChange = useCallback((rowId, waterContent) => {
    setTableRows((prev) =>
      prev.map((row) =>
        row.id === rowId ? { ...row, waterContent: parseInt(waterContent, 10) } : row
      )
    );

    logOperation({
      action: '下拉框选择',
      target: `含水量下拉菜单-行${rowId}`,
      value: waterContent,
      time: new Date().toISOString()
    });
  }, [logOperation]);

  // 处理理由输入
  const handleReasonChange = useCallback((event) => {
    const value = event.target.value;
    setReasonText(value);

    logOperation({
      action: '文本域输入',
      target: '理由输入框',
      value: value,
      time: new Date().toISOString()
    });
  }, [logOperation]);

  // 检查是否可以提交
  const canSubmit = useCallback(() => {
    // 至少有一行完整填写(温度+含水量都选了)
    const hasValidRow = tableRows.some(
      (row) => row.temperature !== null && row.waterContent !== null
    );

    // 理由至少10个字符
    const hasValidReason = reasonText.trim().length >= 10;

    return hasValidRow && hasValidReason;
  }, [tableRows, reasonText]);

  // 处理下一页
  const handleNextPage = useCallback(async () => {
    if (!canSubmit() || isNavigating) {
      return;
    }

    setIsNavigating(true);

    try {
      logOperation({
        action: '点击',
        target: '下一页按钮',
        value: '完成方案选择,进入问卷',
        time: new Date().toISOString()
      });

      // 收集答案 - 方案组合
      const validCombinations = tableRows.filter(
        (row) => row.temperature !== null && row.waterContent !== null
      );

      collectAnswer({
        targetElement: 'solution_combinations',
        value: JSON.stringify(validCombinations)
      });

      // 收集答案 - 理由
      collectAnswer({
        targetElement: 'solution_reason',
        value: reasonText.trim()
      });

      // 构建并提交MarkObject
      const markObject = buildMarkObject('14', '方案选择');
      const success = await submitPageData(markObject);

      if (success) {
        clearOperations();
        await navigateToPage(15);
      } else {
        throw new Error('数据提交失败');
      }
    } catch (error) {
      console.error('[Page14_Solution] 导航失败:', error);
      alert(error.message || '页面跳转失败，请重试');
      setIsNavigating(false);
    }
  }, [canSubmit, isNavigating, tableRows, reasonText, logOperation, collectAnswer, buildMarkObject, submitPageData, clearOperations, navigateToPage]);

  return (
    <div className={styles.container}>
      <div className={styles.pageTitle}>
        <h2>选择最佳方案</h2>
        <p className={styles.subtitle}>
          根据实验数据和折线图,选择合适的温度和含水量组合
        </p>
      </div>

      <div className={styles.contentLayout}>
        {/* 左侧:折线图 */}
        <div className={styles.leftPanel}>
          <LineChart
            temperatureRange={TEMPERATURE_OPTIONS}
            waterContentOptions={WATER_CONTENT_OPTIONS}
            height={450}
            showLegend
            showGrid
          />
        </div>

        {/* 右侧:动态表格+理由输入 */}
        <div className={styles.rightPanel}>
          <div className={styles.tableCard}>
            <h3 className={styles.tableTitle}>方案选择</h3>
            <p className={styles.tableHint}>
              点击&quot;新增&quot;按钮可以添加多个方案进行对比
            </p>

            <div className={styles.tableContainer}>
              <table className={styles.dynamicTable}>
                <thead>
                  <tr>
                    <th className={styles.iconColumn}>图标</th>
                    <th className={styles.selectColumn}>温度</th>
                    <th className={styles.selectColumn}>含水量</th>
                    <th className={styles.actionColumn}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row, index) => (
                    <tr key={row.id} className={styles.tableRow}>
                      <td className={styles.iconCell}>
                        <div className={styles.lightIcon}>
                          {row.temperature !== null && row.waterContent !== null ? '💡' : '○'}
                        </div>
                      </td>
                      <td className={styles.selectCell}>
                        <select
                          value={row.temperature || ''}
                          onChange={(e) => handleTemperatureChange(row.id, e.target.value)}
                          className={styles.selectInput}
                          aria-label={`行${index + 1}温度选择`}
                        >
                          <option value="">请选择</option>
                          {TEMPERATURE_OPTIONS.map((temp) => (
                            <option key={temp} value={temp}>
                              {temp}°C
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className={styles.selectCell}>
                        <select
                          value={row.waterContent || ''}
                          onChange={(e) => handleWaterContentChange(row.id, e.target.value)}
                          className={styles.selectInput}
                          aria-label={`行${index + 1}含水量选择`}
                        >
                          <option value="">请选择</option>
                          {WATER_CONTENT_OPTIONS.map((wc) => (
                            <option key={wc} value={wc}>
                              {wc}%
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className={styles.actionCell}>
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(row.id)}
                          className={styles.deleteButton}
                          disabled={tableRows.length === 1}
                          aria-label={`删除行${index + 1}`}
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.tableActions}>
              <button
                type="button"
                onClick={handleAddRow}
                className={styles.addButton}
              >
                + 新增行
              </button>
            </div>
          </div>

          <div className={styles.reasonCard}>
            <h4 className={styles.reasonTitle}>说明理由</h4>
            <p className={styles.reasonHint}>
              请解释你为什么选择这些温度和含水量组合(至少10个字符)
            </p>

            <textarea
              value={reasonText}
              onChange={handleReasonChange}
              className={styles.reasonTextarea}
              placeholder="例如:我选择40°C和21%含水量,因为在这个条件下小球下落时间最短,说明蜂蜜黏度最低..."
              rows={6}
              maxLength={500}
            />

            <div className={styles.characterCount}>
              <span className={reasonText.length >= 10 ? styles.valid : styles.invalid}>
                {reasonText.length}/500字符
              </span>
              {reasonText.length < 10 && (
                <span className={styles.countHint}>(至少10个字符)</span>
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
          {canSubmit()
            ? (isNavigating ? '跳转中...' : '完成实验,进入问卷')
            : '请完成方案选择和理由说明'}
        </button>
      </div>
    </div>
  );
};

export default Page14_Solution;
