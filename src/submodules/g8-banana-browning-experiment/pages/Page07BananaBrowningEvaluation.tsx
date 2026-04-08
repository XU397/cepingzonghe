import React, { useEffect, useCallback } from 'react';
import EventTypes from '@shared/services/submission/eventTypes.js';
import { useG8BananaBrowningContext } from '../context/G8BananaBrowningContext';
import imgMethod1 from '@/assets/images/xjbs07.jpg';
import imgMethod2 from '@/assets/images/xjbs08.jpg';
import imgMethod3 from '@/assets/images/xjbs09.jpg';
import styles from '../styles/Page07BananaBrowningEvaluation.module.css';

interface MethodConfig {
  id: string;
  name: string;
  description: string;
  imageSrc: string;
  prosKey: string;
  consKey: string;
  prosLabel: string;
  consLabel: string;
}

const METHODS: MethodConfig[] = [
  {
    id: 'method_image',
    name: '图像法',
    description:
      '取一根变黑的香蕉，用手机从多个角度拍摄，然后使用相关软件计算照片中黑色像素所占的比例。',
    imageSrc: imgMethod1,
    prosKey: 'Q4a_图像法优点',
    consKey: 'Q4b_图像法缺点',
    prosLabel: '图像法优点',
    consLabel: '图像法缺点',
  },
  {
    id: 'method_grid',
    name: '网格法',
    description:
      '取一根变黑的香蕉，将表皮展开，用透明网格板覆盖在表面，统计变黑的网格数占总网格数的比例。',
    imageSrc: imgMethod2,
    prosKey: 'Q4c_网格法优点',
    consKey: 'Q4d_网格法缺点',
    prosLabel: '网格法优点',
    consLabel: '网格法缺点',
  },
  {
    id: 'method_weigh',
    name: '称重法',
    description:
      '取一根变黑的香蕉，用电子秤称出整根香蕉皮的重量，然后沿变黑与未变黑的交界处切割，将黑色部分单独再称重，计算黑色部分重量与总皮重的比例。',
    imageSrc: imgMethod3,
    prosKey: 'Q4e_称重法优点',
    consKey: 'Q4f_称重法缺点',
    prosLabel: '称重法优点',
    consLabel: '称重法缺点',
  },
];

const Page07BananaBrowningEvaluation: React.FC = () => {
  const { logOperation, collectAnswer, setPageStartTime, answers, getPagePrefix } =
    useG8BananaBrowningContext();
  const targetPrefix = getPagePrefix();

  useEffect(() => {
    setPageStartTime(new Date());
    logOperation({
      targetElement: `${targetPrefix}页面进入`,
      eventType: EventTypes.PAGE_ENTER,
      value: '页面加载完成',
      time: new Date().toISOString(),
    });
  }, [logOperation, setPageStartTime, targetPrefix]);

  const handleInputChange = useCallback(
    (answerKey: string, logLabel: string, value: string) => {
      collectAnswer({ targetElement: answerKey, value });
      logOperation({
        targetElement: `${targetPrefix}${logLabel}输入`,
        eventType: EventTypes.INPUT_CHANGE,
        value,
        time: new Date().toISOString(),
      });
    },
    [collectAnswer, logOperation, targetPrefix]
  );

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.badge}>6</div>
        <h1 className={styles.title}>香蕉变黑：方案评估</h1>
      </header>

      <p className={styles.description}>
        小明提出了以下三种评估香蕉黑变比例的方法。请分析三种方法的优缺点，并写在相应的方框内。
      </p>

      <section className={styles.cardsContainer}>
        {METHODS.map((method, index) => (
          <article key={method.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardNumber}>{index + 1}</div>
              <span className={styles.cardName}>{method.name}</span>
            </div>
            <p className={styles.cardDescription}>{method.description}</p>
            <div className={styles.imagePlaceholder}>
              <img src={method.imageSrc} alt={method.name} />
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
                value={(answers[method.prosKey] as string) || ''}
                onChange={e => handleInputChange(method.prosKey, method.prosLabel, e.target.value)}
                placeholder="请填写此方法的优点..."
                aria-label={`${method.name}优点输入框`}
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
                value={(answers[method.consKey] as string) || ''}
                onChange={e => handleInputChange(method.consKey, method.consLabel, e.target.value)}
                placeholder="请填写此方法的缺点..."
                aria-label={`${method.name}缺点输入框`}
              />
            </div>
          </article>
        ))}
      </section>
    </div>
  );
};

export default Page07BananaBrowningEvaluation;
