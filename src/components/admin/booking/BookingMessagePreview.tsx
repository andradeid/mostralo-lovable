import { Calendar, Lock, MapPin } from 'lucide-react';

export interface BookingMessagePreviewProps {
  template: string;
  buttons: boolean;
  reminder: boolean;
  store?: { address?: string | null; logo_url?: string | null; name?: string } | null;
}

export function BookingMessagePreview({ template, buttons, reminder, store }: BookingMessagePreviewProps) {
  const values: Record<string, string> = { cliente: 'João Silva', profissional: 'Carlos Souza', servico: 'Corte e barba',
    data: 'sexta, 23/10', horario: '9h30', valor: 'R$ 65', link: 'https://mostralo.com.br/meu-agendamento/exemplo', localizacao: store?.address || '' };
  // Only the button format replaces the standard management link block.
  const mainText = buttons ? template.replace(/🔗\s*\*?Gerencie seu agendamento(?:\s*\(remarcar\/cancelar\))?\s*:?\*?\s*\{link\}/gi, '') : template;
  const text = mainText.replace(/\{(cliente|profissional|servico|data|horario|valor|link|localizacao)\}/gi,
    (match, key: string) => values[key.toLowerCase()] ?? match).replace(/\n{3,}/g, '\n\n').trim();
  const parts = text.split(/(\*[^*\n]+\*)/g);
  return <div aria-label={buttons ? 'Prévia com botões' : 'Prévia só texto'} className="max-w-sm overflow-hidden rounded-lg border bg-card">
    {store?.logo_url && <img src={store.logo_url} alt={`Logo ${store.name || 'da loja'}`} className="h-36 w-full object-contain bg-muted" />}
    <p className="whitespace-pre-wrap break-words p-4 text-sm">{parts.map((part, position) => part.startsWith('*') && part.endsWith('*')
      ? <strong key={`${position}-${part}`}>{part.slice(1, -1)}</strong> : part)}</p>
    {buttons && <>
      <div className="space-y-1 px-4 pb-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Lock aria-hidden="true" className="h-3 w-3" />Assinatura Mostralo</span>
        <p>Agendado pelo Mostralo · mostralo.com.br</p>
      </div>
      <div className="flex items-center justify-center gap-2 border-t p-3 text-sm text-primary"><Calendar aria-hidden="true" className="h-4 w-4" />{reminder ? 'Ver meu agendamento' : 'Remarcar ou cancelar'}</div>
      {store?.address && <div className="flex items-center justify-center gap-2 border-t p-3 text-sm text-primary"><MapPin aria-hidden="true" className="h-4 w-4" />Como chegar</div>}
    </>}
  </div>;
}