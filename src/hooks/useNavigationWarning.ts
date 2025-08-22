import { useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface NavigationWarningOptions {
  when: boolean;
  message?: string;
  onNavigate?: () => void;
}

export const useNavigationWarning = (options: NavigationWarningOptions) => {
  const { when, message, onNavigate } = options;
  const { t } = useTranslation();

  const defaultMessage = message || t('common.unsavedChangesWarning', 'You have unsaved changes. Are you sure you want to leave?');

  // Handle browser navigation (back/forward/refresh)
  useEffect(() => {
    if (!when) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = defaultMessage;
      return defaultMessage;
    };

    const handlePopState = (e: PopStateEvent) => {
      if (when) {
        const shouldLeave = window.confirm(defaultMessage);
        if (!shouldLeave) {
          // Push the current state back to prevent navigation
          window.history.pushState(null, '', window.location.href);
        } else {
          onNavigate?.();
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    // Push initial state to handle back button
    window.history.pushState(null, '', window.location.href);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [when, defaultMessage, onNavigate]);

  // Programmatic navigation warning
  const confirmNavigation = useCallback((callback: () => void) => {
    if (when) {
      const shouldLeave = window.confirm(defaultMessage);
      if (shouldLeave) {
        onNavigate?.();
        callback();
      }
    } else {
      callback();
    }
  }, [when, defaultMessage, onNavigate]);

  return { confirmNavigation };
};