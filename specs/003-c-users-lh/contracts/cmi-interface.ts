/**
 * CMI Interface Contract for 光伏治沙交互实验子模块
 * 
 * 定义子模块与Flow系统集成的标准接口合约
 */

export interface UserContext {
  user: {
    examNo: string;           // 考试编号
    batchCode: string;        // 批次代码  
    studentName?: string;     // 学生姓名(可选)
  };
  session?: {
    isAuthenticated: boolean;
    sessionId?: string;
  };
}

export interface FlowContext {
  flowId: string;             // Flow流程ID
  submoduleId: string;        // 子模块ID
  stepIndex: number;          // 当前步骤索引(1-5)
  updateModuleProgress?: (modulePageNum: number) => void;  // 进度更新回调
  onComplete?: () => void;    // 完成回调
  onTimeout?: () => void;     // 超时回调
}

export interface TimerOptions {
  task?: number;              // 任务计时器时长(秒)
  questionnaire?: number;     // 问卷计时器时长(秒)
}

export interface SubmoduleOptions {
  timers?: TimerOptions;      // 计时器配置覆盖
  // 未来扩展字段:
  // experimentData?: typeof WIND_SPEED_DATA;
  // enableTutorial?: boolean;
  // variant?: string;
}

export interface SubmoduleComponentProps {
  userContext: UserContext;
  initialPageId: string;
  options?: SubmoduleOptions;
  // 注意: flowContext 通过 userContext 或其他方式传递，当前接口未直接暴露
}

export type NavigationMode = 'experiment' | 'questionnaire' | 'hidden';

export interface SubmoduleDefinition {
  submoduleId: string;        // 唯一标识: "g8-pv-sand-experiment"
  displayName: string;        // 显示名称: "8年级光伏治沙-交互实验"
  version: string;           // 版本号: "1.0.0"
  
  // React组件入口
  Component: React.ComponentType<SubmoduleComponentProps>;
  
  // CMI核心方法
  getInitialPage(subPageNum: string): string;           // 页面恢复
  getTotalSteps(): number;                              // 总步数(返回5)
  getNavigationMode(pageId: string): NavigationMode;    // 导航模式
  getDefaultTimers(): TimerOptions;                     // 默认计时配置
  
  // 生命周期钩子(可选)
  onInitialize?(): void;
  onDestroy?(): void;
}

// 光伏治沙子模块的具体接口实现
export interface PvSandExperimentSubmodule extends SubmoduleDefinition {
  submoduleId: "g8-pv-sand-experiment";
  displayName: "8年级光伏治沙-交互实验";
  version: "1.0.0";
  
  // 页面映射规则
  getInitialPage(subPageNum: string): 
    | 'instructions_cover'    // Page 1
    | 'cover_intro'          // Page 2  
    | 'background_notice'    // Page 3
    | 'experiment_design'    // Page 4
    | 'tutorial_simulation'  // Page 5
    | 'experiment_task1'     // Page 6
    | 'experiment_task2'     // Page 7
    | 'conclusion_analysis'; // Page 8
  
  // 固定返回5(仅计算可见步数Page 4-8)
  getTotalSteps(): 5;
  
  // 导航模式映射
  getNavigationMode(pageId: string): 
    | 'hidden'      // Page 1-3
    | 'experiment'; // Page 4-8
  
  // 默认20分钟任务计时
  getDefaultTimers(): {
    task: 1200;        // 20 * 60
    questionnaire: 0;
  };
}

/**
 * 页面ID到步骤索引的映射
 */
export interface StepIndexMapping {
  'instructions_cover': null;      // Hidden页面
  'cover_intro': null;             // Hidden页面
  'background_notice': null;       // Hidden页面
  'experiment_design': 1;          // Step 1
  'tutorial_simulation': 2;        // Step 2
  'experiment_task1': 3;           // Step 3
  'experiment_task2': 4;           // Step 4
  'conclusion_analysis': 5;        // Step 5
}

/**
 * 页面编号到页面ID的映射
 */
export interface PageNumberMapping {
  1: 'instructions_cover';
  2: 'cover_intro';
  3: 'background_notice';
  4: 'experiment_design';
  5: 'tutorial_simulation';
  6: 'experiment_task1';
  7: 'experiment_task2';
  8: 'conclusion_analysis';
}

/**
 * MarkObject页码编码规则
 */
export interface MarkObjectPageNumbers {
  "H.1": "详细封面页(注意事项)";
  "H.2": "任务封面页";
  "H.3": "背景引入页";
  "1.4": "实验方案设计";
  "2.5": "操作指引试玩";
  "3.6": "实验探究-1(50cm高度对比)";
  "4.7": "实验探究-2(趋势分析)";
  "5.8": "结论分析综合问答";
}