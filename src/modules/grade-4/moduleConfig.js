/**
 * 四年级火车购票测评模块配置
 * 配置模块的基本信息、时间设置和页面映射
 */

export const moduleConfig = {
  moduleId: 'grade-4',
  displayName: '四年级火车购票测评',
  url: '/four-grade',
  version: '1.0.0',
  
  // 时间配置（40分钟主任务）
  timers: {
    mainTask: 40 * 60 * 1000,  // 40分钟
    questionnaire: 10 * 60 * 1000  // 10分钟问卷
  },
  
  // 页面配置
  pages: {
    'notices': { 
      number: 1, 
      desc: '注意事项', 
      component: '00-NoticesPage',
      route: '/notices'
    },
    'scenario-intro': {
      number: 2,
      desc: '情景介绍',
      component: '01-ScenarioIntroPage',
      route: '/scenario-intro'
    },
    'problem-identification': {
      number: 3,
      desc: '问题识别',
      component: '02-ProblemIdentificationPage', 
      route: '/problem-identification'
    },
    'factor-analysis': {
      number: 4,
      desc: '因素分析',
      component: '03-TrainTicketFactorsPage',
      route: '/factor-analysis'
    },
    'route-analysis': {
      number: 5,
      desc: '交互式地图与路线计算',
      component: '04-RouteAnalysisPage',
      route: '/route-analysis'
    },
    'station-recommendation': {
      number: 6,
      desc: '站点推荐',
      component: '05-StationRecommendationPage',
      route: '/station-recommendation'
    },
    'timeline-planning-tutorial': {
      number: 7,
      desc: '拖拽式时间规划教程',
      component: '06-TimelinePlanningPage',
      route: '/timeline-planning-tutorial'
    },
    'user-solution-design': {
      number: 8,
      desc: '用户方案设计',
      component: '07-UserSolutionDesignPage',
      route: '/user-solution-design'
    },
    'plan-optimization': {
      number: 9,
      desc: '方案评估与优化',
      component: '08-PlanOptimizationPage',
      route: '/plan-optimization'
    },
    'ticket-filter': {
      number: 10,
      desc: '车票筛选',
      component: '09-TicketFilterPage',
      route: '/ticket-filter'
    },
    'ticket-pricing': {
      number: 11,
      desc: '最终推荐与计价',
      component: '10-TicketPricingPage',
      route: '/ticket-pricing'
    },
    'task-completion': {
      number: 12,
      desc: '测评完成',
      component: '12-TaskCompletionPage',
      route: '/task-completion'
    },
    // 后续页面将在其他故事中添加
  },

  // 模块特定设置
  settings: {
    // 注意事项页面的强制阅读时间
    noticesReadingTime: 40, // 40秒
    
    // 是否启用操作记录
    enableDataLogging: true,
    
    // 全局计时器警告阈值（秒）
    warningThresholdSeconds: 5 * 60,
    // 全局计时器严重阈值（秒）
    criticalThresholdSeconds: 60,
    
    // 默认起始页面
    defaultPage: 'notices'
  }
};

export default moduleConfig;
