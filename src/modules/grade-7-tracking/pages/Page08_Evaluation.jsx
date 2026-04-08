import { useEffect, useState, useCallback } from 'react';
import { useTrackingContext } from '../context/TrackingProvider.jsx';
import { PAGE_MAPPING } from '../config.js';
import PageLayout from '../components/layout/PageLayout.jsx';
import styles from '../styles/Page08_Evaluation.module.css';

const MIN_FILLED_FIELDS = 6;

const ObservationSVG = () => (
  <svg viewBox="0 0 320 150" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect
      x="15"
      y="25"
      width="130"
      height="105"
      rx="4"
      fill="#fff"
      stroke="#ddd"
      strokeWidth="1.5"
    />
    <rect
      x="175"
      y="25"
      width="130"
      height="105"
      rx="4"
      fill="#fff"
      stroke="#ddd"
      strokeWidth="1.5"
    />
    <g className={styles.honeyDrop} transformOrigin="80 78">
      <ellipse cx="80" cy="80" rx="28" ry="26" fill="#e8a020" />
      <ellipse cx="80" cy="75" rx="22" ry="18" fill="#f5a623" />
      <ellipse cx="72" cy="68" rx="8" ry="5" fill="#ffd93d" opacity="0.6" />
      <ellipse cx="85" cy="72" rx="4" ry="3" fill="#ffd93d" opacity="0.4" />
    </g>
    <g transform="translate(240, 78)">
      <ellipse cx="0" cy="18" rx="55" ry="16" fill="#e8a020" opacity="0.5" />
      <ellipse cx="0" cy="14" rx="48" ry="13" fill="#f5a623" />
      <ellipse cx="0" cy="10" rx="38" ry="9" fill="#f7b742" />
      <ellipse cx="-18" cy="8" rx="10" ry="5" fill="#ffd93d" opacity="0.5" />
      <ellipse cx="12" cy="6" rx="6" ry="3" fill="#ffd93d" opacity="0.4" />
    </g>
  </svg>
);

const BallFallSVG = () => (
  <svg viewBox="0 0 320 150" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(50, 8)">
      <path
        d="M5 20 L5 115 Q5 128 18 128 L52 128 Q65 128 65 115 L65 20 Z"
        fill="#e8f4fc"
        stroke="#7ab8dc"
        strokeWidth="2"
      />
      <rect x="8" y="45" width="54" height="80" fill="#e8a020" opacity="0.75" />
      <line x1="62" y1="35" x2="70" y2="35" stroke="#666" strokeWidth="1" />
      <line x1="62" y1="55" x2="67" y2="55" stroke="#666" strokeWidth="0.7" />
      <line x1="62" y1="75" x2="67" y2="75" stroke="#666" strokeWidth="0.7" />
      <line x1="62" y1="95" x2="67" y2="95" stroke="#666" strokeWidth="0.7" />
      <g className={styles.ballFallLeft}>
        <circle cx="35" cy="30" r="7" fill="#4a4a4a" />
        <circle cx="33" cy="28" r="2.5" fill="#6a6a6a" />
      </g>
    </g>
    <g transform="translate(185, 8)">
      <path
        d="M5 20 L5 115 Q5 128 18 128 L52 128 Q65 128 65 115 L65 20 Z"
        fill="#e8f4fc"
        stroke="#7ab8dc"
        strokeWidth="2"
      />
      <rect x="8" y="45" width="54" height="80" fill="#f5c86a" opacity="0.65" />
      <line x1="62" y1="35" x2="70" y2="35" stroke="#666" strokeWidth="1" />
      <line x1="62" y1="55" x2="67" y2="55" stroke="#666" strokeWidth="0.7" />
      <line x1="62" y1="75" x2="67" y2="75" stroke="#666" strokeWidth="0.7" />
      <line x1="62" y1="95" x2="67" y2="95" stroke="#666" strokeWidth="0.7" />
      <g className={styles.ballFallRight}>
        <circle cx="35" cy="30" r="7" fill="#4a4a4a" />
        <circle cx="33" cy="28" r="2.5" fill="#6a6a6a" />
      </g>
    </g>
  </svg>
);

