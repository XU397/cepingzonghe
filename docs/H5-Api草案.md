1. GET /h5/inspect/schools — 学校下拉

  - 路径/方法：GET /h5/inspect/schools
  - 权限：@SaCheckPermission("mobile:inspect:score")
      - 业务上：所有拥有该权限的视察员可以看到当前任务下所有学校（不再按任务成员过滤）。
  - 请求参数（Query）：
      - taskId（必填）：考核任务 ID（EducationAssessmentStandardLibraryTask.id），决定学校范围。
      - keyword（选填）：按学校名称/代码模糊搜索（可后补）。
  - 响应结构（示例）：

  [
    {
      "targetId": 1001,        // ExamineTaskTarget.id 或等价的“任务-学校对象ID”
      "schoolId": 2001,        // EducationSchool.id
      "schoolCode": "SCH001",
      "schoolName": "第一中学",
      "regionName": "XX 区"     // 可选，用于前端展示
    }
  ]

  - 实现建议：
      - 新增 H5InspectSchoolController，调用一个 H5 专用 Service：
          - 通过 ExamineTaskTargetMapper + EducationSchoolMapper 关联查询一个任务下所有学校；
          - 不做“任务-成员”过滤，保证“所有视察员可管理所有学校”的新规则；
          - 可复用项目内已有“任务-对象树”查询逻辑（如 IEducationAssessmentRecordService.findExamineListTree）做底层
            封装。

  ———

  2. GET /h5/inspect/contents — 第三级维度平铺列表

  - 路径/方法：GET /h5/inspect/contents
  - 权限：@SaCheckPermission("mobile:inspect:score")
  - 请求参数（Query）：
      - taskId（必填）：任务 ID。
      - targetId（必填）：上一步学校下拉返回的 targetId（任务中的“学校对象”ID）。
      - keyword（选填）：按第三级内容名称模糊搜索（可选）。
      - 分页参数（保留）：pageNum / pageSize 是否启用，待数据量评估后决定；可先按全量列表实现。
  - 响应结构（示例）：

  {
    "list": [
      {
        "contentId": 3001,
        "content": "校园门卫管理",
        "standard": "需 24 小时值守...",
        "fullMark": 10.0,
        "passMark": 6.0,
        "localeChangeMark": "Y",   // 可选，是否允许现场改分
        "score": 8.0,              // 当前第三级得分（ExamineContentScore）
        "type": "DEDUCT_POINTS",   // FULL_MARK / DEDUCT_POINTS / NOT_CHECK
        "operated": true           // 是否存在下属四级问题得分记录
      }
    ],
    "total": 100                  // 如启用分页
  }

  - operated 的建议判断逻辑：
      - 对当前 taskId + targetId + contentId，若存在任意 ExamineContentQuestionScore 记录，则 operated = true，否
        则 false。
  - 实现建议：
      - 新增 H5 Service 方法，例如 listContentForH5(taskId, targetId)：
          - 根据任务配置找到该任务下的 ExamineContent 列表（可以通过标准库/分类关联，也可复用现有内容查询逻辑）；
          - LEFT JOIN（或分两步查询）：
              - ExamineContentScore（按 taskId + targetId + contentId）填充当前三级得分；
              - ExamineContentQuestionScore（按 taskId + targetId + questionId），只要有记录就标记该 contentId 的
                operated = true。
      - 只做平铺列表，不按一二级维度分组展示；如后续需要分组，可以在 VO 中附加 primaryName / secondaryName 字段。

  ———

  3. GET /h5/inspect/contentQuestions — 某三级维度下的四级问卷

  - 路径/方法：GET /h5/inspect/contentQuestions
  - 权限：@SaCheckPermission("mobile:inspect:score")
  - 请求参数（Query）：
      - taskId（必填）：任务 ID。
      - targetId（必填）：对象 ID（学校）。
      - contentId（必填）：第三级维度 ID（ExamineContent.id）。
  - 响应结构（示例）：

  {
    "contentId": 3001,
    "content": "校园门卫管理",
    "fullMark": 10.0,
    "currentScore": 8.0,         // 当前第三级得分（如有）
    "questions": [
      {
        "questionId": 4001,
        "question": "是否配备保安？",
        "deductScore": 2.0,      // ExamineContentQuestion.score：该题可扣分值
        "score": 0.0,            // 当前该题实际扣分/得分（ExamineContentQuestionScore.score）
        "remark": "部分时段缺岗",
        "suggestions": "补齐人员配备",
        "reviseDate": "2024-12-31",
        "operated": true         // 是否已有该题得分记录
      }
    ]
  }

  - 实现建议：
      - Controller 调用 H5 Service：
          - 通过 IExamineContentQuestionService.getQuestionData(contentId) 获取所有四级题目；
          - 用 ExamineContentQuestionScoreMapper 按 taskId + targetId + questionId IN (...) 查出当前已有得分；
          - 合并成问题级 VO 列表，并计算 operated；
          - 同时查询当前 ExamineContentScore 作为 currentScore（如有）。

  ———

  4. POST /h5/inspect/contentQuestionScore — 四级打分并维护三级分数

  - 路径/方法：POST /h5/inspect/contentQuestionScore
  - 权限：@SaCheckPermission("mobile:inspect:score")
  - 请求 Body（建议支持批量）：

  {
    "taskId": 1,
    "targetId": 1001,
    "contentId": 3001,
    "questions": [
      {
        "questionId": 4001,
        "score": 2.0,                  // 实际扣分或得分值（具体含义见下）
        "remark": "部分时段缺岗",
        "suggestions": "补齐人员配备",
        "reviseDate": "2024-12-31"
      },
      {
        "questionId": 4002,
        "score": 0.0,
        "remark": "",
        "suggestions": "",
        "reviseDate": null
      }
    ]
  }

  - 响应结构（建议）：

  {
    "contentId": 3001,
    "contentScore": 8.0,          // 更新后的第三级得分
    "type": "DEDUCT_POINTS",      // FULL_MARK / DEDUCT_POINTS / NOT_CHECK
    "questions": [
      {
        "questionId": 4001,
        "operated": true
      },
      {
        "questionId": 4002,
        "operated": true
      }
    ]
  }