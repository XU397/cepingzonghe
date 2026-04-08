/**
 * WeatherCalendar - 天气日历 SVG 动画组件
 *
 * 展示成都某月份的天气日历，包含动态 SVG 天气图标
 * 符合 7 年级模块设计系统规范
 *
 * @component
 */

import { memo } from 'react';
import styles from './WeatherCalendar.module.css';

/**
 * 天气数据 - 模拟成都某月份天气
 */
const WEATHER_DATA = [
  { day: 1, weekday: 5, icon: 'cloud-rain', text: '小雨~多云', temp: [19, 26] },
  { day: 2, weekday: 6, icon: 'sunny', text: '多云~晴', temp: [20, 32] },
  { day: 3, weekday: 0, icon: 'sunny', text: '晴', temp: [21, 34] },
  { day: 4, weekday: 1, icon: 'sun-cloud', text: '多云~晴', temp: [22, 34] },
  { day: 5, weekday: 2, icon: 'cloud-rain', text: '多云', temp: [23, 34] },
  { day: 6, weekday: 3, icon: 'cloud', text: '阴~多云', temp: [23, 31] },
  { day: 7, weekday: 4, icon: 'cloud', text: '阴~多云', temp: [23, 32] },
  { day: 8, weekday: 5, icon: 'cloud-sun', text: '阴~小雨', temp: [23, 33] },
  { day: 9, weekday: 6, icon: 'cloud-rain', text: '多云~大雨', temp: [23, 33] },
  { day: 10, weekday: 0, icon: 'heavy-rain', text: '大雨', temp: [23, 33] },
  { day: 11, weekday: 1, icon: 'dark-rain', text: '大雨~阵雨', temp: [19, 22] },
  { day: 12, weekday: 2, icon: 'cloud', text: '阴~多云', temp: [17, 29] },
  { day: 13, weekday: 3, icon: 'cloud-sun', text: '阴~晴', temp: [20, 31] },
  { day: 14, weekday: 4, icon: 'cloud-rain', text: '阴~多云', temp: [21, 31] },
  { day: 15, weekday: 5, icon: 'cloud-rain', text: '阴~多云', temp: [22, 29] },
  { day: 16, weekday: 6, icon: 'cloud-sun', text: '阴~多云', temp: [22, 30] },
];

/**
 * 晴天图标
 */
const SunnyIcon = () => (
  <svg className={styles.weatherIcon} viewBox="0 0 64 64" fill="none" aria-label="晴天">
    <g className={styles.sunRays}>
      <line x1="32" y1="6" x2="32" y2="14" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
      <line
        x1="32"
        y1="50"
        x2="32"
        y2="58"
        stroke="#f59e0b"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line x1="6" y1="32" x2="14" y2="32" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
      <line
        x1="50"
        y1="32"
        x2="58"
        y2="32"
        stroke="#f59e0b"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="13.4"
        y1="13.4"
        x2="19"
        y2="19"
        stroke="#f59e0b"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="45"
        y1="45"
        x2="50.6"
        y2="50.6"
        stroke="#f59e0b"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="13.4"
        y1="50.6"
        x2="19"
        y2="45"
        stroke="#f59e0b"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="45"
        y1="19"
        x2="50.6"
        y2="13.4"
        stroke="#f59e0b"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </g>
    <circle className={styles.sunBody} cx="32" cy="32" r="13" fill="#fbbf24" />
    <circle cx="32" cy="32" r="8" fill="#fcd34d" />
  </svg>
);

/**
 * 多云图标
 */
const CloudIcon = () => (
  <svg className={styles.weatherIcon} viewBox="0 0 64 64" fill="none" aria-label="多云">
    <g className={styles.cloudMain}>
      <ellipse cx="22" cy="38" rx="14" ry="10" fill="#e5e7eb" />
      <ellipse cx="38" cy="36" rx="16" ry="12" fill="#d1d5db" />
      <ellipse cx="30" cy="32" rx="12" ry="9" fill="#e5e7eb" />
    </g>
  </svg>
);

/**
 * 小雨图标
 */
