/**
 * @file useAnswerDrafts.test.tsx
 * @description useAnswerDrafts Hook校验规则和状态管理测试
 * @author Claude (Test Infrastructure)  
 * @created 2025-11-19
 * 
 * 测试覆盖:
 * - 答案草稿状态管理
 * - 校验规则逻辑验证
 * - localStorage持久化
 * - 页面答案收集与验证
 * - 实验答案更新流程
 * - Edge cases处理
 */

import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useAnswerDrafts } from '../hooks/useAnswerDrafts';
import { 
  createMockPvSandProvider,
  createMockAnswerDraft,
  createMockContextValue,
  setupTestLocalStorage,
  expectLocalStorageCall,
  expectOperationLogged,
  expectAnswerCollected
} from './testUtils.jsx';

// Mock usePvSandContext hook
vi.mock('../context/PvSandContext', () => ({
  usePvSandContext: vi.fn()
}));

import { usePvSandContext } from '../context/PvSandContext';

// Mock PvSandContext
const mockContextValue = createMockContextValue();

const TestWrapper = createMockPvSandProvider(mockContextValue);

describe('useAnswerDrafts Hook 测试', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // 重置mock context值
    Object.assign(mockContextValue, createMockContextValue());
    // 设置mock hook返回值
    vi.mocked(usePvSandContext).mockReturnValue(mockContextValue);
  });

  describe('初始化和localStorage持久化', () => {
    it('应该正确初始化默认答案草稿', () => {
      const { result } = renderHook(() => useAnswerDrafts(), { wrapper: TestWrapper });
      
      expect(result.current.answerDraft).toEqual(
        expect.objectContaining({
          pageAnswers: {},
          experimentAnswers: expect.objectContaining({
            designReason: '',
            tutorialCompleted: false,
            experiment1Choice: null,
            experiment2Analysis: '',
            conclusionAnswers: expect.objectContaining({
              question1: '',
              question2: '',
              question3: ''
            })
          }),
          metadata: expect.objectContaining({
            submoduleId: 'g8-pv-sand-experiment',
            totalPages: 5,
            completedPages: []
          })
        })
      );
    });

    it('应该从localStorage恢复答案草稿', () => {
      const savedDraft = createMockAnswerDraft({
        experimentAnswers: {
          designReason: '测试光伏板高度影响',
          tutorialCompleted: true,
          experiment1Choice: 'height50cm',
          experiment2Analysis: '',
          conclusionAnswers: {
            question1: '',
            question2: '',
            question3: ''
          }
        }
      });

      setupTestLocalStorage({
        'module.g8-pv-sand-experiment.answers': JSON.stringify(savedDraft)
      });

      const { result } = renderHook(() => useAnswerDrafts(), { wrapper: TestWrapper });
      
      expect(result.current.answerDraft.experimentAnswers.designReason)
        .toBe('测试光伏板高度影响');
      expect(result.current.answerDraft.experimentAnswers.tutorialCompleted)
        .toBe(true);
      expect(result.current.answerDraft.experimentAnswers.experiment1Choice)
        .toBe('height50cm');
    });

    it('应该处理localStorage读取失败', () => {
      // Mock localStorage.getItem抛出异常
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn().mockImplementation(() => {
        throw new Error('Storage not available');
      });

      const { result } = renderHook(() => useAnswerDrafts(), { wrapper: TestWrapper });
      
      // 应该fallback到默认值
      expect(result.current.answerDraft.experimentAnswers.designReason).toBe('');
      
      // 恢复原方法
      localStorage.getItem = originalGetItem;
    });

    it('应该自动保存答案变更到localStorage', () => {
      const { result } = renderHook(() => useAnswerDrafts(), { wrapper: TestWrapper });

      act(() => {
        result.current.updateExperimentAnswer('designReason', '新的设计原因');
      });

      expectLocalStorageCall('setItem', 
        'module.g8-pv-sand-experiment.answers',
        expect.stringContaining('新的设计原因')
      );
    });
  });

  describe('页面答案更新和验证', () => {
    it('应该正确更新页面答案', () => {
      const { result } = renderHook(() => useAnswerDrafts(), { wrapper: TestWrapper });

      act(() => {
        result.current.updatePageAnswer(
          'page04-experiment-design',
          'question1',
          '因为高度会影响风速流动',
          true
        );
      });

      expect(mockContextValue.updateAnswerDraft).toHaveBeenCalledWith({
        pageAnswers: {
          'page04-experiment-design': {
            'question1': {
              value: '因为高度会影响风速流动',
              lastModified: expect.any(String),
              isValid: true,
              validationMessage: undefined
            }
          }
        }
      });

      expectOperationLogged(mockContextValue.logOperation, {
        targetElement: 'page04-experiment-design_question1',
        eventType: 'change',
        value: '因为高度会影响风速流动'
      });
    });

    it('应该处理验证失败的答案', () => {
      const { result } = renderHook(() => useAnswerDrafts(), { wrapper: TestWrapper });

      act(() => {
        result.current.updatePageAnswer(
          'page04-experiment-design',
          'question1',
          'ab', // 太短
          false,
          '答案长度至少5个字符'
        );
      });

      expect(mockContextValue.updateAnswerDraft).toHaveBeenCalledWith({
        pageAnswers: {
          'page04-experiment-design': {
            'question1': {
              value: 'ab',
              lastModified: expect.any(String),
              isValid: false,
              validationMessage: '答案长度至少5个字符'
            }
          }
        }
      });
    });

    it('validatePageAnswers应该正确验证页面答案', () => {
      // 设置带有有效答案的context
      const contextWithAnswers = createMockContextValue({
        answerDraft: createMockAnswerDraft({
          pageAnswers: {
            'page04-experiment-design': {
              'question1': { 
                value: '有效答案', 
                isValid: true, 
                lastModified: '2025-11-19T10:00:00Z' 
              },
              'question2': { 
                value: '另一个有效答案', 
                isValid: true, 
                lastModified: '2025-11-19T10:01:00Z' 
              }
            }
          }
        })
      });

      const TestWrapperWithAnswers = createMockPvSandProvider(contextWithAnswers);
      const { result } = renderHook(() => useAnswerDrafts(), { wrapper: TestWrapperWithAnswers });

      expect(result.current.validatePageAnswers('page04-experiment-design')).toBe(true);
      expect(result.current.validatePageAnswers('page05-tutorial')).toBe(false); // 无答案
    });
  });

  describe('实验答案更新', () => {
    it('应该正确更新实验设计原因', () => {
      const { result } = renderHook(() => useAnswerDrafts(), { wrapper: TestWrapper });

      act(() => {
        result.current.updateExperimentAnswer('designReason', '测试不同高度对风沙治理的影响');
      });

      expect(mockContextValue.updateAnswerDraft).toHaveBeenCalledWith({
        experimentAnswers: {
          designReason: '测试不同高度对风沙治理的影响',
          tutorialCompleted: false,
          experiment1Choice: null,
          experiment2Analysis: '',
          conclusionAnswers: {
            question1: '',
            question2: '',
            question3: ''
          }
        }
      });

      expectOperationLogged(mockContextValue.logOperation, {
        targetElement: '实验答案_designReason',
        eventType: 'change',
        value: '测试不同高度对风沙治理的影响'
      });
    });

    it('应该正确更新教程完成状态', () => {
      const { result } = renderHook(() => useAnswerDrafts(), { wrapper: TestWrapper });

      act(() => {
        result.current.updateExperimentAnswer('tutorialCompleted', true);
      });

      expect(mockContextValue.updateAnswerDraft).toHaveBeenCalledWith({
        experimentAnswers: expect.objectContaining({
          tutorialCompleted: true
        })
      });
    });

    it('应该正确更新实验1选择', () => {
      const { result } = renderHook(() => useAnswerDrafts(), { wrapper: TestWrapper });

      act(() => {
        result.current.updateExperimentAnswer('experiment1Choice', 'height50cm');
      });

      expect(mockContextValue.updateAnswerDraft).toHaveBeenCalledWith({
        experimentAnswers: expect.objectContaining({
          experiment1Choice: 'height50cm'
        })
      });
    });
  });

  describe('校验规则测试', () => {
    describe('validateExperimentDesign', () => {
      it('设计原因长度 >= 5 应该返回true', () => {
        const contextWithValidDesign = createMockContextValue({
          answerDraft: createMockAnswerDraft({
            experimentAnswers: {
              designReason: '测试光伏板高度对风沙的影响',
              tutorialCompleted: false,
              experiment1Choice: null,
              experiment2Analysis: '',
              conclusionAnswers: { question1: '', question2: '', question3: '' }
            }
          })
        });

        const TestWrapperWithValidDesign = createMockPvSandProvider(contextWithValidDesign);
        const { result } = renderHook(() => useAnswerDrafts(), { wrapper: TestWrapperWithValidDesign });

        expect(result.current.validateExperimentDesign()).toBe(true);
      });

      it('设计原因长度 < 5 应该返回false', () => {
        const contextWithInvalidDesign = createMockContextValue({
          answerDraft: createMockAnswerDraft({
            experimentAnswers: {
              designReason: 'abc', // 只有3个字符
              tutorialCompleted: false,
              experiment1Choice: null,
              experiment2Analysis: '',
              conclusionAnswers: { question1: '', question2: '', question3: '' }
            }
          })
        });

        const TestWrapperWithInvalidDesign = createMockPvSandProvider(contextWithInvalidDesign);
        const { result } = renderHook(() => useAnswerDrafts(), { wrapper: TestWrapperWithInvalidDesign });

        expect(result.current.validateExperimentDesign()).toBe(false);
      });
    });

    describe('validateExperiment1Choice', () => {
      it('有实验1选择时应该返回true', () => {
        const contextWithChoice = createMockContextValue({
          answerDraft: createMockAnswerDraft({
            experimentAnswers: {
              designReason: '',
              tutorialCompleted: false,
              experiment1Choice: 'height50cm',
              experiment2Analysis: '',
              conclusionAnswers: { question1: '', question2: '', question3: '' }
            }
          })
        });

        const TestWrapperWithChoice = createMockPvSandProvider(contextWithChoice);
        const { result } = renderHook(() => useAnswerDrafts(), { wrapper: TestWrapperWithChoice });

        expect(result.current.validateExperiment1Choice()).toBe(true);
      });

      it('没有实验1选择时应该返回false', () => {
        const { result } = renderHook(() => useAnswerDrafts(), { wrapper: TestWrapper });
        
        expect(result.current.validateExperiment1Choice()).toBe(false);
      });
    });

    describe('validateExperiment2Analysis', () => {
      it('有非空分析内容时应该返回true', () => {
        const contextWithAnalysis = createMockContextValue({
          answerDraft: createMockAnswerDraft({
            experimentAnswers: {
              designReason: '',
              tutorialCompleted: false,
              experiment1Choice: null,
              experiment2Analysis: '随着高度增加，发电效率提升',
              conclusionAnswers: { question1: '', question2: '', question3: '' }
            }
          })
        });

        const TestWrapperWithAnalysis = createMockPvSandProvider(contextWithAnalysis);
        const { result } = renderHook(() => useAnswerDrafts(), { wrapper: TestWrapperWithAnalysis });

        expect(result.current.validateExperiment2Analysis()).toBe(true);
      });

      it('空或只有空格的分析应该返回false', () => {
        const contextWithEmptyAnalysis = createMockContextValue({
          answerDraft: createMockAnswerDraft({
            experimentAnswers: {
              designReason: '',
              tutorialCompleted: false,
              experiment1Choice: null,
              experiment2Analysis: '   ', // 只有空格
              conclusionAnswers: { question1: '', question2: '', question3: '' }
            }
          })
        });

        const TestWrapperWithEmptyAnalysis = createMockPvSandProvider(contextWithEmptyAnalysis);
        const { result } = renderHook(() => useAnswerDrafts(), { wrapper: TestWrapperWithEmptyAnalysis });

        expect(result.current.validateExperiment2Analysis()).toBe(false);
      });
    });

    describe('validateConclusionAnswers', () => {
      it('所有结论问题都有答案时应该返回true', () => {
        const contextWithConclusions = createMockContextValue({
          answerDraft: createMockAnswerDraft({
            experimentAnswers: {
              designReason: '',
              tutorialCompleted: false,
              experiment1Choice: null,
              experiment2Analysis: '',
              conclusionAnswers: {
                question1: '光伏板高度确实影响风沙治理效果',
                question2: '50cm高度效果最佳',
                question3: '应该根据实际环境调整高度'
              }
            }
          })
        });

        const TestWrapperWithConclusions = createMockPvSandProvider(contextWithConclusions);
        const { result } = renderHook(() => useAnswerDrafts(), { wrapper: TestWrapperWithConclusions });

        expect(result.current.validateConclusionAnswers()).toBe(true);
      });

      it('任意结论问题为空时应该返回false', () => {
        const contextWithIncompleteConclusions = createMockContextValue({
          answerDraft: createMockAnswerDraft({
            experimentAnswers: {
              designReason: '',
              tutorialCompleted: false,
              experiment1Choice: null,
              experiment2Analysis: '',
              conclusionAnswers: {
                question1: '有答案',
                question2: '', // 空答案
                question3: '有答案'
              }
            }
          })
        });

        const TestWrapperWithIncompleteConclusions = createMockPvSandProvider(contextWithIncompleteConclusions);
        const { result } = renderHook(() => useAnswerDrafts(), { wrapper: TestWrapperWithIncompleteConclusions });

        expect(result.current.validateConclusionAnswers()).toBe(false);
      });
    });

    describe('validateTutorialCompleted', () => {
      it('教程完成时应该返回true', () => {
        const contextWithTutorial = createMockContextValue({
          answerDraft: createMockAnswerDraft({
            experimentAnswers: {
              designReason: '',
              tutorialCompleted: true,
              experiment1Choice: null,
              experiment2Analysis: '',
              conclusionAnswers: { question1: '', question2: '', question3: '' }
            }
          })
        });

        const TestWrapperWithTutorial = createMockPvSandProvider(contextWithTutorial);
        const { result } = renderHook(() => useAnswerDrafts(), { wrapper: TestWrapperWithTutorial });

        expect(result.current.validateTutorialCompleted()).toBe(true);
      });

      it('教程未完成时应该返回false', () => {
        const { result } = renderHook(() => useAnswerDrafts(), { wrapper: TestWrapper });
        
        expect(result.current.validateTutorialCompleted()).toBe(false);
      });
    });
  });

  describe('页面完成状态管理', () => {
    it('应该正确标记页面为完成', () => {
      const { result } = renderHook(() => useAnswerDrafts(), { wrapper: TestWrapper });

      act(() => {
        result.current.markPageCompleted('page04-experiment-design');
      });

      expect(mockContextValue.updateAnswerDraft).toHaveBeenCalledWith({
        metadata: expect.objectContaining({
          completedPages: ['page04-experiment-design']
        })
      });
    });

    it('不应该重复添加已完成的页面', () => {
      const contextWithCompletedPage = createMockContextValue({
        answerDraft: createMockAnswerDraft({
          metadata: {
            submoduleId: 'g8-pv-sand-experiment',
            version: '1.0.0',
            createdAt: '2025-11-19T00:00:00Z',
            lastSavedAt: '2025-11-19T00:00:00Z',
            totalPages: 5,
            completedPages: ['page04-experiment-design']
          }
        })
      });

      const TestWrapperWithCompleted = createMockPvSandProvider(contextWithCompletedPage);
      const { result } = renderHook(() => useAnswerDrafts(), { wrapper: TestWrapperWithCompleted });

      act(() => {
        result.current.markPageCompleted('page04-experiment-design'); // 重复标记
      });

      // 不应该更新，因为页面已经在完成列表中
      expect(mockContextValue.updateAnswerDraft).not.toHaveBeenCalled();
    });

    it('getCompletionStatus应该返回正确的完成统计', () => {
      const contextWithProgress = createMockContextValue({
        answerDraft: createMockAnswerDraft({
          metadata: {
            submoduleId: 'g8-pv-sand-experiment',
            version: '1.0.0',
            createdAt: '2025-11-19T00:00:00Z',
            lastSavedAt: '2025-11-19T00:00:00Z',
            totalPages: 5,
            completedPages: ['page04-experiment-design', 'page05-tutorial', 'page06-experiment1']
          }
        })
      });

      const TestWrapperWithProgress = createMockPvSandProvider(contextWithProgress);
      const { result } = renderHook(() => useAnswerDrafts(), { wrapper: TestWrapperWithProgress });

      const status = result.current.getCompletionStatus();
      
      expect(status).toEqual({
        completed: 3,
        total: 5,
        percentage: 60
      });
    });
  });

  describe('答案收集功能', () => {
    it('应该正确收集页面答案', () => {
      const contextWithAnswers = createMockContextValue({
        answerDraft: createMockAnswerDraft({
          pageAnswers: {
            'page04-experiment-design': {
              'question1': { 
                value: '测试光伏板高度影响',
                isValid: true,
                lastModified: '2025-11-19T10:00:00Z'
              }
            }
          },
          experimentAnswers: {
            designReason: '详细的设计原因',
            tutorialCompleted: false,
            experiment1Choice: null,
            experiment2Analysis: '',
            conclusionAnswers: { question1: '', question2: '', question3: '' }
          }
        })
      });

      const TestWrapperWithAnswers = createMockPvSandProvider(contextWithAnswers);
      const { result } = renderHook(() => useAnswerDrafts(), { wrapper: TestWrapperWithAnswers });

      act(() => {
        result.current.collectPageAnswers('page04-experiment-design');
      });

      expectAnswerCollected(mockContextValue.collectAnswer, {
        targetElement: 'P4_question1',
        value: '测试光伏板高度影响'
      });

      expectAnswerCollected(mockContextValue.collectAnswer, {
        targetElement: 'P4_实验设计问题1',
        value: '详细的设计原因'
      });
    });

    it('应该收集教程完成状态', () => {
      const contextWithTutorial = createMockContextValue({
        answerDraft: createMockAnswerDraft({
          experimentAnswers: {
            designReason: '',
            tutorialCompleted: true,
            experiment1Choice: null,
            experiment2Analysis: '',
            conclusionAnswers: { question1: '', question2: '', question3: '' }
          }
        })
      });

      const TestWrapperWithTutorial = createMockPvSandProvider(contextWithTutorial);
      const { result } = renderHook(() => useAnswerDrafts(), { wrapper: TestWrapperWithTutorial });

      act(() => {
        result.current.collectPageAnswers('page05-tutorial');
      });

      expectAnswerCollected(mockContextValue.collectAnswer, {
        targetElement: 'P5_教程完成标记',
        value: '已完成操作指引教程'
      });
    });
  });

  describe('数据清理功能', () => {
    it('clearAnswerDraft应该重置所有数据', () => {
      const { result } = renderHook(() => useAnswerDrafts(), { wrapper: TestWrapper });

      act(() => {
        result.current.clearAnswerDraft();
      });

      expectLocalStorageCall('removeItem', 'module.g8-pv-sand-experiment.answers', undefined);
      
      expect(mockContextValue.updateAnswerDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          pageAnswers: {},
          experimentAnswers: expect.objectContaining({
            designReason: '',
            tutorialCompleted: false,
            experiment1Choice: null,
            experiment2Analysis: '',
            conclusionAnswers: {
              question1: '',
              question2: '',
              question3: ''
            }
          }),
          metadata: expect.objectContaining({
            completedPages: []
          })
        })
      );
    });
  });

  describe('错误处理和边界情况', () => {
    it('应该处理localStorage写入失败', () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn().mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const { result } = renderHook(() => useAnswerDrafts(), { wrapper: TestWrapper });

      // 不应该抛出异常
      expect(() => {
        act(() => {
          result.current.updateExperimentAnswer('designReason', '新答案');
        });
      }).not.toThrow();

      // 恢复原方法
      localStorage.setItem = originalSetItem;
    });

    it('应该处理无效的JSON数据', () => {
      setupTestLocalStorage({
        'module.g8-pv-sand-experiment.answers': '{ invalid json'
      });

      const { result } = renderHook(() => useAnswerDrafts(), { wrapper: TestWrapper });
      
      // 应该fallback到默认值
      expect(result.current.answerDraft.experimentAnswers.designReason).toBe('');
    });

    it('应该处理undefined页面答案验证', () => {
      const { result } = renderHook(() => useAnswerDrafts(), { wrapper: TestWrapper });
      
      expect(result.current.validatePageAnswers('non-existent-page')).toBe(false);
    });
  });
});