/**
 * 时间计算工具类
 * 实现关键路径分析算法
 */

class TimeCalculator {
  /**
   * 计算关键路径总时间
   * @param {Array} tasks - 任务列表
   * @returns {number} 总时间（分钟）
   */
  static calculateCriticalPathTime(tasks) {
    if (!tasks || tasks.length === 0) return 0;

    // 根据任务位置分析串行和并行关系
    const taskGroups = this.analyzeTaskArrangement(tasks);
    
    // 计算关键路径总时间
    let totalTime = 0;
    
    taskGroups.forEach(group => {
      if (group.type === 'parallel') {
        // 并行任务取最长时间
        const maxTime = Math.max(...group.tasks.map(t => t.duration));
        totalTime += maxTime;
        console.log(`[TimeCalculator] 并行组合最大时间: ${maxTime}分钟`);
      } else {
        // 串行任务累加时间
        const serialTime = group.tasks.reduce((sum, t) => sum + t.duration, 0);
        totalTime += serialTime;
        console.log(`[TimeCalculator] 串行组合总时间: ${serialTime}分钟`);
      }
    });

    console.log(`[TimeCalculator] 关键路径总时间: ${totalTime}分钟`);
    return totalTime;
  }

  /**
   * 分析任务排列关系（串行/并行）
   * @param {Array} tasks - 任务列表
   * @returns {Array} 任务组列表
   */
  static analyzeTaskArrangement(tasks) {
    if (!tasks.length) return [];

    // 按X坐标排序（时间轴从左到右）
    const sortedTasks = [...tasks].sort((a, b) => a.position.x - b.position.x);
    
    const groups = [];
    let currentGroup = null;
    
    // Y坐标相近阈值（像素）
    const Y_THRESHOLD = 40;
    
    sortedTasks.forEach((task, index) => {
      if (index === 0) {
        // 第一个任务，开始新组
        currentGroup = {
          type: 'serial',
          tasks: [task],
          xStart: task.position.x,
          xEnd: task.position.x + this.getTaskWidth(task),
          yCenter: task.position.y
        };
        return;
      }

      const prevTask = sortedTasks[index - 1];
      const yDiff = Math.abs(task.position.y - currentGroup.yCenter);
      const xOverlap = this.checkXOverlap(currentGroup, task);

      // 判断是否与当前组并行
      if (yDiff > Y_THRESHOLD || !xOverlap) {
        // 不并行，结束当前组并开始新组
        groups.push(currentGroup);
        currentGroup = {
          type: 'serial',
          tasks: [task],
          xStart: task.position.x,
          xEnd: task.position.x + this.getTaskWidth(task),
          yCenter: task.position.y
        };
      } else {
        // 并行关系，加入当前组
        if (currentGroup.type === 'serial' && currentGroup.tasks.length === 1) {
          currentGroup.type = 'parallel';
        }
        currentGroup.tasks.push(task);
        currentGroup.xEnd = Math.max(currentGroup.xEnd, task.position.x + this.getTaskWidth(task));
      }
    });

    // 添加最后一个组
    if (currentGroup) {
      groups.push(currentGroup);
    }

    console.log(`[TimeCalculator] 任务分组结果:`, groups.map(g => ({
      type: g.type,
      taskCount: g.tasks.length,
      taskLabels: g.tasks.map(t => t.label).join(',')
    })));

    return groups;
  }

  /**
   * 检查X轴重叠（时间重叠）
   * @param {Object} group - 当前任务组
   * @param {Object} task - 新任务
   * @returns {boolean} 是否重叠
   */
  static checkXOverlap(group, task) {
    const taskStart = task.position.x;
    const taskEnd = task.position.x + this.getTaskWidth(task);
    
    // 检查是否有时间重叠
    return !(taskEnd <= group.xStart || taskStart >= group.xEnd);
  }

  /**
   * 获取任务块宽度
   * @param {Object} task - 任务对象
   * @returns {number} 宽度（像素）
   */
  static getTaskWidth(task) {
    return Math.max(task.duration * 20 + 30, 60);
  }

