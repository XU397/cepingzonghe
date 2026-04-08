import { useStableOperationLogger } from './useStableOperationLogger';
import { OperationLoggerOptions, OperationLoggerResult } from './types';

/**
 * Backward-compatible alias.
 *
 * Prefer `useStableOperationLogger` for new submodules.
 */
export function useOperationLogger(options: OperationLoggerOptions): OperationLoggerResult {
  return useStableOperationLogger(options);
}
