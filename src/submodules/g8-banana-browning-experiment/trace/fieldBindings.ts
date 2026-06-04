export const BANANA_TEXT_FIELD_BY_ANSWER_KEY: Record<string, string> = {
  Q1_科学问题: 'input_question_1',
  Q3a_想法1: 'input_idea_1',
  Q3b_想法2: 'input_idea_2',
  Q3c_想法3: 'input_idea_3',
  Q4a_图像法优点: 'method_1_advantage',
  Q4b_图像法缺点: 'method_1_disadvantage',
  Q4c_网格法优点: 'method_2_advantage',
  Q4d_网格法缺点: 'method_2_disadvantage',
  Q4e_称重法优点: 'method_3_advantage',
  Q4f_称重法缺点: 'method_3_disadvantage',
  Q8_理由: 'reason_text',
};

export const BANANA_QUESTION_BY_ANSWER_KEY = {
  Q5_海南香蕉变黑时间: {
    questionCode: 'Q5',
    questionId: 'question_1',
    fieldId: 'question_1_answer',
    questionIndex: 1,
    totalQuestionCount: 3,
  },
  Q6_常温储存品种: {
    questionCode: 'Q6',
    questionId: 'question_2',
    fieldId: 'question_2_answer',
    questionIndex: 2,
    totalQuestionCount: 3,
  },
  Q7_平缓温度: {
    questionCode: 'Q7',
    questionId: 'question_3',
    fieldId: 'question_3_answer',
    questionIndex: 3,
    totalQuestionCount: 3,
  },
} as const;

export const optionIdFromOptionLabel = (label: string): string => {
  const normalized = String(label || '').trim();
  if (normalized.startsWith('A')) return 'option_a';
  if (normalized.startsWith('B')) return 'option_b';
  if (normalized.startsWith('C')) return 'option_c';
  if (normalized.startsWith('D')) return 'option_d';
  return normalized;
};
