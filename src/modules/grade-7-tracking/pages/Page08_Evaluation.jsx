/**
 * Page08_Evaluation - 方案评估页面
 *
 * FR-015: 展示3种实验方法图片(观察法、落球法、流速法)
 * FR-016: 6个优缺点输入框 (每种方法2个)
 *
 * 页面内容:
 * - 标题: "评估实验方案"
 * - 3种实验方法展示 (图片 + 名称 + 优点/缺点输入框)
 * - "下一页"按钮 (至少完成3个输入框才能点击)
 *
 * @component
 */

import { useEffect, useState, useCallback } from 'react';
import { useTrackingContext } from '../context/TrackingProvider.jsx';
import { useDataLogger } from '../hooks/useDataLogger';
import { PAGE_MAPPING } from '../config.js';
import Button from '../components/ui/Button.jsx';
import TextArea from '../components/ui/TextArea.jsx';
import PageLayout from '../components/layout/PageLayout.jsx';
import styles from '../styles/Page08_Evaluation.module.css';

// 引入实验方法图片
// import observationImg from '../assets/images/method-observation.png'; // T104: 使用占位符替代
// import ballFallImg from '../assets/images/method-ballfall.png'; // T104: 使用占位符替代
// import flowRateImg from '../assets/images/method-flowrate.png'; // T104: 使用占位符替代

const MIN_FILLED_FIELDS = 6; // 所有6个输入框都必须填写

