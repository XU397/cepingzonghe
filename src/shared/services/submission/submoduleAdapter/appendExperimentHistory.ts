import { AnswerEntry } from './types';

interface AppendExperimentHistoryOptions {
  targetElement: string;
  historyCodeBase: number;
}

export function appendExperimentHistory(
  answerList: AnswerEntry[],
  data: unknown,
  options: AppendExperimentHistoryOptions,
): AnswerEntry[] {
  const serialized = typeof data === 'string' ? data : JSON.stringify(data);

  const historyEntry: AnswerEntry = {
    code: options.historyCodeBase,
    targetElement: options.targetElement,
    value: serialized ?? '',
  };

  return [...answerList, historyEntry];
}
