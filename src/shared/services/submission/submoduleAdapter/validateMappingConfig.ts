import { MappingConfigValidationResult, SubmoduleMappingConfig } from './types';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

export function validateMappingConfig(
  config: Partial<SubmoduleMappingConfig>,
): MappingConfigValidationResult {
  const errors: MappingConfigValidationResult['errors'] = [];

  const requireField = (condition: boolean, field: string, message: string) => {
    if (!condition) {
      errors.push({ field, message });
    }
  };

  requireField(Array.isArray(config.PAGE_CONFIGS), 'PAGE_CONFIGS', 'PAGE_CONFIGS is required and must be an array');
  requireField(isRecord(config.PAGE_DESC_MAP), 'PAGE_DESC_MAP', 'PAGE_DESC_MAP is required and must be a record');
  requireField(isRecord(config.PAGE_QUESTIONS), 'PAGE_QUESTIONS', 'PAGE_QUESTIONS is required and must be a record');
  requireField(isRecord(config.QUESTION_CODE_MAP), 'QUESTION_CODE_MAP', 'QUESTION_CODE_MAP is required and must be a record');
  requireField(isRecord(config.QUESTION_TEXT_MAP), 'QUESTION_TEXT_MAP', 'QUESTION_TEXT_MAP is required and must be a record');
  requireField(isRecord(config.ANSWER_KEY_TO_QUESTION), 'ANSWER_KEY_TO_QUESTION', 'ANSWER_KEY_TO_QUESTION is required and must be a record');
  requireField(typeof config.getSubPageNumByPageId === 'function', 'getSubPageNumByPageId', 'getSubPageNumByPageId is required and must be a function');

  if (isRecord(config.PAGE_DESC_MAP)) {
    Object.entries(config.PAGE_DESC_MAP).forEach(([pageId, desc]) => {
      if (typeof desc !== 'string') {
        errors.push({
          field: 'PAGE_DESC_MAP',
          message: `PAGE_DESC_MAP[${pageId}] must be a string`,
        });
      }
    });
  }

  let hasValidPageQuestions = false;
  if (isRecord(config.PAGE_QUESTIONS)) {
    hasValidPageQuestions = true;
    Object.entries(config.PAGE_QUESTIONS).forEach(([pageId, questionKeys]) => {
      if (!Array.isArray(questionKeys)) {
        errors.push({
          field: 'PAGE_QUESTIONS',
          message: `PAGE_QUESTIONS[${pageId}] must be an array`,
        });
        hasValidPageQuestions = false;
      }
    });
  }

  let hasValidCodeMap = false;
  if (isRecord(config.QUESTION_CODE_MAP)) {
    hasValidCodeMap = true;
    const seenCodes = new Map<number, string>();

    Object.entries(config.QUESTION_CODE_MAP).forEach(([questionId, code]) => {
      if (typeof code !== 'number' || Number.isNaN(code)) {
        errors.push({
          field: 'QUESTION_CODE_MAP',
          message: `QUESTION_CODE_MAP[${questionId}] must be a number`,
        });
        hasValidCodeMap = false;
        return;
      }

      const duplicatedKey = seenCodes.get(code);
      if (duplicatedKey) {
        errors.push({
          field: 'QUESTION_CODE_MAP',
          message: `QUESTION_CODE_MAP has duplicate code ${code} for "${duplicatedKey}" and "${questionId}"`,
        });
      } else {
        seenCodes.set(code, questionId);
      }
    });
  }

  if (isRecord(config.QUESTION_TEXT_MAP)) {
    Object.entries(config.QUESTION_TEXT_MAP).forEach(([questionId, text]) => {
      if (typeof text !== 'string') {
        errors.push({
          field: 'QUESTION_TEXT_MAP',
          message: `QUESTION_TEXT_MAP[${questionId}] must be a string`,
        });
      }
    });
  }

  let hasValidAnswerMap = false;
  if (isRecord(config.ANSWER_KEY_TO_QUESTION)) {
    hasValidAnswerMap = true;
    Object.entries(config.ANSWER_KEY_TO_QUESTION).forEach(([answerKey, questionId]) => {
      if (typeof questionId !== 'string') {
        errors.push({
          field: 'ANSWER_KEY_TO_QUESTION',
          message: `ANSWER_KEY_TO_QUESTION[${answerKey}] must be a string`,
        });
        hasValidAnswerMap = false;
      }
    });
  }

  if (hasValidPageQuestions && hasValidCodeMap && hasValidAnswerMap) {
    Object.values(config.PAGE_QUESTIONS as Record<string, string[]>).forEach((questionKeys) => {
      if (!Array.isArray(questionKeys)) {
        return;
      }

      questionKeys.forEach((questionKey) => {
        const questionId = (config.ANSWER_KEY_TO_QUESTION as Record<string, string>)[questionKey];
        if (!questionId) {
          errors.push({
            field: 'ANSWER_KEY_TO_QUESTION',
            message: `Missing questionId mapping for answer key "${questionKey}"`,
          });
          return;
        }

        const code = (config.QUESTION_CODE_MAP as Record<string, number>)[questionId];
        if (typeof code !== 'number') {
          errors.push({
            field: 'QUESTION_CODE_MAP',
            message: `Missing code mapping for questionId "${questionId}" (from answer key "${questionKey}")`,
          });
        }
      });
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
