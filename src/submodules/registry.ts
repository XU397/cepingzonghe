/**
 * 子模块注册表
 * 提供 submoduleId → SubmoduleDefinition 的映射
 */

import type { SubmoduleDefinition } from '@/shared/types/flow';

/**
 * 子模块注册表类
 */
class SubmoduleRegistry {
  private registry: Map<string, SubmoduleDefinition> = new Map();
  private initialized = false;

  /**
   * 初始化注册表（动态导入所有子模块）
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('[SubmoduleRegistry] Already initialized, skipping...');
      return;
    }

    console.log('[SubmoduleRegistry] 🚀 Initializing submodule registry...');

    try {
      // 动态导入并注册子模块包装器
      // TODO: 当其他子模块实现后，在这里导入并注册

      // 示例：7年级蒸馒头实验
      const { G7ExperimentSubmodule } = await import('./g7-experiment');
      this.register(G7ExperimentSubmodule);

      const { G7QuestionnaireSubmodule } = await import('./g7-questionnaire');
      this.register(G7QuestionnaireSubmodule);

      const { G7TrackingExperimentSubmodule } = await import('./g7-tracking-experiment');
      this.register(G7TrackingExperimentSubmodule);

      const { G7TrackingQuestionnaireSubmodule } = await import('./g7-tracking-questionnaire');
      this.register(G7TrackingQuestionnaireSubmodule);

      const { G4ExperimentSubmodule } = await import('./g4-experiment');
      this.register(G4ExperimentSubmodule);

      this.initialized = true;
      console.log(
        '[SubmoduleRegistry] ✅ Submodule registry initialized with',
        this.registry.size,
        'submodules'
      );
      console.log('[SubmoduleRegistry] 📋 Registered submodules:', this.getAllIds());
    } catch (error) {
      console.error('[SubmoduleRegistry] ❌ Initialization failed:', error);
      throw error;
    }
  }

  /**
   * 注册子模块
   */
  register(definition: SubmoduleDefinition): void {
    const { submoduleId } = definition;

    if (this.registry.has(submoduleId)) {
      console.warn(
        `[SubmoduleRegistry] ⚠️ Submodule "${submoduleId}" already registered, overwriting...`
      );
    }

    // 验证必需字段
    if (!definition.Component) {
      throw new Error(`Submodule "${submoduleId}" missing required field: Component`);
    }
    if (!definition.getInitialPage) {
      throw new Error(`Submodule "${submoduleId}" missing required field: getInitialPage`);
    }
    if (!definition.getTotalSteps) {
      throw new Error(`Submodule "${submoduleId}" missing required field: getTotalSteps`);
    }
    if (!definition.getNavigationMode) {
      throw new Error(`Submodule "${submoduleId}" missing required field: getNavigationMode`);
    }

    this.registry.set(submoduleId, definition);
    console.log(`[SubmoduleRegistry] ✅ Registered submodule: ${submoduleId}`);
  }

  /**
   * 获取子模块定义
   */
  get(submoduleId: string): SubmoduleDefinition | undefined {
    return this.registry.get(submoduleId);
  }

  /**
   * 检查子模块是否已注册
   */
  has(submoduleId: string): boolean {
    return this.registry.has(submoduleId);
  }

  /**
   * 获取所有已注册的子模块 ID
   */
  getAllIds(): string[] {
    return Array.from(this.registry.keys());
  }

  /**
   * 获取所有子模块定义
   */
  getAll(): SubmoduleDefinition[] {
    return Array.from(this.registry.values());
  }
}

// 导出单例
export const submoduleRegistry = new SubmoduleRegistry();

// 导出类型
export type { SubmoduleDefinition };
