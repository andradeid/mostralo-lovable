import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ExternalLink, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface BotRecommendationsCardProps {
  storeId: string | null;
  disabled?: boolean;
}

export function BotRecommendationsCard({ 
  storeId, 
  disabled = false 
}: BotRecommendationsCardProps) {
  const navigate = useNavigate();
  const [featuredCount, setFeaturedCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) return;

    const fetchFeaturedCount = async () => {
      setLoading(true);
      try {
        const { count, error } = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('store_id', storeId)
          .eq('is_available', true)
          .eq('is_featured', true);

        if (!error) {
          setFeaturedCount(count || 0);
        }
      } catch (error) {
        console.error('Erro ao buscar produtos em destaque:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedCount();
  }, [storeId]);

  const handleManageProducts = () => {
    navigate('/dashboard/products?filter=featured');
  };

  return (
    <Card>
      <CardHeader className="!p-3 !pb-2 sm:!p-6 sm:!pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 shrink-0" />
          Produtos Recomendados pelo Bot
          <Badge variant="secondary" className="text-[10px] sm:text-xs ml-auto">
            Modo v2
          </Badge>
        </CardTitle>
        <p className="text-xs sm:text-sm text-muted-foreground break-words">
          O assistente recomenda produtos marcados como "Destaque" no seu catálogo
        </p>
      </CardHeader>
      <CardContent className="!p-3 !pt-0 sm:!p-6 sm:!pt-0 space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Package className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <div className="font-semibold text-xl sm:text-2xl">
                {loading ? '...' : featuredCount}
              </div>
              <div className="text-xs text-muted-foreground">
                {featuredCount === 1 ? 'Produto em destaque' : 'Produtos em destaque'}
              </div>
            </div>
          </div>
        </div>

        {featuredCount === 0 && !loading && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <p className="text-xs sm:text-sm text-amber-600 dark:text-amber-400">
              Nenhum produto em destaque. Marque produtos para o bot recomendar quando o cliente pedir sugestões.
            </p>
          </div>
        )}

        <div className="text-xs sm:text-sm text-muted-foreground">
          <p>
            Quando o cliente pedir <strong>recomendação</strong> ou <strong>sugestão</strong>, 
            o assistente usará a função <code className="bg-muted px-1 rounded">get_recommendations()</code> 
            para mostrar os produtos em destaque.
          </p>
        </div>

        <Button 
          variant="outline" 
          className="w-full gap-2"
          onClick={handleManageProducts}
          disabled={disabled}
        >
          <Star className="h-4 w-4" />
          Gerenciar Produtos em Destaque
          <ExternalLink className="h-3 w-3 ml-auto" />
        </Button>
      </CardContent>
    </Card>
  );
}
