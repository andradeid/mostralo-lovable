import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Bike, Package, TrendingUp, MoreVertical, Edit, UserMinus, DollarSign, Clock, AlertTriangle, Settings } from 'lucide-react';
import { EditDriverDialog } from './EditDriverDialog';
import { UnlinkDriverDialog } from './UnlinkDriverDialog';
import { DriverEarningsConfigDialog } from './DriverEarningsConfigDialog';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/driverEarnings';

interface DeliveryDriver {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
}

interface DriverStats {
  driver_id: string;
  total_deliveries: number;
  active_deliveries: number;
  total_earnings: number;
  pending_earnings: number;
}

interface EarningsConfig {
  payment_type: 'fixed' | 'commission';
  fixed_amount?: number;
  commission_percentage?: number;
}

interface DeliveryDriverCardProps {
  driver: DeliveryDriver;
  stats?: DriverStats;
  onUpdate: () => void;
  isOnline?: boolean;
  storeId: string;
}

export function DeliveryDriverCard({ driver, stats, onUpdate, isOnline = false, storeId }: DeliveryDriverCardProps) {
  const navigate = useNavigate();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false);
  const [showEarningsDialog, setShowEarningsDialog] = useState(false);
  const [earningsConfig, setEarningsConfig] = useState<EarningsConfig | null>(null);

  const initials = driver.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';

  useEffect(() => {
    fetchEarningsConfig();
  }, [driver.id, storeId]);

  const fetchEarningsConfig = async () => {
    try {
      const { data } = await supabase
        .from('driver_earnings_config')
        .select('payment_type, fixed_amount, commission_percentage')
        .eq('driver_id', driver.id)
        .eq('store_id', storeId)
        .eq('is_active', true)
        .single();
      
      if (data) {
        setEarningsConfig(data as EarningsConfig);
      }
    } catch (error) {
      console.error('Erro ao buscar configuração:', error);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={driver.avatar_url} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate">
                {driver.full_name || 'Sem nome'}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {driver.email}
              </p>
              <div className="flex flex-col gap-1 mt-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    {isOnline ? (
                      <Badge variant="default" className="text-xs gap-1 w-fit cursor-help">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Online
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs gap-1 w-fit cursor-help">
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                        Offline
                      </Badge>
                    )}
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isOnline 
                      ? 'Entregador está com o app aberto e disponível' 
                      : 'Entregador não está online no momento'
                    }</p>
                  </TooltipContent>
                </Tooltip>

                {earningsConfig && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-xs w-fit cursor-help">
                        {earningsConfig.payment_type === 'fixed' 
                          ? `Fixo: ${formatCurrency(earningsConfig.fixed_amount || 0)}`
                          : `Comissão: ${earningsConfig.commission_percentage}%`
                        }
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{earningsConfig.payment_type === 'fixed' 
                        ? `Valor fixo de ${formatCurrency(earningsConfig.fixed_amount || 0)} por entrega`
                        : `${earningsConfig.commission_percentage}% da taxa de entrega cobrada do cliente`
                      }</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuItem onClick={() => navigate(`/dashboard/entregadores/financeiro?driver=${driver.id}`)}>
                          <DollarSign className="w-4 h-4 mr-2" />
                          Ver Financeiro
                        </DropdownMenuItem>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>Ver histórico de ganhos e pagamentos</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuItem onClick={() => setShowEarningsDialog(true)}>
                          <Settings className="w-4 h-4 mr-2" />
                          Configurar Pagamento
                        </DropdownMenuItem>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>Definir como você vai pagar este entregador</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>Alterar dados do entregador</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuItem 
                          onClick={() => setShowUnlinkDialog(true)}
                          className="text-amber-600"
                        >
                          <UserMinus className="w-4 h-4 mr-2" />
                          Desvincular da Loja
                        </DropdownMenuItem>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>Remover entregador da sua equipe (não apaga a conta)</p>
                      </TooltipContent>
                    </Tooltip>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipTrigger>
              <TooltipContent>
                <p>Opções do entregador</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-between text-sm cursor-help">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Package className="w-4 h-4" />
                  <span>Ativas</span>
                </div>
                <span className="font-semibold">{stats?.active_deliveries || 0}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Entregas em andamento agora</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-between text-sm cursor-help">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Bike className="w-4 h-4" />
                  <span>Concluídas</span>
                </div>
                <span className="font-semibold">{stats?.total_deliveries || 0}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Total de entregas finalizadas por este entregador</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-between text-sm cursor-help">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="w-4 h-4" />
                  <span>Ganhos Totais</span>
                </div>
                <span className="font-semibold text-green-600">
                  {formatCurrency(stats?.total_earnings || 0)}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Total acumulado (pagos + pendentes)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-between text-sm pt-3 border-t cursor-help">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>A Receber</span>
                </div>
                <span className="font-semibold text-amber-600">
                  {formatCurrency(stats?.pending_earnings || 0)}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Valor pendente de pagamento ao entregador</p>
            </TooltipContent>
          </Tooltip>

          {!earningsConfig && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Alert variant="destructive" className="mt-3 cursor-help">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription className="text-xs">
                    Configure como você vai pagar este entregador
                  </AlertDescription>
                </Alert>
              </TooltipTrigger>
              <TooltipContent>
                <p>Clique em "Configurar Pagamento" no menu para definir taxa fixa ou comissão</p>
              </TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full mt-3" 
                onClick={() => navigate(`/dashboard/entregadores/financeiro?driver=${driver.id}`)}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Ver Detalhes Financeiros
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ver histórico completo de entregas e pagamentos</p>
            </TooltipContent>
          </Tooltip>
        </CardContent>
      </Card>

      <EditDriverDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        driver={driver}
        onSuccess={onUpdate}
      />

      <UnlinkDriverDialog
        open={showUnlinkDialog}
        onOpenChange={setShowUnlinkDialog}
        driver={driver}
        storeId={storeId}
        onSuccess={onUpdate}
      />

      <DriverEarningsConfigDialog
        open={showEarningsDialog}
        onOpenChange={(open) => {
          setShowEarningsDialog(open);
          if (!open) {
            onUpdate();
            fetchEarningsConfig();
          }
        }}
        driver={driver}
        storeId={storeId}
      />
    </TooltipProvider>
  );
}
