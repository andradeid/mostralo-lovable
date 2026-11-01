// Abas horizontais com a bolinha de status de cada uma.
// JSX movido da BookingSettingsPage sem mudança.
import { cn } from '@/lib/utils';
import { SECTIONS } from './sections';
import type { SectionKey } from '@/lib/bookingSettings/bookingSettingsForm';

interface BookingSettingsTabsProps {
  activeSection: SectionKey;
  setActiveSection: (section: SectionKey) => void;
  getSectionStatus: (key: SectionKey) => { active: boolean; label: string } | null;
}

export function BookingSettingsTabs({ activeSection, setActiveSection, getSectionStatus }: BookingSettingsTabsProps) {
  return (
    <div className="mt-4 flex overflow-x-auto gap-1 pb-1 scrollbar-hide border-b">
      {SECTIONS.map(({ key, label, icon: Icon }) => {
        const status = getSectionStatus(key);
        return (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors rounded-t-lg border-b-2 -mb-[1px]",
              activeSection === key
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0", activeSection === key ? "text-primary" : "text-muted-foreground")} />
            {label}
            {status && (
              <span className={cn(
                "w-1.5 h-1.5 rounded-full shrink-0",
                status.active ? "bg-emerald-500" : "bg-muted-foreground/30"
              )} />
            )}
          </button>
        );
      })}
    </div>
  );
}
