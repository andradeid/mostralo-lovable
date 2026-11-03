// Atalhos visíveis do PDV (F2 quantidade, F3 buscar, F4 pagar, Del remover último).
import { cn } from '@/lib/utils';

const HINTS = [
  ['F2', 'Quantidade'],
  ['F3', 'Buscar por nome'],
  ['F4', 'Pagar'],
  ['Del', 'Remover último'],
] as const;

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd className={cn('rounded border bg-muted px-1.5 py-0.5 font-mono text-[11px] font-semibold text-foreground', className)}>
      {children}
    </kbd>
  );
}

export function HotkeyHints({ className }: { className?: string }) {
  return (
    <div className={cn('hidden md:flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground', className)}>
      {HINTS.map(([key, label]) => (
        <span key={key} className="flex items-center gap-1">
          <Kbd>{key}</Kbd> {label}
        </span>
      ))}
    </div>
  );
}
