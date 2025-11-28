import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import NavigationButton from '../components/common/NavigationButton';
import TextInput from '../components/common/TextInput';
import Button from '../components/common/Button'; // Generic button
import { simulationTableData } from '../utils/simulationData';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import EventTypes from '@shared/services/submission/eventTypes.js';
import { usePageSubmissionContext } from '@shared/ui/PageFrame/AssessmentPageFrame.jsx';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

/**
 * @file Page_18_Solution_Selection.jsx
 * @description P18: 蒸馒头:方案选择页面
 * PRD User_Step_Number_PDF_Ref: 12
 */

const TEMPERATURE_OPTIONS = simulationTableData.availableTemperatures.map(t => ({ label: `${t}°C`, value: String(t) }));
// 当前页面专用的时间选项，包含0.5小时间隔
const TIME_OPTIONS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8].map(t => ({ label: `${t}h`, value: String(t) }));

const Page_18_Solution_Selection = () => {
  const {
    navigateToPage,
    currentPageId,
    setPageEnterTime,
  } = useAppContext();
  const { submitPage, logOperation } = usePageSubmissionContext();

  const [tableRows, setTableRows] = useState([]);
  const [reasonText, setReasonText] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const operationsRef = useRef([]);
  const pageLoadedRef = useRef(false);
  const reasonInputStateRef = useRef({ focused: false, lastValue: '' });

  // Chart Data Preparation
  const chartLabels = simulationTableData.availableTimes.map(String);
  const chartDatasets = simulationTableData.availableTemperatures.map((temp, index) => {
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];
    return {
      label: `${temp}°C`,
      data: simulationTableData.availableTimes.map(time => 
        simulationTableData.volumeData[time]?.[temp] || null
      ),
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length] + '80', // Add alpha for fill
      fill: false,
      tension: 0.1,
    };
  });

  const chartData = {
    labels: chartLabels,
    datasets: chartDatasets,
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: '温度、时间与面团体积关系图',
        font: { size: 16 }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += `${context.parsed.y} ml`;
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: '时间 (h)'
        }
      },
      y: {
        title: {
          display: true,
          text: '面团体积 (ml)'
        },
        suggestedMin: 65,
        suggestedMax: 130,
        ticks: {
          stepSize: 5
        }
      }
    }
  };

  const recordOperation = useCallback((operation) => {
    const normalizedOperation = { ...operation };
    logOperation(normalizedOperation);
    operationsRef.current = [...operationsRef.current, normalizedOperation];
  }, [logOperation]);

  // 页面进入记录 - 只执行一次，使用ref确保不重复执行
  useEffect(() => {
    if (pageLoadedRef.current) return;
    pageLoadedRef.current = true;
    operationsRef.current = [];
    reasonInputStateRef.current = { focused: false, lastValue: '' };
    setPageEnterTime(new Date());
  }, [setPageEnterTime]);

  const hasAtLeastOneRow = useMemo(() => tableRows.length > 0, [tableRows]);
  const hasBestChoice = useMemo(() => tableRows.some((row) => row.isBest), [tableRows]);
  const hasReason = useMemo(() => reasonText.trim().length > 0, [reasonText]);
  const isNextDisabled = useMemo(
    () => !(hasAtLeastOneRow && hasBestChoice && hasReason),
    [hasAtLeastOneRow, hasBestChoice, hasReason],
  );

  const generateUniqueId = () => `row_${new Date().getTime()}_${Math.random().toString(36).substr(2, 5)}`;

  /**
   * 添加新行
   */
  const handleAddRow = () => {
    const newRow = {
      id: generateUniqueId(),
      temperature: TEMPERATURE_OPTIONS[0].value, // Default to first temp
      time: TIME_OPTIONS[0].value, // Default to first time
      isBest: false
    };
    const nextIndex = tableRows.length + 1;
    recordOperation({
      targetElement: 'btn_add_solution_row',
      eventType: EventTypes.CLICK,
      value: `add_row_${nextIndex}`
    });
    setTableRows(prev => [...prev, newRow]);
  };

  /**
   * 删除行
   * @param {number} id - 行ID
   */
  const handleDeleteRow = (id) => {
    const rowIndex = tableRows.findIndex(row => row.id === id);
    setTableRows(prev => prev.filter(row => row.id !== id));
    
    recordOperation({
      targetElement: 'btn_delete_solution_row',
      eventType: EventTypes.CLICK,
      value: rowIndex >= 0 ? `delete_row_${rowIndex + 1}` : 'delete_row'
    });
  };

  /**
   * 更新行数据
   * @param {number} id - 行ID
   * @param {string} field - 字段名
   * @param {any} value - 新值
   */
  const handleRowDataChange = (id, field, value) => {
    setTableRows(prev => prev.map(row => {
      if (row.id !== id) {
        return field === 'isBest' && value ? { ...row, isBest: false } : row;
      }
      if (field === 'isBest') {
        return { ...row, isBest: value };
      }
      return { ...row, [field]: value };
    }));

    const rowIndex = tableRows.findIndex(row => row.id === id);
    if (field === 'isBest') {
      recordOperation({
        targetElement: `solution_row_${rowIndex + 1}_best`,
        eventType: value ? EventTypes.CHECKBOX_CHECK : EventTypes.CHECKBOX_UNCHECK,
        value: value ? 'set_best' : 'unset_best'
      });
    } else {
      recordOperation({
        targetElement: `solution_row_${rowIndex + 1}_${field}`,
        eventType: EventTypes.SELECT_CHANGE,
        value
      });
    }
  };

  /**
   * 处理理由输入变化
   * @param {string} value - 输入值
   */
  const handleReasonChange = (value) => {
    const prev = reasonInputStateRef.current.lastValue || '';
    const nextValue = value;

    if (nextValue.length < prev.length) {
      recordOperation({
        eventType: EventTypes.INPUT_DELETE,
        targetElement: 'solution_reason',
        value: { action: 'delete', prevLength: prev.length, nextLength: nextValue.length }
      });
    }

    recordOperation({
      eventType: EventTypes.INPUT_CHANGE,
      targetElement: 'solution_reason',
      value: { prev, next: nextValue }
    });

    reasonInputStateRef.current.lastValue = nextValue;
    setReasonText(nextValue);
  };

  const handleReasonFocus = () => {
    if (reasonInputStateRef.current.focused) return;
    recordOperation({
      eventType: EventTypes.INPUT_FOCUS,
      targetElement: 'solution_reason',
      value: '聚焦'
    });
    reasonInputStateRef.current.focused = true;
  };

  /**
   * 处理理由输入框失焦
   */
  const handleReasonBlur = () => {
    recordOperation({
      eventType: EventTypes.INPUT_BLUR,
      targetElement: 'solution_reason',
      value: reasonText
    });
    reasonInputStateRef.current = {
      focused: false,
      lastValue: reasonText
    };
  };

  const handleNextPage = async () => {
    const missing = [];
    if (!hasAtLeastOneRow) missing.push('solutions');
    if (!hasBestChoice) missing.push('best_solution');
    if (!hasReason) missing.push('reason');

    if (missing.length > 0) {
      setAlertMessage('请完成所有必填项：至少添加一个方案、选择一个最佳方案并填写理由。');
      setShowAlert(true);
      recordOperation({
        eventType: EventTypes.CLICK_BLOCKED,
        targetElement: 'btn_next',
        value: { reason: 'incomplete', missing }
      });
      return false;
    }

    recordOperation({
      eventType: EventTypes.CLICK,
      targetElement: 'btn_next',
      value: '提交方案选择'
    });
    
    const solutionRows = tableRows.map((row, index) => ({
      index: index + 1,
      temperature: `${row.temperature}°C`,
      time: `${row.time}小时`,
      isBest: Boolean(row.isBest),
    }));
    const bestSolutions = solutionRows.filter((row) => row.isBest);

    const answers = [
      { targetElement: 'solution_combinations', value: JSON.stringify(solutionRows) },
      { targetElement: 'solution_reason', value: reasonText.trim() },
    ];
    if (bestSolutions.length > 0) {
      answers.push({ targetElement: 'best_solutions', value: JSON.stringify(bestSolutions) });
    }
    
    const submissionSuccess = await submitPage({
      answers,
      operations: operationsRef.current,
    });
    
    if (submissionSuccess) {
      navigateToPage('Page_19_Task_Completion', { skipSubmit: true });
      return true;
    } else {
      setAlertMessage('数据提交失败，请重试。');
      setShowAlert(true);
      return false;
    }
  };

  const AlertBox = ({ message, onClose }) => (
    <div style={{
      position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
      backgroundColor: '#f8d7da', color: '#721c24', padding: '10px 20px',
      borderRadius: '5px', border: '1px solid #f5c6cb', zIndex: 1050,
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)', whiteSpace: 'pre-line'
    }}>
      <span>{message}</span>
      <button onClick={onClose} style={{ marginLeft: '15px', border: 'none', background: 'transparent', color: '#721c24', fontWeight: 'bold', cursor: 'pointer' }}>X</button>
    </div>
  );

  return (
    <div className="page-container page-fade-in solution-selection-page" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {showAlert && <AlertBox message={alertMessage} onClose={() => setShowAlert(false)} />}
      <h1 className="page-title" style={{ textAlign: 'center', color: '#333', marginBottom: '10px' }}>蒸馒头: 方案选择</h1>
      
      <p style={{ backgroundColor: '#e3f2fd', padding: '8px', borderRadius: '8px', borderLeft: '5px solid #2196F3', marginBottom: '10px', fontSize: '0.95em', lineHeight: '1.6',textIndent: '2em'}}>
        经实验,小明绘制出了温度、时间与发酵后面团体积的关系图(见左侧图表)。妈妈告诉小明:当面团膨胀到初始体积的1.5倍时，可停止发酵开始蒸制，蒸出的馒头口感最佳。已知面团初始体积为70ml，请根据折线图，找到面团膨胀到最佳状态时所有可能的温度和时间组合，选入右侧表格中。选择完成后，在你认为最合适的方案前点亮 💡，并在下方方框内，简要说明选择该组合的理由。
      </p>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        {/* 左侧图表区域 */}
        <div style={{ flex: '1', height: '400px', border: '1px solid #ddd', padding: '10px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <Line data={chartData} options={chartOptions} />
        </div>

        {/* 右侧表格区域 */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
          <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '15px', backgroundColor: '#fafafa', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, borderBottom: '2px solid #4CAF50', paddingBottom: '10px', marginBottom: '15px', color: '#388E3C', fontSize: '1.1em'}}>方案选择表</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#e8f5e9'}}>
                <th style={{border: '1px solid #c8e6c9', padding: '8px', textAlign: 'center', fontSize: '0.9em'}}>选择最佳</th>
                  <th style={{border: '1px solid #c8e6c9', padding: '8px', textAlign: 'left', fontSize: '0.9em'}}>序号</th>
                  <th style={{border: '1px solid #c8e6c9', padding: '8px', textAlign: 'left', fontSize: '0.9em'}}>温度</th>
                  <th style={{border: '1px solid #c8e6c9', padding: '8px', textAlign: 'left', fontSize: '0.9em'}}>时间</th>
                  <th style={{border: '1px solid #c8e6c9', padding: '8px', textAlign: 'center', fontSize: '0.9em'}}>操作</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, index) => (
                  <tr key={row.id} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9'}}>
                    <td style={{border: '1px solid #ddd', padding: '6px', textAlign: 'center'}}>
                      <Button 
                        onClick={() => handleRowDataChange(row.id, 'isBest', !row.isBest)} 
                        text="💡" 
                        variant={row.isBest ? 'success' : 'light'} 
                        style={{ fontSize: '1.1em', padding: '2px 8px'}}
                      />
                    </td>
                    <td style={{border: '1px solid #ddd', padding: '6px', fontSize: '0.9em'}}>{index + 1}</td>
                    <td style={{border: '1px solid #ddd', padding: '6px'}}>
                      <select value={row.temperature} onChange={(e) => handleRowDataChange(row.id, 'temperature', e.target.value)} style={{padding: '4px', borderRadius: '4px', border: '1px solid #ccc', width: '100%', fontSize: '0.9em'}}>
                        {TEMPERATURE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </td>
                    <td style={{border: '1px solid #ddd', padding: '6px'}}>
                      <select value={row.time} onChange={(e) => handleRowDataChange(row.id, 'time', e.target.value)} style={{padding: '4px', borderRadius: '4px', border: '1px solid #ccc', width: '100%', fontSize: '0.9em'}}>
                        {TIME_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </td>
                    
                    <td style={{border: '1px solid #ddd', padding: '6px', textAlign: 'center'}}>
                      <Button onClick={() => handleDeleteRow(row.id)} text="删除" variant="danger" style={{padding: '4px 8px', fontSize: '0.9em'}}/>
                    </td>
                  </tr>
                ))}
                {tableRows.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '15px', color: '#777', fontSize: '0.9em' }}>暂无方案，请点击新增按钮添加。</td>
                  </tr>
                )}
              </tbody>
            </table>
            <div style={{ textAlign: 'right', marginTop: '10px' }}>
              <Button onClick={handleAddRow} text="+ 新增方案" variant="primary" style={{fontSize: '0.9em'}} />
            </div>
          </div>

          <div>
            <label htmlFor="reasonInput" style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: '#333', fontSize: '0.95em' }}>请说明理由:</label>
            <TextInput
              id="reasonInput"
              value={reasonText}
              onChange={handleReasonChange}
              onFocus={handleReasonFocus}
              placeholder="请在此处输入选择最佳方案的理由..."
              isMultiline={true}
              rows={3}
              onBlur={handleReasonBlur}
              elementDesc="理由输入框"
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '0.9em', minHeight: '40px' }}
            />
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '-10px',display: 'block' }}>
        <NavigationButton
          currentPageId={currentPageId}
          onClick={handleNextPage}
          buttonText="完成探究"
          disabled={isNextDisabled}
        />
      </div>
    </div>
  );
};

export default Page_18_Solution_Selection; 
