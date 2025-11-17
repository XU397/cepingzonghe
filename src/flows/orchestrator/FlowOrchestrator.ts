/**
 * Flow 编排器
 * 负责加载 Flow 定义、解析进度、动态加载子模块
 */

import type {
  FlowDefinition,
  FlowProgress,
  FlowStep,
  SubmoduleDefinition,
  CompositePageNum,
} from '@/shared/types/flow';
import { parseCompositePageNum, encodeCompositePageNum } from '@/shared/types/flow';
import { getFlowKey } from '@/shared/services/storage/storageKeys';
import { apiClient } from '@/shared/services/api/apiClient';
import { endpoints } from '@/shared/services/api/endpoints';
import { submoduleRegistry } from '@/submodules/registry';

type DefinitionBundle = {
  definition: FlowDefinition;
  progress?: FlowProgress | null;
};

type ResolveResult = {
  stepIndex: number;
  step: FlowStep | null;
  submoduleId: string | null;
  modulePageNum: string | null;
  initialPageId: string | null;
  submoduleDefinition: SubmoduleDefinition | null;
};

/**
 * Flow 编排器类
 */
export class FlowOrchestrator {
  private flowId: string;
  private definition: FlowDefinition | null = null;
  private progress: FlowProgress | null = null;
  private hasLoaded = false;
  private disposed = false;

  constructor(flowId: string) {
    this.flowId = flowId;
  }

  /**
   * 加载 Flow 定义和进度（优先远端，失败回退本地缓存）
   */
  async load(): Promise<{ definition: FlowDefinition; progress: FlowProgress }> {
    this.ensureActive();

    if (this.hasLoaded && this.definition && this.progress) {
      this.log('Reusing in-memory data');
      return { definition: this.definition, progress: this.progress };
    }

    this.log('Loading flow data');

    const cachedDefinition = this.definition ?? this.loadDefinitionFromCache();
    const cachedProgress = this.progress ?? this.loadProgressFromCache();

    let definition = cachedDefinition;
    let progress = cachedProgress;

    try {
      const bundle = await this.fetchDefinitionBundle();
      definition = bundle.definition;
      this.saveDefinitionToCache(bundle.definition);

      if (bundle.progress) {
        progress = bundle.progress;
      }
    } catch (error) {
      this.warn('Failed to load definition from backend, fallback to cache', error);
    }

    if (!progress) {
      try {
        const remoteProgress = await this.fetchProgressBundle();
        if (remoteProgress) {
          progress = remoteProgress;
        }
      } catch (error) {
        this.warn('Failed to load progress from backend', error);
      }
    }

    if (!definition) {
      throw new Error(`[FlowOrchestrator] Flow definition not found for ${this.flowId}`);
    }

    if (!Array.isArray(definition.steps) || definition.steps.length === 0) {
      throw new Error('Flow definition has no steps');
    }

    const normalizedProgress = this.normalizeProgress(progress, definition);
    this.definition = definition;
    this.progress = normalizedProgress;
    this.hasLoaded = true;
    this.persistProgress(normalizedProgress);

    this.log('Flow loaded', {
      stepIndex: normalizedProgress.stepIndex,
      modulePageNum: normalizedProgress.modulePageNum,
    });

    return { definition, progress: normalizedProgress };
  }

  /**
   * 解析进度，定位当前步骤和子模块页码
   */
  resolve(definition: FlowDefinition, progress: FlowProgress): ResolveResult {
    this.ensureActive();

    const totalSteps = Array.isArray(definition?.steps) ? definition.steps.length : 0;
    let stepIndex = Number.isFinite(progress?.stepIndex) ? Number(progress.stepIndex) : 0;

    if (stepIndex < 0) {
      stepIndex = 0;
    }
    if (totalSteps > 0 && stepIndex >= totalSteps) {
      stepIndex = totalSteps - 1;
    }

    const step = totalSteps > 0 ? definition.steps[stepIndex] : null;
    const submoduleId = step?.submoduleId ?? null;
    const submoduleDefinition = submoduleId ? submoduleRegistry.get(submoduleId) : null;

    if (!submoduleDefinition) {
      this.error('Submodule definition not found', { submoduleId, stepIndex });
    }

    const modulePageNum =
      typeof progress?.modulePageNum === 'string' && progress.modulePageNum.trim()
        ? progress.modulePageNum
        : null;
    const initialPageId = submoduleDefinition
      ? submoduleDefinition.getInitialPage(modulePageNum ?? '1')
      : null;

    this.log('Resolve result', {
      stepIndex,
      submoduleId,
      modulePageNum,
      initialPageId,
    });

    return {
      stepIndex,
      step,
      submoduleId,
      modulePageNum,
      initialPageId,
      submoduleDefinition,
    };
  }

