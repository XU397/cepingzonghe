import React, { useState, useEffect, useCallback, useRef } from 'react';
import EventTypes from '@shared/services/submission/eventTypes.js';
import { useG8BananaBrowningContext } from '../context/G8BananaBrowningContext';
import styles from '../styles/Page04BananaBrowningReading.module.css';
import BananaDistributionMap from '../components/BananaDistributionMap';

import xjbs01 from '@assets/images/xjbs01.jpg';
import xjbs02 from '@assets/images/xjbs02.jpg';
import xjbs03 from '@assets/images/xjbs03.jpg';
import xjbs04 from '@assets/images/xjbs04.jpg';
import xjbs05 from '@assets/images/xjbs05.jpg';
import xjbs06 from '@assets/images/xjbs06.jpg';
import xjbs11 from '@assets/images/xjbs11.jpg';

const RESOURCE_ITEMS: ReadonlyArray<{ readonly id: string; readonly title: string }> = [
  { id: 'resource_1', title: '香蕉变色之谜' },
  { id: 'resource_2', title: '香蕉种植分布图' },
  { id: 'resource_3', title: '香蕉网店评论区' },
  { id: 'resource_4', title: '果店员工宝典' },
  { id: 'resource_5', title: '香蕉"泡药"真相' },
];

const FACTOR_OPTIONS: ReadonlyArray<{ readonly key: string; readonly label: string }> = [
  { key: '环境温度', label: '环境温度' },
  { key: '环境湿度', label: '环境湿度' },
  { key: '香蕉形状', label: '香蕉形状' },
  { key: '香蕉品种', label: '香蕉品种' },
  { key: '磕碰损伤', label: '磕碰损伤' },
  { key: '香蕉甜度', label: '香蕉甜度' },
];

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

function OverlayContentLayer4() {
  return (
    <div className={styles.bookContainer}>
      <div className={`${styles.bookPage} ${styles.leftPage}`}>
        <div className={styles.pageHeader}>
          <span className={styles.pageHeaderIcon}>🏪</span>
          <span className={styles.pageHeaderText}>香蕉的保存</span>
        </div>
        <div className={styles.pageContent}>
          <div className={styles.bookGuideSection}>
            <span className={styles.bookGuideCheck}>✓</span>
            <div>
              <h4 className={styles.bookGuideSectionTitle}>保鲜膜包一包</h4>
              <p className={styles.bookGuideSectionText}>
                包上保鲜膜能隔绝空气，香蕉熟得慢，皮也没那么容易变黑。
              </p>
            </div>
          </div>
          <img src={xjbs04} alt="保鲜膜包裹香蕉" className={styles.bookSingleImage} />
          <div className={styles.bookGuideSection}>
            <span className={styles.bookGuideCheck}>✓</span>
            <div>
              <h4 className={styles.bookGuideSectionTitle}>皮上喷点水</h4>
              <p className={styles.bookGuideSectionText}>
                太干会使香蕉失水，口感变差，甜度下降。喷点水保持湿度更好。
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.bookSpine} />

      <div className={`${styles.bookPage} ${styles.rightPage}`}>
        <div className={styles.pageHeader}>
          <span className={styles.pageHeaderText}>香蕉的保存</span>
          <span className={styles.pageHeaderIcon}>🏪</span>
        </div>
        <div className={styles.pageContent}>
          <div className={styles.bookGuideSection}>
            <span className={styles.bookGuideCheck}>✓</span>
            <div>
              <h4 className={styles.bookGuideSectionTitle}>温度不宜太冷或太热</h4>
              <p className={styles.bookGuideSectionText}>
                太冷会冻伤，果肉变黑变硬；太热熟得快，也容易发黑。常温阴凉处最适合。
              </p>
            </div>
          </div>
          <img src={xjbs05} alt="香蕉保存方法" className={styles.bookRightPageImage} />
        </div>
      </div>
    </div>
  );
}

function OverlayContentLayer5() {
  return (
    <div className={styles.newsContainer}>
      <img src={xjbs06} alt="香蕉保鲜场景" className={styles.newsImage} />
      <p className={styles.newsText}>
        近日，网传"香蕉浸泡乳白色不明液体"的视频引发关注，有网友怀疑是甲醛。相关部门回应称，
        该液体实为经国家批准的香蕉保鲜剂。
      </p>
      <p className={styles.newsText}>
        香蕉产自热带、亚热带地区，是市场上常年供应的鲜果。因其采摘后易遭真菌侵染，变黑腐烂，
        必须立即保鲜。该保鲜剂具有低毒、易降解，用量和残留均符合国际标准，可放心食用。
      </p>
    </div>
  );
}

