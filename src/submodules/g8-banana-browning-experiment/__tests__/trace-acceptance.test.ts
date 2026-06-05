import { describe, expect, it } from 'vitest';
import {
  CONTENT_REGISTRY_HASH,
  FIELD_REGISTRY_HASH,
  validateTraceMark,
} from '@shared/services/submission/trace';

const REQUIRED_CASE_IDS = [
  'page02_question_generation_v2_1',
  'page05_multi_idea_generation_v2_1',
  'page08_direct_skip_v2_1_3',
  'page09_experiment_question_v2_1',
  'page12_solution_selection_v2_1',
  'page13_task_finish_v2_1_3',
];

type AcceptanceCase = {
  caseId: string;
  input: {
    pageNumber: string;
    pageDesc: string;
    beginTime: string;
    endTime: string;
    imgList?: unknown[];
    operationList: unknown[];
  };
};

const cases: AcceptanceCase[] = [
  {
    "caseId": "page02_question_generation_v2_1",
    "input": {
      "pageNumber": "1.03",
      "pageDesc": "香蕉的奥秘",
      "beginTime": "2026-06-03T10:00:00.000+08:00",
      "endTime": "2026-06-03T10:00:28.000+08:00",
      "imgList": [],
      "operationList": [
        {
          "code": 1,
          "targetElement": "P1.03_page",
          "eventType": "START_PAGE",
          "time": "2026-06-03T10:00:00.000+08:00",
          "value": {
            "trace_id": "p02-e001",
            "page_id": "page_02_question_generation",
            "page_type": "B1_TEXT_SINGLE",
            "target_id": "page",
            "target_type": "page",
            "metadata": {
              "schema_version": "science-inquiry-trace-v2.1",
              "field_registry_version": "science-inquiry-field-registry-v2.1",
              "field_registry_hash": FIELD_REGISTRY_HASH,
              "content_registry_version": "science-inquiry-content-registry-banana-v2.1",
              "content_registry_hash": CONTENT_REGISTRY_HASH
            }
          }
        },
        {
          "code": 2,
          "targetElement": "P1.03_chat_window",
          "eventType": "CHAT_SCROLL",
          "time": "2026-06-03T10:00:03.200+08:00",
          "value": {
            "trace_id": "p02-e002",
            "page_id": "page_02_question_generation",
            "page_type": "B1_TEXT_SINGLE",
            "target_id": "chat_window",
            "target_type": "content",
            "metadata": {
              "scroll_delta": -420,
              "scroll_direction": "up",
              "visible_content_ids_before": [
                "chat_bubble_02_03",
                "chat_bubble_02_04",
                "chat_bubble_02_05"
              ],
              "visible_content_ids_after": [
                "chat_bubble_02_01",
                "chat_bubble_02_02",
                "chat_bubble_02_03"
              ],
              "phase": "before_input"
            }
          }
        },
        {
          "code": 3,
          "targetElement": "P1.03_chat_bubble_02_04",
          "eventType": "CONTENT_ACTIVATE",
          "time": "2026-06-03T10:00:04.400+08:00",
          "value": {
            "trace_id": "p02-e003",
            "page_id": "page_02_question_generation",
            "page_type": "B1_TEXT_SINGLE",
            "target_id": "chat_bubble_02_04",
            "target_type": "content",
            "content_id": "chat_bubble_02_04",
            "metadata": {
              "content_type": "chat_bubble",
              "activation_type": "hover",
              "dwell_ms": 1200,
              "phase": "before_input"
            }
          }
        },
        {
          "code": 4,
          "targetElement": "P1.03_input_question_1",
          "eventType": "TEXT_FOCUS",
          "time": "2026-06-03T10:00:08.000+08:00",
          "value": {
            "trace_id": "p02-e004",
            "page_id": "page_02_question_generation",
            "page_type": "B1_TEXT_SINGLE",
            "target_id": "input_question_1",
            "target_type": "text",
            "field_id": "input_question_1",
            "metadata": {
              "focus_order": 1
            }
          }
        },
        {
          "code": 5,
          "targetElement": "P1.03_input_question_1",
          "eventType": "TEXT_CHANGE",
          "time": "2026-06-03T10:00:14.200+08:00",
          "value": {
            "trace_id": "p02-e005",
            "page_id": "page_02_question_generation",
            "page_type": "B1_TEXT_SINGLE",
            "target_id": "input_question_1",
            "target_type": "text",
            "field_id": "input_question_1",
            "metadata": {
              "char_count_before": 0,
              "char_delta": 12,
              "char_count_after": 12,
              "trigger_reason": "debounce"
            }
          }
        },
        {
          "code": 6,
          "targetElement": "P1.03_input_question_1",
          "eventType": "TEXT_BLUR",
          "time": "2026-06-03T10:00:22.000+08:00",
          "value": {
            "trace_id": "p02-e006",
            "page_id": "page_02_question_generation",
            "page_type": "B1_TEXT_SINGLE",
            "target_id": "input_question_1",
            "target_type": "text",
            "field_id": "input_question_1",
            "value_after": "香蕉皮为什么会很快变黑？",
            "metadata": {
              "char_count_after": 13
            }
          }
        },
        {
          "code": 7,
          "targetElement": "P1.03_next_button",
          "eventType": "SUBMIT_ATTEMPT",
          "time": "2026-06-03T10:00:27.000+08:00",
          "value": {
            "trace_id": "p02-e007",
            "page_id": "page_02_question_generation",
            "page_type": "B1_TEXT_SINGLE",
            "target_id": "next_button",
            "target_type": "button",
            "submit_attempt_id": "p02-submit-1",
            "validation_status": "success",
            "metadata": {
              "missing_fields": [],
              "submit_trigger": "next_button"
            }
          }
        }
      ]
    }
  },
  {
    "caseId": "page05_multi_idea_generation_v2_1",
    "input": {
      "pageNumber": "1.06",
      "pageDesc": "提出探究方案",
      "beginTime": "2026-06-03T10:05:00.000+08:00",
      "endTime": "2026-06-03T10:06:00.000+08:00",
      "imgList": [],
      "operationList": [
        {
          "code": 1,
          "targetElement": "P1.06_page",
          "eventType": "START_PAGE",
          "time": "2026-06-03T10:05:00.000+08:00",
          "value": {
            "trace_id": "p05-e001",
            "page_id": "page_05_plan_generation",
            "page_type": "B2_TEXT_MULTI_PARALLEL",
            "target_id": "page",
            "target_type": "page",
            "metadata": {
              "schema_version": "science-inquiry-trace-v2.1",
              "field_registry_version": "science-inquiry-field-registry-v2.1",
              "field_registry_hash": FIELD_REGISTRY_HASH,
              "content_registry_version": "science-inquiry-content-registry-banana-v2.1",
              "content_registry_hash": CONTENT_REGISTRY_HASH
            }
          }
        },
        {
          "code": 2,
          "targetElement": "P1.06_input_idea_1",
          "eventType": "TEXT_FOCUS",
          "time": "2026-06-03T10:05:04.000+08:00",
          "value": {
            "trace_id": "p05-e002",
            "page_id": "page_05_plan_generation",
            "page_type": "B2_TEXT_MULTI_PARALLEL",
            "target_id": "input_idea_1",
            "target_type": "text",
            "field_id": "input_idea_1",
            "metadata": {
              "focus_order": 1
            }
          }
        },
        {
          "code": 3,
          "targetElement": "P1.06_input_idea_1",
          "eventType": "TEXT_CHANGE",
          "time": "2026-06-03T10:05:10.200+08:00",
          "value": {
            "trace_id": "p05-e003",
            "page_id": "page_05_plan_generation",
            "page_type": "B2_TEXT_MULTI_PARALLEL",
            "target_id": "input_idea_1",
            "target_type": "text",
            "field_id": "input_idea_1",
            "metadata": {
              "char_count_before": 0,
              "char_delta": 16,
              "char_count_after": 16,
              "trigger_reason": "debounce"
            }
          }
        },
        {
          "code": 4,
          "targetElement": "P1.06_input_idea_2",
          "eventType": "TEXT_FOCUS",
          "time": "2026-06-03T10:05:18.000+08:00",
          "value": {
            "trace_id": "p05-e004",
            "page_id": "page_05_plan_generation",
            "page_type": "B2_TEXT_MULTI_PARALLEL",
            "target_id": "input_idea_2",
            "target_type": "text",
            "field_id": "input_idea_2",
            "metadata": {
              "focus_order": 2
            }
          }
        },
        {
          "code": 5,
          "targetElement": "P1.06_input_idea_2",
          "eventType": "TEXT_CHANGE",
          "time": "2026-06-03T10:05:24.500+08:00",
          "value": {
            "trace_id": "p05-e005",
            "page_id": "page_05_plan_generation",
            "page_type": "B2_TEXT_MULTI_PARALLEL",
            "target_id": "input_idea_2",
            "target_type": "text",
            "field_id": "input_idea_2",
            "metadata": {
              "char_count_before": 0,
              "char_delta": 14,
              "char_count_after": 14,
              "trigger_reason": "debounce"
            }
          }
        },
        {
          "code": 6,
          "targetElement": "P1.06_input_idea_1",
          "eventType": "TEXT_FOCUS",
          "time": "2026-06-03T10:05:30.000+08:00",
          "value": {
            "trace_id": "p05-e006",
            "page_id": "page_05_plan_generation",
            "page_type": "B2_TEXT_MULTI_PARALLEL",
            "target_id": "input_idea_1",
            "target_type": "text",
            "field_id": "input_idea_1",
            "metadata": {
              "focus_order": 3,
              "from_field_id": "input_idea_2"
            }
          }
        },
        {
          "code": 7,
          "targetElement": "P1.06_input_idea_1",
          "eventType": "TEXT_CHANGE",
          "time": "2026-06-03T10:05:34.000+08:00",
          "value": {
            "trace_id": "p05-e007",
            "page_id": "page_05_plan_generation",
            "page_type": "B2_TEXT_MULTI_PARALLEL",
            "target_id": "input_idea_1",
            "target_type": "text",
            "field_id": "input_idea_1",
            "metadata": {
              "char_count_before": 16,
              "char_delta": 4,
              "char_count_after": 20,
              "trigger_reason": "char_delta"
            }
          }
        },
        {
          "code": 8,
          "targetElement": "P1.06_input_idea_3",
          "eventType": "TEXT_FOCUS",
          "time": "2026-06-03T10:05:39.000+08:00",
          "value": {
            "trace_id": "p05-e008",
            "page_id": "page_05_plan_generation",
            "page_type": "B2_TEXT_MULTI_PARALLEL",
            "target_id": "input_idea_3",
            "target_type": "text",
            "field_id": "input_idea_3",
            "metadata": {
              "focus_order": 4,
              "from_field_id": "input_idea_1"
            }
          }
        },
        {
          "code": 9,
          "targetElement": "P1.06_input_idea_3",
          "eventType": "TEXT_CHANGE",
          "time": "2026-06-03T10:05:43.000+08:00",
          "value": {
            "trace_id": "p05-e009",
            "page_id": "page_05_plan_generation",
            "page_type": "B2_TEXT_MULTI_PARALLEL",
            "target_id": "input_idea_3",
            "target_type": "text",
            "field_id": "input_idea_3",
            "metadata": {
              "char_count_before": 0,
              "char_delta": 16,
              "char_count_after": 16,
              "trigger_reason": "debounce"
            }
          }
        },
        {
          "code": 10,
          "targetElement": "P1.06_input_idea_3",
          "eventType": "TEXT_BLUR",
          "time": "2026-06-03T10:05:45.000+08:00",
          "value": {
            "trace_id": "p05-e010",
            "page_id": "page_05_plan_generation",
            "page_type": "B2_TEXT_MULTI_PARALLEL",
            "target_id": "input_idea_3",
            "target_type": "text",
            "field_id": "input_idea_3",
            "value_after": "比较不同温度条件下香蕉皮变化。",
            "metadata": {
              "char_count_after": 16
            }
          }
        },
        {
          "code": 11,
          "targetElement": "P1.06_next_button",
          "eventType": "SUBMIT_ATTEMPT",
          "time": "2026-06-03T10:05:58.000+08:00",
          "value": {
            "trace_id": "p05-e011",
            "page_id": "page_05_plan_generation",
            "page_type": "B2_TEXT_MULTI_PARALLEL",
            "target_id": "next_button",
            "target_type": "button",
            "submit_attempt_id": "p05-submit-1",
            "validation_status": "success",
            "metadata": {
              "missing_fields": [],
              "submit_trigger": "next_button"
            }
          }
        }
      ]
    }
  },
  {
    "caseId": "page08_direct_skip_v2_1_3",
    "input": {
      "pageNumber": "1.09",
      "pageDesc": "模拟实验探索页",
      "beginTime": "2026-06-03T10:08:00.000+08:00",
      "endTime": "2026-06-03T10:08:06.000+08:00",
      "imgList": [],
      "operationList": [
        {
          "code": 1,
          "targetElement": "P1.09_page",
          "eventType": "START_PAGE",
          "time": "2026-06-03T10:08:00.000+08:00",
          "value": {
            "trace_id": "p08-e001",
            "page_id": "page_08_simulation_explore",
            "page_type": "D1_SIMULATION_ONLY",
            "target_id": "page",
            "target_type": "page",
            "metadata": {
              "schema_version": "science-inquiry-trace-v2.1",
              "field_registry_version": "science-inquiry-field-registry-v2.1",
              "field_registry_hash": FIELD_REGISTRY_HASH,
              "content_registry_version": "science-inquiry-content-registry-banana-v2.1",
              "content_registry_hash": CONTENT_REGISTRY_HASH
            }
          }
        },
        {
          "code": 2,
          "targetElement": "P1.09_next_button",
          "eventType": "SUBMIT_ATTEMPT",
          "time": "2026-06-03T10:08:06.000+08:00",
          "value": {
            "trace_id": "p08-e002",
            "page_id": "page_08_simulation_explore",
            "page_type": "D1_SIMULATION_ONLY",
            "target_id": "next_button",
            "target_type": "button",
            "submit_attempt_id": "p08-submit-001",
            "validation_status": "success",
            "metadata": {
              "submit_trigger": "next"
            }
          }
        }
      ]
    }
  },
  {
    "caseId": "page09_experiment_question_v2_1",
    "input": {
      "pageNumber": "1.10",
      "pageDesc": "实验后判断问题一",
      "beginTime": "2026-06-03T10:10:00.000+08:00",
      "endTime": "2026-06-03T10:10:42.000+08:00",
      "imgList": [],
      "operationList": [
        {
          "code": 1,
          "targetElement": "P1.10_page",
          "eventType": "START_PAGE",
          "time": "2026-06-03T10:10:00.000+08:00",
          "value": {
            "trace_id": "p09-e001",
            "page_id": "page_09_experiment_question_1",
            "page_type": "D2_SIMULATION_QUESTION",
            "target_id": "page",
            "target_type": "page",
            "metadata": {
              "schema_version": "science-inquiry-trace-v2.1",
              "field_registry_version": "science-inquiry-field-registry-v2.1",
              "field_registry_hash": FIELD_REGISTRY_HASH,
              "content_registry_version": "science-inquiry-content-registry-banana-v2.1",
              "content_registry_hash": CONTENT_REGISTRY_HASH
            }
          }
        },
        {
          "code": 2,
          "targetElement": "P1.10_exp_days",
          "eventType": "SET_EXP_PARAM",
          "time": "2026-06-03T10:10:05.000+08:00",
          "value": {
            "trace_id": "p09-e002",
            "page_id": "page_09_experiment_question_1",
            "page_type": "D2_SIMULATION_QUESTION",
            "target_id": "exp_days",
            "target_type": "experiment",
            "param_id": "exp_param_days",
            "param_name": "days",
            "value_before": 3,
            "value_after": 7,
            "metadata": {
              "param_snapshot": {
                "days": 7
              }
            }
          }
        },
        {
          "code": 3,
          "targetElement": "P1.10_execute_exp",
          "eventType": "EXECUTE_EXP",
          "time": "2026-06-03T10:10:07.000+08:00",
          "value": {
            "trace_id": "p09-e003",
            "page_id": "page_09_experiment_question_1",
            "page_type": "D2_SIMULATION_QUESTION",
            "target_id": "execute_exp",
            "target_type": "experiment",
            "exp_run_id": "run_1",
            "metadata": {
              "param_snapshot": {
                "days": 7
              },
              "result_snapshot": {
                "black_ratio": 0.42
              },
              "click_debounce_applied": false
            }
          }
        },
        {
          "code": 4,
          "targetElement": "P1.10_question_1_option_a",
          "eventType": "SELECT_ANSWER",
          "time": "2026-06-03T10:10:15.000+08:00",
          "value": {
            "trace_id": "p09-e004",
            "page_id": "page_09_experiment_question_1",
            "page_type": "D2_SIMULATION_QUESTION",
            "target_id": "question_1_option_a",
            "target_type": "radio",
            "question_id": "question_1",
            "option_id": "option_a",
            "value_before": null,
            "value_after": "option_a",
            "metadata": {
              "question_index": 1,
              "total_question_count": 3
            }
          }
        },
        {
          "code": 5,
          "targetElement": "P1.10_exp_days",
          "eventType": "SET_EXP_PARAM",
          "time": "2026-06-03T10:10:22.000+08:00",
          "value": {
            "trace_id": "p09-e005",
            "page_id": "page_09_experiment_question_1",
            "page_type": "D2_SIMULATION_QUESTION",
            "target_id": "exp_days",
            "target_type": "experiment",
            "param_id": "exp_param_days",
            "param_name": "days",
            "value_before": 7,
            "value_after": 9,
            "metadata": {
              "param_snapshot": {
                "days": 9
              },
              "phase": "after_answer"
            }
          }
        },
        {
          "code": 6,
          "targetElement": "P1.10_execute_exp",
          "eventType": "EXECUTE_EXP",
          "time": "2026-06-03T10:10:24.000+08:00",
          "value": {
            "trace_id": "p09-e006",
            "page_id": "page_09_experiment_question_1",
            "page_type": "D2_SIMULATION_QUESTION",
            "target_id": "execute_exp",
            "target_type": "experiment",
            "exp_run_id": "run_2",
            "metadata": {
              "param_snapshot": {
                "days": 9
              },
              "result_snapshot": {
                "black_ratio": 0.63
              },
              "click_debounce_applied": false,
              "phase": "after_answer"
            }
          }
        },
        {
          "code": 7,
          "targetElement": "P1.10_question_1_option_b",
          "eventType": "SELECT_ANSWER",
          "time": "2026-06-03T10:10:32.000+08:00",
          "value": {
            "trace_id": "p09-e007",
            "page_id": "page_09_experiment_question_1",
            "page_type": "D2_SIMULATION_QUESTION",
            "target_id": "question_1_option_b",
            "target_type": "radio",
            "question_id": "question_1",
            "option_id": "option_b",
            "value_before": "option_a",
            "value_after": "option_b",
            "metadata": {
              "question_index": 1,
              "total_question_count": 3
            }
          }
        },
        {
          "code": 8,
          "targetElement": "P1.10_next_button",
          "eventType": "SUBMIT_ATTEMPT",
          "time": "2026-06-03T10:10:40.000+08:00",
          "value": {
            "trace_id": "p09-e008",
            "page_id": "page_09_experiment_question_1",
            "page_type": "D2_SIMULATION_QUESTION",
            "target_id": "next_button",
            "target_type": "button",
            "submit_attempt_id": "p09-submit-1",
            "validation_status": "success",
            "metadata": {
              "missing_fields": [],
              "submit_trigger": "next_button"
            }
          }
        }
      ]
    }
  },
  {
    "caseId": "page12_solution_selection_v2_1",
    "input": {
      "pageNumber": "1.13",
      "pageDesc": "选择最佳方案并说明理由",
      "beginTime": "2026-06-03T10:20:00.000+08:00",
      "endTime": "2026-06-03T10:21:05.000+08:00",
      "imgList": [],
      "operationList": [
        {
          "code": 1,
          "targetElement": "P1.13_page",
          "eventType": "START_PAGE",
          "time": "2026-06-03T10:20:00.000+08:00",
          "value": {
            "trace_id": "p12-e001",
            "page_id": "page_12_solution_selection",
            "page_type": "E1_CHART_PLAN_DECISION",
            "target_id": "page",
            "target_type": "page",
            "metadata": {
              "schema_version": "science-inquiry-trace-v2.1",
              "field_registry_version": "science-inquiry-field-registry-v2.1",
              "field_registry_hash": FIELD_REGISTRY_HASH,
              "content_registry_version": "science-inquiry-content-registry-banana-v2.1",
              "content_registry_hash": CONTENT_REGISTRY_HASH
            }
          }
        },
        {
          "code": 2,
          "targetElement": "P1.13_chart_evidence_1",
          "eventType": "CHART_HOVER",
          "time": "2026-06-03T10:20:08.000+08:00",
          "value": {
            "trace_id": "p12-e002",
            "page_id": "page_12_solution_selection",
            "page_type": "E1_CHART_PLAN_DECISION",
            "target_id": "chart_evidence_1",
            "target_type": "chart",
            "chart_id": "chart_evidence_1",
            "point_id": "point_1",
            "metadata": {
              "hover_ms": 1200,
              "data_snapshot": {
                "plan_param_1": "banana_variety_a",
                "plan_param_2": 13,
                "black_ratio": 0.28
              }
            }
          }
        },
        {
          "code": 3,
          "targetElement": "P1.13_plan_table",
          "eventType": "ADD_ROW",
          "time": "2026-06-03T10:20:14.000+08:00",
          "value": {
            "trace_id": "p12-e003",
            "page_id": "page_12_solution_selection",
            "page_type": "E1_CHART_PLAN_DECISION",
            "target_id": "plan_table",
            "target_type": "table",
            "field_id": "plan_table",
            "row_id": "row_1",
            "metadata": {
              "row_index": 1
            }
          }
        },
        {
          "code": 4,
          "targetElement": "P1.13_plan_table_row_1_temperature",
          "eventType": "SET_PLAN_PARAM",
          "time": "2026-06-03T10:20:18.000+08:00",
          "value": {
            "trace_id": "p12-e004",
            "page_id": "page_12_solution_selection",
            "page_type": "E1_CHART_PLAN_DECISION",
            "target_id": "plan_table_row_1_temperature",
            "target_type": "table",
            "field_id": "plan_table",
            "row_id": "row_1",
            "param_id": "plan_param_2",
            "param_name": "temperature",
            "value_before": null,
            "value_after": 13,
            "metadata": {
              "row_snapshot": {
                "plan_param_1": "banana_variety_a",
                "plan_param_2": 13
              }
            }
          }
        },
        {
          "code": 5,
          "targetElement": "P1.13_plan_table_row_1_best",
          "eventType": "SELECT_BEST",
          "time": "2026-06-03T10:20:24.000+08:00",
          "value": {
            "trace_id": "p12-e005",
            "page_id": "page_12_solution_selection",
            "page_type": "E1_CHART_PLAN_DECISION",
            "target_id": "plan_table_row_1_best",
            "target_type": "table",
            "field_id": "plan_table",
            "row_id": "row_1",
            "metadata": {
              "previous_best_row_id": null,
              "current_best_row_id": "row_1"
            }
          }
        },
        {
          "code": 6,
          "targetElement": "P1.13_reason_text",
          "eventType": "TEXT_FOCUS",
          "time": "2026-06-03T10:20:32.000+08:00",
          "value": {
            "trace_id": "p12-e006",
            "page_id": "page_12_solution_selection",
            "page_type": "E1_CHART_PLAN_DECISION",
            "target_id": "reason_text",
            "target_type": "text",
            "field_id": "reason_text",
            "metadata": {
              "focus_order": 1
            }
          }
        },
        {
          "code": 7,
          "targetElement": "P1.13_reason_text",
          "eventType": "TEXT_BLUR",
          "time": "2026-06-03T10:20:50.000+08:00",
          "value": {
            "trace_id": "p12-e007",
            "page_id": "page_12_solution_selection",
            "page_type": "E1_CHART_PLAN_DECISION",
            "target_id": "reason_text",
            "target_type": "text",
            "field_id": "reason_text",
            "value_after": "我选择 row_1，因为图表中 13 度时香蕉变黑比例较低，和其他方案相比更能延缓变黑。",
            "metadata": {
              "char_count_after": 43,
              "mentions_data": true,
              "mentions_comparison": true,
              "mentions_causality": true
            }
          }
        },
        {
          "code": 8,
          "targetElement": "P1.13_next_button",
          "eventType": "SUBMIT_ATTEMPT",
          "time": "2026-06-03T10:21:03.000+08:00",
          "value": {
            "trace_id": "p12-e008",
            "page_id": "page_12_solution_selection",
            "page_type": "E1_CHART_PLAN_DECISION",
            "target_id": "next_button",
            "target_type": "button",
            "submit_attempt_id": "p12-submit-1",
            "validation_status": "success",
            "metadata": {
              "missing_fields": [],
              "submit_trigger": "next_button"
            }
          }
        }
      ]
    }
  },
  {
    "caseId": "page13_task_finish_v2_1_3",
    "input": {
      "pageNumber": "1.14",
      "pageDesc": "任务结束页",
      "beginTime": "2026-06-03T10:13:00.000+08:00",
      "endTime": "2026-06-03T10:13:03.000+08:00",
      "imgList": [],
      "operationList": [
        {
          "code": 1,
          "targetElement": "P1.14_page",
          "eventType": "START_PAGE",
          "time": "2026-06-03T10:13:00.000+08:00",
          "value": {
            "trace_id": "p13-e001",
            "page_id": "page_13_finish",
            "page_type": "A1_FLOW",
            "target_id": "page",
            "target_type": "page",
            "metadata": {
              "schema_version": "science-inquiry-trace-v2.1",
              "field_registry_version": "science-inquiry-field-registry-v2.1",
              "field_registry_hash": FIELD_REGISTRY_HASH,
              "content_registry_version": "science-inquiry-content-registry-banana-v2.1",
              "content_registry_hash": CONTENT_REGISTRY_HASH
            }
          }
        },
        {
          "code": 2,
          "targetElement": "P1.14_finish",
          "eventType": "TASK_FINISH",
          "time": "2026-06-03T10:13:03.000+08:00",
          "value": {
            "trace_id": "p13-e002",
            "page_id": "page_13_finish",
            "page_type": "A1_FLOW",
            "target_id": "finish",
            "target_type": "button",
            "metadata": {
              "finish_trigger": "auto_or_click"
            }
          }
        }
      ]
    }
  }
];