  /**
   * 更新进度并写入缓存
   */
  updateProgress(stepIndex: number, modulePageNum?: string | null): void {
    this.ensureActive();

    const normalizedIndex = Number.isFinite(stepIndex) ? Number(stepIndex) : 0;
    const normalizedPageNum =
      modulePageNum === undefined
        ? this.progress?.modulePageNum ?? null
        : modulePageNum === null
          ? null
          : String(modulePageNum);

    const nextProgress: FlowProgress = {
      ...(this.progress || { stepIndex: 0, modulePageNum: null }),
      stepIndex: normalizedIndex,
      modulePageNum: normalizedPageNum,
      lastUpdated: new Date().toISOString(),
    };

    this.progress = nextProgress;
    this.persistProgress(nextProgress);
    this.log('Progress updated', nextProgress);
  }

  /**
   * 进入下一步
   */
  nextStep(): boolean {
    this.ensureActive();

    if (!this.definition) {
      this.warn('Cannot advance without definition loaded');
      return false;
    }

    const currentIndex = this.progress?.stepIndex ?? 0;
    const nextIndex = currentIndex + 1;

    if (nextIndex >= this.definition.steps.length) {
      this.log('Flow completed, marking status');
      this.markCompleted();
      return false;
    }

    this.updateProgress(nextIndex, null);
    return true;
  }

  /**
   * 标记为已完成
   */
  markCompleted(): void {
    localStorage.setItem(this.getCacheKey('completed'), 'true');
    if (this.progress) {
      this.progress.completed = true;
      this.persistProgress(this.progress);
    }
  }

  /**
   * 是否已完成
   */
  isCompleted(): boolean {
    return localStorage.getItem(this.getCacheKey('completed')) === 'true';
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    ['definition', 'stepIndex', 'modulePageNum', 'completed'].forEach((key) => {
      localStorage.removeItem(this.getCacheKey(key));
    });
    this.log('Cache cleared');
  }

