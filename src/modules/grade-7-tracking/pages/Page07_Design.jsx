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
import { useTrackingContext } from '../context/TrackingProvider.jsx';
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
    navigateToPage,
    submitPageData
  } = useTrackingContext();

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
      value: `字符数：${value.trim().length}`,
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
      value: `字符数：${value.trim().length}`,
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
      value: `字符数：${value.trim().length}`,
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

      // 同步构建答案列表，避免依赖异步的 collectAnswer 状态
      const answerList = [
        { targetElement: '实验想法1', value: idea1.trim() },
        { targetElement: '实验想法2', value: idea2.trim() },
        { targetElement: '实验想法3', value: idea3.trim() },
      ];

      // 构建并提交MarkObject
      // 从session获取当前页码而不是硬编码
      const pageInfo = PAGE_MAPPING[session.currentPage];
      const markObject = buildMarkObject(
        String(session.currentPage),
        pageInfo?.desc || '方案设计',
        { answerList }
      );
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
  }, [isNavigating, canNavigate, idea1, idea2, idea3, logOperation, buildMarkObject, submitPageData, clearOperations, navigateToPage, session]);

  return (
    <PageLayout showNavigation={true} showTimer={true}>
      <div className={styles.pageContainer}>
        {/* 页面标题 */}
        <div className={styles.header}>
          <h1 className={styles.title}>蜂蜜变稀：方案设计</h1>
          <p className={styles.subtitle}>
            为验证小明的猜想，首先要确定评估蜂蜜黏度的方法。
          </p>
          <p className={styles.subtitle}>
            <strong>假设有两瓶蜂蜜，请你帮小明想一想，有哪些可以比较两瓶蜂蜜黏度的方法。</strong>请提出三个可能的想法，将其简要陈述在下方方框内。
          </p>
        </div>

        {/* 主内容区域 - 单列布局 */}
        <div className={styles.content}>
          {/* 想法1 */}
          <div className={styles.ideaRow}>
            <label className={styles.ideaLabel}>1. 想法一：</label>
            <TextArea
              id="idea-1"
              value={idea1}
              onChange={handleIdea1Change}
              placeholder="请输入你的想法..."
              maxLength={500}
              showCharCount={false}
              rows={8}
              ariaLabel="实验方案想法一输入框"
            />
          </div>

          {/* 想法2 */}
          <div className={styles.ideaRow}>
            <label className={styles.ideaLabel}>2. 想法二：</label>
            <TextArea
              id="idea-2"
              value={idea2}
              onChange={handleIdea2Change}
              placeholder="请输入你的想法..."
              maxLength={500}
              showCharCount={false}
              rows={8}
              ariaLabel="实验方案想法二输入框"
            />
          </div>

          {/* 想法3 */}
          <div className={styles.ideaRow}>
            <label className={styles.ideaLabel}>3. 想法三：</label>
            <TextArea
              id="idea-3"
              value={idea3}
              onChange={handleIdea3Change}
              placeholder="请输入你的想法..."
              maxLength={500}
              showCharCount={false}
              rows={8}
              ariaLabel="实验方案想法三输入框"
            />
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

export default Page07_Design;
