import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import type {
  ChangeEvent,
  ChangeEventHandler,
  FocusEvent,
  FocusEventHandler,
  TextareaHTMLAttributes,
} from 'react';
import EventTypes from '@/shared/services/submission/eventTypes.js';
import type { TrackingInfoProps } from './types';

const toTextareaValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
};

export interface TrackedTextareaProps
  extends Omit<
      TextareaHTMLAttributes<HTMLTextAreaElement>,
      'name' | 'onFocus' | 'onBlur' | 'onChange'
    >,
    TrackingInfoProps {
  onFocus?: FocusEventHandler<HTMLTextAreaElement>;
  onBlur?: FocusEventHandler<HTMLTextAreaElement>;
  onChange?: ChangeEventHandler<HTMLTextAreaElement>;
}

/**
 * 包装 textarea，记录 focus/change/blur 以及删除行为。
 */
export const TrackedTextarea = forwardRef<
  HTMLTextAreaElement,
  TrackedTextareaProps
>(function TrackedTextarea(
  {
    name,
    pageNumber,
    logOperation,
    onFocus,
    onBlur,
    onChange,
    value,
    defaultValue,
    ...rest
  },
  ref,
) {
  const targetElement = useMemo(
    () => `P${pageNumber}_${name}`,
    [pageNumber, name],
  );

  const lastValueRef = useRef<string>(
    value !== undefined
      ? toTextareaValue(value)
      : defaultValue !== undefined
        ? toTextareaValue(defaultValue)
        : '',
  );

  useEffect(() => {
    if (value !== undefined) {
      lastValueRef.current = toTextareaValue(value);
    }
  }, [value]);

  useEffect(() => {
    if (value === undefined && defaultValue !== undefined) {
      lastValueRef.current = toTextareaValue(defaultValue);
    }
  }, [defaultValue, value]);

  const logEvent = useCallback(
    (eventType: string, eventValue?: Record<string, unknown>) => {
      logOperation({
        targetElement,
        eventType,
        value: eventValue,
        time: new Date().toISOString(),
      });
    },
    [logOperation, targetElement],
  );

  const handleFocus = useCallback(
    (event: FocusEvent<HTMLTextAreaElement>) => {
      logEvent(EventTypes.INPUT_FOCUS);
      onFocus?.(event);
    },
    [logEvent, onFocus],
  );

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLTextAreaElement>) => {
      logEvent(EventTypes.INPUT_BLUR);
      onBlur?.(event);
    },
    [logEvent, onBlur],
  );

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const nextValue = toTextareaValue(event.currentTarget.value);
      const prevValue = lastValueRef.current;

      if (nextValue.length < prevValue.length) {
        logEvent(EventTypes.INPUT_DELETE ?? 'input_delete', {
          action: 'delete',
          prevLength: prevValue.length,
          nextLength: nextValue.length,
        });
      }

      logEvent(EventTypes.INPUT_CHANGE, { prev: prevValue, next: nextValue });
      lastValueRef.current = nextValue;
      onChange?.(event);
    },
    [logEvent, onChange],
  );

  return (
    <textarea
      {...rest}
      ref={ref}
      name={name}
      value={value}
      defaultValue={defaultValue}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
    />
  );
});

export default TrackedTextarea;
