import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SNAPSHOT_DIR = path.join(__dirname, '__snapshots__');

const PAGE_NUMBER_REGEX = /^\d+\.\d+$/;
const PAGE_DESC_REGEX = /^\[[\w-]+\/[\w-]+\/\d+\] .+$/;
const BUSINESS_TARGET_REGEX = /^P\d+\.\d+_.+$/;
const TIME_REGEX = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
const QUESTION_TEXT_TARGETS = new Set([
  '我已阅读并理解以上注意事项',
  '问题1：为什么在每次航拍时，都需要确保相机分辨率和天气条件等一致？请写出原因。',
  '问题2：根据模拟实验，当飞行高度为100米时，使用何种焦距可以使地面采样距离（GSD）达到最小？',
  '问题3：根据模拟实验，随着飞行高度的增加，地面采样距离（GSD）呈现出怎样的变化趋势？',
  '问题4：右图展示了飞行高度、镜头焦距与地面采样距离（GSD）的关系曲线。请问在航拍中，为获取更高精度的影像，应优先考虑降低飞行高度还是调整镜头焦距？',
  '请说明你的理由：',
]);

const SYSTEM_TARGETS = new Set([
  'page',
  'flow_context',
  'next_button',
  'capture_button',
  'reset_button',
  'height_selector',
  'focal_selector',
  'experiment_captures',
  'height_button_100',
  'height_button_200',
  'height_button_300',
  'focal_button_plus',
  'focal_button_minus',
  'focal_up',
  'reading_timer',
]);

const ALLOWED_EVENT_TYPES = new Set([
  'page_enter',
  'page_exit',
  'page_submit_success',
  'flow_context',
  'auto_submit',
  'timer_start',
  'timer_stop',
  'timer_complete',
  'reading_complete',
  'checkbox_check',
  'checkbox_uncheck',
  'input_focus',
  'input_change',
  'input_blur',
  'radio_select',
  'next_click',
  'click_blocked',
  'simulation_operation',
]);

const JSON_VALUE_EVENTS = new Set([
  'flow_context',
  'timer_start',
  'timer_stop',
  'timer_complete',
  'input_change',
  'click_blocked',
  'auto_submit',
  'page_submit_success',
]);

const TOTAL_CHECKS = 8;

