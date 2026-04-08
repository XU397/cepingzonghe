# 设计文档：操作管理 Utility 架构

## 1. 架构概览

### 1.1 当前架构问题

```
当前：分散实现
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ g8-drone-imaging │  │ g8-mikania-exp  │  │ g8-pv-sand-exp  │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ 自己管序号       │  │ reducer管序号    │  │ 自己管序号       │
│ 自己注入flow_ctx │  │ reducer注入ctx   │  │ 自己注入flow_ctx │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         ↓                    ↓                    ↓
      实现不一致           实现不一致           实现不一致
```

### 1.2 目标架构

```
目标：统一 utility + 灵活接入
┌─────────────────────────────────────────────────────────┐
│                  共享 Utility 层                         │
├─────────────────┬─────────────────┬─────────────────────┤
│ createOperation │ injectFlow      │ resetPageState      │
│ Sequence        │ Context         │                     │
└────────┬────────┴────────┬────────┴──────────┬──────────┘
         │                 │                   │
         ▼                 ▼                   ▼
┌─────────────────────────────────────────────────────────┐
│              useOperationLogger (全托管)                 │
│  内部使用上述 utility，对外暴露简单 API                    │
└─────────────────────────────────────────────────────────┘
         │                                     │
    新模块使用                             老模块可选
         │                                     │
         ▼                                     ▼
┌─────────────────┐                 ┌─────────────────────┐
│  新子模块        │                 │  老子模块            │
│  (全托管模式)    │                 │  (灵活组合模式)      │
└─────────────────┘                 └─────────────────────┘
```

## 2. 详细设计

### 2.1 OperationSequence 接口

```typescript
// types.ts
export interface OperationSequence {
  /** 获取下一个序号并自增（首次调用返回 1） */
  next(): number;
  /** 重置序号到初始状态 */
  reset(): void;
  /** 获取当前序号（不自增） */
  current(): number;
}

// operationSequence.ts
export function createOperationSequence(): OperationSequence {
  let seq = 0;

  return {
    next: () => ++seq,
    reset: () => { seq = 0; },
    current: () => seq,
  };
}
```

**设计决策**：
- 使用闭包而非 class，保持轻量
- 固定从 0 开始，`next()` 返回 1（符合 code 从 1 开始的规范）
- **不提供 initialValue 参数**：断点续做恢复的是页面位置（modulePageNum），不是操作序号（code）
- 纯 JavaScript 实现，无 React 依赖

### 2.2 FlowContext 注入器

```typescript
// flowContextInjector.ts

/** FlowContext 对象结构（统一定义，与 data-format/spec.md 保持一致） */
export interface FlowContextPayload {
  /** Flow 唯一标识（必填） */
  flowId: string;
  /** 当前步骤索引，从 0 开始（必填） */
  stepIndex: number;
  /** 子模块标识（必填） */
  submoduleId: string;
  /** 子模块显示名称（可选，规范推荐填写，为兼容旧代码设为可选） */
  moduleName?: string;
  /** 当前页面 ID（可选） */
  pageId?: string;
}

export interface InjectFlowContextOptions {
  /** 自定义时间戳（测试用） */
  timestamp?: Date;
  /** 允许缺失 page_enter（仅用于单元测试，生产代码禁止使用） */
  allowMissingPageEnter?: boolean;
}

export class MissingPageEnterError extends Error {
  constructor() {
    super('injectFlowContext: operations 中缺少 page_enter 事件。Flow 场景下必须先记录 page_enter。');
    this.name = 'MissingPageEnterError';
  }
}

export function injectFlowContext(
  operations: Operation[],
  flowContext: FlowContextPayload,
  sequence: OperationSequence,
  options: InjectFlowContextOptions = {}
): Operation[] {
  const { timestamp = new Date(), allowMissingPageEnter = false } = options;

  // flow_context 事件格式（统一规范）
  const flowContextOp: Operation = {
    code: sequence.next(),
    targetElement: 'flow_context',  // 固定值，属于保留元素
    eventType: 'flow_context',      // 固定值
    value: JSON.stringify(flowContext),  // JSON 字符串
    time: formatTimestamp(timestamp),    // 格式：YYYY-MM-DD HH:mm:ss
  };

  // 查找 page_enter 事件
  const enterIndex = operations.findIndex(op => op.eventType === 'page_enter');

  if (enterIndex === -1) {
    // 无 page_enter：Flow 场景下报错，测试场景下可选跳过
    if (!allowMissingPageEnter) {
      throw new MissingPageEnterError();
    }
    // 测试模式：插入开头（仅用于单元测试）
    return [flowContextOp, ...operations];
  }

  // 正常路径：插入到 page_enter 之后
  const result = [...operations];
  result.splice(enterIndex + 1, 0, flowContextOp);
  return result;
}

export function shouldInjectFlowContext(
  operations: Operation[],
  flowContext: FlowContextPayload | null | undefined
): boolean {
  if (!flowContext) return false;
  return !operations.some(op => op.eventType === 'flow_context');
}
```

**设计决策**：
- **唯一插入位置**：`page_enter` 之后（符合规范要求 `page_enter` → `flow_context` → 其他）
- **不提供 `position` 参数**：移除 `start`/`end` 等选项，避免破坏事件顺序规范
- **强制依赖 page_enter**：缺失 `page_enter` 时抛出 `MissingPageEnterError`，而非静默处理
- **测试逃生舱**：`allowMissingPageEnter: true` 仅供单元测试使用，生产代码禁止
- 提供 `shouldInjectFlowContext` 检查函数，避免重复注入
- 纯函数设计，易于测试
- **统一 flow_context 格式**：
  - `targetElement: 'flow_context'`（固定值，属于保留元素，不加前缀）
  - `value: JSON.stringify(flowContext)`（字符串格式，与其他 operation 一致）
  - `time: 'YYYY-MM-DD HH:mm:ss'`（使用 formatTimestamp 函数）
