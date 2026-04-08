import { AnswerEntry, SubmoduleMappingConfig } from './types';

export function collectAnswers(
  pageId: string,
  answers: Record<string, unknown>,
  config: SubmoduleMappingConfig,
): AnswerEntry[] {
  const questionKeys = config.PAGE_QUESTIONS?.[pageId] || [];

  return questionKeys.reduce<AnswerEntry[]>((list, questionKey) => {
    const questionId = config.ANSWER_KEY_TO_QUESTION?.[questionKey];
    if (!questionId) {
      return list;
    }

    const code = config.QUESTION_CODE_MAP?.[questionId];
    const targetElement = config.QUESTION_TEXT_MAP?.[questionId];

    if (typeof code !== 'number' || !targetElement) {
      return list;
    }

    const rawValue = answers?.[questionKey];
    if (typeof rawValue === 'undefined') {
      return list;
    }
    const formattedValue =
      typeof config.formatAnswer === 'function'
        ? config.formatAnswer(questionId, rawValue)
        : JSON.stringify(rawValue);

    list.push({
      code,
      targetElement,
      value: formattedValue ?? '',
    });

    return list;
  }, []);
}
