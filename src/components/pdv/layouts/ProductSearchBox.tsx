// Busca por nome dos modos Lista e Misto (F3 foca). Setas escolhem, Enter adiciona, Esc limpa.
// É o campo marcado data-barcode-search: a leitura do leitor nele é tratada pelo detector
// (que limpa a busca) e o código digitado à mão + Enter também (aqui não adiciona de novo).
import { useEffect, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn, formatCurrency } from '@/lib/utils';
import { looksLikeBarcode, normalizeBarcode } from '@/lib/pdv/barcode';
import { usePDVProductSearch } from '@/hooks/pdv/usePDVCatalog';
import type { PDVPickProduct } from './types';
import { Kbd } from './HotkeyHints';

interface Props {
  storeId: string | null;
  term: string;
  onTermChange: (term: string) => void;
  onPick: (product: PDVPickProduct) => void;
  placeholder?: string;
  className?: string;
}

export function ProductSearchBox({ storeId, term, onTermChange, onPick, placeholder, className }: Props) {
  const { results, pending } = usePDVProductSearch(storeId, term);
  const [active, setActive] = useState(0);
  const [focused, setFocused] = useState(false);

  useEffect(() => setActive(0), [results]);

  const pick = (p: PDVPickProduct) => {
    onPick(p);
    onTermChange('');
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Escape') {
      if (term) {
        e.preventDefault();
        e.stopPropagation(); // não sai da tela cheia do PDV
        onTermChange('');
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (pending || results.length === 0) return;
      // Código digitado + Enter: o leitor já procura o código exato (não adicionar duas vezes)
      const code = normalizeBarcode(term);
      if (looksLikeBarcode(code) && results.some((r) => normalizeBarcode(r.barcode) === code)) return;
      pick(results[Math.min(active, results.length - 1)]);
    }
  };

  const open = focused && term.trim().length > 0;

  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        data-barcode-search=""
        value={term}
        onChange={(e) => onTermChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder ?? 'Buscar por nome ou ler código...'}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls="pdv-search-results"
        className="h-11 pl-10 pr-16 text-base"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
        {pending && term.trim() ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <Kbd>F3</Kbd>}
      </span>

      {open && (
        <ul
          id="pdv-search-results"
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-80 overflow-auto rounded-lg border bg-popover p-1 shadow-lg"
        >
          {results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">{pending ? 'Buscando...' : 'Nenhum produto encontrado.'}</li>
          ) : (
            results.map((p, i) => (
              <li
                key={p.id}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(p)}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-sm',
                  i === active ? 'bg-primary/10 text-foreground' : 'hover:bg-muted',
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{p.name}</span>
                  {p.barcode && <span className="block font-mono text-xs text-muted-foreground">{p.barcode}</span>}
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-primary">
                  {formatCurrency(p.price)}
                  {p.sold_by_weight && <span className="font-normal text-muted-foreground">/kg</span>}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
