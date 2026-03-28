import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Rocket, Share2, MessageCircle, Package, Eye, AlertTriangle, 
  TrendingUp, Star, Clock, Flame, Sparkles 
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ShopDashboardMode } from '@/hooks/useShopDashboardMode';

interface ShopDashboardStateProps {
  storeId: string | null;
  storeSlug: string;
  mode: ShopDashboardMode;
}

export function ShopDashboardState({ storeId, storeSlug, mode }: ShopDashboardStateProps) {
  if (mode === 'onboarding') {
    return <OnboardingState storeSlug={storeSlug} />;
  }
  if (mode === 'parado') {
    return <ParadoState storeId={storeId} storeSlug={storeSlug} />;
  }
  return null; // modo ativo usa os componentes normais (ShopOperationCenter etc)
}

// ==================== ONBOARDING ====================
function OnboardingState({ storeSlug }: { storeSlug: string }) {
  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Rocket className="w-5 h-5 text-primary" />
          Bem-vindo! Vamos configurar sua loja
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <p className="text-sm text-muted-foreground">
          Complete os passos abaixo para começar a receber pedidos:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <OnboardingStep
            icon={<Package className="w-5 h-5" />}
            title="Crie seu primeiro produto"
            description="Adicione produtos para seus clientes comprarem"
            to="/dashboard/products"
            label="Novo Produto"
          />
          <OnboardingStep
            icon={<Share2 className="w-5 h-5" />}
            title="Compartilhe sua loja"
            description="Envie o link da loja para seus clientes"
            to={`/loja/${storeSlug}`}
            label="Ver Loja"
            external
          />
          <OnboardingStep
            icon={<MessageCircle className="w-5 h-5" />}
            title="Ative o WhatsApp"
            description="Configure notificações automáticas"
            to="/dashboard/whatsapp"
            label="Configurar"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function OnboardingStep({ icon, title, description, to, label, external }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  to: string;
  label: string;
  external?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 p-4 rounded-xl bg-card border border-border/50">
      <div className="text-primary">{icon}</div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-xs text-muted-foreground flex-1">{description}</p>
      <NavLink to={to} {...(external ? { target: '_blank' } : {})}>
        <Button size="sm" variant="outline" className="w-full h-8 text-xs mt-1">
          {label}
        </Button>
      </NavLink>
    </div>
  );
}

// ==================== PARADO ====================
function ParadoState({ storeId, storeSlug }: { storeId: string | null; storeSlug: string }) {
  const { data: insights } = useQuery({
    queryKey: ['shop-parado-insights', storeId],
    queryFn: async () => {
      if (!storeId) return null;

      // Produto mais vendido (últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_name, quantity, orders!inner(store_id, status, created_at)')
        .eq('orders.store_id', storeId)
        .eq('orders.status', 'concluido')
        .gte('orders.created_at', thirtyDaysAgo.toISOString());

      let topProduct: string | null = null;
      if (orderItems && orderItems.length > 0) {
        const counts: Record<string, number> = {};
        for (const item of orderItems) {
          counts[item.product_name] = (counts[item.product_name] || 0) + item.quantity;
        }
        const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
        topProduct = sorted[0]?.[0] || null;
      }

      // Melhor horário (últimos 30 dias)
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('created_at')
        .eq('store_id', storeId)
        .not('status', 'eq', 'cancelado')
        .gte('created_at', thirtyDaysAgo.toISOString());

      let peakHour: number | null = null;
      if (recentOrders && recentOrders.length > 0) {
        const hourCounts: Record<number, number> = {};
        for (const o of recentOrders) {
          const h = new Date(o.created_at).getHours();
          hourCounts[h] = (hourCounts[h] || 0) + 1;
        }
        peakHour = Number(Object.entries(hourCounts).sort(([, a], [, b]) => b - a)[0]?.[0]);
      }

      return { topProduct, peakHour };
    },
    enabled: !!storeId,
    retry: 2,
    staleTime: 300_000,
  });

  return (
    <Card className="border-yellow-300/50 dark:border-yellow-700/50 bg-gradient-to-br from-yellow-50/80 to-transparent dark:from-yellow-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          Nenhuma venda registrada hoje
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Insights */}
        {insights && (insights.topProduct || insights.peakHour !== null) && (
          <div className="flex flex-wrap gap-3">
            {insights.topProduct && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border/50">
                <Star className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-xs">
                  Mais vendido: <span className="font-semibold">{insights.topProduct}</span>
                </span>
              </div>
            )}
            {insights.peakHour !== null && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border/50">
                <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-xs">
                  Melhor horário: <span className="font-semibold">{insights.peakHour}h</span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Sugestões com ações */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <NavLink to={`/loja/${storeSlug}`} target="_blank">
            <Button variant="outline" size="sm" className="w-full h-10 text-xs flex-col gap-0.5 py-2">
              <Share2 className="w-4 h-4" />
              Compartilhar
            </Button>
          </NavLink>
          <NavLink to="/dashboard/coupons">
            <Button variant="outline" size="sm" className="w-full h-10 text-xs flex-col gap-0.5 py-2">
              <Sparkles className="w-4 h-4" />
              Promoção
            </Button>
          </NavLink>
          <NavLink to="/dashboard/whatsapp">
            <Button variant="outline" size="sm" className="w-full h-10 text-xs flex-col gap-0.5 py-2">
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </Button>
          </NavLink>
          <NavLink to="/dashboard/reports">
            <Button variant="outline" size="sm" className="w-full h-10 text-xs flex-col gap-0.5 py-2">
              <TrendingUp className="w-4 h-4" />
              Relatórios
            </Button>
          </NavLink>
        </div>
      </CardContent>
    </Card>
  );
}
