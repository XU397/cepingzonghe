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
import PageLayout from '../components/layout/PageLayout';
import styles from '../styles/ExplorationPages.module.css';
import { PAGE_MAPPING } from '../config.js';

// 引入资料图片
import brewingImage from '../../../assets/images/蜂蜜酿造流程.png';
import viscosityImage from '../../../assets/images/黏度原理揭秘.png';
import qaImage from '../../../assets/images/蜂蜜知识问答.png';
import storageImage from '../../../assets/images/蜂蜜存储说明.png';
import adulterationImage from '../../../assets/images/掺假蜂蜜探析.png';

// 资料内容数据
const RESOURCE_DATA = {
  brewing: {
    title: '蜂蜜酿造流程',
    content: null, // 使用图片代替文字
    image: brewingImage
  },
  viscosity: {
    title: '黏度原理揭秘',
    content: null, // 使用图片代替文字
    image: viscosityImage
  },
  qa: {
    title: '蜂蜜知识问答',
    content: null, // 使用图片代替文字
    image: qaImage
  },
  storage: {
    title: '蜂蜜储存说明',
    content: null, // 使用图片代替文字
    image: storageImage
  },
  adulteration: {
    title: '掺假蜂蜜探析',
    content: null, // 使用图片代替文字
    image: adulterationImage
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
    session,
    logOperation,
    clearOperations,
    navigateToPage,
    collectAnswer,
    buildMarkObject,
    submitPageData
  } = useTrackingContext();
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
      // 将多选结果逐项写入 answerList（每个选项各占一项）
      const factorAnswers = selectedOptions.map((id) => ({
        targetElement: `factor_${id}`,
        value: (OPTIONS.find(o => o.id === id)?.label) || id
      }));

      const pageInfo = PAGE_MAPPING[session.currentPage];
      const markObject = buildMarkObject(
        String(session.currentPage),
        pageInfo?.desc || '资料阅读',
        { answerList: factorAnswers }
      );

      const success = await submitPageData(markObject);
      if (success) {
        clearOperations();
        await navigateToPage(4);
      }
    } catch (error) {
      console.error('[Page04_Resource] 导航失败:', error);
      alert(error.message || '页面跳转失败，请重试');
    }
  }, [session, selectedOptions, viewedResources, logOperation, submitPageData, clearOperations, navigateToPage, collectAnswer, buildMarkObject]);

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
                <span className={styles.buttonIcon}>🐝</span>
                <span className={styles.buttonText}>蜂蜜酿造流程</span>
              </button>
              <button
                onClick={() => handleOpenResource('qa')}
                className={styles.infoButton}
              >
                <span className={styles.buttonIcon}>💬</span>
                <span className={styles.buttonText}>蜂蜜知识问答</span>
              </button>
              <button
                onClick={() => handleOpenResource('viscosity')}
                className={styles.infoButton}
              >
                <span className={styles.buttonIcon}>🔬</span>
                <span className={styles.buttonText}>黏度原理揭秘</span>
              </button>
              <button
                onClick={() => handleOpenResource('storage')}
                className={styles.infoButton}
              >
                <span className={styles.buttonIcon}>📦</span>
                <span className={styles.buttonText}>蜂蜜储存说明</span>
              </button>
              <button
                onClick={() => handleOpenResource('adulteration')}
                className={styles.infoButton}
              >
                <span className={styles.buttonIcon}>🔍</span>
                <span className={styles.buttonText}>掺假蜂蜜探析</span>
              </button>
            </div>
          </div>

          {/* 右侧: 任务和选项 */}
          <div className={styles.rightPanel}>
            <div className={styles.taskSection}>
              <p className={styles.taskDescription}>
                为探究影响蜂蜜黏度的因素，小明搜集了左侧的五条资料。请点击并查看资料，思考蜂蜜黏度可能与以下哪些因素有关？单击选择你认为可能的选项，再次点击可取消选择（可多选）。
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
              {RESOURCE_DATA[currentModal].image ? (
                <img
                  src={RESOURCE_DATA[currentModal].image}
                  alt={RESOURCE_DATA[currentModal].title}
                  className={styles.modalImage}
                />
              ) : (
                RESOURCE_DATA[currentModal].content.split('\n\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

// 统一改为由 Provider 进行时间与结构标准化

export default Page04_Resource;
