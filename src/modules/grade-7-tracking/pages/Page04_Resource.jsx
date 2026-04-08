import { useEffect, useCallback, useState } from 'react';
import { useTrackingContext } from '../context/TrackingContext';
import PageLayout from '../components/layout/PageLayout';
import styles from '../styles/Page04_Resource.module.css';
import { PAGE_MAPPING } from '../config.js';

import brewingImage from '../../../assets/images/蜂蜜酿造流程.png';
import viscosityImage from '../../../assets/images/黏度原理揭秘.png';
import qaImage from '../../../assets/images/蜂蜜知识问答.png';
import storageImage from '../../../assets/images/蜂蜜存储说明.png';
import adulterationImage from '../../../assets/images/掺假蜂蜜探析.png';

const RESOURCE_DATA = {
  brewing: {
    title: '蜂蜜酿造流程',
    image: brewingImage,
  },
  viscosity: {
    title: '黏度原理揭秘',
    image: viscosityImage,
  },
  qa: {
    title: '蜂蜜知识问答',
    image: qaImage,
  },
  storage: {
    title: '蜂蜜储存说明',
    image: storageImage,
  },
  adulteration: {
    title: '掺假蜂蜜探析',
    image: adulterationImage,
  },
};

const OPTIONS = [
  { id: 'temperature', label: '环境温度' },
  { id: 'humidity', label: '环境湿度' },
  { id: 'stirring', label: '人为搅拌' },
  { id: 'fermentation', label: '微生物发酵' },
  { id: 'pourSpeed', label: '倾倒速度' },
  { id: 'impurities', label: '掺入杂质' },
];

const Page04_Resource = () => {
  const {
    session,
    logOperation,
    clearOperations,
    navigateToPage,
    buildMarkObject,
    submitPageData,
  } = useTrackingContext();
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [currentModal, setCurrentModal] = useState(null);
  const [viewedResources, setViewedResources] = useState([]);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    logOperation({
      action: 'page_enter',
      target: 'Page_03_Resource',
      value: '资料阅读',
      time: new Date().toISOString(),
    });

    return () => {
      logOperation({
        action: 'page_exit',
        target: 'Page_03_Resource',
        value: '资料阅读',
        time: new Date().toISOString(),
      });
    };
  }, [logOperation]);

  const handleOpenResource = useCallback(
    resourceKey => {
      setCurrentModal(resourceKey);

      if (!viewedResources.includes(resourceKey)) {
        setViewedResources([...viewedResources, resourceKey]);
      }

      logOperation({
        action: 'resource_view',
        target: `resource_${resourceKey}`,
        value: RESOURCE_DATA[resourceKey].title,
        time: new Date().toISOString(),
      });
    },
    [viewedResources, logOperation]
  );

  const handleCloseModal = useCallback(() => {
    if (currentModal) {
      logOperation({
        action: 'modal_close',
        target: `resource_${currentModal}`,
        value: '关闭资料窗口',
        time: new Date().toISOString(),
      });
    }
    setCurrentModal(null);
  }, [currentModal, logOperation]);

  const handleCheckboxChange = useCallback(
    optionId => {
      const newSelected = selectedOptions.includes(optionId)
        ? selectedOptions.filter(id => id !== optionId)
        : [...selectedOptions, optionId];

      setSelectedOptions(newSelected);

      logOperation({
        action: 'checkbox_toggle',
        target: `option_${optionId}`,
        value: newSelected.includes(optionId) ? '选中' : '取消选中',
        time: new Date().toISOString(),
      });
    },
    [selectedOptions, logOperation]
  );

  const handleNextClick = useCallback(async () => {
    if (isNavigating || selectedOptions.length === 0) return;

    setIsNavigating(true);

    try {
      logOperation({
        action: 'click_next',
        target: 'next_button',
        value: 'page_03_to_page_04',
        time: new Date().toISOString(),
      });

      const factorAnswers = selectedOptions.map(id => ({
        targetElement: `factor_${id}`,
        value: OPTIONS.find(o => o.id === id)?.label || id,
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
      } else {
        throw new Error('数据提交失败');
      }
    } catch (error) {
      console.error('[Page04_Resource] 导航失败:', error);
      alert(error.message || '页面跳转失败，请重试');
      setIsNavigating(false);
    }
  }, [
    session,
    selectedOptions,
    logOperation,
    submitPageData,
    clearOperations,
    navigateToPage,
    buildMarkObject,
    isNavigating,
  ]);

  const canGoNext = selectedOptions.length > 0;

  return (
    <PageLayout showNavigation={true} showTimer={true}>
      <div className={styles.pageContainer}>
        <header className={styles.header}>
          <div className={styles.badge}>3</div>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>蜂蜜变稀：资料阅读</h1>
          </div>
        </header>

        <div className={styles.instructionCard}>
          <p className={styles.instructionText}>
            为探究影响蜂蜜黏度的因素，小明搜集了左侧的五条资料。请点击并查看资料，思考蜂蜜黏度可能与以下哪些因素有关？单击选择你认为可能的选项，再次点击可取消选择（可多选）。
          </p>
        </div>

        <div className={styles.content}>
          <div className={styles.leftPanel}>
            <div className={styles.infoCenter}>
              <button onClick={() => handleOpenResource('brewing')} className={styles.infoButton}>
                <span className={styles.buttonIcon}>🐝</span>
                <span className={styles.buttonText}>蜂蜜酿造流程</span>
              </button>
              <button onClick={() => handleOpenResource('qa')} className={styles.infoButton}>
                <span className={styles.buttonIcon}>💬</span>
                <span className={styles.buttonText}>蜂蜜知识问答</span>
              </button>
              <button onClick={() => handleOpenResource('viscosity')} className={styles.infoButton}>
                <span className={styles.buttonIcon}>🔬</span>
                <span className={styles.buttonText}>黏度原理揭秘</span>
              </button>
              <button onClick={() => handleOpenResource('storage')} className={styles.infoButton}>
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

        <footer className={styles.footer}>
          <button
            className={styles.btnPrimary}
            onClick={handleNextClick}
            disabled={!canGoNext || isNavigating}
            aria-label="进入下一页"
          >
            <span>{isNavigating ? '提交中...' : '下一页'}</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </footer>
      </div>

      {currentModal && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{RESOURCE_DATA[currentModal].title}</h3>
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
                RESOURCE_DATA[currentModal].content
                  ?.split('\n\n')
                  .map((paragraph, index) => <p key={index}>{paragraph}</p>)
              )}
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default Page04_Resource;
