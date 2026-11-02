// Escolher produto por nome ou código de barras (leitor USB: lê e aperta Enter sozinho).
import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2, ScanBarcode } from 'lucide-react';
import { looksLikeBarcode } from '@/lib/pdv/barcode';
import { findStockProductByBarcode, searchStockProducts, type StockProduct } from '@/hooks/stock/stockQueries';

interface Props {
  storeId: string;
  onSelect: (product: StockProduct) => void;
  autoFocus?: boolean;
}

export function StockProductPicker({ storeId, onSelect, autoFocus }: Props) {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<StockProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) setTimeout(() => inputRef.current?.focus(), 50);
  }, [autoFocus]);

  useEffect(() => {
    const t = term.trim();
    setMessage('');
    if (!t) {
      setResults([]);
      return;
    }
    let alive = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const rows = await searchStockProducts(storeId, t);
        if (alive) setResults(rows);
      } catch (e) {
        console.error('Erro ao buscar produtos:', e);
      } finally {
        if (alive) setLoading(false);
      }
    }, 250);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [term, storeId]);

  const choose = (p: StockProduct) => {
    setTerm('');
    setResults([]);
    onSelect(p);
  };

  const handleEnter = async () => {
    const t = term.trim();
    if (!t) return;
    if (looksLikeBarcode(t)) {
      setLoading(true);
      try {
        const found = await findStockProductByBarcode(storeId, t);
        if (found) return choose(found);
      } catch (e) {
        console.error('Erro ao buscar código:', e);
      } finally {
        setLoading(false);
      }
    }
    if (results.length === 1) return choose(results[0]);
    if (looksLikeBarcode(t) && results.length === 0) setMessage('Nenhum produto com este código.');
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleEnter();
            }
          }}
          placeholder="Nome do produto ou código de barras"
          className="pl-9"
          autoComplete="off"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      {message && <p className="text-sm text-destructive">{message}</p>}
      {results.length > 0 && (
        <div className="max-h-56 overflow-auto rounded-md border divide-y">
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => choose(p)}
              className="w-full text-left px-3 py-2 hover:bg-accent flex items-center justify-between gap-2"
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium truncate">{p.name}</span>
                {p.barcode && <span className="block text-xs text-muted-foreground">{p.barcode}</span>}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">
                {p.track_stock ? `Estoque: ${p.stock_quantity ?? 0}` : 'Sem controle'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
