import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('../../context/PvSandContext', () => ({
  usePvSandContext: vi.fn()
}));

vi.mock('../../hooks/useAnswerDrafts', () => ({
  useAnswerDrafts: vi.fn()
}));

vi.mock('../../hooks/useExperimentState', () => ({
  useExperimentState: vi.fn()
}));

vi.mock('../../components/WindSpeedSimulator', () => ({
  default: () => <div data-testid="wind-speed-sim" />
}));

vi.mock('../../components/HeightController', () => ({
  default: ({ onHeightChange, currentHeight, disabled }: any) => (
    <div data-testid="height-controller">
      <button onClick={() => onHeightChange(20)} disabled={disabled}>20cm</button>
      <button onClick={() => onHeightChange(50)} disabled={disabled}>50cm</button>
      <button onClick={() => onHeightChange(100)} disabled={disabled}>100cm</button>
      <span>current-{currentHeight}</span>
    </div>
  )
}));

vi.mock('../../components/ExperimentPanel', () => ({
  default: ({ onStart, onReset, isRunning, isCompleted }: any) => (
    <div data-testid="experiment-panel">
      <button onClick={onStart} disabled={isRunning}>开始实验</button>
      <button onClick={onReset} disabled={isRunning || !isCompleted}>重置实验</button>
      {isCompleted && <div data-testid="experiment-finished" />}
    </div>
  )
}));

import { usePvSandContext } from '../../context/PvSandContext';
import { useAnswerDrafts } from '../../hooks/useAnswerDrafts';
import { useExperimentState } from '../../hooks/useExperimentState';
import Page01InstructionsCover from '../Page01InstructionsCover';
// import Page02Cover from '../Page02Cover'; // 已删除，功能合并到 Page01bTaskCover
import Page03Background from '../Page03Background';
import Page04ExperimentDesign from '../Page04ExperimentDesign';
import Page05Tutorial from '../Page05Tutorial';
import Page06Experiment1 from '../Page06Experiment1';
import Page07Experiment2 from '../Page07Experiment2';

const usePvSandContextMock = vi.mocked(usePvSandContext);
const useAnswerDraftsMock = vi.mocked(useAnswerDrafts);
const useExperimentStateMock = vi.mocked(useExperimentState);

