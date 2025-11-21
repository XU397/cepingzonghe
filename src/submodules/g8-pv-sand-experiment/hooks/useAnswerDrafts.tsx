import { useCallback, useEffect } from 'react';
import { usePvSandContext } from '../context/PvSandContext';
import { AnswerDraft } from '../types';

const LOCAL_STORAGE_KEY = 'module.g8-pv-sand-experiment.answers';

export const useAnswerDrafts = () => {
  const { 
    answerDraft, 
    updateAnswerDraft, 
    collectAnswer,
    logOperation 
  } = usePvSandContext();

  const saveAnswerToLocalStorage = useCallback((draft: AnswerDraft) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(draft));
    } catch (error) {
      console.warn('Failed to save answer draft to localStorage:', error);
    }
  }, []);

  const loadAnswerFromLocalStorage = useCallback((): Partial<AnswerDraft> | null => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Failed to load answer draft from localStorage:', error);
      return null;
    }
  }, []);

  const updatePageAnswer = useCallback((
    pageId: string, 
    questionId: string, 
    value: string | number | boolean,
    isValid: boolean = true,
    validationMessage?: string
  ) => {
    const updatedDraft: Partial<AnswerDraft> = {
      pageAnswers: {
        ...answerDraft.pageAnswers,
        [pageId]: {
          ...answerDraft.pageAnswers[pageId],
          [questionId]: {
            value,
            lastModified: new Date().toISOString(),
            isValid,
            validationMessage
          }
        }
      }
    };

    updateAnswerDraft(updatedDraft);

    logOperation({
      targetElement: `${pageId}_${questionId}`,
      eventType: 'change',
      value: String(value),
      time: new Date().toISOString()
    });
  }, [answerDraft, updateAnswerDraft, logOperation]);

  const updateExperimentAnswer = useCallback((
    field: keyof AnswerDraft['experimentAnswers'],
    value: any
  ) => {
    const updatedDraft: Partial<AnswerDraft> = {
      experimentAnswers: {
        ...answerDraft.experimentAnswers,
        [field]: value
      }
    };

    updateAnswerDraft(updatedDraft);

    logOperation({
      targetElement: `实验答案_${field}`,
      eventType: 'change',
      value: String(value),
      time: new Date().toISOString()
    });
  }, [answerDraft, updateAnswerDraft, logOperation]);

  const validatePageAnswers = useCallback((pageId: string): boolean => {
    const pageAnswers = answerDraft.pageAnswers[pageId];
    if (!pageAnswers) return false;

    return Object.values(pageAnswers).every(answer => answer.isValid);
  }, [answerDraft.pageAnswers]);

  const validateExperimentDesign = useCallback((): boolean => {
    const { designReason } = answerDraft.experimentAnswers;
    return designReason.length >= 5;
  }, [answerDraft.experimentAnswers]);

  const validateExperiment1Choice = useCallback((): boolean => {
    return answerDraft.experimentAnswers.experiment1Choice !== null;
  }, [answerDraft.experimentAnswers]);

  const validateExperiment2Analysis = useCallback((): boolean => {
    const { experiment2Analysis } = answerDraft.experimentAnswers;
    return experiment2Analysis.trim().length > 0;
  }, [answerDraft.experimentAnswers]);

  const validateConclusionAnswers = useCallback((): boolean => {
    const { conclusionAnswers } = answerDraft.experimentAnswers;
    return (
      conclusionAnswers.selectedOption.trim().length > 0 &&
      conclusionAnswers.reason.trim().length > 0
    );
  }, [answerDraft.experimentAnswers]);

  const validateTutorialCompleted = useCallback((): boolean => {
    return answerDraft.experimentAnswers.tutorialCompleted;
  }, [answerDraft.experimentAnswers]);

  const markPageCompleted = useCallback((pageId: string) => {
    const completedPages = [...answerDraft.metadata.completedPages];
    if (!completedPages.includes(pageId)) {
      completedPages.push(pageId);
      
      updateAnswerDraft({
        metadata: {
          ...answerDraft.metadata,
          completedPages
        }
      });
    }
  }, [answerDraft.metadata, updateAnswerDraft]);

  const collectPageAnswers = useCallback((pageId: string) => {
    const pageAnswers = answerDraft.pageAnswers[pageId];
    const { experimentAnswers } = answerDraft;

    if (pageAnswers) {
      Object.entries(pageAnswers).forEach(([questionId, answer]) => {
        collectAnswer({
          targetElement: `P${pageId.slice(-1)}_${questionId}`,
          value: String(answer.value)
        });
      });
    }

    switch (pageId) {
      case 'page04-experiment-design':
        if (experimentAnswers.designReason) {
          collectAnswer({
            targetElement: 'P4_实验设计问题1',
            value: experimentAnswers.designReason
          });
        }
        break;

      case 'page05-tutorial':
        if (experimentAnswers.tutorialCompleted) {
          collectAnswer({
            targetElement: 'P5_教程完成标记',
            value: '已完成操作指引教程'
          });
        }
        break;

      case 'page07-experiment2':
        if (experimentAnswers.experiment2Analysis) {
          collectAnswer({
            targetElement: 'P7_趋势分析问题',
            value: experimentAnswers.experiment2Analysis
          });
        }
        break;
    }
  }, [answerDraft, collectAnswer]);

  const getCompletionStatus = useCallback(() => {
    const totalPages = answerDraft.metadata.totalPages;
    const completedPages = answerDraft.metadata.completedPages.length;
    return {
      completed: completedPages,
      total: totalPages,
      percentage: Math.round((completedPages / totalPages) * 100)
    };
  }, [answerDraft.metadata]);

  const clearAnswerDraft = useCallback(() => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    const initialAnswerDraft: AnswerDraft = {
      pageAnswers: {},
      experimentAnswers: {
        designReason: '',
        tutorialCompleted: false,
        experiment1Choice: null,
        experiment2Analysis: '',
        conclusionAnswers: {
          selectedOption: '',
          reason: ''
        }
      },
      metadata: {
        submoduleId: 'g8-pv-sand-experiment',
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        lastSavedAt: new Date().toISOString(),
        totalPages: 8,
        completedPages: []
      }
    };
    updateAnswerDraft(initialAnswerDraft);
  }, [updateAnswerDraft]);

  useEffect(() => {
    const savedDraft = loadAnswerFromLocalStorage();
    if (savedDraft) {
      updateAnswerDraft(savedDraft);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    saveAnswerToLocalStorage(answerDraft);
  }, [answerDraft, saveAnswerToLocalStorage]);

  return {
    answerDraft,
    updatePageAnswer,
    updateExperimentAnswer,
    validatePageAnswers,
    validateExperimentDesign,
    validateExperiment1Choice,
    validateExperiment2Analysis,
    validateConclusionAnswers,
    validateTutorialCompleted,
    markPageCompleted,
    collectPageAnswers,
    getCompletionStatus,
    clearAnswerDraft
  };
};