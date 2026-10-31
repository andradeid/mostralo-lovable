// Cabeçalho da tela de pedidos (grade de 3 colunas): título e botões, banner do sistema,
// criar pedido e resumo do dia. JSX movido da OrdersPage sem mudança.
import { AlertCircle, ChevronDown, ChevronUp, HelpCircle, Maximize2, Minimize2, Plus, RefreshCw, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SystemBanner } from '@/components/admin/SystemBanner';
import { formatBRL } from '@/lib/scheduledOrders';
import type { HighlightButton } from '@/hooks/orders/useOrdersPageLayout';

interface Props {
  pendingCount: number;
  configExpanded: boolean;
  onToggleConfig: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onShowTutorial: () => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  getHighlightClass: (buttonType: HighlightButton) => string;
  onCreateOrder: () => void;
  todayOrderCount: number;
  todayRevenue: number;
  soundEnabled: boolean;
  notificationsGranted: boolean;
}

export function OrdersPageHeader({
  pendingCount,
  configExpanded,
  onToggleConfig,
  isFullscreen,
  onToggleFullscreen,
  onShowTutorial,
  isRefreshing,
  onRefresh,
  getHighlightClass,
  onCreateOrder,
  todayOrderCount,
  todayRevenue,
  soundEnabled,
  notificationsGranted,
}: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[20%_60%_20%] gap-4 items-start">
      {/* Coluna Esquerda - Título e Configurações */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-2xl font-bold truncate">Pedidos</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Gerencie seus pedidos em tempo real</p>
          </div>
          {pendingCount > 0 && (
            <Badge
              variant="destructive"
              className="animate-pulse text-sm px-2 py-0.5 flex-shrink-0"
            >
              <AlertCircle className="h-3 w-3 mr-1" />
              {pendingCount} {pendingCount === 1 ? 'Novo' : 'Novos'}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleConfig}
            className={`gap-1 ${getHighlightClass('config')}`}
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Config</span>
            {configExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant={isFullscreen ? "default" : "outline"}
            size="sm"
            onClick={onToggleFullscreen}
            className={`gap-1 ${getHighlightClass('exit')}`}
            title={isFullscreen ? "Sair da tela cheia (Esc)" : "Modo tela cheia"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4" />
                <span className="hidden sm:inline">Tela Cheia</span>
              </>
            )}
          </Button>

          {/* Botão de Ajuda */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onShowTutorial}
            title="Ver instruções"
            className={`px-2 ${getHighlightClass('help')}`}
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Atualizar pedidos"
            className="px-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Coluna Central - Banner */}
      <div className="flex items-center justify-center order-first lg:order-none">
        <div className="w-full">
          <SystemBanner position="orders_page" />
        </div>
      </div>

      {/* Coluna Direita - Criar Pedido e Stats */}
      <div className="flex flex-col items-start lg:items-end gap-2">
        <Button
          onClick={onCreateOrder}
          size="sm"
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="sm:hidden">Novo</span>
          <span className="hidden sm:inline">Criar Pedido</span>
        </Button>
        {!configExpanded && (
          <div className="flex items-center gap-2 flex-wrap justify-start lg:justify-end">
            <Badge variant="secondary" className="text-xs">
              📊 {todayOrderCount} pedidos • {formatBRL(todayRevenue)}
            </Badge>
            {soundEnabled && (
              <Badge variant="outline" className="text-xs">
                🔊 Som ativo
              </Badge>
            )}
            {notificationsGranted && (
              <Badge variant="outline" className="text-xs">
                🔔 Notificações
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
