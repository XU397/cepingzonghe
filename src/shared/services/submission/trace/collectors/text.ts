interface TextLogger {
  textFocus(_fieldId: string, _valueBefore: string): unknown;
  textChange(
    _fieldId: string,
    _valueBefore: string,
    _valueAfter: string,
    _metadata?: Record<string, unknown>
  ): unknown;
  textBlur(
    _fieldId: string,
    _valueBefore: string,
    _valueAfter: string,
    _metadata?: Record<string, unknown>
  ): unknown;
}

export interface TextEventCollectorOptions {
  fieldId: string;
  logger: TextLogger;
  debounceMs: number;
  throttleCharDelta: number;
}

export function createTextEventCollector(options: TextEventCollectorOptions) {
  let focusValue = '';
  let currentValue = '';
  let lastLoggedValue = '';
  let timer: ReturnType<typeof setTimeout> | null = null;
  let focused = false;

  const clearTimer = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const logChange = (flushReason: string) => {
    if (currentValue === lastLoggedValue) {
      return;
    }
    options.logger.textChange(options.fieldId, focusValue, currentValue, {
      flush_reason: flushReason,
    });
    lastLoggedValue = currentValue;
  };

  return {
    onFocus(valueBefore: string) {
      focused = true;
      focusValue = valueBefore || '';
      currentValue = focusValue;
      lastLoggedValue = focusValue;
      options.logger.textFocus(options.fieldId, focusValue);
    },
    onChange(valueAfter: string, eventOptions: { isComposing?: boolean } = {}) {
      if (eventOptions.isComposing) {
        return;
      }
      currentValue = valueAfter || '';
      if (Math.abs(currentValue.length - lastLoggedValue.length) >= options.throttleCharDelta) {
        clearTimer();
        logChange('char_delta');
        return;
      }
      clearTimer();
      timer = setTimeout(() => logChange('debounce'), options.debounceMs);
    },
    onBlur(valueAfter: string) {
      currentValue = valueAfter || '';
      clearTimer();
      logChange('blur');
      if (focused) {
        options.logger.textBlur(options.fieldId, focusValue, currentValue, {
          flush_reason: 'blur',
        });
      }
      focused = false;
    },
    flush(reason: 'submit' | 'dispose') {
      clearTimer();
      logChange(reason);
      if (focused) {
        options.logger.textBlur(options.fieldId, focusValue, currentValue, {
          flush_reason: reason,
        });
      }
      focused = false;
    },
    dispose() {
      clearTimer();
    },
  };
}
