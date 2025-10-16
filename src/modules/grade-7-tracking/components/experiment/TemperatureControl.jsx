/**
 * TemperatureControl - 温度控制器组件
 *
 * 功能:
 * - 5档温度选择器(25℃, 30℃, 35℃, 40℃, 45℃)
 * - 实时数值显示(大号温度计样式)
 * - 支持点击按钮切换或滑块拖动(可选)
 * - 温度变化时显示视觉反馈(颜色渐变)
 *
 * T039 - TemperatureControl组件
 */


import PropTypes from 'prop-types';
import styles from '../../styles/TemperatureControl.module.css';

const TemperatureControl = ({
  selectedTemperature,
  onTemperatureChange,
  disabled = false,
  temperatureOptions = [25, 30, 35, 40, 45]
}) => {
  const handleTemperatureClick = (temperature) => {
    if (disabled) return;
    onTemperatureChange(temperature);
  };

  const handleSliderChange = (event) => {
    if (disabled) return;
    const index = parseInt(event.target.value, 10);
    onTemperatureChange(temperatureOptions[index]);
  };

  const getCurrentIndex = () => {
    return temperatureOptions.indexOf(selectedTemperature);
  };

  const getTemperatureColor = (temp) => {
    // 温度越高,颜色越红
    const ratio = (temp - 25) / 20; // 0-1范围
    const hue = 200 - ratio * 200; // 200(蓝色) -> 0(红色)
    return `hsl(${hue}, 70%, 50%)`;
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>设置环境温度</h3>

      <div className={styles.displayArea}>
        <div className={styles.thermometerContainer}>
          {/* 温度计图标SVG */}
          <svg
            viewBox="0 0 80 240"
            className={styles.thermometerSvg}
            aria-hidden="true"
          >
            {/* 温度计管 */}
            <rect
              x="30"
              y="20"
              width="20"
              height="180"
              fill="none"
              stroke="#d9d9d9"
              strokeWidth="2"
              rx="10"
            />

            {/* 温度计球 */}
            <circle cx="40" cy="210" r="15" fill="#ff4d4f" stroke="#d9d9d9" strokeWidth="2" />

            {/* 液体柱(根据当前温度动态变化) */}
            {selectedTemperature && (
              <g>
                <rect
                  x="32"
                  y={200 - ((selectedTemperature - 25) / 20) * 160}
                  width="16"
                  height={((selectedTemperature - 25) / 20) * 160}
                  fill={getTemperatureColor(selectedTemperature)}
                  opacity="0.8"
                />
                <circle
                  cx="40"
                  cy="210"
                  r="12"
                  fill={getTemperatureColor(selectedTemperature)}
                />
              </g>
            )}

            {/* 刻度标记 */}
            {temperatureOptions.map((temp) => {
              const y = 200 - ((temp - 25) / 20) * 160;
              return (
                <g key={temp}>
                  <line
                    x1="50"
                    y1={y}
                    x2="55"
                    y2={y}
                    stroke="#999"
                    strokeWidth="2"
                  />
                  <text
                    x="60"
                    y={y + 5}
                    fontSize="12"
                    fill="#666"
                    textAnchor="start"
                  >
                    {temp}°C
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className={styles.currentDisplay}>
          <div className={styles.temperatureValue}>
            {selectedTemperature !== null ? (
              <>
                <span className={styles.number}>{selectedTemperature}</span>
                <span className={styles.unit}>°C</span>
              </>
            ) : (
              <span className={styles.placeholder}>--</span>
            )}
          </div>
          <div className={styles.temperatureLabel}>当前温度</div>
        </div>
      </div>

      <div className={styles.controlArea}>
        {/* 按钮式选择器 */}
        <div className={styles.buttonGroup} role="radiogroup" aria-label="选择温度">
          {temperatureOptions.map((temp) => {
            const isSelected = selectedTemperature === temp;
            return (
              <button
                key={temp}
                type="button"
                className={`${styles.tempButton} ${
                  isSelected ? styles.selected : ''
                }`}
                onClick={() => handleTemperatureClick(temp)}
                disabled={disabled}
                role="radio"
                aria-checked={isSelected}
                aria-label={`${temp}摄氏度`}
              >
                <span className={styles.tempButtonValue}>{temp}</span>
                <span className={styles.tempButtonUnit}>°C</span>
              </button>
            );
          })}
        </div>

        {/* 滑块式选择器(可选辅助方式) */}
        <div className={styles.sliderContainer}>
          <input
            type="range"
            min="0"
            max={temperatureOptions.length - 1}
            step="1"
            value={getCurrentIndex()}
            onChange={handleSliderChange}
            disabled={disabled}
            className={styles.slider}
            aria-label="温度滑块"
          />
          <div className={styles.sliderLabels}>
            {temperatureOptions.map((temp) => (
              <span key={temp} className={styles.sliderLabel}>
                {temp}°
              </span>
            ))}
          </div>
        </div>
      </div>

      {selectedTemperature !== null && (
        <div className={styles.selectionHint} role="status">
          已设置温度: <strong>{selectedTemperature}°C</strong>
        </div>
      )}
    </div>
  );
};

TemperatureControl.propTypes = {
  /** 当前选中的温度(null表示未选择) */
  selectedTemperature: PropTypes.number,

  /** 温度变化回调 */
  onTemperatureChange: PropTypes.func.isRequired,

  /** 是否禁用控制器 */
  disabled: PropTypes.bool,

  /** 可选的温度选项 */
  temperatureOptions: PropTypes.arrayOf(PropTypes.number)
};

export default TemperatureControl;