const FlowRateSVG = () => (
  <svg viewBox="0 0 320 150" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(35, 10)">
      <path
        d="M0 0 L0 100 Q0 125 25 125 Q50 125 50 100 L50 0 L0 0 Z"
        fill="#f0f7fc"
        stroke="#7ab8dc"
        strokeWidth="2"
      />
      <ellipse cx="15" cy="20" rx="8" ry="6" fill="#e8a020" />
      <path
        d="M15 26 Q12 45 18 65 Q22 80 15 95"
        stroke="#e8a020"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
      <g className={styles.honeyFlowLeft}>
        <ellipse cx="15" cy="30" rx="6" ry="5" fill="#f5a623" />
      </g>
    </g>
    <g transform="translate(195, 10)">
      <path
        d="M0 0 L0 100 Q0 125 25 125 Q50 125 50 100 L50 0 L0 0 Z"
        fill="#f0f7fc"
        stroke="#7ab8dc"
        strokeWidth="2"
      />
      <ellipse cx="15" cy="20" rx="8" ry="6" fill="#f5c86a" />
      <path
        d="M15 26 Q10 50 20 75 Q25 95 18 115"
        stroke="#f5c86a"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
      <g className={styles.honeyFlowRight}>
        <ellipse cx="15" cy="30" rx="6" ry="5" fill="#f7c85a" />
      </g>
    </g>
    <line x1="30" y1="140" x2="290" y2="140" stroke="#999" strokeWidth="1" strokeDasharray="4 3" />
  </svg>
);

