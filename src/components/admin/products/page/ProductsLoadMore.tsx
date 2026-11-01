// Rodapé da lista de produtos: contador "Exibindo X de Y" e botão Carregar mais.
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface Props {
  loadedProducts: number;
  totalProducts: number;
  hasMoreProducts: boolean;
  isLoadingMore: boolean;
  loadMoreProducts: () => void;
  pageSize: number;
}

export function ProductsLoadMore({ loadedProducts, totalProducts, hasMoreProducts, isLoadingMore, loadMoreProducts, pageSize: PAGE_SIZE }: Props) {
  return (
          <div className="flex flex-col items-center gap-4 py-6 border-t mt-6">
            <div className="text-sm text-muted-foreground">
              Exibindo <strong className="text-foreground">{loadedProducts}</strong> de{' '}
              <strong className="text-foreground">{totalProducts}</strong> produtos
            </div>

            {hasMoreProducts && (
              <Button
                variant="outline"
                onClick={loadMoreProducts}
                disabled={isLoadingMore}
                className="min-w-[200px]"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  <>
                    Carregar mais {PAGE_SIZE} produtos
                  </>
                )}
              </Button>
            )}

            {!hasMoreProducts && loadedProducts === totalProducts && (
              <p className="text-sm text-muted-foreground">
                ✓ Todos os {totalProducts} produtos carregados
              </p>
            )}
          </div>
  );
}
