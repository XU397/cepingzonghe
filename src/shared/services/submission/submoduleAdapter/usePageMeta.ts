import { useMemo } from 'react';
import { encodeCompositePageNum } from '@shared/utils/pageMapping.ts';
import { PageMetaResult } from './types';

/**
 * Hook: derive page meta info including pageNumber and target prefix.
 */
export function usePageMeta(stepIndex: number, subPageNum: number): PageMetaResult {
  return useMemo(() => {
    const pageNumber = encodeCompositePageNum(stepIndex, subPageNum);
    const targetPrefix = `P${pageNumber}_`;
    const prefixTarget = (elementId: string) => `${targetPrefix}${elementId}`;

    return { pageNumber, targetPrefix, prefixTarget };
  }, [stepIndex, subPageNum]);
}