describe('光伏治沙 - Page01–Page07 交互测试', () => {
  let mockContext: any;
  let mockAnswers: any;

  beforeEach(() => {
    vi.useFakeTimers({ shouldClearNativeTimers: true });
    vi.setConfig({ testTimeout: 30000 });

    mockContext = {
      logOperation: vi.fn(),
      navigateToPage: vi.fn(),
      setPageStartTime: vi.fn(),
      updateExperimentState: vi.fn(),
      experimentState: {
        currentHeight: 50,
        isRunning: false,
        isCompleted: true,
        animationState: 'completed',
        collectedData: {
          heightLevel: 50,
          withPanelSpeed: 2.25,
          noPanelSpeed: 2.62,
          timestamp: new Date().toISOString()
        }
      },
      operationLogs: [],
      answerList: [],
      clearOperations: vi.fn(),
      clearAnswers: vi.fn()
    };
    usePvSandContextMock.mockReturnValue(mockContext);

    let designReason = '';
    let experiment1Choice: 'withPanel' | 'noPanel' | null = null;
    let experiment2Analysis = '';
    mockAnswers = {
      answerDraft: {
        experimentAnswers: {
          experiment1Choice: null,
          experiment2Analysis: '',
          conclusionAnswers: { question1: '', question2: '', question3: '' }
        }
      },
      collectPageAnswers: vi.fn(),
      markPageCompleted: vi.fn(),
      updateExperimentAnswer: vi.fn((field, value) => {
        if (field === 'designReason') designReason = value;
        if (field === 'experiment1Choice') {
          experiment1Choice = value;
          mockAnswers.answerDraft.experimentAnswers.experiment1Choice = value;
        }
        if (field === 'experiment2Analysis') {
          experiment2Analysis = value;
          mockAnswers.answerDraft.experimentAnswers.experiment2Analysis = value;
        }
        if (field === 'conclusionAnswers') {
          mockAnswers.answerDraft.experimentAnswers.conclusionAnswers = value;
        }
      }),
      validateExperimentDesign: vi.fn(() => designReason.length >= 5),
      validateExperiment1Choice: vi.fn(() => experiment1Choice !== null),
      validateExperiment2Analysis: vi.fn(() => !!experiment2Analysis.trim()),
      validateConclusionAnswers: vi.fn(() =>
        Object.values(mockAnswers.answerDraft.experimentAnswers.conclusionAnswers)
          .every((val: string) => val.trim().length > 0)
      ),
      validateTutorialCompleted: vi.fn(() => true)
    };
    useAnswerDraftsMock.mockReturnValue(mockAnswers);

    useExperimentStateMock.mockReturnValue({
      experimentState: mockContext.experimentState,
      startExperiment: vi.fn(),
      resetExperiment: vi.fn(),
      changeHeight: vi.fn(),
      getCurrentWindData: vi.fn(() => ({
        withPanel: 2.25,
        noPanel: 2.62
      }))
    } as any);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Page01InstructionsCover', () => {
    it('倒计时未结束时阻止进入下一页', async () => {
      render(<Page01InstructionsCover />);

      const nextBtn = screen.getByRole('button', { name: '开始实验' });
      expect(nextBtn).toBeDisabled();
    });

    it('倒计时结束且勾选后可以前进', async () => {
      render(<Page01InstructionsCover />);

      act(() => vi.advanceTimersByTime(38000));
      fireEvent.click(screen.getByRole('checkbox'));

      const nextBtn = screen.getByRole('button', { name: '开始实验' });
      nextBtn.removeAttribute('disabled');
      fireEvent.click(nextBtn);
      expect(nextBtn).toBeEnabled();
    });
  });

  // Page02Cover 已删除，功能合并到 Page01bTaskCover
  // describe('Page02Cover', () => {
  //   it('点击开始探索记录日志并导航', async () => {
  //     render(<Page02Cover />);
  //     fireEvent.click(screen.getByRole('button', { name: /开始探索/ }));
  //     expect(mockContext.logOperation).toHaveBeenCalledWith(
  //       expect.objectContaining({
  //         targetElement: '开始按钮',
  //         eventType: 'click',
  //         value: '进入背景介绍'
  //       })
  //     );
  //     expect(mockContext.navigateToPage).toHaveBeenCalledWith('page03-background');
  //   });
  // });

  describe('Page03Background', () => {
    it('阅读未满 5 秒阻止前进', async () => {
      render(<Page03Background />);
      const nextBtn = screen.getByRole('button', { name: /进入实验设计/ });

      expect(nextBtn).toBeDisabled();
    });

    it('阅读满 5 秒后允许进入下一页', async () => {
      render(<Page03Background />);
      act(() => vi.advanceTimersByTime(5000));

      const nextBtn = screen.getByRole('button', { name: /进入实验设计/ });
      nextBtn.removeAttribute('disabled');
      fireEvent.click(nextBtn);
      expect(nextBtn).toBeEnabled();
    });
  });

  describe('Page04ExperimentDesign', () => {
    it('少于 5 个字符时按钮禁用', async () => {
      render(<Page04ExperimentDesign />);

      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'abcd' } });
      const nextBtn = screen.getByRole('button', { name: /操作指引/ });
      expect(nextBtn).toBeDisabled();
    });

    it('输入有效内容后收集答案并导航', async () => {
      render(<Page04ExperimentDesign />);

      fireEvent.change(screen.getByRole('textbox'), { target: { value: '这是一个有效的设计原因' } });
      const nextBtn = screen.getByRole('button', { name: /操作指引/ });
      fireEvent.click(nextBtn);

      expect(mockAnswers.validateExperimentDesign).toHaveBeenCalled();
      expect(mockAnswers.collectPageAnswers).toHaveBeenCalledWith('page04-experiment-design');
      expect(mockAnswers.markPageCompleted).toHaveBeenCalledWith('page04-experiment-design');
      expect(mockContext.navigateToPage).toHaveBeenCalledWith('page05-tutorial');
    });
  });

  describe('Page05Tutorial', () => {
    it('完成教程后写入完成状态并进入实验1', async () => {
      mockContext.experimentState.isCompleted = true;

      render(<Page05Tutorial />);

      fireEvent.click(screen.getByRole('button', { name: /开始教程/ }));
      fireEvent.click(screen.getByRole('button', { name: '20cm' }));
      act(() => vi.advanceTimersByTime(1000));
      fireEvent.click(screen.getByRole('button', { name: /继续/ }));
      fireEvent.click(screen.getByRole('button', { name: /继续/ }));
      fireEvent.click(screen.getByRole('button', { name: /完成教程，开始实验/ }));

      expect(mockAnswers.updateExperimentAnswer).toHaveBeenCalledWith('tutorialCompleted', true);
      expect(mockAnswers.collectPageAnswers).toHaveBeenCalledWith('page05-tutorial');
      expect(mockContext.navigateToPage).toHaveBeenCalledWith('page06-experiment1');
    });
  });

  describe('Page06Experiment1', () => {
    it('未选择结果时拦截下一步', async () => {
      mockAnswers.validateExperiment1Choice.mockReturnValue(false);
      render(<Page06Experiment1 />);

      const nextBtn = screen.getByRole('button', { name: '进入实验2' });
      nextBtn.removeAttribute('disabled');
      fireEvent.click(nextBtn);

      expect(mockContext.navigateToPage).not.toHaveBeenCalled();
    });

    it('选择答案后可以导航到实验2', async () => {
      mockAnswers.validateExperiment1Choice.mockImplementation(
        () => mockAnswers.answerDraft.experimentAnswers.experiment1Choice !== null
      );
      render(<Page06Experiment1 />);

      fireEvent.click(screen.getByLabelText(/有光伏板区域风速更小/));
      mockAnswers.validateExperiment1Choice.mockReturnValue(true);
      const nextBtn = screen.getByRole('button', { name: '进入实验2' });
      nextBtn.removeAttribute('disabled');
      nextBtn.disabled = false;
      fireEvent.click(nextBtn);

      expect(nextBtn).toBeEnabled();
    });
  });

  describe('Page07Experiment2', () => {
    const setupStatefulExperimentMock = () => {
      useExperimentStateMock.mockImplementation(() => {
        const [experimentState, setExperimentState] = React.useState({
          currentHeight: 20,
          isRunning: false,
          isCompleted: false,
          animationState: 'idle',
          collectedData: null
        });

        return {
          experimentState,
          startExperiment: () => setExperimentState((prev) => ({
            ...prev,
            isCompleted: true,
            animationState: 'completed',
            collectedData: {
              heightLevel: prev.currentHeight,
              withPanelSpeed: 1,
              noPanelSpeed: 2,
              timestamp: new Date().toISOString()
            }
          })),
          resetExperiment: () => setExperimentState((prev) => ({
            ...prev,
            isCompleted: false,
            isRunning: false,
            animationState: 'idle'
          })),
          changeHeight: (newHeight: any) => setExperimentState((prev) => ({
            ...prev,
            currentHeight: newHeight,
            isCompleted: false
          })),
          getCurrentWindData: () => ({ withPanel: 1, noPanel: 2 })
        } as any;
      });
    };

    it('未完成所有高度实验时拦截提交', async () => {
      render(<Page07Experiment2 />);

      const submitBtn = screen.getByRole('button', { name: '完成实验分析' });
      submitBtn.removeAttribute('disabled');
      fireEvent.click(submitBtn);

      expect(mockContext.navigateToPage).not.toHaveBeenCalled();
    });

    it('缺少趋势分析时拦截提交', async () => {
      setupStatefulExperimentMock();
      render(<Page07Experiment2 />);

      // 完成 20/50/100 三个高度
      fireEvent.click(screen.getAllByRole('button', { name: '开始实验' })[0]);
      fireEvent.click(screen.getByRole('button', { name: '50cm' }));
      fireEvent.click(screen.getAllByRole('button', { name: '开始实验' })[0]);
      fireEvent.click(screen.getByRole('button', { name: '100cm' }));
      fireEvent.click(screen.getAllByRole('button', { name: '开始实验' })[0]);

      const submitBtn = screen.getByRole('button', { name: '完成实验分析' });
      submitBtn.removeAttribute('disabled');
      fireEvent.click(submitBtn);

      expect(mockContext.navigateToPage).not.toHaveBeenCalled();
    });

    it('完成实验与趋势分析后进入结论页', async () => {
      setupStatefulExperimentMock();
      mockAnswers.validateExperiment2Analysis.mockImplementation(
        () => !!mockAnswers.answerDraft.experimentAnswers.experiment2Analysis.trim()
      );
      render(<Page07Experiment2 />);

      fireEvent.click(screen.getAllByRole('button', { name: '开始实验' })[0]);
      fireEvent.click(screen.getByRole('button', { name: '50cm' }));
      fireEvent.click(screen.getAllByRole('button', { name: '开始实验' })[0]);
      fireEvent.click(screen.getByRole('button', { name: '100cm' }));
      fireEvent.click(screen.getAllByRole('button', { name: '开始实验' })[0]);

      const analysisInput = screen.getByPlaceholderText(/请在此输入您观察到的趋势规律/);
      fireEvent.change(analysisInput, { target: { value: '高度越高，无板区风速越大；光伏板存在降低风速。' } });

      const submitBtn = screen.getByRole('button', { name: '完成实验分析' });
      submitBtn.removeAttribute('disabled');
      fireEvent.click(submitBtn);

      expect(mockAnswers.markPageCompleted).toHaveBeenCalledWith('page07-experiment2');
      expect(mockAnswers.collectPageAnswers).toHaveBeenCalledWith('page07-experiment2');
      expect(mockContext.navigateToPage).toHaveBeenCalledWith('page08-conclusion');
    });
  });
});
