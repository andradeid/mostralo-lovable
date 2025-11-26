import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  slug: string;
  is_on_offer?: boolean;
  original_price?: number;
  offer_price?: number;
}

interface Store {
  id: string;
  name: string;
  slug: string;
  theme_colors: any;
  configuration?: {
    primary_color?: string;
    secondary_color?: string;
  };
}

interface RelatedProductsProps {
  products: Product[];
  store: Store;
  onProductClick: (product: Product) => void;
}

export function RelatedProducts({ products, store, onProductClick }: RelatedProductsProps) {
  if (!products || products.length === 0) {
    return null;
  }

  const primaryColor = store?.configuration?.primary_color || store?.theme_colors?.primary || '#3B82F6';

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  return (
    <div className="mt-12">
      <div className="max-w-[1080px] mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6">Produtos Relacionados</h2>
        
        {/* Mobile: Scroll horizontal */}
        <div className="md:hidden">
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
            {products.map((product) => (
              <div key={product.id} className="flex-shrink-0 w-64">
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => onProductClick(product)}
                >
                  <CardContent className="p-0">
                    <div className="relative">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-40 object-cover rounded-t-lg"
                        />
                      ) : (
                        <div className="w-full h-40 bg-muted rounded-t-lg flex items-center justify-center">
                          <span className="text-muted-foreground">Sem imagem</span>
                        </div>
                      )}
                      
                      {product.is_on_offer && (
                        <Badge className="absolute top-2 right-2 bg-red-500 text-white">
                          {Math.round((1 - product.offer_price! / product.price) * 100)}% OFF
                        </Badge>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold text-sm mb-2 line-clamp-2">{product.name}</h3>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          {product.is_on_offer ? (
                            <div className="space-y-1">
                              <div className="text-sm font-bold text-primary">
                                {formatPrice(product.offer_price!)}
                              </div>
                              <div className="text-xs text-muted-foreground line-through">
                                {formatPrice(product.price)}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm font-bold text-primary">
                              {formatPrice(product.price)}
                            </div>
                          )}
                        </div>
                        
                        <Button 
                          size="sm" 
                          style={{ backgroundColor: primaryColor }}
                          className="text-xs px-3"
                        >
                          Ver
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: Grid */}
        <div className="hidden md:grid md:grid-cols-4 gap-6">
          {products.slice(0, 4).map((product) => (
            <Card 
              key={product.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => onProductClick(product)}
            >
              <CardContent className="p-0">
                <div className="relative">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="w-full h-48 bg-muted rounded-t-lg flex items-center justify-center">
                      <span className="text-muted-foreground">Sem imagem</span>
                    </div>
                  )}
                  
                  {product.is_on_offer && (
                    <Badge className="absolute top-2 right-2 bg-red-500 text-white">
                      {Math.round((1 - product.offer_price! / product.price) * 100)}% OFF
                    </Badge>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold mb-2 line-clamp-2">{product.name}</h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      {product.is_on_offer ? (
                        <div className="space-y-1">
                          <div className="text-lg font-bold text-primary">
                            {formatPrice(product.offer_price!)}
                          </div>
                          <div className="text-sm text-muted-foreground line-through">
                            {formatPrice(product.price)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-lg font-bold text-primary">
                          {formatPrice(product.price)}
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      size="sm" 
                      style={{ backgroundColor: primaryColor }}
                    >
                      Ver Produto
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}