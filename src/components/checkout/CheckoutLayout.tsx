import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Store, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GUARANTEE_TEXT } from '@/lib/checkout';

const STEPS = ['Seus dados', 'Pagamento', 'Criar senha'];

export function CheckoutLayout({ step, children }: { step: 0 | 1 | 2; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-background to-background">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-bold text-primary text-lg">
            <Store className="h-5 w-5" /> Mostralo
          </Link>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-green-600" /> Pagamento seguro
          </span>
        </div>
      </header>
      <main className="container mx-auto max-w-5xl px-4 py-6 md:py-10">
        <ol className="mb-6 flex items-center justify-center gap-2 text-xs sm:text-sm" aria-label="Etapas">
          {STEPS.map((label, i) => (
            <li key={label} className="flex items-center gap-2">
              <span
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold',
                  i < step && 'border-green-600 bg-green-600 text-white',
                  i === step && 'border-primary bg-primary text-primary-foreground',
                  i > step && 'border-muted-foreground/30 text-muted-foreground',
                )}
                aria-current={i === step ? 'step' : undefined}
              >
                {i < step ? '✓' : i + 1}
              </span>
              <span className={cn(i === step ? 'font-semibold' : 'text-muted-foreground', 'hidden sm:inline')}>{label}</span>
              {i < STEPS.length - 1 && <span className="mx-1 h-px w-6 bg-muted-foreground/30 sm:w-10" />}
            </li>
          ))}
        </ol>
        {children}
        <p className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 shrink-0 text-green-600" /> {GUARANTEE_TEXT}
        </p>
      </main>
    </div>
  );
}
