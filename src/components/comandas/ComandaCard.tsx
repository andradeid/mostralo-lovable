import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Comanda } from '@/hooks/useComandas';
import { formatCurrency } from '@/lib/utils';
import { Clock, User, MoreVertical, Printer, DollarSign, X, Receipt, Smartphone, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ComandaCardProps {
  comanda: Comanda;
  onClick?: () => void;
  onClose?: () => void;
  onCancel?: () => void;
  onPrint?: () => void;
  pendingApprovalCount?: number;
}

const statusColors: Record<string, string> = {
  open: 'bg-green-500/10 text-green-600 border-green-500/20',
  closed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const statusLabels: Record<string, string> = {
  open: 'Aberta',
  closed: 'Fechada',
  cancelled: 'Cancelada',
};

export function ComandaCard({ comanda, onClick, onClose, onCancel, onPrint, pendingApprovalCount = 0 }: ComandaCardProps) {
  const isOpen = comanda.status === 'open';
  const isMobile = useIsMobile();
  const isSelfService = comanda.source === 'self_service';

  return (
    <Card 
      className={`cursor-pointer hover:border-primary transition-all active:scale-[0.99] ${isMobile ? 'touch-manipulation' : ''} ${isSelfService ? 'border-l-4 border-l-orange-500' : ''}`}
      onClick={onClick}
    >
      <CardHeader className={`pb-2 ${isMobile ? 'p-4' : ''}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className={isMobile ? 'text-3xl' : 'text-2xl'}>
              {comanda.type === 'mesa' ? '🍽️' : '🛒'}
            </span>
            <div className="flex-1 min-w-0">
              <h3 className={`font-bold truncate ${isMobile ? 'text-lg' : 'text-base'}`}>
                {comanda.type === 'mesa' ? `Mesa ${comanda.table_number}` : `Balcão #${comanda.number}`}
              </h3>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <Badge variant="outline" className={statusColors[comanda.status]}>
                  {statusLabels[comanda.status]}
                </Badge>
                {isSelfService && (
                  <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border-orange-500/20">
                    <Smartphone className="w-3 h-3 mr-1" />
                    Self-Service
                  </Badge>
                )}
                {pendingApprovalCount > 0 && (
                  <Badge variant="destructive" className="animate-pulse">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {pendingApprovalCount} pendente{pendingApprovalCount > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className={isMobile ? 'h-10 w-10' : 'h-8 w-8'}>
                <MoreVertical className={isMobile ? 'h-5 w-5' : 'h-4 w-4'} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onPrint && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPrint(); }}>
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </DropdownMenuItem>
              )}
              {isOpen && onClose && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClose(); }}>
                  <Receipt className="h-4 w-4 mr-2" />
                  Fechar Comanda
                </DropdownMenuItem>
              )}
              {isOpen && onCancel && (
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); onCancel(); }}
                  className="text-destructive focus:text-destructive"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className={`space-y-3 ${isMobile ? 'p-4 pt-0' : ''}`}>
        {comanda.customer_name && (
          <div className={`flex items-center gap-2 text-muted-foreground ${isMobile ? 'text-base' : 'text-sm'}`}>
            <User className={isMobile ? 'h-5 w-5' : 'h-4 w-4'} />
            <span className="truncate">{comanda.customer_name}</span>
          </div>
        )}

        <div className={`flex items-center gap-2 text-muted-foreground ${isMobile ? 'text-base' : 'text-sm'}`}>
          <Clock className={isMobile ? 'h-5 w-5' : 'h-4 w-4'} />
          <span>{format(new Date(comanda.opened_at), "HH:mm", { locale: ptBR })}</span>
        </div>

        <div className={`flex items-center justify-between pt-2 border-t ${isMobile ? 'pt-3' : ''}`}>
          <span className={`text-muted-foreground ${isMobile ? 'text-base' : 'text-sm'}`}>Total</span>
          <span className={`font-bold text-primary ${isMobile ? 'text-xl' : 'text-lg'}`}>
            {formatCurrency(comanda.total)}
          </span>
        </div>

        {/* Botões de ação rápida no mobile */}
        {isMobile && isOpen && (
          <div className="flex gap-2 pt-2">
            {onClose && (
              <Button
                variant="default"
                size="lg"
                className="flex-1 h-12"
                onClick={(e) => { e.stopPropagation(); onClose(); }}
              >
                <DollarSign className="h-5 w-5 mr-2" />
                Fechar
              </Button>
            )}
            {onPrint && (
              <Button
                variant="outline"
                size="lg"
                className="h-12"
                onClick={(e) => { e.stopPropagation(); onPrint(); }}
              >
                <Printer className="h-5 w-5" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
