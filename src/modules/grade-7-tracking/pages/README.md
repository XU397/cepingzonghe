# Grade 7 Tracking Module - Pages Directory

This directory contains all page components for the 7th grade tracking assessment module.

## Completed Pages

### Phase 3 User Story 1 - Initial Pages

- **Page01_Notice.jsx** (页码 0.1) - 注意事项页面
  - 4条注意事项展示
  - 复选框确认
  - 40秒倒计时
  - 样式: Page01_Notice.module.css

- **Page02_Intro.jsx** (页码 1) - 情景引入页面
  - 背景故事介绍
  - 蜂蜜图片展示
  - 样式: ExplorationPages.module.css (共享)

- **Page03_Question.jsx** (页码 2) - 提出问题页面
  - 对话气泡展示
  - 文本输入框
  - 样式: ExplorationPages.module.css (共享)

- **Page04_Resource.jsx** (页码 3) - 资料阅读页面
  - 5个资料按钮
  - 模态弹窗展示资料
  - 6个复选框选项
  - 样式: ExplorationPages.module.css (共享)

- **Page13_Summary.jsx** (页码 13) - 任务总结页面
  - 总结性文字展示
  - "继续"按钮
  - 样式: Page13_Summary.module.css

## Remaining Pages (To Be Created)

### Exploration Preparation Phase (第4-7页)

- **Page05_Hypothesis.jsx** (页码 4) - 明确假设
- **Page06_Design.jsx** (页码 5) - 设计实验方案
- **Page07_Evaluation.jsx** (页码 6) - 评估实验方案
- **Page08_Transition.jsx** (页码 7) - 开启探索之旅

### Experiment Phase (第8-12页)

- **Page09_Experiment.jsx** (页码 8) - 模拟实验
- **Page10_Analysis1.jsx** (页码 9) - 实验分析1
- **Page11_Analysis2.jsx** (页码 10) - 实验分析2
- **Page12_Analysis3.jsx** (页码 11) - 实验分析3
- **Page13_Solution.jsx** (页码 12) - 方案选择

### Transition Pages

- **Page00_2_QuestionnaireIntro.jsx** (页码 0.2) - 问卷说明

### Questionnaire Phase (第14-21页)

- **Questionnaire_01.jsx** (页码 14) - 问卷第1页 (9题)
- **Questionnaire_02.jsx** (页码 15) - 问卷第2页 (9题)
- **Questionnaire_03.jsx** (页码 16) - 问卷第3页 (10题)
- **Questionnaire_04.jsx** (页码 17) - 问卷第4页 (5题)
- **Questionnaire_05.jsx** (页码 18) - 问卷第5页 (11题)
- **Questionnaire_06.jsx** (页码 19) - 问卷第6页 (7题)
- **Questionnaire_07.jsx** (页码 20) - 问卷第7页 (7题)
- **Questionnaire_08.jsx** (页码 21) - 问卷第8页 (3题)

### Completion Page

- **Page22_Completion.jsx** (页码 22) - 问卷已完成

## Shared Styles

- **ExplorationPages.module.css** - 探究准备页面共享样式 (第1-7页)
- **Page01_Notice.module.css** - 注意事项页面专用样式
- **Page13_Summary.module.css** - 任务总结页面专用样式

## Development Notes

### Common Patterns

All pages follow these patterns:

1. **Import Structure**:
   ```jsx
   import { useTrackingContext } from '../context/TrackingContext';
   import { useDataLogger } from '../hooks/useDataLogger';
   import PageLayout from '../components/layout/PageLayout';
   ```

2. **Page Lifecycle Logging**:
   ```jsx
   useEffect(() => {
     logOperation({
       action: 'page_enter',
       target: 'Page_XX_Name',
       value: '页面名称',
       time: new Date().toISOString()
     });

     return () => {
       logOperation({
         action: 'page_exit',
         target: 'Page_XX_Name',
         value: '页面名称',
         time: new Date().toISOString()
       });
     };
   }, [logOperation]);
   ```

3. **Data Submission**:
   ```jsx
   const markObject = {
     pageNumber: 'X',
     pageDesc: '页面描述',
     operationList: currentPageOperations.map(op => ({...})),
     answerList: [...],
     beginTime: formatDateTime(pageStartTime),
     endTime: formatDateTime(pageEndTime),
     imgList: []
   };

   const success = await submitPageData(markObject);
   if (success) {
     clearOperations();
     await navigateToPage(nextPageNum);
   }
   ```

4. **Navigation Controls**:
   - Use `canGoNext` flag for validation
   - Disable button when validation fails
   - Log all user interactions

### Asset Requirements

Images needed (in `/public/assets/grade-7-tracking/`):
- `honey-jar.jpg` - 蜂蜜罐图片 (Page 1)
- `weather-chengdu.jpg` - 成都天气图 (Page 4)
- `observation-method.jpg` - 观察法图片 (Page 6)
- `falling-ball-method.jpg` - 落球法图片 (Page 6)
- `flow-rate-method.jpg` - 流速法图片 (Page 6)
- `xiaoming-friends.jpg` - 小明和小伙伴图片 (Page 7)

### Data Files Needed

- Resource content for Page 3 (已在代码中定义)
- Questionnaire questions data (需要创建JSON文件)
