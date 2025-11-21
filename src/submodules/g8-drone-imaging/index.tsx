import { lazy } from 'react';
import type { SubmoduleDefinition } from '@shared/types/flow';
import { getPageIdBySubPageNum, getPageConfig, PAGE_CONFIGS } from './mapping';
import type { PageId } from './mapping';

// Lazy load the main component
const Component = lazy(() => import('./Component'));

/**
 * G8 Drone Imaging Submodule Definition
 *
 * This submodule provides an interactive drone imaging experiment
 * for grade 8 students to learn about GSD (Ground Sample Distance)
 * and its relationship with drone height and camera focal length.
 */
export const G8DroneImagingSubmodule: SubmoduleDefinition = {
  submoduleId: 'g8-drone-imaging',
  displayName: '无人机航拍交互课堂',
  version: '1.0.0',

  // Main component (lazy loaded)
  Component,

  // Get initial page based on subPageNum from backend
  getInitialPage: (subPageNum: string): string => {
    const num = parseInt(subPageNum, 10) || 1;
    return getPageIdBySubPageNum(num);
  },

  // Total steps (excluding cover page)
  getTotalSteps: (): number => {
    // Count pages that are not cover (stepIndex > 0)
    return PAGE_CONFIGS.filter(config => config.stepIndex > 0).length;
  },

  // Get navigation mode for a specific page
  getNavigationMode: (pageId: string): 'experiment' | 'questionnaire' | 'hidden' => {
    const config = getPageConfig(pageId as PageId);
    return config?.navigationMode ?? 'experiment';
  },

  // Default timers configuration
  getDefaultTimers: () => ({
    task: 1200, // 20 minutes total
  }),

  // Optional: initialization hook
  onInitialize: () => {
    console.log('[G8DroneImagingSubmodule] Initialized');
  },

  // Optional: cleanup hook
  onDestroy: () => {
    console.log('[G8DroneImagingSubmodule] Destroyed');
    // Clear module-specific localStorage if needed
    // Note: Be careful not to clear data that might be needed for submission
  },

  // Resolve pageId to subPageNum
  resolvePageNum: (pageId: string | null | undefined): string | null => {
    if (!pageId) return null;
    const config = getPageConfig(pageId as PageId);
    return config ? String(config.subPageNum) : null;
  },
};

// Default export for convenient importing
export default G8DroneImagingSubmodule;

// Re-export types and utilities for external use
export type { PageId } from './mapping';
export { getPageIdBySubPageNum, getPageConfig, PAGE_CONFIGS } from './mapping';
