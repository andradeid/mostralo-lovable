import { useState, useEffect } from 'react';
import { getContextualVerse, type BibleVerse } from '@/utils/bibleVerses';

export const useBibleVerses = (progressPercentage: number) => {
  const [currentVerse, setCurrentVerse] = useState<BibleVerse | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    const verse = getContextualVerse(hour, progressPercentage);
    setCurrentVerse(verse);
  }, [progressPercentage]);

  return {
    currentVerse
  };
};