const Page08_Evaluation = () => {
  const {
    session,
    logOperation,
    collectAnswer,
    clearOperations,
    buildMarkObject,
    navigateToPage,
  } = useTrackingContext();

  const { submitPageData } = useDataLogger();
  const [pageStartTime] = useState(() => new Date());
  const [isNavigating, setIsNavigating] = useState(false);

  // 3种方法的优缺点状态
  const [evaluations, setEvaluations] = useState({
    observation: { advantage: '', disadvantage: '' },
    ballFall: { advantage: '', disadvantage: '' },
    flowRate: { advantage: '', disadvantage: '' },
  });

  // 计算已填写的输入框数量
  const filledFieldsCount = Object.values(evaluations).reduce((count, method) => {
    return count + (method.advantage.trim() ? 1 : 0) + (method.disadvantage.trim() ? 1 : 0);
  }, 0);

  // 必须所有6个输入框都填写才能导航
  const canNavigate = filledFieldsCount === MIN_FILLED_FIELDS;

  // 页面进入日志
  useEffect(() => {
    logOperation({
      action: 'page_enter',
      target: 'page_08_evaluation',
      value: '方案评估页面',
      time: new Date().toISOString(),
    });

    return () => {
      // 页面离开日志
      logOperation({
        action: 'page_exit',
        target: 'page_08_evaluation',
        value: `停留时长: ${((Date.now() - pageStartTime) / 1000).toFixed(1)}秒`,
        time: new Date().toISOString(),
      });
    };
  }, [logOperation, pageStartTime]);

  // 通用输入处理函数
  const handleInputChange = useCallback((method, field, value) => {
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
      value: `字符数: ${value.trim().length}`,
      time: new Date().toISOString(),
    });
  }, [logOperation]);

  // 处理"下一页"点击
  const handleNextPage = useCallback(async () => {
    if (isNavigating || !canNavigate) return;

    setIsNavigating(true);

    try {
      // 记录完成状态
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

      // 收集答案
      collectAnswer({
        targetElement: '观察法_优点',
        value: evaluations.observation.advantage.trim()
      });
      collectAnswer({
        targetElement: '观察法_缺点',
        value: evaluations.observation.disadvantage.trim()
      });
      collectAnswer({
        targetElement: '落球法_优点',
        value: evaluations.ballFall.advantage.trim()
      });
      collectAnswer({
        targetElement: '落球法_缺点',
        value: evaluations.ballFall.disadvantage.trim()
      });
      collectAnswer({
        targetElement: '流速法_优点',
        value: evaluations.flowRate.advantage.trim()
      });
      collectAnswer({
        targetElement: '流速法_缺点',
        value: evaluations.flowRate.disadvantage.trim()
      });

      // 构建并提交MarkObject
      // 从session获取当前页码而不是硬编码
      const pageInfo = PAGE_MAPPING[session.currentPage];
      const markObject = buildMarkObject(String(session.currentPage), pageInfo?.desc || '方案评估');
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
  }, [isNavigating, canNavigate, filledFieldsCount, evaluations, logOperation, collectAnswer, buildMarkObject, submitPageData, clearOperations, navigateToPage, session]);

  // 实验方法配置
  const methods = [
    {
      id: 'observation',
      name: '方法一：观察法',
      description: '从两瓶蜂蜜中各取一滴，分别滴在纸上，观察形状。',
      image: '/src/assets/images/纸上蜂蜜.png',
      imagePlaceholder: '👁️',
    },
    {
      id: 'ballFall',
      name: '方法二：落球法',
      description: '从两瓶蜂蜜中各取200ml，分别装入两个量筒中。将小钢球分别垂直落入两个量筒，测量小球落至量筒底部的时间。',
      image: '/src/assets/images/量筒+钢球.png',
      imagePlaceholder: '⚽',
      layoutType: 'horizontal', // 标记为横向布局
    },
    {
      id: 'flowRate',
      name: '方法三：流速法',
      description: '用滴管从两瓶蜂蜜中各取一滴，滴到倾斜角度相同的试管内壁上，观察蜂蜜流到试管底部的时间。',
      image: '/src/assets/images/试管蜂蜜.png',
      imagePlaceholder: '🌊',
    },
  ];

  return (
    <PageLayout showNavigation={true} showTimer={true}>
      <div className={styles.pageContainer}>
        {/* 页面标题 */}
        <div className={styles.header}>
          <h1 className={styles.title}>蜂蜜变稀：方案评估</h1>
          <p className={styles.subtitle}>
            小明提出了以下三种比较蜂蜜黏度的方法。请分析三种方法的优缺点，并写在相应的方框内。
          </p>
        </div>

      {/* 主内容区域 */}
      <div className={styles.content}>
        {methods.map((method) => (
          <div key={method.id} className={styles.methodCard}>
            {/* 方法展示区 */}
            {method.layoutType === 'horizontal' ? (
              // 横向布局：标题单独一行居中，下面文字和图片并列
              <div className={styles.methodHeaderHorizontal}>
                <h2 className={styles.methodName}>{method.name}</h2>
                <div className={styles.horizontalContent}>
                  <div className={styles.methodInfo}>
                    <p className={styles.methodDescription}>{method.description}</p>
                  </div>
                  <div className={styles.methodImageContainer}>
                    <img
                      src={method.image}
                      alt={method.name}
                      className={styles.methodImage}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className={styles.methodPlaceholder}>
                      <div className={styles.placeholderIcon}>{method.imagePlaceholder}</div>
                      <p className={styles.placeholderText}>{method.name}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // 纵向布局：文字在上，图片在下
              <div className={styles.methodHeader}>
                <div className={styles.methodInfo}>
                  <h2 className={styles.methodName}>{method.name}</h2>
                  <p className={styles.methodDescription}>{method.description}</p>
                </div>
                <div className={styles.methodImageContainer}>
                  <img
                    src={method.image}
                    alt={method.name}
                    className={styles.methodImage}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className={styles.methodPlaceholder}>
                    <div className={styles.placeholderIcon}>{method.imagePlaceholder}</div>
                    <p className={styles.placeholderText}>{method.name}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 评估输入区 */}
            <div className={styles.evaluationInputs}>
              {/* 优点输入 */}
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  <span className={styles.labelIcon}>✓</span>
                  <span className={styles.labelText}>优点</span>
                  <span className={styles.charCount}>
                    {evaluations[method.id].advantage.trim().length} 字符
                  </span>
                </label>
                <TextArea
                  id={`${method.id}-advantage`}
                  value={evaluations[method.id].advantage}
                  onChange={(value) => handleInputChange(method.id, 'advantage', value)}
                  placeholder={`请分析${method.name}的优点...`}
                  maxLength={300}
                  rows={3}
                  ariaLabel={`${method.name}优点输入框`}
                />
              </div>

              {/* 缺点输入 */}
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  <span className={styles.labelIcon}>✗</span>
                  <span className={styles.labelText}>缺点</span>
                  <span className={styles.charCount}>
                    {evaluations[method.id].disadvantage.trim().length} 字符
                  </span>
                </label>
                <TextArea
                  id={`${method.id}-disadvantage`}
                  value={evaluations[method.id].disadvantage}
                  onChange={(value) => handleInputChange(method.id, 'disadvantage', value)}
                  placeholder={`请分析${method.name}的缺点...`}
                  maxLength={300}
                  rows={3}
                  ariaLabel={`${method.name}缺点输入框`}
                />
              </div>
            </div>
          </div>
        ))}

        {/* 进度提示 */}
        <div className={canNavigate ? styles.successBar : styles.progressBar}>
          <div className={styles.progressIcon}>
            {canNavigate ? '✓' : '📝'}
          </div>
          <div className={styles.progressText}>
            {canNavigate ? (
              <span className={styles.successMessage}>
                很好！已完成 {filledFieldsCount} 个输入框，可以继续下一页。
              </span>
            ) : (
              <span className={styles.progressMessage}>
                已完成 <strong>{filledFieldsCount}</strong> / {MIN_FILLED_FIELDS} 个必填输入框
                {MIN_FILLED_FIELDS - filledFieldsCount > 0 &&
                  `，还需填写 ${MIN_FILLED_FIELDS - filledFieldsCount} 个`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 底部按钮区域 */}
      <div className={styles.footer}>
        <Button
          onClick={handleNextPage}
          disabled={!canNavigate || isNavigating}
          loading={isNavigating}
          variant="primary"
          ariaLabel="进入下一页"
        >
          下一页
        </Button>
      </div>
      </div>
    </PageLayout>
  );
};

export default Page08_Evaluation;
