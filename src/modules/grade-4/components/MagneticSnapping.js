/**
 * 磁吸技术实现工具类
 * 提供智能对齐和磁吸功能
 */

class MagneticSnapping {
  // 磁吸配置
  static SNAP_CONFIG = {
    GRID_SIZE: 20,           // 网格大小（20px）
    SNAP_THRESHOLD: 15,      // 磁吸阈值（15px内触发）
    ALIGN_THRESHOLD: 25,     // 对齐阈值（25px内触发对齐）
    SNAP_STRENGTH: 0.8,      // 磁吸强度（0-1）
    ANIMATION_DURATION: 200,  // 磁吸动画时长（ms）
    BOUNDARY_PADDING: 10     // 边界内边距
  };

  /**
   * 网格磁吸：对齐到网格点
   * @param {Object} position - 当前位置 {x, y}
   * @returns {Object} 磁吸结果
   */
  static snapToGrid(position) {
    const { GRID_SIZE, SNAP_THRESHOLD } = this.SNAP_CONFIG;
    
    const gridX = Math.round(position.x / GRID_SIZE) * GRID_SIZE;
    const gridY = Math.round(position.y / GRID_SIZE) * GRID_SIZE;
    
    const deltaX = Math.abs(position.x - gridX);
    const deltaY = Math.abs(position.y - gridY);
    
    const shouldSnapX = deltaX < SNAP_THRESHOLD;
    const shouldSnapY = deltaY < SNAP_THRESHOLD;
    
    return {
      x: shouldSnapX ? gridX : position.x,
      y: shouldSnapY ? gridY : position.y,
      snapped: shouldSnapX || shouldSnapY,
      alignType: 'grid'
    };
  }

  /**
   * 任务对齐磁吸：与其他任务对齐
   * @param {Object} currentTask - 当前拖拽的任务
   * @param {Array} otherTasks - 其他已放置的任务
   * @param {Object} dragPosition - 拖拽位置
   * @returns {Object} 最佳磁吸结果
   */
  static snapToTasks(currentTask, otherTasks, dragPosition) {
    const { ALIGN_THRESHOLD } = this.SNAP_CONFIG;
    let bestSnap = { ...dragPosition, snapped: false };
    let minDistance = Infinity;

    otherTasks.forEach(task => {
      if (task.id === currentTask.id) return;

      // 水平对齐检测
      const yDiff = Math.abs(dragPosition.y - task.position.y);
      if (yDiff < ALIGN_THRESHOLD) {
        if (yDiff < minDistance) {
          minDistance = yDiff;
          bestSnap = {
            x: dragPosition.x,
            y: task.position.y, // 对齐到同一水平线
            snapped: true,
            alignType: 'horizontal',
            alignTarget: task.id
          };
        }
      }

      // 垂直对齐检测  
      const xDiff = Math.abs(dragPosition.x - task.position.x);
      if (xDiff < ALIGN_THRESHOLD) {
        if (xDiff < minDistance) {
          minDistance = xDiff;
          bestSnap = {
            x: task.position.x, // 对齐到同一垂直线
            y: dragPosition.y,
            snapped: true,
            alignType: 'vertical',
            alignTarget: task.id
          };
        }
      }

      // 串行连接磁吸：任务首尾相接
      const currentTaskWidth = this.getTaskWidth(currentTask);
      const targetTaskWidth = this.getTaskWidth(task);
      
      // 检查连接到任务右侧
      const taskEndX = task.position.x + targetTaskWidth;
      const connectionDistance = Math.abs(dragPosition.x - taskEndX);
      const yAlignment = Math.abs(dragPosition.y - task.position.y);
      
      if (connectionDistance < ALIGN_THRESHOLD && yAlignment < ALIGN_THRESHOLD) {
        const totalDistance = connectionDistance + yAlignment;
        if (totalDistance < minDistance) {
          minDistance = totalDistance;
          bestSnap = {
            x: taskEndX + 5, // 留5px间隙
            y: task.position.y,
            snapped: true,
            alignType: 'serial',
            alignTarget: task.id
          };
        }
      }
      
      // 检查连接到任务左侧
      const taskStartX = task.position.x;
      const leftConnectionDistance = Math.abs((dragPosition.x + currentTaskWidth) - taskStartX);
      
      if (leftConnectionDistance < ALIGN_THRESHOLD && yAlignment < ALIGN_THRESHOLD) {
        const totalDistance = leftConnectionDistance + yAlignment;
        if (totalDistance < minDistance) {
          minDistance = totalDistance;
          bestSnap = {
            x: taskStartX - currentTaskWidth - 5, // 留5px间隙
            y: task.position.y,
            snapped: true,
            alignType: 'serial',
            alignTarget: task.id
          };
        }
      }
    });

    return bestSnap;
  }

  /**
   * 边界磁吸：对齐到容器边缘
   * @param {Object} position - 当前位置
   * @param {Object} containerBounds - 容器边界
   * @param {number} taskWidth - 任务宽度
   * @returns {Object} 边界磁吸结果
   */
  static snapToBounds(position, containerBounds, taskWidth = 60) {
    const { SNAP_THRESHOLD, BOUNDARY_PADDING } = this.SNAP_CONFIG;
    let snappedPos = { ...position };
    let snapped = false;

    // 左边界磁吸
    if (position.x < SNAP_THRESHOLD + BOUNDARY_PADDING) {
      snappedPos.x = BOUNDARY_PADDING;
      snapped = true;
    }

    // 右边界磁吸
    const rightEdge = containerBounds.width - taskWidth - BOUNDARY_PADDING;
    if (position.x > rightEdge - SNAP_THRESHOLD) {
      snappedPos.x = rightEdge;
      snapped = true;
    }

    // 上边界磁吸
    if (position.y < SNAP_THRESHOLD + BOUNDARY_PADDING) {
      snappedPos.y = BOUNDARY_PADDING;
      snapped = true;
    }

    // 下边界磁吸
    const bottomEdge = containerBounds.height - 50 - BOUNDARY_PADDING; // 50px任务块高度
    if (position.y > bottomEdge - SNAP_THRESHOLD) {
      snappedPos.y = bottomEdge;
      snapped = true;
    }

    return { 
      ...snappedPos, 
      snapped,
      alignType: snapped ? 'boundary' : null
    };
  }

