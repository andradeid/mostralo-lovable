// Aba Caixa: modo padrão da tela do PDV para a loja (dono/admin). Cada computador ainda pode
// trocar só para si pelo botão do cabeçalho.
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { PDV_LAYOUTS, PDV_LAYOUT_HINT, PDV_LAYOUT_LABEL } from '@/lib/pdv/layout';
import type { PDVLayoutController } from '@/hooks/pdv/usePDVLayout';
import { LAYOUT_ICON } from './LayoutSwitcher';

export function StoreLayoutSetting({ controller }: { controller: PDVLayoutController }) {
  const { storeLayout, deviceLayout, canManageStoreLayout, setStoreLayout } = controller;
  const disabled = !canManageStoreLayout || setStoreLayout.isPending;
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="space-y-1">
          <Label className="text-sm font-medium">Modo da tela do PDV (padrão da loja)</Label>
          <p className="text-xs text-muted-foreground">
            Vale para todos os computadores da loja; cada um pode trocar só para si no botão do topo do PDV.
            {!canManageStoreLayout && ' Só o dono ou administrador da loja pode mudar o padrão.'}
            {deviceLayout && ` Este computador está usando: ${PDV_LAYOUT_LABEL[deviceLayout]}.`}
          </p>
        </div>
        <div role="radiogroup" className="grid gap-2 sm:grid-cols-3">
          {PDV_LAYOUTS.map((value) => {
            const Icon = LAYOUT_ICON[value];
            const selected = storeLayout === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={disabled}
                onClick={() => !selected && setStoreLayout.mutate(value)}
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-3 text-left transition disabled:cursor-not-allowed',
                  selected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary/50',
                  disabled && !selected && 'opacity-60',
                )}
              >
                <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', selected ? 'text-primary' : 'text-muted-foreground')} />
                <span className="space-y-0.5">
                  <span className="block text-sm font-medium">{PDV_LAYOUT_LABEL[value]}</span>
                  <span className="block text-xs text-muted-foreground">{PDV_LAYOUT_HINT[value]}</span>
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
