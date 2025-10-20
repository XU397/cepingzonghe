/**
 * Page07_Design - 方案设计页面
 *
 * FR-014: 3个想法输入框 (每个最少2个字)
 *
 * 页面内容:
 * - 标题: "设计实验方案"
 * - 3个独立的TextArea组件 (想法1, 想法2, 想法3)
 * - 字符计数和验证逻辑
 * - "下一页"按钮 (所有3个输入框字符数≥2才能点击)
 *
 * @component
 */

import { useEffect, useState, useCallback } from 'react';
import { useTrackingContext } from '../context/TrackingContext.jsx';
import { useDataLogger } from '../hooks/useDataLogger';
import { PAGE_MAPPING } from '../config.js';
import Button from '../components/ui/Button.jsx';
import TextArea from '../components/ui/TextArea.jsx';
import PageLayout from '../components/layout/PageLayout.jsx';
import styles from '../styles/Page07_Design.module.css';

const MIN_CHAR_COUNT = 2; // 每个输入框最少字符数

const Page07_Design = () => {
  const {
    session,
    logOperation,
    collectAnswer,
    clearOperations,
    buildMarkObject,
    navigateToPage
  } = useTrackingContext();

  const { submitPageData } = useDataLogger();
  const [pageStartTime] = useState(() => Date.now());
  const [isNavigating, setIsNavigating] = useState(false);

  // 3个想法的状态
  const [idea1, setIdea1] = useState('');
  const [idea2, setIdea2] = useState('');
  const [idea3, setIdea3] = useState('');

  // 编辑状态追踪
  const [editStartTime, setEditStartTime] = useState({
    idea1: null,
    idea2: null,
    idea3: null,
  });

  // 计算是否可以导航
  const canNavigate =
    idea1.trim().length >= MIN_CHAR_COUNT &&
    idea2.trim().length >= MIN_CHAR_COUNT &&
    idea3.trim().length >= MIN_CHAR_COUNT;

  // 页面进入日志
  useEffect(() => {
    logOperation({
      action: 'page_enter',
      target: 'page_07_design',
      value: '方案设计页面',
      time: new Date().toISOString(),
    });

    return () => {
      // 页面离开日志
      logOperation({
        action: 'page_exit',
        target: 'page_07_design',
        value: `停留时长: ${((Date.now() - pageStartTime) / 1000).toFixed(1)}秒`,
        time: new Date().toISOString(),
      });
    };
  }, [logOperation, pageStartTime]);

  // 处理想法1输入
  const handleIdea1Change = useCallback((value) => {
    if (!editStartTime.idea1) {
      const now = Date.now();
      setEditStartTime(prev => ({ ...prev, idea1: now }));
      logOperation({
        action: 'start_edit',
        target: '实验想法输入框1',
        value: 'focus',
        time: new Date().toISOString(),
      });
    }

    setIdea1(value);
    logOperation({
      action: '文本域输入',
      target: '实验想法输入框1',
      value: `字符数: ${value.trim().length}`,
      time: new Date().toISOString(),
    });
  }, [editStartTime.idea1, logOperation]);

  // 处理想法2输入
  const handleIdea2Change = useCallback((value) => {
    if (!editStartTime.idea2) {
      const now = Date.now();
      setEditStartTime(prev => ({ ...prev, idea2: now }));
      logOperation({
        action: 'start_edit',
        target: '实验想法输入框2',
        value: 'focus',
        time: new Date().toISOString(),
      });
    }

    setIdea2(value);
    logOperation({
      action: '文本域输入',
      target: '实验想法输入框2',
      value: `字符数: ${value.trim().length}`,
      time: new Date().toISOString(),
    });
  }, [editStartTime.idea2, logOperation]);

  // 处理想法3输入
  const handleIdea3Change = useCallback((value) => {
    if (!editStartTime.idea3) {
      const now = Date.now();
      setEditStartTime(prev => ({ ...prev, idea3: now }));
      logOperation({
        action: 'start_edit',
        target: '实验想法输入框3',
        value: 'focus',
        time: new Date().toISOString(),
      });
    }

    setIdea3(value);
    logOperation({
      action: '文本域输入',
      target: '实验想法输入框3',
      value: `字符数: ${value.trim().length}`,
      time: new Date().toISOString(),
    });
  }, [editStartTime.idea3, logOperation]);

  // 处理"下一页"点击
  const handleNextPage = useCallback(async () => {
    if (isNavigating || !canNavigate) return;

    setIsNavigating(true);

    try {
      // 记录完成状态
      logOperation({
        action: 'complete_design',
        target: 'design_ideas',
        value: JSON.stringify({
          idea1Length: idea1.trim().length,
          idea2Length: idea2.trim().length,
          idea3Length: idea3.trim().length,
        }),
        time: new Date().toISOString(),
      });

      logOperation({
        action: 'click_next',
        target: '下一页按钮',
        value: 'page_07_to_page_08',
        time: new Date().toISOString(),
      });

      // 收集答案
      collectAnswer({
        targetElement: '实验想法1',
        value: idea1.trim()
      });
      collectAnswer({
        targetElement: '实验想法2',
        value: idea2.trim()
      });
      collectAnswer({
        targetElement: '实验想法3',
        value: idea3.trim()
      });

      // 构建并提交MarkObject
      // 从session获取当前页码而不是硬编码
      const pageInfo = PAGE_MAPPING[session.currentPage];
      const markObject = buildMarkObject(String(session.currentPage), pageInfo?.desc || '方案设计');
      const success = await submitPageData(markObject);

      if (success) {
        clearOperations();
        await navigateToPage(6);
      } else {
        throw new Error('数据提交失败');
      }
    } catch (error) {
      console.error('[Page07_Design] 导航失败:', error);
      alert(error.message || '页面跳转失败，请重试');
      setIsNavigating(false);
    }
  }, [isNavigating, canNavigate, idea1, idea2, idea3, logOperation, collectAnswer, buildMarkObject, submitPageData, clearOperations, navigateToPage, session]);

  return (
    <PageLayout showNavigation={true} showTimer={true}>
      <div className={styles.pageContainer}>
        {/* 页面标题 */}
        <div className={styles.header}>
          <h1 className={styles.title}>设计实验方案</h1>
        <p className={styles.subtitle}>
          请根据提出的假设，设计3种不同的实验方案来验证蜂蜜黏度与温度、含水量的关系。
          每个想法至少填写 <strong>{MIN_CHAR_COUNT}</strong> 个字符。
        </p>
      </div>

      {/* 主内容区域 */}
      <div className={styles.content}>
        {/* 想法1 */}
        <div className={styles.ideaCard}>
          <div className={styles.ideaHeader}>
            <div className={styles.ideaNumber}>1</div>
            <h2 className={styles.ideaTitle}>想法一</h2>
            <div className={styles.charCountBadge}>
              <span
                className={
                  idea1.trim().length >= MIN_CHAR_COUNT
                    ? styles.charCountValid
                    : styles.charCountInvalid
                }
              >
                {idea1.trim().length}/{MIN_CHAR_COUNT} 字符
              </span>
            </div>
          </div>
          <TextArea
            id="idea-1"
            value={idea1}
            onChange={handleIdea1Change}
            placeholder="请描述你的第一个实验方案想法，包括实验目的、方法、需要控制的变量等..."
            maxLength={500}
            showCharCount={true}
            rows={5}
            ariaLabel="实验方案想法一输入框"
          />
        </div>

        {/* 想法2 */}
        <div className={styles.ideaCard}>
          <div className={styles.ideaHeader}>
            <div className={styles.ideaNumber}>2</div>
            <h2 className={styles.ideaTitle}>想法二</h2>
            <div className={styles.charCountBadge}>
              <span
                className={
                  idea2.trim().length >= MIN_CHAR_COUNT
                    ? styles.charCountValid
                    : styles.charCountInvalid
                }
              >
                {idea2.trim().length}/{MIN_CHAR_COUNT} 字符
              </span>
            </div>
          </div>
          <TextArea
            id="idea-2"
            value={idea2}
            onChange={handleIdea2Change}
            placeholder="请描述你的第二个实验方案想法，可以从不同角度或使用不同方法进行实验..."
            maxLength={500}
            showCharCount={true}
            rows={5}
            ariaLabel="实验方案想法二输入框"
          />
        </div>

        {/* 想法3 */}
        <div className={styles.ideaCard}>
          <div className={styles.ideaHeader}>
            <div className={styles.ideaNumber}>3</div>
            <h2 className={styles.ideaTitle}>想法三</h2>
            <div className={styles.charCountBadge}>
              <span
                className={
                  idea3.trim().length >= MIN_CHAR_COUNT
                    ? styles.charCountValid
                    : styles.charCountInvalid
                }
              >
                {idea3.trim().length}/{MIN_CHAR_COUNT} 字符
              </span>
            </div>
          </div>
          <TextArea
            id="idea-3"
            value={idea3}
            onChange={handleIdea3Change}
            placeholder="请描述你的第三个实验方案想法，思考如何让实验结果更加准确可靠..."
            maxLength={500}
            showCharCount={true}
            rows={5}
            ariaLabel="实验方案想法三输入框"
          />
        </div>

        {/* 提示信息 */}
        {!canNavigate && (
          <div className={styles.hintCard}>
            <div className={styles.hintIcon}>💡</div>
            <p className={styles.hintText}>
              请确保所有3个想法都至少填写了 <strong>{MIN_CHAR_COUNT}</strong> 个字符才能进入下一页。
              {idea1.trim().length < MIN_CHAR_COUNT && ' 想法一还需 ' + (MIN_CHAR_COUNT - idea1.trim().length) + ' 字符。'}
              {idea2.trim().length < MIN_CHAR_COUNT && ' 想法二还需 ' + (MIN_CHAR_COUNT - idea2.trim().length) + ' 字符。'}
              {idea3.trim().length < MIN_CHAR_COUNT && ' 想法三还需 ' + (MIN_CHAR_COUNT - idea3.trim().length) + ' 字符。'}
            </p>
          </div>
        )}

        {canNavigate && (
          <div className={styles.successCard}>
            <div className={styles.successIcon}>✓</div>
            <p className={styles.successText}>
              很好！所有想法都已填写完成，点击&quot;下一页&quot;继续。
            </p>
          </div>
        )}
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

export default Page07_Design;
