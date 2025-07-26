/**
 * 模拟实验数据
 * 记录不同温度和时间条件下面团的体积变化
 * 数据来源：需求文档中的表格数据
 */
export const simulationTableData = {
  // 面团在不同温度下的初始体积（ml）
  initialVolume: 70,
  
  // 不同温度和时间下的面团体积（ml）
  volumeData: {
    // 时间（小时）: { 温度（°C）: 体积（ml） }
    0: {
      20: 70,
      25: 70,
      30: 70,
      35: 70,
      40: 70
    },
    1: {
      20: 70,
      25: 70,
      30: 70,
      35: 70,
      40: 70
    },
    2: {
      20: 70,
      25: 82,
      30: 80,
      35: 75,
      40: 70
    },
    3: {
      20: 75,
      25: 105,
      30: 98,
      35: 95,
      40: 70
    },
    4: {
      20: 85,
      25: 110,
      30: 112,
      35: 105,
      40: 72
    },
    5: {
      20: 92,
      25: 115,
      30: 118,
      35: 112,
      40: 74
    },
    6: {
      20: 105,
      25: 120,
      30: 122,
      35: 115,
      40: 74
    },
    7: {
      20: 110,
      25: 120,
      30: 123,
      35: 120,
      40: 74
    },
    8: {
      20: 115,
      25: 123,
      30: 125,
      35: 122,
      40: 74
    }
  },
  
  // 可选的发酵时间（小时）
  availableTimes: [1, 2, 3, 4, 5, 6, 7, 8],
  
  // 恒温箱温度（°C）
  availableTemperatures: [20, 25, 30, 35, 40],
  
  /**
   * 根据温度和时间获取面团体积
   * @param {number} temperature - 温度（°C）
   * @param {number} time - 时间（小时）
   * @returns {number} 面团体积（ml）
   */
  getVolumeByTemperatureAndTime(temperature, time) {
    return this.volumeData[time]?.[temperature] || this.initialVolume;
  },
  
  /**
   * 根据温度和目标体积找到所需时间
   * @param {number} temperature - 温度（°C）
   * @param {number} targetVolume - 目标体积（ml）
   * @returns {number|null} 所需时间（小时），如果无法达到目标体积则返回null
   */
  getTimeForTargetVolume(temperature, targetVolume) {
    for (const time of this.availableTimes) {
      const volume = this.getVolumeByTemperatureAndTime(temperature, time);
      if (volume >= targetVolume) {
        return time;
      }
    }
    return null;
  },
  
  /**
   * 获取指定条件下的最佳发酵方案
   * 基于馒头发酵到初始体积的1.5倍时口感最佳的准则（105ml）
   * @returns {Array} 适合的温度和时间组合
   */
  getBestFermentationOptions() {
    const targetVolume = this.initialVolume * 1.5; // 105ml
    const options = [];
    
    this.availableTemperatures.forEach(temp => {
      this.availableTimes.forEach(time => {
        const volume = this.getVolumeByTemperatureAndTime(temp, time);
        if (volume >= targetVolume) {
          options.push({
            temperature: temp,
            time: time,
            volume: volume
          });
        }
      });
    });
    
    // 按时间和接近目标体积程度排序
    return options.sort((a, b) => {
      // 先按时间排序
      if (a.time !== b.time) {
        return a.time - b.time;
      }
      // 时间相同则按体积与目标体积差值排序
      return Math.abs(a.volume - targetVolume) - Math.abs(b.volume - targetVolume);
    });
  }
}; 