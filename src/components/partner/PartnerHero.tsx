import { Bell, CalendarDays, RefreshCw, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PartnerPhotoCarousel } from './PartnerPhotoCarousel';

interface PartnerHeroProps {
  /** Nome de quem indicou (sem parceiro válido, a página vira genérica). */
  partnerName?: string | null;
  partnerPhoto?: string | null;
  /** Frase curta da condição ("a vaga de sócio fundador: …"). */
  offerText?: string | null;
  className?: string;
}

/** Topo escuro da página do parceiro: fotos que se alternam, quem indicou e a promessa. */
export function PartnerHero({ partnerName, partnerPhoto, offerText, className }: PartnerHeroProps) {
  const initial = (partnerName?.trim()[0] ?? 'M').toUpperCase();
  return (
    <section className={cn('flex min-w-0 flex-col gap-5 bg-[#1E1611] pb-6 text-[#FFF7F0] md:gap-7 md:px-12 md:pb-2 md:pt-10', className)}>
      <PartnerPhotoCarousel className="aspect-[39/32] md:aspect-[3/2] md:rounded-2xl">
        {partnerName && (
          <div className="absolute left-3 top-3 flex items-center gap-2.5 rounded-full bg-white py-1.5 pl-1.5 pr-4 text-stone-900 md:left-4 md:top-4">
            {partnerPhoto
              ? <img src={partnerPhoto} alt="" className="h-9 w-9 rounded-full object-cover" />
              : <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#B8541A] font-bold text-white" aria-hidden="true">{initial}</span>}
            <span className="flex flex-col leading-tight">
              <span className="text-[11px] text-stone-600">Indicação de</span>
              <span className="text-sm font-bold">{partnerName}</span>
            </span>
          </div>
        )}
      </PartnerPhotoCarousel>

      <div className="space-y-3 px-4 md:px-0">
        <h1 className="font-display text-[28px] font-extrabold leading-[1.1] tracking-tight md:text-[42px]">
          Sua agenda enchendo sozinha.{' '}
          <span className="text-[#F0A066]">{partnerName ? 'Com condição de indicação.' : 'Sem comissão por agendamento.'}</span>
        </h1>
        {partnerName && offerText && (
          <p className="text-[15px] leading-relaxed text-[#E4D3C6] md:text-lg">
            {partnerName.split(' ')[0]} usa e recomenda o Mostralo. Quem chega por aqui ganha {offerText}.
          </p>
        )}
      </div>
    </section>
  );
}

const BENEFITS = [
  { icon: CalendarDays, text: 'Cliente marca sozinho pelo link, a qualquer hora' },
  { icon: Bell, text: 'Confirmação e lembrete no WhatsApp, com botões' },
  { icon: RefreshCw, text: 'Remarcou? O horário volta livre na agenda' },
  { icon: Star, text: 'Pedido de avaliação no Google depois do atendimento' },
];

/** O que o sistema faz e a prova real (Barbearia Jeferson Dias, nome autorizado). */
export function PartnerBenefits({ className }: { className?: string }) {
  return (
    <section className={cn('flex min-w-0 flex-col gap-6 bg-[#1E1611] px-4 py-8 text-[#FFF7F0] md:px-12 md:pb-12 md:pt-5', className)}>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {BENEFITS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-2.5 text-[15px] leading-snug">
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#F0A066]" aria-hidden="true" />
            {text}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-5 rounded-2xl bg-[#2C2018] px-5 py-4 md:mt-auto">
        <div className="flex flex-col">
          <span className="font-display text-3xl font-extrabold text-white">2.415</span>
          <span className="text-xs text-[#CDB3A0]">agendamentos em 2026</span>
        </div>
        <div className="flex flex-col">
          <span className="font-display text-3xl font-extrabold text-[#F0A066]">38%</span>
          <span className="text-xs text-[#CDB3A0]">com a barbearia fechada</span>
        </div>
        <p className="min-w-[160px] flex-1 text-xs leading-relaxed text-[#CDB3A0]">Números reais da Barbearia Jeferson Dias, tirados do sistema.</p>
      </div>
    </section>
  );
}
