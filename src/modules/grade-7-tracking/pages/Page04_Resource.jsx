/**
 * Page04_Resource - 收集资料与提出猜想页面 (页码 3)
 *
 * 功能:
 * - 显示平板电脑信息中心，包含5个可点击按钮
 * - 点击按钮弹出对应资料的模态窗口
 * - 右侧显示6个复选框选项，至少选择一个后可点击"下一页"
 */

import { useEffect, useCallback, useState } from 'react';
import { useTrackingContext } from '../context/TrackingContext';
import { useDataLogger } from '../hooks/useDataLogger';
import PageLayout from '../components/layout/PageLayout';
import styles from '../styles/ExplorationPages.module.css';

// 资料内容数据
const RESOURCE_DATA = {
  brewing: {
    title: '蜂蜜酿造流程',
    content: `蜜蜂采集花蜜后，会在体内将花蜜中的蔗糖分解成葡萄糖和果糖。回到蜂巢后，工蜂将花蜜吐入巢房，并通过反复扇风降低水分含量。

当蜂蜜中的含水量降至约18%-20%时，工蜂就会用蜂蜡将巢房封盖，标志着蜂蜜成熟。成熟的蜂蜜质地浓稠，不易变质。

未完全成熟的蜂蜜含水量较高，黏度较低，容易发酵变质。`
  },
  viscosity: {
    title: '黏度原理揭秘',
    content: `黏度是液体流动时分子间摩擦力的体现。黏度越大，液体流动越困难。

温度是影响液体黏度的重要因素：
- 温度升高时，分子运动加剧，分子间作用力减弱，黏度降低
- 温度降低时，分子运动减缓，分子间作用力增强，黏度升高

对于蜂蜜这样的高糖溶液，温度变化对黏度的影响尤其显著。同时，蜂蜜中的含水量也会影响其黏度——含水量越高，黏度越低。`
  },
  qa: {
    title: '蜂蜜知识问答',
    content: `Q: 为什么冬天蜂蜜会结晶？
A: 蜂蜜中的葡萄糖在低温下容易析出形成结晶核，导致蜂蜜结晶。这是自然现象，不影响蜂蜜品质。

Q: 蜂蜜可以加热吗？
A: 可以适当加热，但温度不宜超过60℃，否则会破坏蜂蜜中的活性酶和营养成分。

Q: 如何判断蜂蜜是否变质？
A: 变质的蜂蜜会产生酸味或酒精味，表面出现大量气泡，质地变稀。`
  },
  storage: {
    title: '蜂蜜储存说明',
    content: `正确的储存方法：
1. 密封保存：避免吸收空气中的水分
2. 避光储存：防止光照破坏营养成分
3. 常温保存：理想温度为10-20℃
4. 使用干燥勺子：避免带入水分和细菌

储存不当的影响：
- 吸收水分后含水量升高，黏度下降
- 高温环境下营养成分流失
- 潮湿环境易导致发酵变质`
  },
  adulteration: {
    title: '掺假蜂蜜探析',
    content: `常见的蜂蜜掺假方式：
1. 掺入糖浆：降低成本，但营养价值大幅降低
2. 掺入水分：增加重量，但易变质
3. 喂糖蜂蜜：蜜蜂被喂食糖浆产出的"蜂蜜"

鉴别方法：
- 观察结晶：天然蜂蜜结晶细腻，掺假蜂蜜结晶粗糙
- 滴纸测试：天然蜂蜜滴在纸上不易渗透
- 加水摇晃：天然蜂蜜会产生丰富泡沫且持久不消`
  }
};

// 选项数据
const OPTIONS = [
  { id: 'temperature', label: '环境温度' },
  { id: 'humidity', label: '环境湿度' },
  { id: 'stirring', label: '人为搅拌' },
  { id: 'fermentation', label: '微生物发酵' },
  { id: 'pourSpeed', label: '倾倒速度' },
  { id: 'impurities', label: '掺入杂质' }
];

