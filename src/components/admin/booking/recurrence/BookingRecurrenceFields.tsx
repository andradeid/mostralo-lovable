import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Repeat, Loader2, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { MAX_WEEKS, MIN_WEEKS, addDaysIso } from '@/lib/bookingRecurrence/weeklyDates';
import { STATUS_LABEL } from '@/lib/bookingRecurrence/summary';
import type { OccurrenceStatus } from '@/lib/bookingRecurrence/conflicts';
import type { BookingRecurrenceState } from '@/hooks/bookingRecurrence/useBookingRecurrence';

const WEEK_OPTIONS = Array.from({ length: MAX_WEEKS - MIN_WEEKS + 1 }, (_, i) => MIN_WEEKS + i);

const STATUS_STYLE: Record<OccurrenceStatus, string> = {
  free: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
  busy: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300',
  off_hours: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
  blocked: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
  past: 'bg-muted text-muted-foreground',
};

const dayLabel = (iso: string) => {
  try {
    return format(parseISO(iso), "EEE, dd/MM", { locale: ptBR });
  } catch {
    return iso;
  }
};

interface Props {
  recurrence: BookingRecurrenceState;
}

/** Chave "Repetir toda semana" + semanas/até a data + lista das datas com o que está ocupado. */
export function BookingRecurrenceFields({ recurrence: r }: Props) {
  const { counts } = r;

  return (
    <div className="rounded-lg border p-3 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <Repeat className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <Label htmlFor="repeat-weekly" className="cursor-pointer">Repetir toda semana</Label>
            <p className="text-xs text-muted-foreground">Mesmo dia e horário (mensalista, cliente fixo)</p>
          </div>
        </div>
        <Switch id="repeat-weekly" checked={r.enabled} onCheckedChange={r.setEnabled} />
      </div>

      {r.enabled && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Quantas semanas</Label>
              <Select value={String(r.weeks)} onValueChange={(v) => r.setWeeks(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WEEK_OPTIONS.map(n => (
                    <SelectItem key={n} value={String(n)}>{n} semanas</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="repeat-until" className="text-xs">Até a data (opcional)</Label>
              <div className="flex gap-1">
                <Input
                  id="repeat-until"
                  type="date"
                  value={r.untilDate}
                  min={r.startDate ? addDaysIso(r.startDate, 7) : undefined}
                  onChange={(e) => r.setUntilDate(e.target.value)}
                />
                {r.untilDate && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => r.setUntilDate('')} aria-label="Limpar data final">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {!r.startDate || !r.time ? (
            <p className="text-xs text-muted-foreground">Escolha a data e o horário para ver as datas da série.</p>
          ) : r.dates.length < 2 ? (
            <p className="text-xs text-amber-600 dark:text-amber-500">A série precisa de pelo menos 2 datas. Ajuste a data final.</p>
          ) : r.loading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Conferindo a agenda...
            </div>
          ) : (
            <div className="space-y-2">
              <ul className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {r.occurrences.map(o => (
                  <li key={o.date} className="flex items-center justify-between gap-2 text-sm">
                    <span className={cn('capitalize', o.status !== 'free' && 'text-muted-foreground line-through')}>
                      {dayLabel(o.date)} · {r.time}
                    </span>
                    <span className={cn('rounded px-1.5 py-0.5 text-[11px] font-medium shrink-0', STATUS_STYLE[o.status])}>
                      {o.status === 'free' ? 'Livre' : STATUS_LABEL[o.status].replace(/^./, c => c.toUpperCase())}
                    </span>
                  </li>
                ))}
              </ul>
              <p className={cn('text-xs', counts.free ? 'text-muted-foreground' : 'text-destructive')}>
                {counts.free
                  ? `Serão criadas ${counts.free} ${counts.free === 1 ? 'reserva' : 'reservas'}${counts.skipped ? `; ${counts.skipped} ${counts.skipped === 1 ? 'data será pulada' : 'datas serão puladas'}` : ''}.`
                  : 'Nenhuma data livre: nada será criado.'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
