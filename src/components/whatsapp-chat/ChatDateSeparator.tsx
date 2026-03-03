import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChatDateSeparatorProps {
  date: Date;
}

export function ChatDateSeparator({ date }: ChatDateSeparatorProps) {
  let label: string;

  if (isToday(date)) {
    label = 'Hoje';
  } else if (isYesterday(date)) {
    label = 'Ontem';
  } else {
    label = format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  }

  return (
    <div className="flex items-center justify-center my-3">
      <span className="bg-card border border-border text-muted-foreground text-[11px] px-3 py-1 rounded-full shadow-sm">
        {label}
      </span>
    </div>
  );
}
