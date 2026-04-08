// 子模块占位导出：用于隔离与渐进集成
// 注意：Flow 系统使用 registry.ts，此文件仅作为旧模块兼容层

import { G4ExperimentSubmodule } from './g4-experiment';

export const registry = new Map();

export function registerSubmodule(id, impl) {
  registry.set(id, impl);
}

export function getSubmodule(id) {
  return registry.get(id);
}

// 默认注册已实现的子模块，便于旧流程兼容调用
registerSubmodule(G4ExperimentSubmodule.submoduleId, G4ExperimentSubmodule);
