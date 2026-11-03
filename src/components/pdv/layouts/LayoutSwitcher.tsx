// Botão discreto no cabeçalho do PDV: troca o modo só neste computador (ou volta ao padrão da loja).
import { Check, LayoutGrid, LayoutList, Store, Croissant } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { PDV_LAYOUTS, PDV_LAYOUT_LABEL, type PDVLayout } from '@/lib/pdv/layout';
import type { PDVLayoutController } from '@/hooks/pdv/usePDVLayout';

export const LAYOUT_ICON: Record<PDVLayout, typeof LayoutGrid> = {
  grid: LayoutGrid,
  list: LayoutList,
  mixed: Croissant,
};

export function LayoutSwitcher({ controller, className }: { controller: PDVLayoutController; className?: string }) {
  const { layout, storeLayout, deviceLayout, setDeviceLayout } = controller;
  const Icon = LAYOUT_ICON[layout];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={cn('gap-1.5 text-muted-foreground', className)} title="Modo da tela do PDV (só neste computador)">
          <Icon className="h-4 w-4" />
          <span className="hidden xl:inline">{PDV_LAYOUT_LABEL[layout].split(' ')[0]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Modo do PDV neste computador</DropdownMenuLabel>
        {PDV_LAYOUTS.map((value) => {
          const ItemIcon = LAYOUT_ICON[value];
          return (
            <DropdownMenuItem key={value} onSelect={() => setDeviceLayout(value)} className="gap-2">
              <ItemIcon className="h-4 w-4" />
              <span className="flex-1">{PDV_LAYOUT_LABEL[value]}</span>
              {layout === value && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={!deviceLayout} onSelect={() => setDeviceLayout(null)} className="gap-2">
          <Store className="h-4 w-4" />
          <span className="flex-1">Usar o padrão da loja</span>
          <span className="text-xs text-muted-foreground">{PDV_LAYOUT_LABEL[storeLayout].split(' ')[0]}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
