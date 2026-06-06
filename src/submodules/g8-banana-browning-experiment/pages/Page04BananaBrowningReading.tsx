import React, { useState, useCallback, useRef } from 'react';
import { useG8BananaBrowningContext } from '../context/G8BananaBrowningContext';
import type { PageId } from '../mapping';
import styles from '../styles/Page04BananaBrowningReading.module.css';
import BananaDistributionMap from '../components/BananaDistributionMap';
import { useTracePageStart } from '../trace/useTracePageStart';

import xjbs01 from '@assets/images/xjbs01.jpg';
import xjbs02 from '@assets/images/xjbs02.jpg';
import xjbs03 from '@assets/images/xjbs03.jpg';
import xjbs11 from '@assets/images/xjbs11.jpg';

const RESOURCE_ITEMS: ReadonlyArray<{
  readonly id: string;
  readonly title: string;
  readonly traceContentId?: string;
}> = [
  { id: 'card_1', title: '香蕉变色之谜', traceContentId: 'factor_card_1' },
  { id: 'card_2', title: '香蕉种植分布图', traceContentId: 'factor_card_2' },
  { id: 'card_3', title: '香蕉网店评论区' },
];

const FACTOR_OPTIONS: ReadonlyArray<{
  readonly id: string;
  readonly label: string;
  readonly traceOptionId?: string;
}> = [
  { id: 'factor_option_1', label: '环境温度', traceOptionId: 'option_a' },
  { id: 'factor_option_2', label: '环境湿度', traceOptionId: 'option_b' },
  { id: 'factor_option_3', label: '香蕉形状', traceOptionId: 'option_c' },
  { id: 'factor_option_4', label: '香蕉品种', traceOptionId: 'option_d' },
];

const FACTOR_OPTION_BY_LABEL = new Map(FACTOR_OPTIONS.map(option => [option.label, option]));
const FACTOR_OPTION_BY_ID = new Map(FACTOR_OPTIONS.map(option => [option.id, option]));

const parseSavedFactorIds = (value: unknown): string[] => {
  if (typeof value !== 'string' || !value) {
    return [];
  }

  return value
    .split(',')
    .map(entry => entry.trim())
    .map(entry => FACTOR_OPTION_BY_ID.get(entry)?.id || FACTOR_OPTION_BY_LABEL.get(entry)?.id)
    .filter((entry): entry is string => Boolean(entry));
};

const labelsFromFactorIds = (factorIds: string[]): string[] =>
  factorIds
    .map(id => FACTOR_OPTION_BY_ID.get(id)?.label)
    .filter((label): label is string => Boolean(label));

const traceOptionIdsFromFactorIds = (factorIds: string[]): string[] =>
  factorIds
    .map(id => FACTOR_OPTION_BY_ID.get(id)?.traceOptionId)
    .filter((traceOptionId): traceOptionId is string => Boolean(traceOptionId));

function OverlayContentLayer1() {
  return (
    <div className={styles.layerOneGrid}>
      <div className={styles.layerOneCol}>
        <p className={styles.layerOneText}>
          香蕉皮和果肉中含有多酚类物质和多酚氧化酶。它们平时在细胞中被隔开。
          一旦香蕉被碰伤或挤压，细胞结构被破坏，这两类物质就会接触。
        </p>
        <img src={xjbs01} alt="香蕉变色原理示意1" className={styles.layerOneImage} />
      </div>
      <div className={styles.layerOneCol}>
        <p className={styles.layerOneText}>
          在有氧气时，酚类物质和多酚氧化酶会发生反应，先变成棕色的醌，再进一步变成黑色素，
          这样香蕉就变黑了。
        </p>
        <img src={xjbs02} alt="香蕉变色原理示意2" className={styles.layerOneImage} />
      </div>
    </div>
  );
}

function OverlayContentLayer2() {
  return <BananaDistributionMap />;
}

function OverlayContentLayer3() {
  return (
    <div className={styles.reviewContainer}>
      <div className={styles.reviewBlock}>
        <div className={styles.reviewUserRow}>
          <img src={xjbs11} alt="用户头像" className={styles.reviewAvatar} />
          <span className={styles.reviewUserName}>用户评价</span>
        </div>
        <p className={styles.reviewText}>
          香蕉个头很大，口感甜糯，家人都说好吃，打算再多买些！不过发现个别香蕉有磕碰的黑斑，
          请问这种情况还能吃吗？
        </p>
      </div>
      <img src={xjbs03} alt="香蕉评价配图" className={styles.reviewImage} />
      <div className={styles.reviewReplyBlock}>
        <div className={styles.replyLabel}>商家回复</div>
        <p className={styles.reviewText}>
          感谢您对小店的支持！我们会继续努力提供更好的服务，期待您的再次光临！关于香蕉皮的黑斑问题，
          这是果皮破损后的自然现象，只要果肉完好，没有异味就可以放心食用。不过建议尽快食用哦，
          这样口感会更好呢！
        </p>
      </div>
    </div>
  );
}

function renderOverlayById(overlayId: string): React.ReactNode {
  switch (overlayId) {
    case 'card_1':
      return <OverlayContentLayer1 />;
    case 'card_2':
      return <OverlayContentLayer2 />;
    case 'card_3':
      return <OverlayContentLayer3 />;
    default:
      return null;
  }
}