  /**
   * 综合磁吸计算
   * @param {Object} currentTask - 当前任务
   * @param {Object} dragPosition - 拖拽位置
   * @param {Array} otherTasks - 其他任务
   * @param {Object} containerBounds - 容器边界
   * @returns {Object} 最终磁吸结果
   */
  static calculateSnapping(currentTask, dragPosition, otherTasks, containerBounds) {
    // 1. 首先尝试任务对齐磁吸（优先级最高）
    if (otherTasks && otherTasks.length > 0) {
      const taskSnap = this.snapToTasks(currentTask, otherTasks, dragPosition);
      if (taskSnap.snapped) {
        return taskSnap;
      }
    }

    // 2. 尝试边界磁吸
    const taskWidth = this.getTaskWidth(currentTask);
    const boundsSnap = this.snapToBounds(dragPosition, containerBounds, taskWidth);
    if (boundsSnap.snapped) {
      return boundsSnap;
    }

    // 3. 尝试网格磁吸
    const gridSnap = this.snapToGrid(dragPosition);
    if (gridSnap.snapped) {
      return gridSnap;
    }

    // 4. 无磁吸，返回原位置
    return { ...dragPosition, snapped: false };
  }

  /**
   * 获取任务宽度
   * @param {Object} task - 任务对象
   * @returns {number} 任务宽度（像素）
   */
  static getTaskWidth(task) {
    if (!task || !task.duration) return 60;
    return Math.max(task.duration * 20 + 30, 60);
  }

  /**
   * 检查磁吸区域
   * @param {Object} position - 当前位置
   * @param {Array} tasks - 已放置任务
   * @param {Object} containerBounds - 容器边界
   * @returns {Object} 磁吸区域信息
   */
  static getSnapZones(position, tasks, containerBounds) {
    const { ALIGN_THRESHOLD, GRID_SIZE, BOUNDARY_PADDING } = this.SNAP_CONFIG;
    const zones = [];

    // 网格磁吸区域
    const gridX = Math.round(position.x / GRID_SIZE) * GRID_SIZE;
    const gridY = Math.round(position.y / GRID_SIZE) * GRID_SIZE;
    if (Math.abs(position.x - gridX) < ALIGN_THRESHOLD || 
        Math.abs(position.y - gridY) < ALIGN_THRESHOLD) {
      zones.push({ type: 'grid', x: gridX, y: gridY });
    }

    // 任务对齐磁吸区域
    tasks.forEach(task => {
      const taskPos = task.position;
      
      // 水平对齐
      if (Math.abs(position.y - taskPos.y) < ALIGN_THRESHOLD) {
        zones.push({ type: 'horizontal', x: position.x, y: taskPos.y, targetTask: task.id });
      }
      
      // 垂直对齐
      if (Math.abs(position.x - taskPos.x) < ALIGN_THRESHOLD) {
        zones.push({ type: 'vertical', x: taskPos.x, y: position.y, targetTask: task.id });
      }
    });

    // 边界磁吸区域
    if (position.x < ALIGN_THRESHOLD + BOUNDARY_PADDING) {
      zones.push({ type: 'boundary', x: BOUNDARY_PADDING, y: position.y, side: 'left' });
    }
    if (position.x > containerBounds.width - ALIGN_THRESHOLD - BOUNDARY_PADDING) {
      zones.push({ type: 'boundary', x: containerBounds.width - BOUNDARY_PADDING, y: position.y, side: 'right' });
    }
    if (position.y < ALIGN_THRESHOLD + BOUNDARY_PADDING) {
      zones.push({ type: 'boundary', x: position.x, y: BOUNDARY_PADDING, side: 'top' });
    }
    if (position.y > containerBounds.height - ALIGN_THRESHOLD - BOUNDARY_PADDING) {
      zones.push({ type: 'boundary', x: position.x, y: containerBounds.height - BOUNDARY_PADDING, side: 'bottom' });
    }

    return zones;
  }

  /**
   * 计算磁吸距离
   * @param {Object} originalPos - 原始位置
   * @param {Object} snappedPos - 磁吸后位置
   * @returns {number} 磁吸距离
   */
  static calculateSnapDistance(originalPos, snappedPos) {
    const deltaX = snappedPos.x - originalPos.x;
    const deltaY = snappedPos.y - originalPos.y;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  }

  /**
   * 验证磁吸位置的合法性
   * @param {Object} position - 磁吸后位置
   * @param {Object} task - 当前任务
   * @param {Object} containerBounds - 容器边界
   * @returns {boolean} 是否合法
   */
  static validateSnapPosition(position, task, containerBounds) {
    const taskWidth = this.getTaskWidth(task);
    const taskHeight = 40; // 固定任务高度
    
    // 检查是否超出容器边界
    if (position.x < 0 || position.y < 0) return false;
    if (position.x + taskWidth > containerBounds.width) return false;
    if (position.y + taskHeight > containerBounds.height) return false;
    
    return true;
  }
}

export default MagneticSnapping;