const Page08_Evaluation = () => {
  const {
    session,
    logOperation,
    clearOperations,
    buildMarkObject,
    navigateToPage,
    submitPageData,
  } = useTrackingContext();

  const [pageStartTime] = useState(() => new Date());
  const [isNavigating, setIsNavigating] = useState(false);

  const [evaluations, setEvaluations] = useState({
    observation: { advantage: '', disadvantage: '' },
    ballFall: { advantage: '', disadvantage: '' },
    flowRate: { advantage: '', disadvantage: '' },
  });

  const filledFieldsCount = Object.values(evaluations).reduce((count, method) => {
    return count + (method.advantage.trim() ? 1 : 0) + (method.disadvantage.trim() ? 1 : 0);
  }, 0);

  const canNavigate = filledFieldsCount === MIN_FILLED_FIELDS;

  useEffect(() => {
    logOperation({
      action: 'page_enter',
      target: 'page_08_evaluation',
      value: '方案评估页面',
      time: new Date().toISOString(),
    });

    return () => {
      logOperation({
        action: 'page_exit',
        target: 'page_08_evaluation',
        value: `停留时长: ${((Date.now() - pageStartTime) / 1000).toFixed(1)}秒`,
        time: new Date().toISOString(),
      });
    };
  }, [logOperation, pageStartTime]);

  const handleInputChange = useCallback(
    (method, field, value) => {
      setEvaluations(prev => ({
        ...prev,
        [method]: {
          ...prev[method],
          [field]: value,
        },
      }));

      logOperation({
        action: '文本域输入',
        target: `${method}_${field}`,
        value: `字符数：${value.trim().length}`,
        time: new Date().toISOString(),
      });
    },
    [logOperation]
  );

  const handleNextPage = useCallback(async () => {
    if (isNavigating || !canNavigate) return;

    setIsNavigating(true);

    try {
      logOperation({
        action: 'complete_evaluation',
        target: 'method_evaluation',
        value: JSON.stringify({
          filledFields: filledFieldsCount,
          observationAdv: evaluations.observation.advantage.length,
          observationDisadv: evaluations.observation.disadvantage.length,
          ballFallAdv: evaluations.ballFall.advantage.length,
          ballFallDisadv: evaluations.ballFall.disadvantage.length,
          flowRateAdv: evaluations.flowRate.advantage.length,
          flowRateDisadv: evaluations.flowRate.disadvantage.length,
        }),
        time: new Date().toISOString(),
      });

      logOperation({
        action: '点击',
        target: '下一页按钮',
        value: 'page_08_to_page_09',
        time: new Date().toISOString(),
      });

      const answerList = [
        { targetElement: '观察法_优点', value: evaluations.observation.advantage.trim() },
        { targetElement: '观察法_缺点', value: evaluations.observation.disadvantage.trim() },
        { targetElement: '落球法_优点', value: evaluations.ballFall.advantage.trim() },
        { targetElement: '落球法_缺点', value: evaluations.ballFall.disadvantage.trim() },
        { targetElement: '流速法_优点', value: evaluations.flowRate.advantage.trim() },
        { targetElement: '流速法_缺点', value: evaluations.flowRate.disadvantage.trim() },
      ];

      const pageInfo = PAGE_MAPPING[session.currentPage];
      const markObject = buildMarkObject(
        String(session.currentPage),
        pageInfo?.desc || '方案评估',
        { answerList }
      );
      const success = await submitPageData(markObject);

      if (success) {
        clearOperations();
        await navigateToPage(7);
      } else {
        throw new Error('数据提交失败');
      }
    } catch (error) {
      console.error('[Page08_Evaluation] 导航失败:', error);
      alert(error.message || '页面跳转失败，请重试');
      setIsNavigating(false);
    }
  }, [
    isNavigating,
    canNavigate,
    filledFieldsCount,
    evaluations,
    logOperation,
    buildMarkObject,
    submitPageData,
    clearOperations,
    navigateToPage,
    session,
  ]);

  const methods = [
    {
      id: 'observation',
      name: '方法一：观察法',
      description: '从两瓶蜂蜜中各取一滴，分别滴在纸上，观察形状。',
      SVGComponent: ObservationSVG,
    },
    {
      id: 'ballFall',
      name: '方法二：落球法',
      description: '从两瓶蜂蜜中各取 200ml，分别装入量筒。将小钢球垂直落入，测量落到底部的时间。',
      SVGComponent: BallFallSVG,
    },
    {
      id: 'flowRate',
      name: '方法三：流速法',
      description:
        '用滴管从两瓶蜂蜜中各取一滴，滴到倾斜角度相同的试管内壁上，观察蜂蜜流到试管底部的时间。',
      SVGComponent: FlowRateSVG,
    },
  ];

  return (
    <PageLayout showNavigation={true} showTimer={true}>
      <main className={styles.pageFrame}>
        <header className={styles.header}>
          <div className={styles.badge} aria-label="第6题">
            6
          </div>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>蜂蜜变稀：方案评估</h1>
            <p className={styles.description}>
              小明提出了以下三种比较蜂蜜黏度的方法。请分析三种方法的优缺点，并写在相应的方框内。
            </p>
          </div>
        </header>

        <section className={styles.cardsContainer} aria-label="方案卡片区域">
          {methods.map(method => (
            <article key={method.id} className={styles.card}>
              <div className={styles.cardNumber}>
                <span className={styles.num}>{methods.indexOf(method) + 1}</span>
                <span className={styles.methodName}>{method.name}</span>
              </div>
              <p className={styles.cardDescription}>{method.description}</p>
              <div
                className={styles.imagePlaceholder}
                role="img"
                aria-label={`${method.name}示意图`}
              >
                <method.SVGComponent />
              </div>
              <div className={styles.inputGroup}>
                <label
                  className={`${styles.inputLabel} ${styles.pros}`}
                  htmlFor={`pros-${method.id}`}
                >
                  优点：
                </label>
                <textarea
                  id={`pros-${method.id}`}
                  className={styles.textarea}
                  value={evaluations[method.id].advantage}
                  onChange={e => handleInputChange(method.id, 'advantage', e.target.value)}
                  placeholder="请填写此方法的优点..."
                />
              </div>
              <div className={styles.inputGroup}>
                <label
                  className={`${styles.inputLabel} ${styles.cons}`}
                  htmlFor={`cons-${method.id}`}
                >
                  缺点：
                </label>
                <textarea
                  id={`cons-${method.id}`}
                  className={styles.textarea}
                  value={evaluations[method.id].disadvantage}
                  onChange={e => handleInputChange(method.id, 'disadvantage', e.target.value)}
                  placeholder="请填写此方法的缺点..."
                />
              </div>
            </article>
          ))}
        </section>

        <footer className={styles.footer}>
          <button
            className={styles.btnNext}
            type="button"
            aria-label="进入下一页"
            disabled={!canNavigate || isNavigating}
            onClick={handleNextPage}
          >
            {isNavigating ? '提交中...' : '下一页'}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </footer>
      </main>
    </PageLayout>
  );
};

export default Page08_Evaluation;
