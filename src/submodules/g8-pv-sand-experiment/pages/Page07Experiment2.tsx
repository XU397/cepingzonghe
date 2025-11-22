import React, { useState, useEffect } from 'react';
import { usePvSandContext } from '../context/PvSandContext';
import WindSpeedometer from '../components/WindSpeedometer';
import styles from '../styles/Page05Tutorial.module.css';

const Page07Experiment2: React.FC = () => {
  const {
    logOperation,
    setPageStartTime,
    collectAnswer,
    currentPageId,
    answers
  } = usePvSandContext();

  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [heightIndex, setHeightIndex] = useState(0); // 0: 0cm, 1: 20cm, 2: 50cm, 3: 100cm
  const [withPanelSpeed, setWithPanelSpeed] = useState(0);
  const [withoutPanelSpeed, setWithoutPanelSpeed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showError, setShowError] = useState(false);

  // 实验数据: [0cm, 20cm, 50cm, 100cm]
  const heightOptions = [0, 20, 50, 100];
  const withPanelData = [0, 2.09, 2.25, 1.66];
  const withoutPanelData = [0, 2.37, 2.62, 2.77];

  const currentHeight = heightOptions[heightIndex];

  const options = [
    '在两区域，风速都随高度增加而增加',
    '在两区域，风速都随高度增加而减小',
    '在无板区，风速随高度增加而增大；在有板区，风速随高度增加而减小',
    '在无板区，风速随高度增加而减小；在有板区，风速随高度增加而增大'
  ];

  // Initialize from saved answers
  useEffect(() => {
    const savedAnalysis = answers['experiment2Analysis'];
    if (savedAnalysis) {
      // 支持字符串或数组格式
      if (typeof savedAnalysis === 'string') {
        try {
          const parsed = JSON.parse(savedAnalysis);
          setSelectedOptions(Array.isArray(parsed) ? parsed : [savedAnalysis]);
        } catch {
          setSelectedOptions([savedAnalysis]);
        }
      } else if (Array.isArray(savedAnalysis)) {
        setSelectedOptions(savedAnalysis);
      }
    }
  }, []);

  // Listen for validation errors from frame
  useEffect(() => {
    const handleValidationError = () => {
      setShowError(true);
      // Auto-hide error after 3 seconds
      setTimeout(() => setShowError(false), 3000);
    };

    window.addEventListener('pv-sand-validation-error', handleValidationError);
    return () => {
      window.removeEventListener('pv-sand-validation-error', handleValidationError);
    };
  }, []);

  useEffect(() => {
    const startTime = new Date();
    setPageStartTime(startTime);

    logOperation({
      targetElement: '页面',
      eventType: 'page_enter',
      value: currentPageId,
      time: startTime.toISOString()
    });

    return () => {
      logOperation({
        targetElement: '页面',
        eventType: 'page_exit',
        value: currentPageId,
        time: new Date().toISOString()
      });
    };
  }, [logOperation, setPageStartTime, currentPageId]);

  const handleOptionToggle = (option: string) => {
    const newSelected = selectedOptions.includes(option)
      ? selectedOptions.filter(o => o !== option)
      : [...selectedOptions, option];

    setSelectedOptions(newSelected);

    collectAnswer({
      targetElement: 'experiment2Analysis',
      value: JSON.stringify(newSelected)
    });

    logOperation({
      targetElement: '选项',
      eventType: 'click',
      value: selectedOptions.includes(option) ? `取消选择: ${option}` : `选择: ${option}`,
      time: new Date().toISOString()
    });
  };

  const handleHeightChange = (delta: number) => {
    const newIndex = Math.max(0, Math.min(3, heightIndex + delta));
    setHeightIndex(newIndex);

    logOperation({
      targetElement: '高度调节',
      eventType: 'click',
      value: `调整高度: ${heightOptions[newIndex]}cm`,
      time: new Date().toISOString()
    });
  };

  const handleReset = () => {
    setWithPanelSpeed(0);
    setWithoutPanelSpeed(0);
    setHeightIndex(0); // 重置为0cm

    logOperation({
      targetElement: '重置按钮',
      eventType: 'click',
      value: '重置实验',
      time: new Date().toISOString()
    });
  };

  const handleStart = () => {
    if (isRunning) return;

    setIsRunning(true);
    logOperation({
      targetElement: '开始按钮',
      eventType: 'click',
      value: `开始测量 - 高度${currentHeight}cm`,
      time: new Date().toISOString()
    });

    setTimeout(() => {
      setWithPanelSpeed(withPanelData[heightIndex]);
      setWithoutPanelSpeed(withoutPanelData[heightIndex]);
      setIsRunning(false);
    }, 2000);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>光伏治沙</h1>

      <div className={styles.contentArea}>
        {/* 左侧问题和选择题 */}
        <div className={styles.leftContent}>
          <div className={styles.instructionBox}>
            <p className={styles.instructionIntro}>
              <strong>问题3：</strong>根据实验模拟，关于风速随高度变化的描述，正确的是？
            </p>

            <div className={styles.radioGroup}>
              {options.map((option, index) => (
                <label
                  key={index}
                  className={`${styles.radioOption} ${selectedOptions.includes(option) ? styles.selected : ''}`}
                >
                  <input
                    type="checkbox"
                    name="experiment2"
                    value={option}
                    checked={selectedOptions.includes(option)}
                    onChange={() => handleOptionToggle(option)}
                    className={styles.radioInput}
                  />
                  <span className={styles.radioLabel}>{option}</span>
                </label>
              ))}
            </div>

            {showError && (
              <div style={{
                background: '#fff5f5',
                border: '2px solid #e74c3c',
                borderRadius: '8px',
                padding: '12px 20px',
                color: '#e74c3c',
                fontSize: '14px',
                fontWeight: 600,
                textAlign: 'center',
                marginTop: '10px',
                animation: 'errorShake 0.5s ease-out'
              }}>
                请至少选择一个选项
              </div>
            )}
          </div>
        </div>

        {/* 右侧实验面板 */}
        <div className={styles.experimentContainer}>
          <div className={styles.experimentUnit}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>有光伏板</span>
              <span className={styles.panelTitle}>无光伏板</span>
            </div>

            <div className={styles.windDisplay}>
              <svg viewBox="0 0 600 400" className={styles.windSimulator}>
                {/* 渐变定义 */}
                <defs>
                  {/* 天空渐变 */}
                  <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#87CEEB" />
                    <stop offset="100%" stopColor="#FFF8DC" />
                  </linearGradient>
                  {/* 沙丘渐变 */}
                  <linearGradient id="sandGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#F4C430" />
                    <stop offset="100%" stopColor="#DAA520" />
                  </linearGradient>
                  {/* 太阳光芒渐变 */}
                  <radialGradient id="sunGlow">
                    <stop offset="0%" stopColor="#FFD700" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#FFA500" stopOpacity="0" />
                  </radialGradient>
                  {/* 按钮渐变 */}
                  <linearGradient id="resetGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FF8C42" />
                    <stop offset="100%" stopColor="#FF6B35" />
                  </linearGradient>
                  <linearGradient id="startGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#4CAF50" />
                    <stop offset="100%" stopColor="#388E3C" />
                  </linearGradient>
                </defs>

                {/* 天空背景 */}
                <rect x="0" y="0" width="600" height="280" fill="url(#skyGradient)" />

                {/* 太阳 */}
                <g transform="translate(500, 50)">
                  <circle cx="0" cy="0" r="35" fill="url(#sunGlow)" />
                  <circle cx="0" cy="0" r="25" fill="#FFD700" />
                </g>

                {/* 云朵 */}
                <g opacity="0.6">
                  <ellipse cx="100" cy="60" rx="30" ry="15" fill="#FFFFFF" />
                  <ellipse cx="120" cy="55" rx="35" ry="18" fill="#FFFFFF" />
                  <ellipse cx="140" cy="60" rx="28" ry="14" fill="#FFFFFF" />
                </g>

                {/* 远处的沙丘 */}
                <path d="M 0 220 Q 100 180 200 220 T 400 220 T 600 220 L 600 300 L 0 300 Z"
                      fill="#E6BE8A" opacity="0.4" />
                <path d="M 0 240 Q 150 200 300 240 T 600 240 L 600 300 L 0 300 Z"
                      fill="#DEB887" opacity="0.5" />

                {/* 主沙丘地面 */}
                <path d="M 0 280 Q 150 265 300 280 T 600 280 L 600 300 L 0 300 Z"
                      fill="url(#sandGradient)" />

                {/* 沙丘纹理线条 */}
                <path d="M 50 275 Q 100 270 150 275" stroke="#D4A76A" strokeWidth="1" fill="none" opacity="0.4" />
                <path d="M 200 278 Q 250 273 300 278" stroke="#D4A76A" strokeWidth="1" fill="none" opacity="0.4" />
                <path d="M 350 276 Q 400 271 450 276" stroke="#D4A76A" strokeWidth="1" fill="none" opacity="0.4" />

                {/* 沙漠植物 - 左侧 */}
                <g transform="translate(50, 270)">
                  <ellipse cx="0" cy="0" rx="8" ry="4" fill="#8B7355" />
                  <path d="M -3 -2 Q -5 -8 -3 -12 M 0 -2 Q 0 -10 0 -15 M 3 -2 Q 5 -8 3 -12"
                        stroke="#556B2F" strokeWidth="1.5" fill="none" />
                </g>

                {/* 沙漠植物 - 右侧 */}
                <g transform="translate(530, 268)">
                  <ellipse cx="0" cy="0" rx="6" ry="3" fill="#8B7355" />
                  <path d="M -2 -2 Q -3 -6 -2 -10 M 2 -2 Q 3 -6 2 -10"
                        stroke="#556B2F" strokeWidth="1.5" fill="none" />
                </g>

                {/* 风速仪 (左侧有板) */}
                <WindSpeedometer
                  x={150}
                  speed={(isRunning && currentHeight > 0) ? withPanelData[heightIndex] : 0}
                  isSpinning={isRunning && currentHeight > 0}
                  heightPercent={currentHeight}
                  showPanel={true}
                  size={{ width: 200, height: 300 }}
                />
                {/* 风速仪 (右侧无板) */}
                <WindSpeedometer
                  x={450}
                  speed={(isRunning && currentHeight > 0) ? withoutPanelData[heightIndex] : 0}
                  isSpinning={isRunning && currentHeight > 0}
                  heightPercent={currentHeight}
                  showPanel={false}
                  size={{ width: 200, height: 300 }}
                />

                {/* 地面遮挡层 (沙漠色遮挡，模拟杆子插入地下) - 加高遮挡灰色杆子 */}
                <rect x="0" y="282" width="600" height="118" fill="#DAA520" />
                <rect x="0" y="282" width="600" height="3" fill="#D4A76A" opacity="0.5" />

                {/* 风速标签和显示框 */}
                <text x="300" y="310" textAnchor="middle" fill="#333" fontSize="14" fontWeight="500">风速</text>

                {/* 风速显示框 - 左侧（有板区）*/}
                <g transform="translate(150, 318)">
                  <rect x="-40" y="0" width="80" height="32" fill="#c8e6c9" stroke="#81c784" strokeWidth="2" rx="4" />
                  <text x="0" y="21" textAnchor="middle" fill="#333" fontSize="15" fontWeight="600">
                    {withPanelSpeed > 0 ? `${withPanelSpeed}m/s` : '0'}
                  </text>
                </g>

                {/* 风速显示框 - 右侧（无板区）*/}
                <g transform="translate(450, 318)">
                  <rect x="-40" y="0" width="80" height="32" fill="#c8e6c9" stroke="#81c784" strokeWidth="2" rx="4" />
                  <text x="0" y="21" textAnchor="middle" fill="#333" fontSize="15" fontWeight="600">
                    {withoutPanelSpeed > 0 ? `${withoutPanelSpeed}m/s` : '0'}
                  </text>
                </g>

                {/* 控制面板 - 新布局：重置 - 减号 - 高度 - 加号 - 开始 */}
                <g transform="translate(300, 375)">
                  {/* 重置按钮（左侧）*/}
                  <g onClick={handleReset} style={{ cursor: 'pointer' }}>
                    <rect x="-150" y="-12" width="60" height="28" fill="url(#resetGradient)" rx="5" />
                    <text x="-120" y="7" textAnchor="middle" fill="white" fontSize="13" fontWeight="500">重置</text>
                  </g>

                  {/* 减号按钮 */}
                  <g onClick={() => heightIndex > 0 && handleHeightChange(-1)}
                     opacity={heightIndex <= 0 ? 0.3 : 1}
                     style={{ cursor: heightIndex <= 0 ? 'not-allowed' : 'pointer' }}>
                    <rect x="-70" y="-12" width="28" height="28" fill="transparent" stroke="#333" strokeWidth="2" rx="4" />
                    <text x="-56" y="7" textAnchor="middle" fill="#333" fontSize="18" fontWeight="600">−</text>
                  </g>

                  {/* 高度显示（居中）*/}
                  <rect x="-35" y="-12" width="70" height="28" fill="#333" rx="4" />
                  <text x="0" y="9" textAnchor="middle" fill="white" fontSize="14" fontWeight="600">{currentHeight}cm</text>

                  {/* 加号按钮 */}
                  <g onClick={() => heightIndex < 3 && handleHeightChange(1)}
                     opacity={heightIndex >= 3 ? 0.3 : 1}
                     style={{ cursor: heightIndex >= 3 ? 'not-allowed' : 'pointer' }}>
                    <rect x="42" y="-12" width="28" height="28" fill="transparent" stroke="#333" strokeWidth="2" rx="4" />
                    <text x="56" y="7" textAnchor="middle" fill="#333" fontSize="18" fontWeight="600">+</text>
                  </g>

                  {/* 开始按钮（右侧）*/}
                  <g onClick={handleStart}
                     opacity={isRunning ? 0.6 : 1}
                     style={{ cursor: isRunning ? 'not-allowed' : 'pointer', pointerEvents: isRunning ? 'none' : 'auto' }}>
                    <rect x="90" y="-12" width="60" height="28"
                          fill={isRunning ? '#999' : 'url(#startGradient)'} rx="5" />
                    <text x="120" y="7" textAnchor="middle" fill="white" fontSize="13" fontWeight="500">开始</text>
                  </g>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page07Experiment2;
