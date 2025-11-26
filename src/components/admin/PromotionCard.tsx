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
  TrendingUp
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
      active: { label: 'Ativa', variant: 'default' as const },
      paused: { label: 'Pausada', variant: 'secondary' as const },
      scheduled: { label: 'Agendada', variant: 'outline' as const },
      expired: { label: 'Expirada', variant: 'destructive' as const }
    };
    
    const config = statusConfig[promotion.status] || statusConfig.active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeBadge = () => {
    const typeLabels = {
      percentage: 'Percentual',
      fixed_amount: 'Valor Fixo',
      free_delivery: 'Frete Grátis',
      bogo: 'BOGO',
      first_order: '1ª Compra',
      minimum_order: 'Pedido Mínimo'
    };
    
    return typeLabels[promotion.type] || promotion.type;
  };

  const usagePercentage = promotion.max_uses 
    ? (promotion.current_uses / promotion.max_uses) * 100 
    : 0;

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-lg">{promotion.name}</h3>
              {getStatusBadge()}
              <Badge variant="outline">{getTypeBadge()}</Badge>
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

        {/* Código */}
        {promotion.code && (
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Tag className="w-4 h-4 text-muted-foreground" />
            <span className="font-mono font-bold text-primary">
              {promotion.code}
            </span>
          </div>
        )}

        {/* Estatísticas */}
        <div className="grid grid-cols-2 gap-4 text-sm">
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
              <div className="w-full bg-muted rounded-full h-2 mt-1">
                <div 
                  className="bg-primary rounded-full h-2 transition-all"
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
              {promotion.end_date && (
                <> - {format(new Date(promotion.end_date), 'dd/MM/yyyy', { locale: ptBR })}</>
              )}
            </p>
          </div>
        </div>

        {/* Desconto */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Desconto</span>
            <span className="font-bold text-lg text-primary">
              {promotion.type === 'percentage' && `${promotion.discount_percentage}%`}
              {promotion.type === 'fixed_amount' && `R$ ${promotion.discount_amount}`}
              {promotion.type === 'free_delivery' && 'Frete Grátis'}
              {promotion.type === 'bogo' && `${promotion.bogo_buy_quantity}x${promotion.bogo_get_quantity}`}
              {promotion.type === 'first_order' && 'Primeira Compra'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};