  /**
   * 分析关键路径详情
   * @param {Array} tasks - 任务列表
   * @returns {Object} 关键路径分析结果
   */
  static analyzeCriticalPath(tasks) {
    if (!tasks || tasks.length === 0) {
      return {
        totalTime: 0,
        groups: [],
        criticalTasks: [],
        parallelGroups: 0,
        serialGroups: 0
      };
    }

    const taskGroups = this.analyzeTaskArrangement(tasks);
    let totalTime = 0;
    let criticalTasks = [];
    let parallelGroups = 0;
    let serialGroups = 0;

    taskGroups.forEach(group => {
      if (group.type === 'parallel') {
        parallelGroups++;
        // 找出并行组中的关键任务（最长时间的任务）
        const maxDuration = Math.max(...group.tasks.map(t => t.duration));
        const criticalTask = group.tasks.find(t => t.duration === maxDuration);
        criticalTasks.push(criticalTask);
        totalTime += maxDuration;
      } else {
        serialGroups++;
        // 串行组中所有任务都是关键任务
        criticalTasks.push(...group.tasks);
        totalTime += group.tasks.reduce((sum, t) => sum + t.duration, 0);
      }
    });

    return {
      totalTime,
      groups: taskGroups,
      criticalTasks,
      parallelGroups,
      serialGroups,
      efficiency: this.calculateEfficiency(tasks, totalTime)
    };
  }

  /**
   * 计算方案效率
   * @param {Array} tasks - 任务列表
   * @param {number} totalTime - 总时间
   * @returns {number} 效率百分比
   */
  static calculateEfficiency(tasks, totalTime) {
    if (!tasks.length) return 0;
    
    const totalTaskTime = tasks.reduce((sum, t) => sum + t.duration, 0);
    if (totalTime === 0) return 0;
    
    // 效率 = 总任务时间 / 关键路径时间 * 100%
    const efficiency = (totalTaskTime / totalTime) * 100;
    return Math.round(efficiency * 100) / 100; // 保留两位小数
  }

  /**
   * 获取任务排列建议
   * @param {Array} tasks - 任务列表
   * @returns {Object} 优化建议
   */
  static getOptimizationSuggestions(tasks) {
    if (!tasks.length) return { suggestions: [], canOptimize: false };

    const analysis = this.analyzeCriticalPath(tasks);
    const suggestions = [];

    // 检查是否有可以并行的任务
    const serialGroups = analysis.groups.filter(g => g.type === 'serial' && g.tasks.length === 1);
    if (serialGroups.length > 1) {
      suggestions.push({
        type: 'parallel_opportunity',
        message: '可以考虑将一些任务并行执行以节省时间',
        impact: 'medium'
      });
    }

    // 检查效率
    if (analysis.efficiency < 80) {
      suggestions.push({
        type: 'low_efficiency',
        message: '当前方案效率较低，建议重新安排任务顺序',
        impact: 'high'
      });
    }

    // 检查是否有依赖关系问题
    const dependencyIssues = this.checkDependencyIssues(tasks);
    if (dependencyIssues.length > 0) {
      suggestions.push(...dependencyIssues);
    }

    return {
      suggestions,
      canOptimize: suggestions.length > 0,
      currentEfficiency: analysis.efficiency
    };
  }

  /**
   * 检查任务依赖关系问题
   * @param {Array} tasks - 任务列表
   * @returns {Array} 问题列表
   */
  static checkDependencyIssues(tasks) {
    const issues = [];

    // 根据任务内容检查逻辑依赖
    const task1 = tasks.find(t => t.label === '①'); // 洗水壶
    const task2 = tasks.find(t => t.label === '②'); // 烧水
    const task3 = tasks.find(t => t.label === '③'); // 灌水

    if (task1 && task2 && task1.position.x > task2.position.x) {
      issues.push({
        type: 'dependency_violation',
        message: '洗水壶应该在烧水之前完成',
        impact: 'high'
      });
    }

    if (task2 && task3 && task2.position.x > task3.position.x) {
      issues.push({
        type: 'dependency_violation',
        message: '烧水应该在灌水之前完成',
        impact: 'high'
      });
    }

    return issues;
  }
}

export default TimeCalculator;