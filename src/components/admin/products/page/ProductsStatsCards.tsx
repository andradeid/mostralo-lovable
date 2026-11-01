// Cards de estatísticas da tela de produtos (total, ativos, categorias).
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Grid } from 'lucide-react';

interface Props {
  totalProducts: number;
  activeProducts: number;
  categoriesCount: number;
}

export function ProductsStatsCards({ totalProducts, activeProducts, categoriesCount }: Props) {
  const statsCards = [
    {
      title: 'Total de Produtos',
      value: totalProducts,
      description: 'Produtos cadastrados',
      icon: Package
    },
    {
      title: 'Produtos Ativos',
      value: activeProducts,
      description: 'Disponíveis para venda',
      icon: Package
    },
    {
      title: 'Categorias',
      value: categoriesCount,
      description: 'Categorias ativas',
      icon: Grid
    }
  ];

  return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
        {statsCards.map((card, index) => (
          <Card key={index} className="p-3 md:p-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-0 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
  );
}
