// Peças pequenas usadas nas abas (dica, linha com chave liga/desliga e título da aba).
// Código movido da BookingSettingsPage sem mudança.
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

export const Tip = ({ text }: { text: string }) => (
  <Tooltip>
    <TooltipTrigger asChild><HelpCircle className="h-3 w-3 text-muted-foreground/50 cursor-help shrink-0" /></TooltipTrigger>
    <TooltipContent className="max-w-xs text-xs"><p>{text}</p></TooltipContent>
  </Tooltip>
);

export const TRow = ({ id, label, tip, checked, onChange, disabled }: { id: string; label: string; tip?: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) => (
  <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
    <div className="flex items-center gap-1.5">
      <Label htmlFor={id} className="text-sm cursor-pointer">{label}</Label>
      {tip && <Tip text={tip} />}
    </div>
    <Switch id={id} checked={checked} onCheckedChange={onChange} disabled={disabled} />
  </div>
);

export const SectionTitle = ({ title, description }: { title: string; description?: string }) => (
  <div className="mb-4">
    <h2 className="text-base font-semibold">{title}</h2>
    {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
  </div>
);