const CloudRainIcon = () => (
  <svg className={styles.weatherIcon} viewBox="0 0 64 64" fill="none" aria-label="小雨">
    <g className={styles.cloudMain}>
      <ellipse cx="20" cy="24" rx="12" ry="8" fill="#e5e7eb" />
      <ellipse cx="34" cy="22" rx="14" ry="10" fill="#d1d5db" />
      <ellipse cx="28" cy="18" rx="10" ry="7" fill="#e5e7eb" />
    </g>
    <line
      className={styles.rainLine}
      x1="22"
      y1="36"
      x2="20"
      y2="48"
      stroke="#60a5fa"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line
      className={styles.rainLine2}
      x1="32"
      y1="38"
      x2="30"
      y2="50"
      stroke="#60a5fa"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line
      className={styles.rainLine3}
      x1="42"
      y1="36"
      x2="40"
      y2="48"
      stroke="#60a5fa"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * 晴转多云图标
 */
const SunCloudIcon = () => (
  <svg className={styles.weatherIcon} viewBox="0 0 64 64" fill="none" aria-label="晴转多云">
    <g className={styles.sunRaysSmall} style={{ transformOrigin: '18px 20px' }}>
      <line
        x1="18"
        y1="4"
        x2="18"
        y2="10"
        stroke="#f59e0b"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="4"
        y1="20"
        x2="10"
        y2="20"
        stroke="#f59e0b"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="8"
        y1="10"
        x2="12"
        y2="14"
        stroke="#f59e0b"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="26"
        y1="10"
        x2="22"
        y2="14"
        stroke="#f59e0b"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </g>
    <circle className={styles.sunBody} cx="18" cy="20" r="9" fill="#fbbf24" />
    <circle cx="18" cy="20" r="5" fill="#fcd34d" />
    <g className={styles.cloudMain}>
      <ellipse cx="36" cy="42" rx="14" ry="10" fill="#e5e7eb" />
      <ellipse cx="48" cy="40" rx="10" ry="8" fill="#d1d5db" />
      <ellipse cx="42" cy="36" rx="10" ry="8" fill="#e5e7eb" />
    </g>
  </svg>
);

/**
 * 多云转晴图标
 */
const CloudSunIcon = () => (
  <svg className={styles.weatherIcon} viewBox="0 0 64 64" fill="none" aria-label="多云转晴">
    <g className={styles.sunRaysSmall} style={{ transformOrigin: '50px 18px' }}>
      <line x1="50" y1="4" x2="50" y2="9" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
      <line
        x1="58"
        y1="18"
        x2="62"
        y2="18"
        stroke="#f59e0b"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line x1="56" y1="10" x2="59" y2="7" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
    </g>
    <circle className={styles.sunBody} cx="50" cy="18" r="7" fill="#fbbf24" />
    <g className={styles.cloudMain}>
      <ellipse cx="22" cy="40" rx="14" ry="10" fill="#e5e7eb" />
      <ellipse cx="38" cy="38" rx="16" ry="12" fill="#d1d5db" />
      <ellipse cx="30" cy="34" rx="12" ry="9" fill="#e5e7eb" />
    </g>
  </svg>
);

/**
 * 大雨图标
 */
const HeavyRainIcon = () => (
  <svg className={styles.weatherIcon} viewBox="0 0 64 64" fill="none" aria-label="大雨">
    <g className={styles.cloudMain}>
      <ellipse cx="20" cy="16" rx="12" ry="8" fill="#6b7280" />
      <ellipse cx="34" cy="14" rx="14" ry="10" fill="#4b5563" />
      <ellipse cx="28" cy="10" rx="10" ry="7" fill="#374151" />
    </g>
    <line
      className={styles.heavyRainLine}
      x1="14"
      y1="28"
      x2="11"
      y2="44"
      stroke="#3b82f6"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <line
      className={styles.heavyRainLine}
      x1="24"
      y1="30"
      x2="21"
      y2="46"
      stroke="#3b82f6"
      strokeWidth="2.5"
      strokeLinecap="round"
      style={{ animationDelay: '-0.2s' }}
    />
    <line
      className={styles.heavyRainLine}
      x1="34"
      y1="28"
      x2="31"
      y2="44"
      stroke="#3b82f6"
      strokeWidth="2.5"
      strokeLinecap="round"
      style={{ animationDelay: '-0.4s' }}
    />
    <line
      className={styles.heavyRainLine}
      x1="44"
      y1="30"
      x2="41"
      y2="46"
      stroke="#3b82f6"
      strokeWidth="2.5"
      strokeLinecap="round"
      style={{ animationDelay: '-0.15s' }}
    />
    <line
      className={styles.heavyRainLine}
      x1="19"
      y1="36"
      x2="17"
      y2="48"
      stroke="#60a5fa"
      strokeWidth="2"
      strokeLinecap="round"
      style={{ animationDelay: '-0.3s' }}
    />
    <line
      className={styles.heavyRainLine}
      x1="29"
      y1="34"
      x2="27"
      y2="46"
      stroke="#60a5fa"
      strokeWidth="2"
      strokeLinecap="round"
      style={{ animationDelay: '-0.5s' }}
    />
    <line
      className={styles.heavyRainLine}
      x1="39"
      y1="36"
      x2="37"
      y2="48"
      stroke="#60a5fa"
      strokeWidth="2"
      strokeLinecap="round"
      style={{ animationDelay: '-0.1s' }}
    />
  </svg>
);

/**
 * 暴雨图标
 */
const DarkRainIcon = () => (
  <svg className={styles.weatherIcon} viewBox="0 0 64 64" fill="none" aria-label="暴雨">
    <g className={styles.cloudMain}>
      <ellipse cx="22" cy="18" rx="12" ry="8" fill="#6b7280" />
      <ellipse cx="36" cy="16" rx="14" ry="10" fill="#4b5563" />
      <ellipse cx="30" cy="12" rx="10" ry="7" fill="#6b7280" />
    </g>
    <line
      className={styles.rainLine}
      x1="20"
      y1="30"
      x2="17"
      y2="44"
      stroke="#3b82f6"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <line
      className={styles.rainLine2}
      x1="32"
      y1="32"
      x2="29"
      y2="46"
      stroke="#3b82f6"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <line
      className={styles.rainLine3}
      x1="44"
      y1="30"
      x2="41"
      y2="44"
      stroke="#3b82f6"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <line
      className={styles.rainLine}
      x1="26"
      y1="36"
      x2="24"
      y2="46"
      stroke="#60a5fa"
      strokeWidth="2"
      strokeLinecap="round"
      style={{ animationDelay: '-0.5s' }}
    />
    <line
      className={styles.rainLine2}
      x1="38"
      y1="34"
      x2="36"
      y2="44"
      stroke="#60a5fa"
      strokeWidth="2"
      strokeLinecap="round"
      style={{ animationDelay: '-0.3s' }}
    />
  </svg>
);

/**
 * 根据图标类型获取对应组件
 */
const getWeatherIcon = iconType => {
  const iconMap = {
    sunny: SunnyIcon,
    cloud: CloudIcon,
    'cloud-rain': CloudRainIcon,
    'sun-cloud': SunCloudIcon,
    'cloud-sun': CloudSunIcon,
    'heavy-rain': HeavyRainIcon,
    'dark-rain': DarkRainIcon,
  };
  const IconComponent = iconMap[iconType] || CloudIcon;
  return <IconComponent />;
};

/**
 * 周几标题
 */
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

/**
 * WeatherCalendar 组件
 */
const WeatherCalendar = memo(function WeatherCalendar() {
  return (
    <div className={styles.calendarContainer}>
      {/* 周几标题行 */}
      <div className={styles.weekdays}>
        {WEEKDAYS.map((day, index) => (
          <div
            key={day}
            className={`${styles.weekday} ${index === 0 || index === 6 ? styles.weekend : ''}`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 日历网格 */}
      <div className={styles.calendarGrid}>
        {/* 1号是周五(weekday=5)，前面有5个空格 */}
        {[...Array(5)].map((_, i) => (
          <div key={`empty-${i}`} className={`${styles.dayCell} ${styles.empty}`} />
        ))}

        {/* 天气数据 */}
        {WEATHER_DATA.map(data => {
          const isWeekend = data.weekday === 0 || data.weekday === 6;
          return (
            <div
              key={data.day}
              className={`${styles.dayCell}${isWeekend ? ` ${styles.weekend}` : ''}`}
            >
              <div className={styles.dayNumber}>{data.day}</div>
              {getWeatherIcon(data.icon)}
              <div className={styles.weatherText}>{data.text}</div>
              <div className={styles.temperature}>
                <span className={styles.tempLow}>{data.temp[0]}°</span>
                <span>~</span>
                <span className={styles.tempHigh}>{data.temp[1]}°</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default WeatherCalendar;
