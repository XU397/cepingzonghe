import { forwardRef, useCallback, useMemo } from 'react';
import type {
  ButtonHTMLAttributes,
  MouseEvent,
  MouseEventHandler,
} from 'react';
import EventTypes from '@/shared/services/submission/eventTypes.js';
import type {
  RequiredFieldState,
  TrackingInfoProps,
} from './types';

const CLICK_BLOCKED_EVENT = EventTypes.CLICK_BLOCKED ?? 'click_blocked';

const isValueProvided = (value: unknown): boolean => {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  if (typeof value === 'number') {
    return !Number.isNaN(value);
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  if (value instanceof Date) {
    return !Number.isNaN(value.getTime());
  }
  if (typeof value === 'object') {
    return Object.keys(value).length > 0;
  }
  return true;
};

const collectMissingFields = (
  fields: RequiredFieldState[] | undefined,
): string[] =>
  (fields ?? [])
    .filter((field) => {
      if (typeof field.validator === 'function') {
        return !field.validator(field.value);
      }
      return !isValueProvided(field.value);
    })
    .map((field) => field.name);

export interface TrackedButtonProps
  extends Omit<
      ButtonHTMLAttributes<HTMLButtonElement>,
      'name' | 'onClick' | 'disabled'
    >,
    TrackingInfoProps {
  disabled?: boolean;
  requiredFields?: RequiredFieldState[];
  onClick?: MouseEventHandler<HTMLButtonElement>;
  isNext?: boolean;
}

/**
 * 封装按钮，自动记录 click / next_click / click_blocked 事件。
 */
export const TrackedButton = forwardRef<
  HTMLButtonElement,
  TrackedButtonProps
>(function TrackedButton(
  {
    name,
    pageNumber,
    logOperation,
    requiredFields,
    disabled = false,
    onClick,
    type,
    tabIndex,
    isNext = false,
    ...rest
  },
  ref,
) {
  const targetElement = useMemo(
    () => `P${pageNumber}_${name}`,
    [pageNumber, name],
  );

  const buttonType = disabled ? 'button' : type ?? 'button';
  const computedTabIndex = disabled ? -1 : tabIndex;

  const logEvent = useCallback(
    (eventType: string, value?: Record<string, unknown>) => {
      logOperation({
        targetElement,
        eventType,
        value,
        time: new Date().toISOString(),
      });
    },
    [logOperation, targetElement],
  );

  const handleBlockedClick = useCallback(
    (
      event: MouseEvent<HTMLButtonElement>,
      reason:
        | 'disabled'
        | 'missing_fields',
      missing?: string[],
    ) => {
      event.preventDefault();
      event.stopPropagation();

      logEvent(CLICK_BLOCKED_EVENT, {
        reason,
        ...(missing && missing.length > 0 ? { missing } : {}),
      });
    },
    [logEvent],
  );

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (disabled) {
        handleBlockedClick(event, 'disabled');
        return;
      }

      const missingFields = collectMissingFields(requiredFields);
      if (missingFields.length > 0) {
        handleBlockedClick(event, 'missing_fields', missingFields);
        return;
      }

      const trackedEvent = isNext
        ? EventTypes.NEXT_CLICK ?? 'next_click'
        : EventTypes.CLICK ?? 'click';
      logEvent(trackedEvent, undefined);
      onClick?.(event);
    },
    [disabled, handleBlockedClick, isNext, logEvent, onClick, requiredFields],
  );

  return (
    <button
      {...rest}
      ref={ref}
      name={name}
      type={buttonType}
      tabIndex={computedTabIndex}
      aria-disabled={disabled}
      data-disabled={disabled ? 'true' : undefined}
      onClick={handleClick}
    />
  );
});

export default TrackedButton;
