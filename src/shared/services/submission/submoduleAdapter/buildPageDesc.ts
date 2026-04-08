import { FlowContext } from './types';

export function buildPageDesc(pageTitle: string, flowContext?: FlowContext | null): string {
  if (!flowContext) {
    return pageTitle;
  }

  return `[${flowContext.flowId}/${flowContext.submoduleId}/${flowContext.stepIndex}] ${pageTitle}`;
}