function main() {
  if (!fs.existsSync(SNAPSHOT_DIR)) {
    console.error(`Snapshot directory not found: ${SNAPSHOT_DIR}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(SNAPSHOT_DIR)
    .filter((f) => f.endsWith('.snap.json'))
    .sort();

  if (files.length === 0) {
    console.error('No .snap.json files found under __snapshots__.');
    process.exit(1);
  }

  let passedCount = 0;
  const allErrors = [];
  const allWarnings = [];

  for (const file of files) {
    const {
      errors,
      warnings,
      schemaChecksPassed,
      eventChecksPassed,
      eventChecksTotal,
    } = validateSnapshot(file);

    const hasErrors = errors.length > 0;
    if (!hasErrors) {
      passedCount += 1;
      const eventCheckText =
        eventChecksPassed === eventChecksTotal
          ? `${eventChecksTotal} event checks`
          : `${eventChecksPassed}/${eventChecksTotal} event checks`;
      const warningText = warnings.length
        ? `, ${warnings.length} warning${warnings.length > 1 ? 's' : ''}`
        : '';
      console.log(
        `✓ ${file} (${schemaChecksPassed} schema checks + ${eventCheckText} passed${warningText})`
      );
    } else {
      const errorParts = [];
      errorParts.push(`${schemaChecksPassed} schema checks passed`);
      const schemaErrorCount = errors.filter((e) => e.field.startsWith('schema')).length;
      const eventErrorCount = errors.length - schemaErrorCount;
      if (schemaErrorCount) {
        errorParts.push(`${schemaErrorCount} schema error${schemaErrorCount > 1 ? 's' : ''}`);
      }
      if (eventErrorCount) {
        const eventMsgs = errors
          .filter((e) => e.field.startsWith('event'))
          .map((e) => e.message);
        const preview = eventMsgs.slice(0, 2).join('; ');
        errorParts.push(
          `${eventErrorCount} event error${eventErrorCount > 1 ? 's' : ''}${preview ? `: ${preview}` : ''
          }`
        );
      }
      if (warnings.length) {
        errorParts.push(
          `${warnings.length} warning${warnings.length > 1 ? 's' : ''}: ${warnings
            .map((w) => w.message)
            .join('; ')}`
        );
      }
      console.log(`✗ ${file} (${errorParts.join(', ')})`);
      errors.forEach((err) =>
        allErrors.push({
          file,
          ...err,
        })
      );
    }

    warnings.forEach((warn) =>
      allWarnings.push({
        file,
        ...warn,
      })
    );
  }

  if (allErrors.length) {
    console.log('\nErrors:');
    for (const err of allErrors) {
      console.log(
        `${err.file}:${err.line}:${err.field}:${err.message}`
      );
    }
  }

  if (allWarnings.length) {
    console.log('\nWarnings:');
    for (const warn of allWarnings) {
      console.log(
        `${warn.file}:${warn.line}:${warn.field}:${warn.message}`
      );
    }
  }

  const total = files.length;
  const failed = total - passedCount;
  const summary =
    failed === 0
      ? `${passedCount}/${total} snapshots passed validation`
      : `${passedCount}/${total} snapshots passed (${failed} failed)`;
  console.log(`\n${summary}`);

  process.exit(failed === 0 ? 0 : 1);
}

function validateSnapshot(fileName) {
  const filePath = path.join(SNAPSHOT_DIR, fileName);
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);
  const errors = [];

  const addError = (field, message, line) => {
    errors.push({
      field,
      message,
      line: line || 1,
    });
  };

  const findLineForKey = (key) => {
    const idx = lines.findIndex((line) => line.includes(`"${key}"`));
    return idx === -1 ? 1 : idx + 1;
  };

  const findLineForEntry = (sectionKey, code, field) => {
    const sectionStart = lines.findIndex((line) =>
      line.includes(`"${sectionKey}"`)
    );
    const startIndex = sectionStart === -1 ? 0 : sectionStart;
    const codePattern = `"code": ${code}`;
    const codeLine = lines.findIndex(
      (line, idx) => idx >= startIndex && line.includes(codePattern)
    );
    if (codeLine === -1) return null;
    for (let i = codeLine; i < lines.length; i += 1) {
      if (lines[i].includes(`"${field}"`)) {
        return i + 1;
      }
      if (
        i > codeLine &&
        /"code":\s*\d+/.test(lines[i]) &&
        lines[i].includes('"code"')
      ) {
        break;
      }
    }
    return codeLine + 1;
  };

  const parseErrorLine = (message) => {
    const match = /position (\d+)/.exec(message);
    if (!match) return 1;
    const pos = Number(match[1]);
    const prefix = raw.slice(0, pos);
    return prefix.split(/\r?\n/).length;
  };

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    addError('$', `JSON parse error: ${err.message}`, parseErrorLine(err.message));
    return { errors, checksPassed: 0 };
  }

  const operationList = Array.isArray(data.operationList)
    ? data.operationList
    : null;
  const answerList = Array.isArray(data.answerList) ? data.answerList : null;
  let operationListRecorded = false;
  let answerListRecorded = false;

  const ensureOperationList = () => {
    if (operationList) return true;
    if (!operationListRecorded) {
      addError(
        'operationList',
        'operationList must be an array',
        findLineForKey('operationList')
      );
      operationListRecorded = true;
    }
    return false;
  };

  const ensureAnswerList = () => {
    if (answerList) return true;
    if (!answerListRecorded) {
      addError(
        'answerList',
        'answerList must be an array',
        findLineForKey('answerList')
      );
      answerListRecorded = true;
    }
    return false;
  };

  const checks = [
    () => checkPageNumber(data, addError, findLineForKey),
    () => checkPageDesc(data, addError, findLineForKey),
    () => checkOperationCodeContinuity(operationList, addError, ensureOperationList, findLineForEntry),
    () => checkOperationTargets(operationList, addError, ensureOperationList, findLineForEntry),
    () => checkEventTypes(operationList, addError, ensureOperationList, findLineForEntry),
    () => checkTimeFormats(data, operationList, addError, ensureOperationList, findLineForEntry, findLineForKey),
    () => checkValueStructure(operationList, addError, ensureOperationList, findLineForEntry),
    () => checkAnswerList(answerList, addError, ensureAnswerList, findLineForEntry),
  ];

  let checksPassed = 0;
  for (const fn of checks) {
    if (fn()) {
      checksPassed += 1;
    }
  }

  const {
    errors: eventErrors,
    warnings,
    passed: eventChecksPassed,
    total: eventChecksTotal,
  } = validateEventSets(
    fileName,
    data,
    operationList,
    findLineForEntry,
    findLineForKey
  );

  return {
    errors: [
      ...errors.map((e) => ({ ...e, field: `schema.${e.field}` })),
      ...eventErrors.map((e) => ({ ...e, field: `event.${e.field}` })),
    ],
    warnings,
    schemaChecksPassed: checksPassed,
    eventChecksPassed,
    eventChecksTotal,
  };
}

function checkPageNumber(data, addError, findLineForKey) {
  if (typeof data.pageNumber !== 'string' || !PAGE_NUMBER_REGEX.test(data.pageNumber)) {
    addError(
      'pageNumber',
      `pageNumber must match ${PAGE_NUMBER_REGEX}, received ${String(data.pageNumber)}`,
      findLineForKey('pageNumber')
    );
    return false;
  }
  return true;
}

function checkPageDesc(data, addError, findLineForKey) {
  if (typeof data.pageDesc !== 'string' || !PAGE_DESC_REGEX.test(data.pageDesc)) {
    addError(
      'pageDesc',
      `pageDesc must match ${PAGE_DESC_REGEX}, received ${String(data.pageDesc)}`,
      findLineForKey('pageDesc')
    );
    return false;
  }
  return true;
}

function checkOperationCodeContinuity(operationList, addError, ensureOperationList, findLineForEntry) {
  if (!ensureOperationList()) return false;

  let expected = 1;
  let ok = true;

  for (const op of operationList) {
    const line = findLineForEntry('operationList', op.code, 'code');
    if (typeof op.code !== 'number' || !Number.isInteger(op.code)) {
      addError('operationList.code', `code must be an integer, received ${String(op.code)}`, line);
      ok = false;
    }
    if (op.code !== expected) {
      addError(
        'operationList.code',
        `code should increment from 1 without gaps (expected ${expected}, found ${op.code})`,
        line
      );
      ok = false;
    }
    expected += 1;
  }

  return ok;
}

function checkOperationTargets(operationList, addError, ensureOperationList, findLineForEntry) {
  if (!ensureOperationList()) return false;

  let ok = true;
  for (const op of operationList) {
    const target = op.targetElement;
    const line = findLineForEntry('operationList', op.code, 'targetElement');
    if (typeof target !== 'string' || target.length === 0) {
      addError('operationList.targetElement', 'targetElement is required', line);
      ok = false;
      continue;
    }
    const isBusiness = BUSINESS_TARGET_REGEX.test(target);
    const isSystem = SYSTEM_TARGETS.has(target);
    if (!isBusiness && !isSystem) {
      addError(
        'operationList.targetElement',
        `targetElement must use business prefix P<pageNumber>_ or be a known system element`,
        line
      );
      ok = false;
    }
  }
  return ok;
}

function checkEventTypes(operationList, addError, ensureOperationList, findLineForEntry) {
  if (!ensureOperationList()) return false;

  let ok = true;
  for (const op of operationList) {
    const line = findLineForEntry('operationList', op.code, 'eventType');
    if (!ALLOWED_EVENT_TYPES.has(op.eventType)) {
      addError(
        'operationList.eventType',
        `eventType must be one of ${Array.from(ALLOWED_EVENT_TYPES).join(', ')}`,
        line
      );
      ok = false;
    }
  }
  return ok;
}

function checkTimeFormats(data, operationList, addError, ensureOperationList, findLineForEntry, findLineForKey) {
  let ok = true;
  if (!ensureOperationList()) {
    ok = false;
  } else {
    for (const op of operationList) {
      const line = findLineForEntry('operationList', op.code, 'time');
      if (typeof op.time !== 'string' || !TIME_REGEX.test(op.time)) {
        addError(
          'operationList.time',
          `time must match ${TIME_REGEX}, received ${String(op.time)}`,
          line
        );
        ok = false;
      }
    }
  }

  if (typeof data.beginTime !== 'string' || !TIME_REGEX.test(data.beginTime)) {
    addError(
      'beginTime',
      `beginTime must match ${TIME_REGEX}, received ${String(data.beginTime)}`,
      findLineForKey('beginTime')
    );
    ok = false;
  }

  if (typeof data.endTime !== 'string' || !TIME_REGEX.test(data.endTime)) {
    addError(
      'endTime',
      `endTime must match ${TIME_REGEX}, received ${String(data.endTime)}`,
      findLineForKey('endTime')
    );
    ok = false;
  }

  return ok;
}

function checkValueStructure(operationList, addError, ensureOperationList, findLineForEntry) {
  if (!ensureOperationList()) return false;

  let ok = true;
  for (const op of operationList) {
    if (!JSON_VALUE_EVENTS.has(op.eventType)) continue;
    const line = findLineForEntry('operationList', op.code, 'value');
    if (typeof op.value !== 'string') {
      addError('operationList.value', 'value must be a JSON string for this eventType', line);
      ok = false;
      continue;
    }
    try {
      JSON.parse(op.value);
    } catch (err) {
      addError('operationList.value', 'value must be valid JSON string', line);
      ok = false;
    }
  }
  return ok;
}

function checkAnswerList(answerList, addError, ensureAnswerList, findLineForEntry) {
  if (!ensureAnswerList()) return false;

  let ok = true;
  let expected = 1;
  for (const ans of answerList) {
    const line = findLineForEntry('answerList', ans.code, 'code');
    if (typeof ans.code !== 'number' || !Number.isInteger(ans.code)) {
      addError('answerList.code', `code must be an integer, received ${String(ans.code)}`, line);
      ok = false;
    }
    if (ans.code !== expected) {
      addError(
        'answerList.code',
        `code should increment from 1 without gaps (expected ${expected}, found ${ans.code})`,
        line
      );
      ok = false;
    }
    expected += 1;

    const targetLine = findLineForEntry('answerList', ans.code, 'targetElement');
    const isQuestionText = QUESTION_TEXT_TARGETS.has(ans.targetElement);
    const isSystem = SYSTEM_TARGETS.has(ans.targetElement);
    if (typeof ans.targetElement !== 'string' || (!isQuestionText && !isSystem)) {
      addError(
        'answerList.targetElement',
        'targetElement must be the full question text or a known system element',
        targetLine
      );
      ok = false;
    }

    const valueLine = findLineForEntry('answerList', ans.code, 'value');
    if (typeof ans.value !== 'string') {
      addError('answerList.value', 'value must be a string', valueLine);
      ok = false;
    } else if (ans.value.trim().length === 0 && ans.value !== '超时未回答') {
      addError('answerList.value', 'value cannot be empty (except for 超时未回答)', valueLine);
      ok = false;
    }
  }

  return ok;
}

function validateEventSets(fileName, data, operationList, findLineForEntry, findLineForKey) {
  const errors = [];
  const warnings = [];
  let passed = 0;
  let total = 0;

  const addError = (field, message, line = 1) => {
    errors.push({ field, message, line });
  };

  const addWarning = (field, message, line = 1) => {
    warnings.push({ field, message, line });
  };

  const addCheckResult = (ok) => {
    total += 1;
    if (ok) passed += 1;
  };

  if (!Array.isArray(operationList) || operationList.length === 0) {
    const line = findLineForKey ? findLineForKey('operationList') : 1;
    addError('operationList', 'operationList is required for event validation', line);
    return { errors, warnings, passed, total };
  }

  const opsByType = (type) => operationList.filter((op) => op.eventType === type);
  const parseJsonValue = (value) => {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  // Base: page_enter
  const pageEnter = opsByType('page_enter')[0];
  total += 1;
  if (pageEnter && pageEnter.code === 1 && pageEnter.targetElement === 'page') {
    passed += 1;
  } else {
    const line = pageEnter
      ? findLineForEntry('operationList', pageEnter.code, 'eventType')
      : 1;
    addError('page_enter', 'missing or invalid page_enter at code=1 with targetElement=page', line);
  }

  // Base: flow_context
  const flowContext = opsByType('flow_context')[0];
  total += 1;
  if (flowContext && flowContext.code === 2 && flowContext.targetElement === 'flow_context') {
    const line = findLineForEntry('operationList', flowContext.code, 'value');
    const parsed = typeof flowContext.value === 'string' ? parseJsonValue(flowContext.value) : null;
    const hasRequired =
      parsed &&
      parsed.flowId &&
      parsed.submoduleId &&
      parsed.moduleName &&
      Object.prototype.hasOwnProperty.call(parsed, 'stepIndex') &&
      parsed.pageId;
    if (hasRequired) {
      passed += 1;
    } else {
      addError(
        'flow_context',
        'flow_context.value must contain flowId, stepIndex, submoduleId, moduleName, pageId',
        line
      );
    }
  } else {
    const line = flowContext
      ? findLineForEntry('operationList', flowContext.code, 'eventType')
      : 1;
    addError('flow_context', 'missing or invalid flow_context at code=2 with targetElement=flow_context', line);
  }

  // Base: page_submit_success last, value contains fields
  total += 1;
  const lastOp = operationList[operationList.length - 1];
  if (lastOp && lastOp.eventType === 'page_submit_success') {
    const line = findLineForEntry('operationList', lastOp.code, 'value');
    const parsed = typeof lastOp.value === 'string' ? parseJsonValue(lastOp.value) : null;
    const hasFields =
      parsed &&
      Object.prototype.hasOwnProperty.call(parsed, 'pageNumber') &&
      Object.prototype.hasOwnProperty.call(parsed, 'pageDesc') &&
      Object.prototype.hasOwnProperty.call(parsed, 'auto_submit');
    if (hasFields) {
      passed += 1;
    } else {
      addError(
        'page_submit_success',
        'page_submit_success.value must contain pageNumber, pageDesc, auto_submit',
        line
      );
    }
  } else {
    const line = lastOp
      ? findLineForEntry('operationList', lastOp.code, 'eventType')
      : findLineForKey('operationList');
    addError('page_submit_success', 'last event must be page_submit_success', line);
  }

  // Base: page_exit penultimate
  total += 1;
  if (operationList.length >= 2) {
    const penultimate = operationList[operationList.length - 2];
    if (penultimate.eventType === 'page_exit' && penultimate.targetElement === 'page') {
      passed += 1;
    } else {
      const line = findLineForEntry('operationList', penultimate.code, 'eventType');
      addError('page_exit', 'page_exit must be the penultimate event with targetElement=page', line);
    }
  } else {
    const line = findLineForKey('operationList');
    addError('page_exit', 'page_exit penultimate event missing', line);
  }

  // Conditional: blocked scenarios require click_blocked (warning if missing)
  const isBlocked = /_blocked/i.test(fileName);
  if (isBlocked) {
    total += 1;
    const clickBlocked = opsByType('click_blocked')[0];
    if (clickBlocked) {
      const line = findLineForEntry('operationList', clickBlocked.code, 'value');
      const parsed = typeof clickBlocked.value === 'string' ? parseJsonValue(clickBlocked.value) : null;
      const ok =
        parsed &&
        typeof parsed.reason === 'string' &&
        Array.isArray(parsed.missing);
      if (ok) {
        passed += 1;
      } else {
        addError(
          'click_blocked',
          'click_blocked.value must contain reason and missing array',
          line
        );
      }
    } else {
      addWarning('click_blocked', 'blocked scenario should contain click_blocked event', 1);
    }
  }

  // Conditional: input pages
  const isInputPage =
    fileName === 'Page03_Hypothesis_normal.snap.json' ||
    fileName === 'Page07_Conclusion_normal.snap.json';
  if (isInputPage) {
    total += 1;
    const focus = opsByType('input_focus')[0];
    const changes = opsByType('input_change').filter(
      (op) => !focus || op.targetElement === focus.targetElement
    );
    const blur = opsByType('input_blur').find(
      (op) => !focus || op.targetElement === focus.targetElement
    );
    const hasSequence =
      focus &&
      blur &&
      changes.length > 0 &&
      focus.code < changes[0].code &&
      changes[changes.length - 1].code < blur.code;
    if (hasSequence) {
      passed += 1;
    } else {
      const line = focus
        ? findLineForEntry('operationList', focus.code, 'eventType')
        : 1;
      addError('input_sequence', 'input_focus -> input_change (>=1) -> input_blur sequence missing or out of order', line);
    }
  }

  // Conditional: selection pages
  const isSelectionPage =
    /^Page05_/.test(fileName) ||
    /^Page06_/.test(fileName) ||
    /^Page07_.*normal\.snap\.json$/.test(fileName);
  if (isSelectionPage) {
    total += 1;
    const hasSelect =
      opsByType('radio_select').length > 0 ||
      opsByType('checkbox_check').length > 0;
    if (hasSelect) {
      passed += 1;
    } else if (isBlocked) {
      addWarning('selection', 'blocked scenario missing selection event (expected if user did not answer)', 1);
    } else {
      addError('selection', 'selection page requires radio_select or checkbox_check event', 1);
    }
  }

  // Conditional: timer pages
  const isTimerPage =
    /^Page01_/.test(fileName) || /^Page02_/.test(fileName);
  if (isTimerPage) {
    total += 1;
    const timerStart = opsByType('timer_start')[0];
    const timerStop = opsByType('timer_stop').find(
      (op) => !timerStart || op.targetElement === timerStart.targetElement
    );
    const ok =
      timerStart &&
      timerStop &&
      timerStart.code < timerStop.code &&
      parseJsonValue(timerStart.value) &&
      parseJsonValue(timerStop.value);
    if (ok) {
      const startVal = parseJsonValue(timerStart.value);
      const stopVal = parseJsonValue(timerStop.value);
      const validStart =
        startVal &&
        typeof startVal.duration !== 'undefined' &&
        typeof startVal.unit === 'string';
      const validStop =
        stopVal &&
        typeof stopVal.reason === 'string' &&
        typeof stopVal.elapsed !== 'undefined';
      if (validStart && validStop) {
        passed += 1;
      } else {
        const line = findLineForEntry('operationList', timerStart.code, 'value');
        addError('timer', 'timer_start/timer_stop must include duration/unit and reason/elapsed', line);
      }
    } else {
      const line = timerStart
        ? findLineForEntry('operationList', timerStart.code, 'eventType')
        : 1;
      addError('timer', 'timer_start -> timer_stop sequence missing or invalid', line);
    }
  }

  // Conditional: experiment normal pages
  const isExperimentNormal = /^Page04_.*_normal\.snap\.json$/.test(fileName);
  if (isExperimentNormal) {
    total += 1;
    const simOps = opsByType('simulation_operation');
    if (simOps.length > 0) {
      passed += 1;
    } else {
      addError('simulation_operation', 'experiment page requires at least one simulation_operation event', 1);
    }
  }

  // Conditional: timeout scenario
  const isTimeout = fileName === 'Module_Timeout.snap.json';
  if (isTimeout) {
    total += 1;
    const timerComplete = opsByType('timer_complete')[0];
    const autoSubmit = opsByType('auto_submit').find(
      (op) => !timerComplete || op.code > timerComplete.code
    );
    const ok = timerComplete && autoSubmit && timerComplete.code < autoSubmit.code;
    if (ok) {
      const timerLine = findLineForEntry('operationList', timerComplete.code, 'value');
      const autoLine = findLineForEntry('operationList', autoSubmit.code, 'value');
      const timerVal = parseJsonValue(timerComplete.value);
      const autoVal = parseJsonValue(autoSubmit.value);
      const validTimer =
        timerVal &&
        typeof timerVal.reason === 'string' &&
        typeof timerVal.elapsed !== 'undefined';
      const validAuto =
        autoVal &&
        typeof autoVal.reason === 'string' &&
        Object.prototype.hasOwnProperty.call(autoVal, 'currentPage');
      if (validTimer && validAuto) {
        passed += 1;
      } else {
        const line = validTimer ? autoLine : timerLine;
        addError('timeout', 'timer_complete/auto_submit values must include reason/elapsed and reason/currentPage', line);
      }
    } else {
      const line = timerComplete
        ? findLineForEntry('operationList', timerComplete.code, 'eventType')
        : 1;
      addError('timeout', 'timer_complete -> auto_submit sequence missing or invalid', line);
    }
  }

  return { errors, warnings, passed, total };
}

const isMain = import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  main();
}
