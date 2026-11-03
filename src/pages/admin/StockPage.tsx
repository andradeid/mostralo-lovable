// Tela de Estoque: produtos com estoque controlado (custo, valor e margem), entrada de
// mercadoria (também pelo leitor de código de barras, sem precisar de campo focado; código
// não cadastrado oferece o cadastro rápido e depois abre a entrada) e histórico de entradas.
import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Loader2, PackagePlus, ScanBarcode, Warehouse } from 'lucide-react';
import { usePageSEO } from '@/hooks/useSEO';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { useStockOverview } from '@/hooks/stock/useStockOverview';
import type { StockProduct } from '@/hooks/stock/stockQueries';
import { useProductScan } from '@/hooks/barcode/useProductScan';
import { QuickProductDialog } from '@/components/admin/products/quick/QuickProductDialog';
import { brl } from '@/lib/brl';
import { looksLikeBarcode, normalizeBarcode } from '@/lib/pdv/barcode';
import { stockValue } from '@/lib/products/margin';
import { stockStatus } from '@/lib/stock/stockEntry';
import { StockEntryDialog } from '@/components/admin/stock/StockEntryDialog';
import { StockProductsTable } from '@/components/admin/stock/StockProductsTable';
import { StockEntriesTable } from '@/components/admin/stock/StockEntriesTable';

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const StockPage = () => {
  usePageSEO({ title: 'Estoque - Mostralo', description: 'Controle de estoque e entrada de mercadoria.' });
  const { storeId, isLoading: accessLoading, hasAccess } = useStoreAccess();
  const { products, costs, entries, loading, error, reload } = useStockOverview(hasAccess ? storeId : null);

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogProduct, setDialogProduct] = useState<StockProduct | null>(null);

  const openEntry = (product: StockProduct | null) => {
    setDialogProduct(product);
    setDialogOpen(true);
  };

  // Leitor de código de barras: abre a entrada do produto lido (inclusive indisponível)
  const scan = useProductScan({
    storeId: hasAccess ? storeId : null,
    requireAvailable: false,
    askInitialStock: false,
    onClearSearch: () => setSearch(''),
    onProduct: (product) => openEntry(product),
  });

  const filtered = useMemo(() => {
    const t = search.trim();
    if (!t) return products;
    const code = normalizeBarcode(t);
    const q = fold(t);
    return products.filter((p) => fold(p.name).includes(q) || (p.barcode && normalizeBarcode(p.barcode) === code));
  }, [products, search]);

  const totals = useMemo(() => {
    let value = 0;
    let low = 0;
    for (const p of products) {
      value += stockValue(p.stock_quantity, costs[p.id] ?? null) ?? 0;
      if (stockStatus(p.stock_quantity, p.stock_alert_threshold) !== 'ok') low++;
    }
    return { value, low };
  }, [products, costs]);

  // Enter na busca com código digitado: mesmo fluxo do leitor; com nome, abre se sobrar um produto só
  const handleSearchEnter = () => {
    const t = search.trim();
    if (!t || !storeId) return;
    if (looksLikeBarcode(t)) {
      setSearch('');
      scan.scanCode(normalizeBarcode(t));
      return;
    }
    if (filtered.length === 1) openEntry(filtered[0]);
  };

  if (accessLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!hasAccess || !storeId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2 text-muted-foreground">
        <AlertCircle className="h-8 w-8" />
        <p>Sem acesso a esta loja.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Warehouse className="h-6 w-6" />
            Estoque
          </h1>
          <p className="text-sm text-muted-foreground">Entrada de mercadoria, custo e valor do estoque.</p>
        </div>
        <Button onClick={() => openEntry(null)}>
          <PackagePlus className="h-4 w-4 mr-2" />
          Entrada de mercadoria
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Produtos com estoque</p>
            <p className="text-2xl font-bold">{products.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Baixo ou zerado</p>
            <p className={`text-2xl font-bold ${totals.low > 0 ? 'text-yellow-600 dark:text-yellow-400' : ''}`}>{totals.low}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Valor em estoque (custo)</p>
            <p className="text-2xl font-bold">{brl(totals.value)}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="produtos">
        <TabsList>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="entradas">Entradas</TabsTrigger>
        </TabsList>

        <TabsContent value="produtos" className="space-y-3">
          <div className="relative max-w-md">
            <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              data-barcode-search=""
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearchEnter();
                }
              }}
              placeholder="Buscar por nome ou ler código de barras"
              className="pl-9"
              autoComplete="off"
            />
          </div>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <p className="text-sm text-destructive py-6 text-center">{error}</p>
          ) : (
            <StockProductsTable products={filtered} costs={costs} onEntry={openEntry} />
          )}
          {!loading && !error && products.length === 0 && (
            <p className="text-xs text-muted-foreground text-center">
              Ao registrar a primeira entrada de um produto, o controle de estoque dele é ligado.
            </p>
          )}
        </TabsContent>

        <TabsContent value="entradas">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <StockEntriesTable entries={entries} />
          )}
        </TabsContent>
      </Tabs>

      <StockEntryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        storeId={storeId}
        product={dialogProduct}
        onSaved={() => reload()}
      />
      <QuickProductDialog {...scan.quickDialogProps} />
    </div>
  );
};

export default StockPage;
