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

interface TextCollectorEventOptions {
  isComposing?: boolean;
  metadata?: Record<string, unknown>;
}

export function createTextEventCollector(options: TextEventCollectorOptions) {
  let focusValue = '';
  let currentValue = '';
  let lastLoggedValue = '';
  let currentMetadata: Record<string, unknown> = {};
  let timer: ReturnType<typeof setTimeout> | null = null;
  let focused = false;

  const clearTimer = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const logChange = (flushReason: string, metadata: Record<string, unknown> = {}) => {
    if (currentValue === lastLoggedValue) {
      return;
    }
    const valueBefore = lastLoggedValue;
    options.logger.textChange(options.fieldId, valueBefore, currentValue, {
      ...currentMetadata,
      ...metadata,
      flush_reason: flushReason,
    });
    lastLoggedValue = currentValue;
  };

  const flush = (reason: 'submit' | 'dispose', metadata: Record<string, unknown> = {}) => {
    clearTimer();
    logChange(reason, metadata);
    if (focused) {
      options.logger.textBlur(options.fieldId, focusValue, currentValue, {
        ...currentMetadata,
        ...metadata,
        flush_reason: reason,
      });
    }
    focused = false;
    currentMetadata = {};
  };

  return {
    onFocus(valueBefore: string) {
      focused = true;
      focusValue = valueBefore || '';
      currentValue = focusValue;
      lastLoggedValue = focusValue;
      options.logger.textFocus(options.fieldId, focusValue);
    },
    onChange(valueAfter: string, eventOptions: TextCollectorEventOptions = {}) {
      if (eventOptions.isComposing) {
        return;
      }
      currentMetadata = {
        ...currentMetadata,
        ...(eventOptions.metadata || {}),
      };
      currentValue = valueAfter || '';
      if (Math.abs(currentValue.length - lastLoggedValue.length) >= options.throttleCharDelta) {
        clearTimer();
        logChange('char_delta');
        return;
      }
      clearTimer();
      timer = setTimeout(() => {
        timer = null;
        logChange('debounce');
      }, options.debounceMs);
    },
    onBlur(valueAfter: string, metadata: Record<string, unknown> = {}) {
      currentValue = valueAfter || '';
      clearTimer();
      logChange('blur', metadata);
      if (focused) {
        options.logger.textBlur(options.fieldId, focusValue, currentValue, {
          ...currentMetadata,
          ...metadata,
          flush_reason: 'blur',
        });
      }
      focused = false;
      currentMetadata = {};
    },
    flush,
    dispose() {
      flush('dispose');
    },
  };
}
