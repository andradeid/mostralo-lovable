import { Card } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import { BibleVerse } from '@/utils/bibleVerses';

interface BibleVerseBannerProps {
  verse: BibleVerse | null;
}

export const BibleVerseBanner = ({ verse }: BibleVerseBannerProps) => {
  if (!verse) return null;

  return (
    <Card className="p-6 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-amber-500/20">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
          <BookOpen className="h-8 w-8" />
        </div>
        <div className="flex-1">
          <p className="text-lg font-medium leading-relaxed mb-2">
            "{verse.text}"
          </p>
          <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
            — {verse.reference}
          </p>
        </div>
      </div>
    </Card>
  );
};
