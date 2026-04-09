import { BookOpen } from 'lucide-react';
import { BibleVerse } from '@/utils/bibleVerses';

interface BibleVerseBannerProps {
  verse: BibleVerse | null;
}

export const BibleVerseBanner = ({ verse }: BibleVerseBannerProps) => {
  if (!verse) return null;

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-4">
      <div className="flex items-start gap-3">
        <BookOpen className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm leading-relaxed italic">
            "{verse.text}"
          </p>
          <p className="text-xs font-semibold text-amber-500 mt-1.5">
            {verse.reference}
          </p>
        </div>
      </div>
    </div>
  );
};
