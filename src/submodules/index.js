// 子模块占位导出：用于隔离与渐进集成

export const registry = new Map();

export function registerSubmodule(id, impl) {
  registry.set(id, impl);
}

export function getSubmodule(id) {
  return registry.get(id);
}