function renderOverlayById(overlayId: string): React.ReactNode {
  switch (overlayId) {
    case 'resource_1':
      return <OverlayContentLayer1 />;
    case 'resource_2':
      return <OverlayContentLayer2 />;
    case 'resource_3':
      return <OverlayContentLayer3 />;
    case 'resource_4':
      return <OverlayContentLayer4 />;
    case 'resource_5':
      return <OverlayContentLayer5 />;
    default:
      return null;
  }
}

const Page04BananaBrowningReading: React.FC = () => {
  const { logOperation, collectAnswer, setPageStartTime, answers, getPagePrefix } =
    useG8BananaBrowningContext();

  const targetPrefix = getPagePrefix();
  const pageLoadedRef = useRef(false);
  const [openOverlayId, setOpenOverlayId] = useState<string | null>(null);
  const [selectedFactors, setSelectedFactors] = useState<string[]>(() => {
    const saved = answers['Q2_影响因素'];
    if (typeof saved === 'string' && saved) {
      return saved.split(',');
    }
    return [];
  });

  useEffect(() => {
    if (!pageLoadedRef.current) {
      pageLoadedRef.current = true;
      setPageStartTime(new Date());
      logOperation({
        targetElement: `${targetPrefix}页面进入`,
        eventType: EventTypes.PAGE_ENTER,
        value: '页面加载完成',
        time: new Date().toISOString(),
      });
    }
  }, [logOperation, setPageStartTime, targetPrefix]);

  const handleOpenOverlay = useCallback(
    (id: string, title: string) => {
      setOpenOverlayId(id);
      logOperation({
        targetElement: `${targetPrefix}资料按钮_${title}`,
        eventType: EventTypes.MODAL_OPEN,
        value: title,
        time: new Date().toISOString(),
      });
    },
    [logOperation, targetPrefix]
  );

  const handleCloseOverlay = useCallback(() => {
    if (!openOverlayId) return;
    const item = RESOURCE_ITEMS.find(r => r.id === openOverlayId);
    logOperation({
      targetElement: `${targetPrefix}弹层关闭_${item?.title ?? openOverlayId}`,
      eventType: EventTypes.MODAL_CLOSE,
      value: item?.title ?? openOverlayId,
      time: new Date().toISOString(),
    });
    setOpenOverlayId(null);
  }, [logOperation, targetPrefix, openOverlayId]);

  const handleFactorToggle = useCallback(
    (factorKey: string) => {
      const isCurrentlySelected = selectedFactors.includes(factorKey);
      const willBeSelected = !isCurrentlySelected;
      const next = willBeSelected
        ? [...selectedFactors, factorKey]
        : selectedFactors.filter(f => f !== factorKey);

      setSelectedFactors(next);

      logOperation({
        targetElement: `${targetPrefix}因素_${factorKey}`,
        eventType: willBeSelected ? EventTypes.CHECKBOX_CHECK : EventTypes.CHECKBOX_UNCHECK,
        value: willBeSelected ? '选中' : '取消选中',
        time: new Date().toISOString(),
      });

      collectAnswer({
        targetElement: 'Q2_影响因素',
        value: next.join(','),
      });
    },
    [selectedFactors, logOperation, collectAnswer, targetPrefix]
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
          为探索影响香蕉变黑的因素，小明搜集了左侧的五条资料。
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
                onClick={() => handleOpenOverlay(item.id, item.title)}
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
                const isSelected = selectedFactors.includes(factor.key);
                return (
                  <div
                    key={factor.key}
                    className={`${styles.checkboxOption} ${isSelected ? styles.checkboxSelected : ''}`}
                    onClick={() => handleFactorToggle(factor.key)}
                    role="checkbox"
                    aria-checked={isSelected}
                    tabIndex={0}
                    onKeyDown={e => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        handleFactorToggle(factor.key);
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
          className={`${styles.overlayBackdrop} ${openOverlayId === 'resource_2' ? styles.overlayBackdropMap : ''}`}
          onClick={handleCloseOverlay}
          onKeyDown={e => {
            if (e.key === 'Escape') handleCloseOverlay();
          }}
        >
          <div
            role="document"
            className={`${styles.overlayCard} ${openOverlayId === 'resource_2' ? styles.overlayCardWide : ''}`}
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
