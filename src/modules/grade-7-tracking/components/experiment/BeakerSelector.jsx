/**
 * BeakerSelector - 量筒选择器组件
 *
 * 功能:
 * - 显示4个不同含水量的量筒图标(15%, 17%, 19%, 21%)
 * - 单选逻辑:同一时间只能选中一个量筒
 * - 选中状态:高亮显示(边框加粗、背景颜色变化)
 * - 支持键盘导航(可选)
 *
 * T037 - BeakerSelector组件
 */


import PropTypes from 'prop-types';
import styles from '../../styles/BeakerSelector.module.css';

const BeakerSelector = ({
  selectedWaterContent,
  onWaterContentChange,
  disabled = false,
  waterContentOptions = [15, 17, 19, 21]
}) => {
  const handleBeakerClick = (waterContent) => {
    if (disabled) return;
    onWaterContentChange(waterContent);
  };

  const handleKeyDown = (event, waterContent) => {
    if (disabled) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onWaterContentChange(waterContent);
    }
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>选择蜂蜜含水量</h3>
      <div className={styles.beakerGrid}>
        {waterContentOptions.map((waterContent) => {
          const isSelected = selectedWaterContent === waterContent;

          return (
            <div
              key={waterContent}
              className={`${styles.beakerItem} ${
                isSelected ? styles.selected : ''
              } ${disabled ? styles.disabled : ''}`}
              onClick={() => handleBeakerClick(waterContent)}
              onKeyDown={(e) => handleKeyDown(e, waterContent)}
              role="radio"
              aria-checked={isSelected}
              aria-label={`含水量 ${waterContent}%`}
              tabIndex={disabled ? -1 : 0}
            >
              <div className={styles.beakerIcon}>
                {/* 量筒图标SVG */}
                <svg
                  viewBox="0 0 100 200"
                  className={styles.beakerSvg}
                  aria-hidden="true"
                >
                  {/* 量筒外框 */}
                  <rect
                    x="20"
                    y="10"
                    width="60"
                    height="180"
                    fill="none"
                    stroke={isSelected ? '#1890ff' : '#d9d9d9'}
                    strokeWidth={isSelected ? '3' : '2'}
                    rx="5"
                  />

                  {/* 蜂蜜液体 */}
                  <rect
                    x="22"
                    y={190 - (waterContent / 21) * 170}
                    width="56"
                    height={(waterContent / 21) * 170}
                    fill={isSelected ? '#ffa940' : '#ffd591'}
                    opacity="0.8"
                  />

                  {/* 刻度线 */}
                  {[0, 25, 50, 75, 100].map((mark, idx) => (
                    <g key={mark}>
                      <line
                        x1="20"
                        y1={190 - (mark / 100) * 170}
                        x2="25"
                        y2={190 - (mark / 100) * 170}
                        stroke="#999"
                        strokeWidth="1"
                      />
                      {idx % 2 === 0 && (
                        <text
                          x="15"
                          y={195 - (mark / 100) * 170}
                          fontSize="10"
                          fill="#666"
                          textAnchor="end"
                        >
                          {mark}
                        </text>
                      )}
                    </g>
                  ))}
                </svg>
              </div>

              <div className={styles.beakerLabel}>
                <span className={styles.waterContentValue}>{waterContent}%</span>
                <span className={styles.waterContentText}>含水量</span>
              </div>

              {isSelected && (
                <div className={styles.selectedBadge} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 20 20">
                    <circle cx="10" cy="10" r="9" fill="#52c41a" />
                    <path
                      d="M8 12.5L5.5 10L4.5 11L8 14.5L15.5 7L14.5 6L8 12.5Z"
                      fill="white"
                    />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedWaterContent !== null && (
        <div className={styles.selectionHint} role="status">
          已选择含水量: <strong>{selectedWaterContent}%</strong>
        </div>
      )}
    </div>
  );
};

BeakerSelector.propTypes = {
  /** 当前选中的含水量(null表示未选择) */
  selectedWaterContent: PropTypes.number,

  /** 含水量变化回调 */
  onWaterContentChange: PropTypes.func.isRequired,

  /** 是否禁用选择器 */
  disabled: PropTypes.bool,

  /** 可选的含水量选项 */
  waterContentOptions: PropTypes.arrayOf(PropTypes.number)
};

export default BeakerSelector;
