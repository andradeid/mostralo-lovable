// Campo com rótulo, dica e erro (telas fiscais).
import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';

export function FiscalField({ id, label, error, hint, children, className }: {
  id: string; label: string; error?: string; hint?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ''}`}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
