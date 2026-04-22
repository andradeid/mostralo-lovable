import { useEffect, useState } from 'react';

function getPageVisibility() {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return true;
  }

  return !document.hidden && document.hasFocus();
}

export function usePageVisibility() {
  const [isPageVisible, setIsPageVisible] = useState(getPageVisibility);

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }

    const updateVisibility = () => {
      setIsPageVisible(getPageVisibility());
    };

    document.addEventListener('visibilitychange', updateVisibility);
    window.addEventListener('focus', updateVisibility);
    window.addEventListener('blur', updateVisibility);

    return () => {
      document.removeEventListener('visibilitychange', updateVisibility);
      window.removeEventListener('focus', updateVisibility);
      window.removeEventListener('blur', updateVisibility);
    };
  }, []);

  return isPageVisible;
}