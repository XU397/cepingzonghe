import { useEffect, useState } from 'react';
import useFullscreen from '@/hooks/useFullscreen';
import {
  showFullscreenPrompt,
  showInitialFullscreenGuide,
  hideFullscreenPrompt,
} from '@/utils/fullscreenPromptManager';

/**
 * Enforces fullscreen across the entire app (including Flow routes) and shows a prompt when exited.
 * Uses direct DOM prompts to avoid portal/z-index issues inside submodules.
 */
export default function FullscreenEnforcer() {
  const { isFullscreen, enterFullscreen } = useFullscreen();
  const [hasEnteredFullscreen, setHasEnteredFullscreen] = useState(() => {
    try {
      return sessionStorage.getItem('hasEnteredFullscreen') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!isFullscreen) {
      return;
    }

    try {
      sessionStorage.setItem('hasEnteredFullscreen', 'true');
    } catch {
      // ignore storage errors (private mode, etc.)
    }
    setHasEnteredFullscreen(true);
  }, [isFullscreen]);

  useEffect(() => {
    if (!isFullscreen) {
      if (hasEnteredFullscreen) {
        showFullscreenPrompt(enterFullscreen);
      } else {
        showInitialFullscreenGuide(enterFullscreen);
      }
    } else {
      hideFullscreenPrompt();
    }

    return () => {
      hideFullscreenPrompt();
    };
  }, [isFullscreen, hasEnteredFullscreen, enterFullscreen]);

  return null;
}