  /**
   * 销毁实例
   */
  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.definition = null;
    this.progress = null;
    this.hasLoaded = false;
    this.log('Disposed orchestrator instance');
  }

  /**
   * destroy 别名（兼容调用方）
   */
  destroy(): void {
    this.dispose();
  }

  /**
   * 获取当前 Flow ID
   */
  getFlowId(): string {
    return this.flowId;
  }

  /**
   * 获取当前定义
   */
  getDefinition(): FlowDefinition | null {
    return this.definition;
  }

  /**
   * 获取当前进度
   */
  getProgress(): FlowProgress | null {
    return this.progress;
  }

  /**
   * 加载 definition 接口（可能自带 progress）
   */
  private async fetchDefinitionBundle(): Promise<DefinitionBundle> {
    const response: any = await apiClient.get(endpoints.flow.getDefinition(this.flowId));
    this.log('Definition response:', response);
    const payload = this.extractApiPayload<any>(response);

    if (payload && typeof payload === 'object' && 'definition' in payload) {
      const definition = (payload.definition ?? null) as FlowDefinition | null;
      if (!definition) {
        throw new Error('Invalid API response format');
      }
      return {
        definition,
        progress: (payload.progress ?? null) as FlowProgress | null,
      };
    }

    return {
      definition: payload as FlowDefinition,
      progress: null,
    };
  }

  /**
   * 加载远端进度，失败返回 null
   */
  private async fetchProgressBundle(): Promise<FlowProgress | null> {
    const progressEndpoint = this.getProgressEndpoint();
    const response: any = await apiClient.get(progressEndpoint);
    this.log('Progress response:', response);

    if (response === null || response === undefined || response === '') {
      return null;
    }

    const payload = this.extractApiPayload<any>(response, true);

    if (payload === null || payload === undefined) {
      return null;
    }

    if (typeof payload === 'object' && 'progress' in payload) {
      return (payload.progress ?? null) as FlowProgress | null;
    }

    return payload as FlowProgress;
  }

  private getProgressEndpoint(): string {
    if (typeof endpoints.flow?.updateProgress === 'function') {
      return endpoints.flow.updateProgress(this.flowId);
    }
    return `/api/flows/${this.flowId}/progress`;
  }

  private extractApiPayload<T>(response: any, allowNull = false): T {
    if (response === null || response === undefined) {
      if (allowNull) {
        return response as T;
      }
      throw new Error('Invalid API response format');
    }

    if (typeof response === 'object') {
      if ('obj' in response) {
        const payload = (response as any).obj;
        if (payload === undefined) {
          throw new Error('Invalid API response format');
        }
        if (payload === null && !allowNull) {
          throw new Error('Invalid API response format');
        }
        return payload as T;
      }

      if ('code' in response) {
        throw new Error('Invalid API response format');
      }
    }

    return response as T;
  }

  /**
   * 从缓存加载定义
   */
  private loadDefinitionFromCache(): FlowDefinition | null {
    try {
      const raw = localStorage.getItem(this.getCacheKey('definition'));
      return raw ? (JSON.parse(raw) as FlowDefinition) : null;
    } catch (error) {
      this.warn('Failed to parse cached definition', error);
      return null;
    }
  }

  /**
   * 保存定义到缓存
   */
  private saveDefinitionToCache(definition: FlowDefinition): void {
    try {
      localStorage.setItem(this.getCacheKey('definition'), JSON.stringify(definition));
    } catch (error) {
      this.warn('Failed to cache definition', error);
    }
  }

  /**
   * 从缓存加载进度
   */
  private loadProgressFromCache(): FlowProgress | null {
    try {
      const stepIndexRaw = localStorage.getItem(this.getCacheKey('stepIndex'));
      const modulePageRaw = localStorage.getItem(this.getCacheKey('modulePageNum'));

      if (stepIndexRaw === null && modulePageRaw === null) {
        return null;
      }

      const parsedStep = stepIndexRaw !== null ? parseInt(stepIndexRaw, 10) : 0;
      const normalizedStep = Number.isFinite(parsedStep) ? parsedStep : 0;
      const normalizedPage = modulePageRaw && modulePageRaw.trim() ? modulePageRaw : null;

      return {
        stepIndex: normalizedStep,
        modulePageNum: normalizedPage,
      };
    } catch (error) {
      this.warn('Failed to parse cached progress', error);
      return null;
    }
  }

  /**
   * 持久化进度到本地缓存
   */
  private persistProgress(progress: FlowProgress): void {
    try {
      localStorage.setItem(this.getCacheKey('stepIndex'), String(progress.stepIndex));

      const modulePageKey = this.getCacheKey('modulePageNum');
      if (progress.modulePageNum === null || progress.modulePageNum === undefined) {
        localStorage.removeItem(modulePageKey);
      } else {
        localStorage.setItem(modulePageKey, String(progress.modulePageNum));
      }
    } catch (error) {
      this.warn('Failed to persist progress', error);
    }
  }

  /**
   * 获取缓存键名
   */
  private getCacheKey(key: string): string {
    return getFlowKey(this.flowId, key);
  }

  /**
   * 归一化进度（包含复合页码解析与边界处理）
   */
  private normalizeProgress(
    progress: FlowProgress | null | undefined,
    definition: FlowDefinition
  ): FlowProgress {
    const normalized: FlowProgress = {
      stepIndex: 0,
      modulePageNum: null,
      ...progress,
    };

    let stepIndex = Number.isFinite(normalized.stepIndex) ? normalized.stepIndex : 0;
    let modulePageNum =
      typeof normalized.modulePageNum === 'string'
        ? normalized.modulePageNum.trim() || null
        : null;

    if (modulePageNum) {
      const composite = parseCompositePageNum(modulePageNum);
      if (composite) {
        stepIndex = composite.stepIndex;
        modulePageNum = String(composite.subPageNum);
      }
    }

    if (stepIndex < 0) {
      stepIndex = 0;
    }

    const maxStepIndex = Math.max(0, (definition.steps?.length || 1) - 1);
    if (stepIndex > maxStepIndex) {
      stepIndex = maxStepIndex;
    }

    return {
      ...normalized,
      stepIndex,
      modulePageNum,
    };
  }

  /**
   * 确保实例未被销毁
   */
  private ensureActive(): void {
    if (this.disposed) {
      throw new Error('[FlowOrchestrator] Instance has been disposed');
    }
  }

  /**
   * 日志输出
   */
  private log(message: string, payload?: any): void {
    if (payload === undefined) {
      console.log('[FlowOrchestrator]', message);
    } else {
      console.log('[FlowOrchestrator]', message, payload);
    }
  }

  private warn(message: string, payload?: any): void {
    if (payload === undefined) {
      console.warn('[FlowOrchestrator]', message);
    } else {
      console.warn('[FlowOrchestrator]', message, payload);
    }
  }

  private error(message: string, payload?: any): void {
    if (payload === undefined) {
      console.error('[FlowOrchestrator]', message);
    } else {
      console.error('[FlowOrchestrator]', message, payload);
    }
  }
}

/**
 * 从复合页码解析 Flow 进度
 * 格式：M<stepIndex>:<subPageNum>
 */
export function parseFlowPageNum(pageNum: string): CompositePageNum | null {
  return parseCompositePageNum(pageNum);
}

/**
 * 编码 Flow 复合页码
 */
export function encodeFlowPageNum(stepIndex: number, subPageNum: string): string {
  return encodeCompositePageNum(stepIndex, subPageNum);
}
