// Atalhos grandes do modo Misto (produtos marcados "Mostrar como atalho no PDV").
// "+ Escolher atalho" (dono/admin) marca outro produto sem sair do PDV.
import { useState } from 'react';
import { Loader2, Plus, Scale, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn, formatCurrency } from '@/lib/utils';
import { usePDVProductSearch, usePDVShortcuts, type PDVCatalogProduct } from '@/hooks/pdv/usePDVCatalog';
import type { PDVPickProduct } from './types';

interface Props {
  storeId: string | null;
  onPick: (product: PDVPickProduct) => void;
  canManage: boolean;
  className?: string;
}

export function ShortcutGrid({ storeId, onPick, canManage, className }: Props) {
  const { shortcuts, isLoading, toggleShortcut } = usePDVShortcuts(storeId, true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Atalhos</h3>
        {canManage && shortcuts.length > 0 && (
          <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditing((v) => !v)}>
            {editing ? 'Pronto' : 'Editar'}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {shortcuts.map((p) => (
            <div key={p.id} className="relative">
              <button
                type="button"
                onClick={() => !editing && onPick(p)}
                className={cn(
                  'flex h-28 w-full flex-col justify-between rounded-xl border-2 bg-card p-3 text-left shadow-sm transition',
                  'hover:border-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.98]',
                  editing && 'opacity-60',
                )}
              >
                <span className="line-clamp-2 text-base font-bold leading-tight">{p.name}</span>
                <span className="flex items-center justify-between gap-2">
                  <span className="text-lg font-extrabold tabular-nums text-primary">
                    {formatCurrency(p.price)}
                    {p.sold_by_weight && <span className="text-xs font-medium text-muted-foreground">/kg</span>}
                  </span>
                  {p.sold_by_weight && <Scale className="h-4 w-4 text-muted-foreground" aria-label="Por quilo" />}
                </span>
              </button>
              {editing && (
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute -right-2 -top-2 h-7 w-7 rounded-full"
                  disabled={toggleShortcut.isPending}
                  onClick={() => toggleShortcut.mutate({ productId: p.id, on: false })}
                  aria-label={`Tirar ${p.name} dos atalhos`}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}

          {canManage && (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="flex h-28 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              <Plus className="h-6 w-6" />
              <span className="text-sm font-medium">Escolher atalho</span>
            </button>
          )}
        </div>
      )}

      {!isLoading && shortcuts.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhum atalho ainda. {canManage ? 'Use "Escolher atalho" ou marque "Mostrar como atalho no PDV" no cadastro do produto.' : 'Peça ao dono da loja para marcar os produtos.'}
        </p>
      )}

      {canManage && (
        <ShortcutPickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          storeId={storeId}
          current={shortcuts}
          saving={toggleShortcut.isPending}
          onChoose={(p) => toggleShortcut.mutate({ productId: p.id, on: true }, { onSuccess: () => setPickerOpen(false) })}
        />
      )}
    </div>
  );
}

function ShortcutPickerDialog({
  open,
  onOpenChange,
  storeId,
  current,
  saving,
  onChoose,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  storeId: string | null;
  current: PDVCatalogProduct[];
  saving: boolean;
  onChoose: (p: PDVCatalogProduct) => void;
}) {
  const [term, setTerm] = useState('');
  const { results, pending } = usePDVProductSearch(storeId, term, 12);
  const already = new Set(current.map((p) => p.id));

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setTerm(''); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Escolher atalho</DialogTitle>
          <DialogDescription>O produto escolhido vira um botão grande no modo Misto.</DialogDescription>
        </DialogHeader>
        <Input autoFocus value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Nome do produto" autoComplete="off" />
        <ul className="max-h-72 space-y-1 overflow-auto">
          {term.trim() === '' ? (
            <li className="px-2 py-3 text-sm text-muted-foreground">Digite parte do nome.</li>
          ) : results.length === 0 ? (
            <li className="px-2 py-3 text-sm text-muted-foreground">{pending ? 'Buscando...' : 'Nenhum produto encontrado.'}</li>
          ) : (
            results.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  disabled={saving || already.has(p.id)}
                  onClick={() => onChoose(p)}
                  className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted disabled:opacity-50"
                >
                  <span className="truncate font-medium">{p.name}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {already.has(p.id) ? 'já é atalho' : `${formatCurrency(p.price)}${p.sold_by_weight ? '/kg' : ''}`}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