const Page04_Resource = () => {
  const {
    logOperation,
    clearOperations,
    currentPageOperations,
    navigateToPage
  } = useTrackingContext();

  const { submitPageData } = useDataLogger();
  const [pageStartTime] = useState(() => new Date());
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [currentModal, setCurrentModal] = useState(null);
  const [viewedResources, setViewedResources] = useState([]);

  // 记录页面进入/退出
  useEffect(() => {
    logOperation({
      action: 'page_enter',
      target: 'Page_03_Resource',
      value: '资料阅读',
      time: new Date().toISOString()
    });

    return () => {
      logOperation({
        action: 'page_exit',
        target: 'Page_03_Resource',
        value: '资料阅读',
        time: new Date().toISOString()
      });
    };
  }, [logOperation]);

  // 打开资料模态窗口
  const handleOpenResource = useCallback((resourceKey) => {
    setCurrentModal(resourceKey);

    if (!viewedResources.includes(resourceKey)) {
      setViewedResources([...viewedResources, resourceKey]);
    }

    logOperation({
      action: 'resource_view',
      target: `resource_${resourceKey}`,
      value: RESOURCE_DATA[resourceKey].title,
      time: new Date().toISOString()
    });
  }, [viewedResources, logOperation]);

  // 关闭模态窗口
  const handleCloseModal = useCallback(() => {
    if (currentModal) {
      logOperation({
        action: 'modal_close',
        target: `resource_${currentModal}`,
        value: '关闭资料窗口',
        time: new Date().toISOString()
      });
    }
    setCurrentModal(null);
  }, [currentModal, logOperation]);

  // 处理复选框变化
  const handleCheckboxChange = useCallback((optionId) => {
    const newSelected = selectedOptions.includes(optionId)
      ? selectedOptions.filter(id => id !== optionId)
      : [...selectedOptions, optionId];

    setSelectedOptions(newSelected);

    logOperation({
      action: 'checkbox_toggle',
      target: `option_${optionId}`,
      value: newSelected.includes(optionId) ? '选中' : '取消选中',
      time: new Date().toISOString()
    });
  }, [selectedOptions, logOperation]);

  // 处理"下一页"点击
  const handleNextClick = useCallback(async () => {
    if (selectedOptions.length === 0) {
      alert('请至少选择一个影响因素');
      return;
    }

    logOperation({
      action: 'button_click',
      target: 'next_page_button',
      value: '下一页',
      time: new Date().toISOString()
    });

    try {
      const pageEndTime = new Date();
      const markObject = {
        pageNumber: '3',
        pageDesc: '资料阅读',
        operationList: currentPageOperations.map(op => ({
          targetElement: op.target,
          eventType: op.action,
          value: op.value || '',
          time: op.time || new Date(op.timestamp).toISOString()
        })),
        answerList: [
          {
            targetElement: 'factors_selection',
            value: selectedOptions.join(', ')
          },
          {
            targetElement: 'viewed_resources',
            value: viewedResources.join(', ')
          }
        ],
        beginTime: formatDateTime(pageStartTime),
        endTime: formatDateTime(pageEndTime),
        imgList: []
      };

      const success = await submitPageData(markObject);
      if (success) {
        clearOperations();
        await navigateToPage(4);
      }
    } catch (error) {
      console.error('[Page04_Resource] 导航失败:', error);
      alert(error.message || '页面跳转失败，请重试');
    }
  }, [selectedOptions, viewedResources, currentPageOperations, pageStartTime, logOperation, submitPageData, clearOperations, navigateToPage]);

  const canGoNext = selectedOptions.length > 0;

  return (
    <PageLayout showNavigation={true} showTimer={true}>
      <div className={styles.pageContainer}>
        <div className={styles.splitLayout}>
          {/* 左侧: 信息中心平板 */}
          <div className={styles.leftPanel}>
            <h2 className={styles.sectionTitle}>蜂蜜变稀：资料阅读</h2>
            <div className={styles.infoCenter}>
              <button
                onClick={() => handleOpenResource('brewing')}
                className={styles.infoButton}
              >
                蜂蜜酿造流程
              </button>
              <button
                onClick={() => handleOpenResource('viscosity')}
                className={styles.infoButton}
              >
                黏度原理揭秘
              </button>
              <button
                onClick={() => handleOpenResource('qa')}
                className={styles.infoButton}
              >
                蜂蜜知识问答
              </button>
              <button
                onClick={() => handleOpenResource('storage')}
                className={styles.infoButton}
              >
                蜂蜜储存说明
              </button>
              <button
                onClick={() => handleOpenResource('adulteration')}
                className={styles.infoButton}
              >
                掺假蜂蜜探析
              </button>
            </div>
          </div>

          {/* 右侧: 任务和选项 */}
          <div className={styles.rightPanel}>
            <div className={styles.taskSection}>
              <h3 className={styles.taskTitle}>任务</h3>
              <p className={styles.taskDescription}>
                请点击并查看资料，思考蜂蜜黏度可能与以下哪些因素有关？
              </p>
              <div className={styles.checkboxGroup}>
                {OPTIONS.map(option => (
                  <div key={option.id} className={styles.checkboxOption}>
                    <input
                      type="checkbox"
                      id={option.id}
                      checked={selectedOptions.includes(option.id)}
                      onChange={() => handleCheckboxChange(option.id)}
                    />
                    <label htmlFor={option.id}>{option.label}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 下一页按钮 */}
        <div className={styles.buttonContainer}>
          <button
            onClick={handleNextClick}
            disabled={!canGoNext}
            className={`${styles.nextButton} ${canGoNext ? styles.active : styles.disabled}`}
          >
            下一页
          </button>
        </div>
      </div>

      {/* 资料模态窗口 */}
      {currentModal && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {RESOURCE_DATA[currentModal].title}
              </h3>
              <button onClick={handleCloseModal} className={styles.closeButton}>
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              {RESOURCE_DATA[currentModal].content.split('\n\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

// 辅助函数: 格式化日期时间
function formatDateTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

export default Page04_Resource;