- 提交层 SHALL 检测已存在的 flow_context 事件，避免重复注入

### 2.3 页面切换重置器

```typescript
// pageStateReset.ts
export interface PageStateResetOptions {
  /** 是否重置 flowContextInjected 标记 */
  resetFlowContextFlag?: boolean;
}

export function createPageStateResetter(
  sequence: OperationSequence,
  setFlowContextInjected?: (value: boolean) => void
) {
  return function resetPageState(options: PageStateResetOptions = {}) {
    const { resetFlowContextFlag = true } = options;

    // 重置序号
    sequence.reset();

    // 重置 flow_context 注入标记
    if (resetFlowContextFlag && setFlowContextInjected) {
      setFlowContextInjected(false);
    }
  };
}
```

### 2.4 useOperationLogger 重构

```typescript
// useOperationLogger.ts (重构后)
export function useOperationLogger(options: OperationLoggerOptions): OperationLoggerResult {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [flowContextInjected, setFlowContextInjected] = useState(false);

  // 使用新的 utility
  const sequenceRef = useRef(createOperationSequence());

  const resetPageState = useMemo(
    () => createPageStateResetter(sequenceRef.current, setFlowContextInjected),
    []
  );

  const logOperation = useCallback((params: LogOperationParams) => {
    const operation: Operation = {
      code: sequenceRef.current.next(),
      targetElement: prefixTargetElement(params.targetElement, options.targetPrefix),
      eventType: params.eventType,
      value: normalizeValue(params.value),
      time: params.time || formatTimestamp(new Date()),
    };

    setOperations(prev => {
      let nextOperations = [...prev, operation];

      // 自动注入 flow_context
      if (
        params.eventType === 'page_enter' &&
        shouldInjectFlowContext(nextOperations, options.flowContext) &&
        !flowContextInjected
      ) {
        nextOperations = injectFlowContext(
          nextOperations,
          options.flowContext!,
          sequenceRef.current
        );
        setFlowContextInjected(true);
      }

      return nextOperations;
    });
  }, [options.flowContext, options.targetPrefix, flowContextInjected]);

  const clearOperations = useCallback(() => {
    setOperations([]);
    resetPageState();
  }, [resetPageState]);

  return {
    operations,
    logOperation,
    clearOperations,
    currentCode: () => sequenceRef.current.current(),
  };
}
```

## 3. 接入模式指南

### 3.1 模式 A：全托管（推荐新模块）

```typescript
// 子模块只需使用 useOperationLogger
const { operations, logOperation, clearOperations } = useOperationLogger({
  targetPrefix,
  flowContext,
});

// 记录操作
logOperation({
  targetElement: '下一步按钮',
  eventType: 'click',
  value: '',
});

// 页面切换时
useEffect(() => {
  clearOperations();
}, [currentPageId]);
```

### 3.2 模式 B：灵活组合（兼容老模块）

```typescript
// 子模块使用独立 utility
import {
  createOperationSequence,
  injectFlowContext,
  shouldInjectFlowContext,
} from '@shared/services/submission/submoduleAdapter';

// 在 reducer 中使用
const initialState = {
  operations: [],
  sequence: createOperationSequence(),
  flowContextInjected: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_PAGE':
      state.sequence.reset();  // 重置序号
      return {
        ...state,
        currentPageId: action.payload,
        operations: [],
        flowContextInjected: false,
      };

    case 'LOG_OPERATION': {
      const operation = {
        ...action.payload,
        code: state.sequence.next(),
      };
      let operations = [...state.operations, operation];
      let flowContextInjected = state.flowContextInjected;

      // 检查是否需要注入 flow_context
      if (
        operation.eventType === 'page_enter' &&
        shouldInjectFlowContext(operations, flowContext) &&
        !flowContextInjected
      ) {
        operations = injectFlowContext(operations, flowContext, state.sequence);
        flowContextInjected = true;
      }

      return { ...state, operations, flowContextInjected };
    }
  }
}
```

## 4. 测试策略

### 4.1 单元测试

```typescript
describe('createOperationSequence', () => {
  it('should start from 1', () => {
    const seq = createOperationSequence();
    expect(seq.next()).toBe(1);
    expect(seq.next()).toBe(2);
  });

  it('should reset to initial value', () => {
    const seq = createOperationSequence();
    seq.next(); // 1
    seq.next(); // 2
    seq.reset();
    expect(seq.next()).toBe(1);
  });
});

describe('injectFlowContext', () => {
  it('should inject after page_enter', () => {
    const seq = createOperationSequence();
    const operations = [
      { code: 1, eventType: 'page_enter', ... },
      { code: 2, eventType: 'click', ... },
    ];

    const result = injectFlowContext(operations, flowContext, seq);

    expect(result[0].eventType).toBe('page_enter');
    expect(result[1].eventType).toBe('flow_context');
    expect(result[2].eventType).toBe('click');
  });
});
```

### 4.2 集成测试

- 验证 `useOperationLogger` 使用新 utility 后行为不变
- 验证现有子模块快照测试通过

## 5. 迁移路径

### 阶段 1：实现 utility（本变更）
- 实现 `createOperationSequence`
- 实现 `injectFlowContext`
- 重构 `useOperationLogger` 使用新 utility
- 更新文档

### 阶段 2：子模块迁移（后续可选）
- g8-drone-imaging：可选迁移到全托管模式
- g8-mikania：保持 reducer 模式，使用灵活组合 utility
- g8-pv-sand：可选迁移到全托管模式
- g7-experiment：保持包装器模式
