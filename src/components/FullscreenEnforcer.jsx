import { useEffect, useState } from 'react';
import useFullscreen from '@/hooks/useFullscreen';
import {
  showFullscreenPrompt,
  showInitialFullscreenGuide,
  hideFullscreenPrompt,
} from '@/utils/fullscreenPromptManager';
import { shouldEnforceFullscreen } from '@/utils/fullscreenPreference';

/**
 * Enforces fullscreen across the entire app (including Flow routes) and shows a prompt when exited.
 * Uses direct DOM prompts to avoid portal/z-index issues inside submodules.
 */
export default function FullscreenEnforcer() {
  const { isFullscreen, enterFullscreen } = useFullscreen();
  const enforceFullscreen = shouldEnforceFullscreen();
  const [hasEnteredFullscreen, setHasEnteredFullscreen] = useState(() => {
    try {
      return sessionStorage.getItem('hasEnteredFullscreen') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!enforceFullscreen) {
      return;
    }

    if (!isFullscreen) {
      return;
    }

    try {
      sessionStorage.setItem('hasEnteredFullscreen', 'true');
    } catch {
      // ignore storage errors (private mode, etc.)
    }
    setHasEnteredFullscreen(true);
  }, [enforceFullscreen, isFullscreen]);

  useEffect(() => {
    if (!enforceFullscreen) {
      hideFullscreenPrompt();
      return;
    }

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
  }, [enforceFullscreen, isFullscreen, hasEnteredFullscreen, enterFullscreen]);

  return null;
}