const Page04BananaBrowningReading: React.FC = () => {
  const { collectAnswer, answers, getPagePrefix } = useG8BananaBrowningContext();

  const traceLogger = useTracePageStart({
    pageId: 'banana_browning_reading' as PageId,
    pageNumber: getPagePrefix().replace(/^P/, '').replace(/_$/, ''),
    flowContext: undefined,
    metadata: {
      initial_state: {},
    },
  });

  const modalOpenedAtRef = useRef(0);
  const [openOverlayId, setOpenOverlayId] = useState<string | null>(null);
  const [selectedFactorIds, setSelectedFactorIds] = useState<string[]>(() =>
    parseSavedFactorIds(answers['Q2_影响因素'])
  );

  const handleOpenOverlay = useCallback(
    (item: (typeof RESOURCE_ITEMS)[number]) => {
      setOpenOverlayId(item.id);
      modalOpenedAtRef.current = Date.now();
      if (item.traceContentId) {
        traceLogger?.openModal(item.traceContentId, {
          source: 'material_card',
          source_ui_id: item.id,
          title: item.title,
        });
      }
    },
    [traceLogger]
  );

  const handleCloseOverlay = useCallback(() => {
    if (!openOverlayId) return;
    const openItem = RESOURCE_ITEMS.find(item => item.id === openOverlayId);
    if (openItem?.traceContentId) {
      traceLogger?.closeModal(openItem.traceContentId, Date.now() - modalOpenedAtRef.current, {
        source: 'material_card',
        source_ui_id: openOverlayId,
      });
    }
    setOpenOverlayId(null);
  }, [traceLogger, openOverlayId]);

  const handleFactorToggle = useCallback(
    (factor: (typeof FACTOR_OPTIONS)[number]) => {
      const isCurrentlySelected = selectedFactorIds.includes(factor.id);
      const willBeSelected = !isCurrentlySelected;
      const nextSelectedFactorIds = willBeSelected
        ? [...selectedFactorIds, factor.id]
        : selectedFactorIds.filter(id => id !== factor.id);
      const nextSelectedLabels = labelsFromFactorIds(nextSelectedFactorIds);
      const selectedTraceOptionIds = traceOptionIdsFromFactorIds(selectedFactorIds);
      const nextSelectedTraceOptionIds = traceOptionIdsFromFactorIds(nextSelectedFactorIds);

      setSelectedFactorIds(nextSelectedFactorIds);

      if (factor.traceOptionId) {
        traceLogger?.emit(
          'CHECKBOX_TOGGLE',
          {
            field_id: 'factor_selection',
            question_id: 'factor_selection',
            option_id: factor.traceOptionId,
            value_before: selectedTraceOptionIds,
            value_after: nextSelectedTraceOptionIds,
          },
          {
            targetId: `factor_selection_${factor.traceOptionId}`,
            targetType: 'checkbox',
            metadata: {
              option_label: factor.label,
              source_ui_id: factor.id,
              selected_labels: nextSelectedLabels,
              selected_count: nextSelectedTraceOptionIds.length,
            },
          }
        );
      }

      collectAnswer({
        targetElement: 'Q2_影响因素',
        value: nextSelectedLabels.join(','),
      });
    },
    [selectedFactorIds, traceLogger, collectAnswer]
  );

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.badge}>3</div>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>香蕉变黑：资料阅读</h1>
        </div>
      </header>

      <div className={styles.instructionCard}>
        <p className={styles.instructionText}>
          为探索影响香蕉变黑的因素，小明搜集了左侧的三条资料。
          <strong>请点击并查看资料</strong>，
          思考香蕉变黑可能与以下哪些因素有关？单击选择你认为正确的选项，再次点击可取消选择（可多选）。
        </p>
      </div>

      <div className={styles.content}>
        <div className={styles.leftPanel}>
          <div className={styles.infoCenter}>
            {RESOURCE_ITEMS.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                className={styles.infoButton}
                onClick={() => handleOpenOverlay(item)}
              >
                <span className={styles.buttonIcon}>{idx + 1}</span>
                <span className={styles.buttonText}>{item.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.rightPanel}>
          <div className={styles.taskSection}>
            <div className={styles.checkboxGroup}>
              {FACTOR_OPTIONS.map(factor => {
                const isSelected = selectedFactorIds.includes(factor.id);
                return (
                  <div
                    key={factor.id}
                    className={`${styles.checkboxOption} ${isSelected ? styles.checkboxSelected : ''}`}
                    onClick={() => handleFactorToggle(factor)}
                    role="checkbox"
                    aria-checked={isSelected}
                    tabIndex={0}
                    onKeyDown={e => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        handleFactorToggle(factor);
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      className={styles.factorCheckbox}
                      checked={isSelected}
                      readOnly
                      tabIndex={-1}
                    />
                    <span className={styles.factorLabel}>{factor.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {openOverlayId && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={RESOURCE_ITEMS.find(r => r.id === openOverlayId)?.title ?? '资料弹层'}
           className={`${styles.overlayBackdrop} ${openOverlayId === 'card_2' ? styles.overlayBackdropMap : ''}`}
          onClick={handleCloseOverlay}
          onKeyDown={e => {
            if (e.key === 'Escape') handleCloseOverlay();
          }}
        >
          <div
            role="document"
             className={`${styles.overlayCard} ${openOverlayId === 'card_2' ? styles.overlayCardWide : ''}`}
            onClick={e => e.stopPropagation()}
            onKeyDown={e => e.stopPropagation()}
          >
            <div className={styles.overlayHeader}>
              <h3 className={styles.overlayTitle}>
                {RESOURCE_ITEMS.find(r => r.id === openOverlayId)?.title ?? ''}
              </h3>
              <button
                type="button"
                className={styles.overlayCloseBtn}
                onClick={handleCloseOverlay}
                aria-label="关闭"
              >
                &times;
              </button>
            </div>
            <div className={styles.overlayBody}>{renderOverlayById(openOverlayId)}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page04BananaBrowningReading;
