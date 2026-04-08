import { useEffect } from 'react';
import EventTypes from '@shared/services/submission/eventTypes.js';
import factorOptions from '../constants/factorOptions';
import { useG4Context } from '../context/G4Context';
import useG4Navigation from '../hooks/useG4Navigation';
import styles from './Page04_FactorAnalysis.module.css';
import topBgImage from '../../../assets/images/g4_03_bg.jpg';

function Page04_FactorAnalysis() {
  const { state, toggleFactor, logOperation, collectAnswer, flowContext } = useG4Context();
  const { handleNextPage, isSubmitting, subPageNum } = useG4Navigation();
  const selected = state.selectedFactors || [];

  useEffect(() => {
    logOperation({
      targetElement: 'page_factor_analysis',
      eventType: EventTypes.PAGE_ENTER,
      value: 'Page_04_因素分析',
    });
  }, [logOperation]);

  useEffect(() => {
    if (flowContext?.updateModuleProgress && subPageNum) {
      flowContext.updateModuleProgress(String(subPageNum));
    }
  }, [flowContext, subPageNum]);

  const handleToggle = (optionId) => {
    const alreadySelected = selected.includes(optionId);
    toggleFactor(optionId);
    logOperation({
      targetElement: `factor_${optionId}`,
      eventType: alreadySelected ? EventTypes.CHECKBOX_UNCHECK : EventTypes.CHECKBOX_CHECK,
      value: optionId,
    });
  };

  const handleNext = async () => {
    const hasSelection = selected.length > 0;
    if (!hasSelection) {
      logOperation({
        targetElement: 'next_button',
        eventType: EventTypes.CLICK_BLOCKED,
        value: 'factor_not_selected',
      });
      return;
    }
    // 收集选中的因素答案
    collectAnswer({
      targetElement: '选中因素',
      value: selected.join(','),
    });
    logOperation({
      targetElement: 'next_button',
      eventType: EventTypes.NEXT_CLICK,
      value: 'factor_analysis_next',
    });
    logOperation({
      targetElement: 'page_factor_analysis',
      eventType: EventTypes.PAGE_EXIT,
      value: 'Page_04_因素分析',
    });
    await handleNextPage({
      validate: () => selected.length > 0,
      nextPageId: 'route-analysis',
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.imageContainer}>
        <img src={topBgImage} alt="因素分析场景图" className={styles.topImage} />
      </div>

      <div className={styles.contentContainer}>
        <p className={styles.prompt}>为解决上述问题,请问小明在购票时需要考虑以下哪些因素?</p>
        <p className={styles.tip}>单击选择你认为正确的选项，再次单击可取消选择（可多选） 。
        </p>

        <div className={styles.options}>
          {factorOptions.map((option) => {
            const checked = selected.includes(option.id);
            return (
              <label key={option.id} className={`${styles.option} ${checked ? styles.checked : ''}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => handleToggle(option.id)}
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>

      </div>
    </div>
  );
}

export default Page04_FactorAnalysis;
