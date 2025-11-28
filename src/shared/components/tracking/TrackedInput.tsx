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
  InputHTMLAttributes,
} from 'react';
import EventTypes from '@/shared/services/submission/eventTypes.js';
import type { TrackingInfoProps } from './types';

/**
 * 标准化输入值，确保 change 事件 value 结构统一。
 */
const toInputString = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }
  if (Array.isArray(value)) {
    return value.join(',');
  }
  return String(value);
};

export interface TrackedInputProps
  extends Omit<
      InputHTMLAttributes<HTMLInputElement>,
      'name' | 'onFocus' | 'onBlur' | 'onChange'
    >,
    TrackingInfoProps {
  onFocus?: FocusEventHandler<HTMLInputElement>;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  onChange?: ChangeEventHandler<HTMLInputElement>;
}

/**
 * 包装后的 input 组件，自动记录 focus/change/blur 埋点事件。
 */
export const TrackedInput = forwardRef<HTMLInputElement, TrackedInputProps>(
  function TrackedInput(
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
        ? toInputString(value)
        : defaultValue !== undefined
          ? toInputString(defaultValue)
          : '',
    );

    useEffect(() => {
      if (value !== undefined) {
        lastValueRef.current = toInputString(value);
      }
    }, [value]);

    useEffect(() => {
      if (value === undefined && defaultValue !== undefined) {
        lastValueRef.current = toInputString(defaultValue);
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
      (event: FocusEvent<HTMLInputElement>) => {
        logEvent(EventTypes.INPUT_FOCUS);
        onFocus?.(event);
      },
      [logEvent, onFocus],
    );

    const handleBlur = useCallback(
      (event: FocusEvent<HTMLInputElement>) => {
        logEvent(EventTypes.INPUT_BLUR);
        onBlur?.(event);
      },
      [logEvent, onBlur],
    );

    const handleChange = useCallback(
      (event: ChangeEvent<HTMLInputElement>) => {
        const nextValue = toInputString(event.currentTarget.value);
        const prevValue = lastValueRef.current;

        logEvent(EventTypes.INPUT_CHANGE, { prev: prevValue, next: nextValue });
        lastValueRef.current = nextValue;
        onChange?.(event);
      },
      [logEvent, onChange],
    );

    return (
      <input
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
  },
);

export default TrackedInput;
