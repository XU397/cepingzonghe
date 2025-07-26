/**
 * 问卷调查数据
 * 包含各个问卷页面的题目内容和选项
 */

// 李克特量表选项（4级量表）
export const LIKERT_OPTIONS_4 = [
  '非常不同意',
  '比较不同意', 
  '比较同意',
  '非常同意'
];

// 自信度选项
export const CONFIDENCE_OPTIONS = [
  '一点也不自信',
  '不太自信',
  '自信',
  '非常自信'
];

// 频率选项
export const FREQUENCY_OPTIONS = [
  '没有或几乎没有', // 修改：与文档一致
  '大约每年一次或两次',
  '大约每月一次或两次',
  '大约每星期一次或两次',
  '每天或几乎每天', // 修改：与文档一致
];

/**
 * P21: 好奇心问题组 (9个陈述句，每个对应一组单选按钮)
 * 文档PPT第21页
 */
export const CURIOSITY_QUESTIONS = [
  {
    id: 'curiosity_q1',
    text: '我对许多不同事物有好奇心。'
  },
  {
    id: 'curiosity_q2',
    text: '我喜欢发问。'
  },
  {
    id: 'curiosity_q3',
    text: '我喜欢了解事物如何运作。'
  },
  {
    id: 'curiosity_q4',
    text: '我喜欢在学校里学习新东西。'
  },
  {
    id: 'curiosity_q5',
    text: '我比我认识的大多数人更有好奇心。'
  },
  {
    id: 'curiosity_q6',
    text: '我喜欢提出假设，并根据我的观察来验证它。'
  },
  {
    id: 'curiosity_q7',
    text: '我觉得学习新事物很无聊。'
  },
  {
    id: 'curiosity_q8',
    text: '对感兴趣的事物，我会花时间查找更多资讯。'
  },
  {
    id: 'curiosity_q9',
    text: '我喜欢学习新东西。' // 与第四条重复，根据文档保留
  }
];

/**
 * P22: 创造力/问题解决问题组 (9个陈述句)
 * 文档PPT第22页
 */
export const CREATIVITY_QUESTIONS = [
  {
    id: 'creativity_q1',
    text: '做有创造性的事情让我有满足感。'
  },
  {
    id: 'creativity_q2',
    text: '我非常有创造力。'
  },
  {
    id: 'creativity_q3',
    text: '我喜欢玩挑战我创造力的游戏。'
  },
  {
    id: 'creativity_q4',
    text: '我喜欢需要创造性解决方案的项目。'
  },
  {
    id: 'creativity_q5',
    text: '我喜欢构思新方法去解决问题。'
  },
  {
    id: 'creativity_q6',
    text: '我喜欢解决复杂的问题。'
  },
  {
    id: 'creativity_q7',
    text: '我喜欢有挑战性的学校作业。'
  },
  {
    id: 'creativity_q8',
    text: '我可以为问题提出多种解决方案。'
  },
  {
    id: 'creativity_q9',
    text: '我喜欢学习新事物。' // 注意：此条与P21中的问题9内容相同，但ID不同，按文档保留
  }
];

/**
 * P23: 想象力/开放性/创造力信念问题组 (10个陈述句)
 * 文档PPT第23页
 */
export const IMAGINATION_QUESTIONS = [
  {
    id: 'imagination_q1',
    text: '我很难运用自己的想象力。'
  },
  {
    id: 'imagination_q2',
    text: '我经常会陷入沉思。'
  },
  {
    id: 'imagination_q3',
    text: '提出新的想法让我很有满足感。'
  },
  {
    id: 'imagination_q4',
    text: '我具有很好的想象力。'
  },
  {
    id: 'imagination_q5',
    text: '每天都做同样的事情，我会感到无聊。'
  },
  {
    id: 'imagination_q6',
    text: '我喜欢自发性活动。'
  },
  {
    id: 'imagination_q7',
    text: '我想去我从未到过的地方。'
  },
  {
    id: 'imagination_q8',
    text: '自己的创造力是无法很大改变的。'
  },
  {
    id: 'imagination_q9',
    text: '有些人就是缺乏创造力，无论他们怎么努力学习和训练。'
  },
  {
    id: 'imagination_q10',
    text: '创造力是少数人的特权，普通人很难真正掌握。'
  }
];

/**
 * P24: 科学创造自我效能问题组 (5个陈述句)
 * 文档PPT第24页
 */
