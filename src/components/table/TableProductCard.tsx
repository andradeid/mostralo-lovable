import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Loader2, Plus } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
}

interface TableProductCardProps {
  product: Product;
  onAdd: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function TableProductCard({ product, onAdd, isLoading, disabled = false }: TableProductCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="flex">
        {product.image_url && (
          <img 
            src={product.image_url} 
            alt={product.name}
            className="w-24 h-24 object-cover"
          />
        )}
        <CardContent className="flex-1 p-3 flex flex-col justify-between">
          <div>
            <h3 className="font-medium">{product.name}</h3>
            {product.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {product.description}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="font-bold text-primary">{formatCurrency(product.price)}</span>
            <Button 
              size="sm" 
              onClick={onAdd}
              disabled={isLoading || disabled}
              variant={disabled ? 'secondary' : 'default'}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : disabled ? (
                'Pausado'
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
