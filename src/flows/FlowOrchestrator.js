// FlowOrchestrator: 最小占位实现，用于跨页面/模块的编排
// 后续会与 CMI/心跳上报等能力集成

export default class FlowOrchestrator {
  constructor(steps = []) {
    this.steps = steps;
    this.index = 0;
  }

  getCurrentStep() {
    return this.steps[this.index] || null;
  }

  goTo(index) {
    if (index >= 0 && index < this.steps.length) {
      this.index = index;
      return true;
    }
    return false;
  }

  next() {
    return this.goTo(this.index + 1);
  }

  prev() {
    return this.goTo(this.index - 1);
  }
}

