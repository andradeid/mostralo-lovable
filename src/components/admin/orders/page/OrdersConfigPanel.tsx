// Seção recolhível de configurações da tela de pedidos: som, notificações, aviso de som bloqueado,
// números do dia e filtros. JSX movido da OrdersPage sem mudança.
import { AlertCircle, Bell, DollarSign, ShoppingBag, TrendingUp, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SoundSelector } from '@/components/admin/orders/SoundSelector';
import { OrderFilters } from '@/components/admin/orders/OrderFilters';
import { MarketplaceSavingsCard } from '@/components/admin/MarketplaceSavingsCard';
import { formatBRL } from '@/lib/scheduledOrders';
import type { Database } from '@/integrations/supabase/types';

type PaymentStatus = Database['public']['Enums']['payment_status'];
type DeliveryType = Database['public']['Enums']['delivery_type'];

interface Props {
  audioUnlocked: boolean;
  audioBlocked: boolean;
  soundEnabled: boolean;
  onUnlockAudio: () => void;
  notificationsGranted: boolean;
  onAskNotifications: () => void;
  onTestSound: () => void;
  onToggleSound: (checked: boolean) => void;
  todayOrderCount: number;
  todayRevenue: number;
  averageTicket: number;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  paymentStatusFilter: PaymentStatus | 'all';
  onPaymentStatusChange: (value: PaymentStatus | 'all') => void;
  deliveryTypeFilter: DeliveryType | 'all';
  onDeliveryTypeChange: (value: DeliveryType | 'all') => void;
  onClearFilters: () => void;
}

export function OrdersConfigPanel({
  audioUnlocked,
  audioBlocked,
  soundEnabled,
  onUnlockAudio,
  notificationsGranted,
  onAskNotifications,
  onTestSound,
  onToggleSound,
  todayOrderCount,
  todayRevenue,
  averageTicket,
  searchTerm,
  onSearchChange,
  paymentStatusFilter,
  onPaymentStatusChange,
  deliveryTypeFilter,
  onDeliveryTypeChange,
  onClearFilters,
}: Props) {
  return (
    <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
      {/* Controles de Som */}
      <div className="flex items-center gap-2 flex-wrap p-3 bg-muted/30 rounded-lg border">
        {!audioUnlocked && soundEnabled && (
          <Button
            variant="default"
            size="sm"
            onClick={onUnlockAudio}
            className="gap-1 sm:gap-2 bg-orange-500 hover:bg-orange-600 animate-pulse text-xs sm:text-sm h-8 sm:h-9"
          >
            <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Ativar Som</span>
          </Button>
        )}

        {!notificationsGranted && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAskNotifications}
            className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9"
          >
            <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Ativar Notificações</span>
            <span className="sm:hidden">Notif.</span>
          </Button>
        )}

        <SoundSelector />

        <Button
          variant="outline"
          size="sm"
          onClick={onTestSound}
          className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9"
        >
          <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Testar</span>
        </Button>

        <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border bg-card">
          {soundEnabled ? (
            <Volume2 className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
          ) : (
            <VolumeX className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          )}
          <Label htmlFor="sound-toggle" className="text-xs sm:text-sm cursor-pointer hidden sm:block">
            Som
          </Label>
          <Switch
            id="sound-toggle"
            checked={soundEnabled}
            onCheckedChange={onToggleSound}
            className="scale-90 sm:scale-100"
          />
        </div>
      </div>

      {/* Banner de Alerta de Som Bloqueado */}
      {soundEnabled && audioBlocked && (
        <Card className="bg-orange-500/10 border-orange-500/50">
          <div className="p-4 flex items-center justify-between gap-4 flex-col sm:flex-row">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <AlertCircle className="h-6 w-6 text-orange-500 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-orange-700 dark:text-orange-400">
                  ⚠️ Som de Notificação Bloqueado
                </h3>
                <p className="text-sm text-orange-600 dark:text-orange-300">
                  Clique no botão ao lado para ativar o som e receber alertas de novos pedidos
                </p>
              </div>
            </div>
            <Button
              onClick={onUnlockAudio}
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 text-white flex-shrink-0 w-full sm:w-auto"
            >
              <Volume2 className="h-5 w-5 mr-2" />
              Ativar Som
            </Button>
          </div>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 min-w-[320px]">
          <MarketplaceSavingsCard variant="inline" />

          <Card className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Pedidos Hoje</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{todayOrderCount}</p>
              </div>
              <ShoppingBag className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-primary opacity-20 flex-shrink-0" />
            </div>
          </Card>

          <Card className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Receita do Dia</p>
                <p className="text-lg sm:text-xl lg:text-3xl font-bold truncate">{formatBRL(todayRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-green-500 opacity-20 flex-shrink-0" />
            </div>
          </Card>

          <Card className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Ticket Médio</p>
                <p className="text-lg sm:text-xl lg:text-3xl font-bold truncate">{formatBRL(averageTicket)}</p>
              </div>
              <TrendingUp className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-blue-500 opacity-20 flex-shrink-0" />
            </div>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <OrderFilters
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        paymentStatusFilter={paymentStatusFilter}
        onPaymentStatusChange={onPaymentStatusChange}
        deliveryTypeFilter={deliveryTypeFilter}
        onDeliveryTypeChange={onDeliveryTypeChange}
        onClearFilters={onClearFilters}
      />
    </div>
  );
}