describe('banana L2 acceptance contracts', () => {
  it('locks the required acceptance case set', () => {
    expect(cases.map(acceptanceCase => acceptanceCase.caseId)).toEqual(REQUIRED_CASE_IDS);
    expect(cases).toHaveLength(6);
  });

  it.each(cases.map(acceptanceCase => [acceptanceCase.caseId, acceptanceCase] as const))(
    'validates %s',
    (_caseId, acceptanceCase) => {
      expect(acceptanceCase.input.pageNumber).toEqual(expect.any(String));
      expect(acceptanceCase.input.pageNumber).not.toHaveLength(0);
      expect(acceptanceCase.input.pageDesc).toEqual(expect.any(String));
      expect(acceptanceCase.input.pageDesc).not.toHaveLength(0);
      expect(acceptanceCase.input.beginTime).toEqual(expect.any(String));
      expect(acceptanceCase.input.beginTime).not.toHaveLength(0);
      expect(acceptanceCase.input.endTime).toEqual(expect.any(String));
      expect(acceptanceCase.input.endTime).not.toHaveLength(0);

      const mark = {
        pageNumber: acceptanceCase.input.pageNumber,
        pageDesc: acceptanceCase.input.pageDesc,
        beginTime: acceptanceCase.input.beginTime,
        endTime: acceptanceCase.input.endTime,
        answerList: [],
        imgList: acceptanceCase.input.imgList || [],
        operationList: acceptanceCase.input.operationList,
      };
      expect(() => validateTraceMark(mark)).not.toThrow();
    }
  );
});
