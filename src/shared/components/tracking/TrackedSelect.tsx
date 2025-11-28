import { forwardRef, useCallback, useMemo } from 'react';
import type {
  ChangeEvent,
  ChangeEventHandler,
  SelectHTMLAttributes,
} from 'react';
import EventTypes from '@/shared/services/submission/eventTypes.js';
import type { TrackingInfoProps } from './types';

const getSelectValue = (
  element: HTMLSelectElement,
): string | Record<string, unknown> => {
  if (element.multiple) {
    return {
      selected: Array.from(element.selectedOptions).map((option) => option.value),
    };
  }
  return element.value;
};

export interface TrackedSelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'name' | 'onChange'>,
    TrackingInfoProps {
  onChange?: ChangeEventHandler<HTMLSelectElement>;
}

/**
 * 包装 select，统一 select_change 埋点行为。
 */
export const TrackedSelect = forwardRef<HTMLSelectElement, TrackedSelectProps>(
  function TrackedSelect(
    { name, pageNumber, logOperation, onChange, ...rest },
    ref,
  ) {
    const targetElement = useMemo(
      () => `P${pageNumber}_${name}`,
      [pageNumber, name],
    );

    const handleChange = useCallback(
      (event: ChangeEvent<HTMLSelectElement>) => {
        logOperation({
          targetElement,
          eventType: EventTypes.SELECT_CHANGE ?? 'select_change',
          value: getSelectValue(event.currentTarget),
          time: new Date().toISOString(),
        });

        onChange?.(event);
      },
      [logOperation, onChange, targetElement],
    );

    return (
      <select
        {...rest}
        ref={ref}
        name={name}
        onChange={handleChange}
      />
    );
  },
);

export default TrackedSelect;
