import { Promotion } from '@/types/promotions';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreVertical, 
  Edit, 
  Copy, 
  Pause, 
  Play, 
  Trash2,
  Tag,
  Calendar,
  Users,
  Truck,
  Percent,
  Gift,
  ShoppingBag,
  Clock,
  Eye,
  EyeOff
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PromotionCardProps {
  promotion: Promotion;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onToggleStatus: (id: string, currentStatus: string) => void;
  onDelete: (id: string) => void;
}

export const PromotionCard = ({
  promotion,
  onEdit,
  onDuplicate,
  onToggleStatus,
  onDelete
}: PromotionCardProps) => {
  const getStatusBadge = () => {
    const statusConfig = {
      active: { label: 'Ativa', className: 'bg-green-500 text-white' },
      paused: { label: 'Pausada', className: 'bg-yellow-500 text-white' },
      scheduled: { label: 'Agendada', className: 'bg-blue-500 text-white' },
      expired: { label: 'Expirada', className: 'bg-red-500 text-white' }
    };
    
    const config = statusConfig[promotion.status] || statusConfig.active;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getTypeBadge = () => {
    const typeConfig: Record<string, { label: string; icon: React.ReactNode }> = {
      percentage: { label: `${promotion.discount_percentage}% OFF`, icon: <Percent className="w-3 h-3" /> },
      fixed_amount: { label: `R$ ${promotion.discount_amount?.toFixed(2)} OFF`, icon: <Tag className="w-3 h-3" /> },
      free_delivery: { label: 'Frete Grátis', icon: <Truck className="w-3 h-3" /> },
      bogo: { label: `${(promotion.bogo_discount_percentage ?? 100) >= 100 ? `Leve ${promotion.bogo_buy_quantity} Pague ${(promotion.bogo_buy_quantity || 2) - (promotion.bogo_get_quantity || 1)}` : `Compre ${promotion.bogo_buy_quantity}, ${promotion.bogo_discount_percentage}% OFF no${(promotion.bogo_get_quantity || 1) > 1 ? "s" : ""} próximo${(promotion.bogo_get_quantity || 1) > 1 ? "s" : ""}`}`, icon: <Gift className="w-3 h-3" /> },
      first_order: { label: '1ª Compra', icon: <ShoppingBag className="w-3 h-3" /> },
    };
    
    return typeConfig[promotion.type] || { label: promotion.type, icon: <Tag className="w-3 h-3" /> };
  };

  const getBenefitBadges = () => {
    const badges: { label: string; icon: React.ReactNode; className: string }[] = [];
    
    // Tipo principal
    if (promotion.type === 'free_delivery') {
      badges.push({ label: 'Frete Grátis', icon: <Truck className="w-3 h-3" />, className: 'bg-green-500 text-white' });
      if (promotion.discount_percentage) {
        badges.push({ label: `${promotion.discount_percentage}% OFF`, icon: <Percent className="w-3 h-3" />, className: 'bg-orange-500 text-white' });
      } else if (promotion.discount_amount) {
        badges.push({ label: `R$ ${promotion.discount_amount.toFixed(2)} OFF`, icon: <Tag className="w-3 h-3" />, className: 'bg-orange-500 text-white' });
      }
    } else if (promotion.type === 'percentage' && promotion.discount_percentage) {
      badges.push({ label: `${promotion.discount_percentage}% OFF`, icon: <Percent className="w-3 h-3" />, className: 'bg-orange-500 text-white' });
    } else if (promotion.type === 'fixed_amount' && promotion.discount_amount) {
      badges.push({ label: `R$ ${promotion.discount_amount.toFixed(2)} OFF`, icon: <Tag className="w-3 h-3" />, className: 'bg-orange-500 text-white' });
    } else if (promotion.type === 'bogo') {
      badges.push({ label: `${(promotion.bogo_discount_percentage ?? 100) >= 100 ? `Leve ${promotion.bogo_buy_quantity} Pague ${(promotion.bogo_buy_quantity || 2) - (promotion.bogo_get_quantity || 1)}` : `Compre ${promotion.bogo_buy_quantity}, ${promotion.bogo_discount_percentage}% OFF no${(promotion.bogo_get_quantity || 1) > 1 ? "s" : ""} próximo${(promotion.bogo_get_quantity || 1) > 1 ? "s" : ""}`}`, icon: <Gift className="w-3 h-3" />, className: 'bg-purple-500 text-white' });
    }
    
    if (promotion.first_order_only) {
      badges.push({ label: '1º Pedido', icon: <ShoppingBag className="w-3 h-3" />, className: 'bg-blue-500 text-white' });
    }
    
    return badges;
  };

  const scopeLabels: Record<string, string> = {
    all_products: 'Todos os produtos',
    specific_products: 'Produtos específicos',
    category: 'Categorias específicas',
    delivery_type: 'Tipo de entrega',
  };

  const usagePercentage = promotion.max_uses 
    ? (promotion.current_uses / promotion.max_uses) * 100 
    : 0;

  const benefits = getBenefitBadges();

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Banner da promoção */}
      {promotion.banner_image_url && (
        <div className="relative w-full h-40 overflow-hidden">
          <img 
            src={promotion.banner_image_url} 
            alt={promotion.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2">
            {getStatusBadge()}
          </div>
        </div>
      )}

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-lg">{promotion.name}</h3>
              {!promotion.banner_image_url && getStatusBadge()}
            </div>
            
            {promotion.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {promotion.description}
              </p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(promotion.id)}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(promotion.id)}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onToggleStatus(promotion.id, promotion.status)}>
                {promotion.status === 'active' ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pausar
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Ativar
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(promotion.id)}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Badges de benefícios */}
        {benefits.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {benefits.map((b, i) => (
              <Badge key={i} className={`${b.className} text-xs flex items-center gap-1`}>
                {b.icon}
                {b.label}
              </Badge>
            ))}
          </div>
        )}

        {/* Código */}
        {promotion.code && (
          <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg">
            <Tag className="w-4 h-4 text-muted-foreground" />
            <span className="font-mono font-bold text-primary text-sm">
              {promotion.code}
            </span>
          </div>
        )}

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="w-3 h-3" />
              <span>Usos</span>
            </div>
            <p className="font-semibold">
              {promotion.current_uses}
              {promotion.max_uses && ` / ${promotion.max_uses}`}
            </p>
            {promotion.max_uses && (
              <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                <div 
                  className="bg-primary rounded-full h-1.5 transition-all"
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>Validade</span>
            </div>
            <p className="font-semibold text-xs">
              {format(new Date(promotion.start_date), 'dd/MM/yyyy', { locale: ptBR })}
              {promotion.end_date ? (
                <> - {format(new Date(promotion.end_date), 'dd/MM/yyyy', { locale: ptBR })}</>
              ) : (
                <span className="text-muted-foreground"> - Indeterminado</span>
              )}
            </p>
          </div>
        </div>

        {/* Detalhes adicionais */}
        <div className="space-y-2 text-xs text-muted-foreground border-t pt-3">
          <div className="flex items-center justify-between">
            <span>Escopo</span>
            <span className="font-medium text-foreground">{scopeLabels[promotion.scope] || promotion.scope}</span>
          </div>
          
          {promotion.minimum_order_value && (
            <div className="flex items-center justify-between">
              <span>Pedido mínimo</span>
              <span className="font-medium text-foreground">R$ {promotion.minimum_order_value.toFixed(2)}</span>
            </div>
          )}

          {(promotion.start_time || promotion.end_time) && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Horário</span>
              </div>
              <span className="font-medium text-foreground">
                {promotion.start_time || '00:00'} - {promotion.end_time || '23:59'}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span>Visível na loja</span>
            <span className="font-medium text-foreground flex items-center gap-1">
              {promotion.is_visible_on_store ? (
                <><Eye className="w-3 h-3 text-green-500" /> Sim</>
              ) : (
                <><EyeOff className="w-3 h-3 text-muted-foreground" /> Não</>
              )}
            </span>
          </div>

          {promotion.show_as_popup && (
            <div className="flex items-center justify-between">
              <span>Popup</span>
              <Badge variant="outline" className="text-[10px] h-5">Ativo</Badge>
            </div>
          )}
        </div>

        {/* Botão editar */}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => onEdit(promotion.id)}
        >
          <Edit className="w-3.5 h-3.5 mr-2" />
          Editar Promoção
        </Button>
      </div>
    </Card>
  );
};
