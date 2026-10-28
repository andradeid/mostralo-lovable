import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface PartnerSlide { name: string; label: string; alt: string }

/** Fotos da página do parceiro: cada celular mostra uma tela real do agendamento. */
const PARTNER_SLIDES: PartnerSlide[] = [
  { name: 'barbeiro', label: 'Barbearias', alt: 'Barbeiro mostrando a página de agendamento do Mostralo no celular' },
  { name: 'nail', label: 'Nail designers', alt: 'Nail designer mostrando a escolha de data e horário no celular' },
  { name: 'salao', label: 'Salões', alt: 'Dona de salão mostrando um agendamento confirmado no celular' },
  { name: 'estetica', label: 'Estética', alt: 'Esteticista mostrando a confirmação do agendamento no WhatsApp' },
];

const INTERVAL_MS = 4500;

/** Carrossel com troca suave; para sozinho quando a pessoa escolhe uma foto ou prefere menos movimento. */
export function PartnerPhotoCarousel({ className, children }: { className?: string; children?: ReactNode }) {
  const [index, setIndex] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto) return;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const t = window.setInterval(() => setIndex(i => (i + 1) % PARTNER_SLIDES.length), INTERVAL_MS);
    return () => window.clearInterval(t);
  }, [auto]);

  const current = PARTNER_SLIDES[index];

  return (
    <div className={cn('relative overflow-hidden bg-stone-800', className)}>
      {PARTNER_SLIDES.map((s, i) => (
        <picture key={s.name}>
          <source media="(max-width: 767px)" srcSet={`/parceiro/${s.name}-mob.webp`} />
          <img
            src={`/parceiro/${s.name}-desk.webp`}
            alt={i === index ? s.alt : ''}
            aria-hidden={i === index ? undefined : true}
            loading={i === 0 ? 'eager' : 'lazy'}
            decoding="async"
            className={cn('absolute inset-0 h-full w-full object-cover transition-opacity duration-700', i === index ? 'opacity-100' : 'opacity-0')}
          />
        </picture>
      ))}
      {children}
      <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/70 py-1 pl-3 pr-1 text-white">
        <span className="text-xs font-semibold" aria-live="polite">{current.label}</span>
        {PARTNER_SLIDES.map((s, i) => (
          <button
            key={s.name}
            type="button"
            onClick={() => { setAuto(false); setIndex(i); }}
            aria-label={`Ver foto: ${s.label}`}
            aria-current={i === index ? 'true' : undefined}
            className="flex h-6 w-5 items-center justify-center"
          >
            <span className={cn('block h-2 w-2 rounded-full', i === index ? 'bg-white' : 'bg-white/45')} />
          </button>
        ))}
      </div>
    </div>
  );
}