export const SCIENCE_EFFICACY_QUESTIONS = [
  {
    id: 'efficacy_q1',
    text: '为学校的科学探究项目，提出有创造性的想法。'
  },
  {
    id: 'efficacy_q2',
    text: '想出许多有关科学实验的好想法。'
  },
  {
    id: 'efficacy_q3',
    text: '发明新东西。'
  },
  {
    id: 'efficacy_q4',
    text: '运用科学知识治理环境污染等问题。'
  },
  {
    id: 'efficacy_q5',
    text: '运用科学创新设计想出许多帮助有需要的人的好主意（如辅助设备、医疗技术等）。'
  }
];

/**
 * P25: 创造环境问题组 (11个陈述句，按上下文分组显示)
 * 文档PPT第25页
 */
export const ENVIRONMENT_QUESTIONS = {
  teacher: {
    title: '老师/学校相关',
    questions: [
      {
        id: 'env_teacher_q1',
        text: '老师给我足够的时间去提出有关作业的有创造性的解决方案。'
      },
      {
        id: 'env_teacher_q2',
        text: '老师重视学生的创造力。'
      },
      {
        id: 'env_teacher_q3',
        text: '我们在课堂上的活动有助于我想出解决问题的新方法。'
      },
      {
        id: 'env_teacher_q4',
        text: '老师鼓励我提出原创的答案。'
      },
      {
        id: 'env_teacher_q5',
        text: '在学校，我有机会表达自己的想法。'
      }
    ]
  },
  peer: {
    title: '同伴相关',
    questions: [
      {
        id: 'env_peer_q1',
        text: '我的朋友对新的想法持开放态度。'
      },
      {
        id: 'env_peer_q2',
        text: '我和朋友对彼此的想法互相给予回应。'
      },
      {
        id: 'env_peer_q3',
        text: '我和朋友互相鼓励提出新的想法。'
      }
    ]
  },
  family: {
    title: '家庭相关',
    questions: [
      {
        id: 'env_family_q1',
        text: '我的家人鼓励我尝试新事物。'
      },
      {
        id: 'env_family_q2',
        text: '在家里，我被鼓励多利用想象力。'
      },
      {
        id: 'env_family_q3',
        text: '我在家里的讨论帮助我提出新的想法。'
      }
    ]
  }
};

/**
 * P26: 校内科学活动参与情况 (7项活动)
 * 文档PPT第26页
 */
export const SCHOOL_ACTIVITIES = [
  {
    id: 'school_activity_1',
    text: '科学实验课/活动'
  },
  {
    id: 'school_activity_2',
    text: '科学探究营/研学'
  },
  {
    id: 'school_activity_3',
    text: '科学学会/社团'
  },
  {
    id: 'school_activity_4',
    text: '科普讲座/工作坊'
  },
  {
    id: 'school_activity_5',
    text: '科普出版物（例如：科学杂志、报纸、年刊）'
  },
  {
    id: 'school_activity_6',
    text: '科学展览'
  },
  {
    id: 'school_activity_7',
    text: '科技竞赛'
  }
];

/**
 * P27: 校外科学活动参与情况 (7项活动，同P26)
 * 文档PPT第27页
 */
export const OUTSCHOOL_ACTIVITIES = [
  {
    id: 'outschool_activity_1',
    text: '科学实验课/活动' // 内容与P26相同，按文档需求
  },
  {
    id: 'outschool_activity_2',
    text: '科学探究营/研学'
  },
  {
    id: 'outschool_activity_3',
    text: '科学学会/社团'
  },
  {
    id: 'outschool_activity_4',
    text: '科普讲座/工作坊'
  },
  {
    id: 'outschool_activity_5',
    text: '科普出版物（例如：科学杂志、报纸、年刊）'
  },
  {
    id: 'outschool_activity_6',
    text: '科学展览'
  },
  {
    id: 'outschool_activity_7',
    text: '科技竞赛'
  }
];

/**
 * P28: 努力评估问题 (3个问题，每个对应1-10的评分)
 * 文档PPT第28页
 */
export const EFFORT_QUESTIONS = [
  {
    id: 'effort_q1',
    text: '你为做好探究任务付出了多少努力？',
  },
  {
    id: 'effort_q2', 
    text: '如果探究任务结果会计入你的学习成绩，你会付出多少努力？',
  },
  {
    id: 'effort_q3',
    text: '现在想想你刚回答的问卷，你在提供准确答案方面付出了多少努力？',
  }
]; 