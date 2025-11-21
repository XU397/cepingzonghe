/**
 * G8DroneImaging Submodule Definition Interface
 *
 * This contract defines the interface that the g8-drone-imaging submodule
 * must implement to integrate with the Flow system.
 */

import { SubmoduleDefinition, SubmoduleComponentProps } from '@shared/types/flow';

export interface G8DroneImagingSubmodule extends SubmoduleDefinition {
  submoduleId: 'g8-drone-imaging';
  displayName: '8年级无人机航拍-交互实验';
  version: '1.0.0';

  /**
   * Main component that renders the submodule content
   */
  Component: (props: SubmoduleComponentProps) => React.ReactNode;

  /**
   * Map subPageNum (from backend) to internal pageId
   * @param subPageNum - String number "1" to "7"
   * @returns pageId - Internal page identifier
   */
  getInitialPage(subPageNum: string): string;

  /**
   * Total number of navigation steps (excluding hidden cover page)
   * @returns 6
   */
  getTotalSteps(): number;

  /**
   * Get navigation mode for a specific page
   * @param pageId - Internal page identifier
   * @returns Navigation mode determining UI display
   */
  getNavigationMode(pageId: string): 'experiment' | 'questionnaire' | 'hidden';

  /**
   * Default timer configuration
   * @returns Timer settings in seconds
   */
  getDefaultTimers(): {
    task: number;  // 1200 (20 minutes)
  };

  /**
   * Optional initialization hook
   */
  onInitialize?: () => void;

  /**
   * Optional cleanup hook
   */
  onDestroy?: () => void;
}

/**
 * Props passed to the submodule component
 */
export interface G8DroneImagingComponentProps extends SubmoduleComponentProps {
  userContext: {
    examNo: string;
    batchCode: string;
    flowId?: string;
    studentName?: string;
  };
  initialPageId: string;
  onComplete: () => void;
  onError: (error: Error) => void;
}
