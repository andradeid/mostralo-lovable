import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Loader2, 
  Search,
  Bell,
  BellOff,
  Wifi,
  WifiOff,
  Shield,
  Store,
  RefreshCw,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  HelpCircle
} from "lucide-react";

interface StoreNotificationData {
  id: string;
  name: string;
  slug: string;
  notify_new_orders: boolean;
  use_master_for_notifications: boolean;
  notification_phone: string | null;
  notification_phone_2: string | null;
  whatsapp: string | null;
  has_active_instance: boolean;
  instance_name: string | null;
  instance_status: string | null;
}

export default function StoreNotificationsManagementPage() {
  const [stores, setStores] = useState<StoreNotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const fetchStores = async () => {
    setLoading(true);
    try {
      // Buscar todas as lojas com suas configurações de notificação
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select(`
          id,
          name,
          slug,
          notify_new_orders,
          use_master_for_notifications,
          notification_phone,
          notification_phone_2,
          whatsapp
        `)
        .order('name');

      if (storesError) throw storesError;

      // Buscar instâncias WhatsApp de todas as lojas
      const { data: instancesData } = await supabase
        .from('whatsapp_instances')
        .select('store_id, instance_name, status')
        .eq('status', 'connected');

      // Mapear instâncias por store_id
      const instancesByStore = new Map<string, { instance_name: string; status: string }>();
      instancesData?.forEach(inst => {
        if (!instancesByStore.has(inst.store_id)) {
          instancesByStore.set(inst.store_id, { instance_name: inst.instance_name, status: inst.status });
        }
      });

      // Combinar dados
      const combinedData: StoreNotificationData[] = (storesData || []).map(store => {
        const instance = instancesByStore.get(store.id);
        return {
          ...store,
          has_active_instance: !!instance,
          instance_name: instance?.instance_name || null,
          instance_status: instance?.status || null
        };
      });

      setStores(combinedData);
    } catch (error) {
      console.error('Erro ao buscar lojas:', error);
      toast.error('Erro ao carregar lojas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const toggleNotifyNewOrders = async (storeId: string, currentValue: boolean) => {
    setUpdatingId(storeId);
    try {
      const { error } = await supabase
        .from('stores')
        .update({ notify_new_orders: !currentValue })
        .eq('id', storeId);

      if (error) throw error;

      setStores(prev => prev.map(s => 
        s.id === storeId ? { ...s, notify_new_orders: !currentValue } : s
      ));
      toast.success(!currentValue ? 'Notificações ativadas' : 'Notificações desativadas');
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      toast.error('Erro ao atualizar configuração');
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleUseMaster = async (storeId: string, currentValue: boolean) => {
    setUpdatingId(storeId);
    try {
      const { error } = await supabase
        .from('stores')
        .update({ use_master_for_notifications: !currentValue })
        .eq('id', storeId);

      if (error) throw error;

      setStores(prev => prev.map(s => 
        s.id === storeId ? { ...s, use_master_for_notifications: !currentValue } : s
      ));
      toast.success(!currentValue ? 'Fallback Master ativado' : 'Fallback Master desativado');
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      toast.error('Erro ao atualizar configuração');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredStores = stores.filter(store => 
    store.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.slug?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const stats = {
    total: stores.length,
    notificationsActive: stores.filter(s => s.notify_new_orders).length,
    withInstance: stores.filter(s => s.has_active_instance).length,
    usingMaster: stores.filter(s => s.use_master_for_notifications).length
  };

  const getNotificationSource = (store: StoreNotificationData): { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: JSX.Element } => {
    if (!store.notify_new_orders) {
      return { label: "Desativado", variant: "outline", icon: <BellOff className="h-3 w-3" /> };
    }
    if (store.has_active_instance) {
      return { label: "Instância Própria", variant: "default", icon: <Wifi className="h-3 w-3" /> };
    }
    if (store.use_master_for_notifications) {
      return { label: "Master", variant: "secondary", icon: <Shield className="h-3 w-3" /> };
    }
    return { label: "Sem Envio", variant: "destructive", icon: <WifiOff className="h-3 w-3" /> };
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-4 md:space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-help">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                    <div>
                      <div className="text-lg md:text-2xl font-bold">{stats.total}</div>
                      <div className="text-[10px] md:text-xs text-muted-foreground">Total de Lojas</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Número total de lojas cadastradas no sistema</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-help">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
                    <div>
                      <div className="text-lg md:text-2xl font-bold text-green-500">{stats.notificationsActive}</div>
                      <div className="text-[10px] md:text-xs text-muted-foreground">Notificações Ativas</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Lojas com notificações de novos pedidos habilitadas</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-help">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
                    <div>
                      <div className="text-lg md:text-2xl font-bold text-blue-500">{stats.withInstance}</div>
                      <div className="text-[10px] md:text-xs text-muted-foreground">Com Instância</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Lojas com instância WhatsApp própria conectada</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-help">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 md:h-5 md:w-5 text-purple-500" />
                    <div>
                      <div className="text-lg md:text-2xl font-bold text-purple-500">{stats.usingMaster}</div>
                      <div className="text-[10px] md:text-xs text-muted-foreground">Usando Master</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Lojas que autorizaram uso da instância Master como fallback</p>
            </TooltipContent>
          </Tooltip>
        </div>

      {/* Main Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <Bell className="h-4 w-4 md:h-5 md:w-5" />
                Gerenciar Notificações das Lojas
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Controle quais lojas recebem notificações de novos pedidos e se usam a instância Master como fallback
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchStores}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma loja encontrada
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loja</TableHead>
                    <TableHead className="hidden md:table-cell">Telefone</TableHead>
                    <TableHead className="text-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center gap-1 cursor-help">
                            Instância
                            <HelpCircle className="h-3 w-3 text-muted-foreground" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Indica se a loja possui uma instância WhatsApp própria conectada</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableHead>
                    <TableHead className="text-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center gap-1 cursor-help">
                            Fonte Atual
                            <HelpCircle className="h-3 w-3 text-muted-foreground" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>De onde as notificações serão enviadas</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableHead>
                    <TableHead className="text-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center gap-1 cursor-help">
                            Notificações
                            <HelpCircle className="h-3 w-3 text-muted-foreground" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ativa ou desativa o envio de notificações de novos pedidos</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableHead>
                    <TableHead className="text-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center gap-1 cursor-help">
                            Usar Master
                            <HelpCircle className="h-3 w-3 text-muted-foreground" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Permite usar a instância Master quando a loja não tem WhatsApp próprio</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStores.map((store) => {
                    const source = getNotificationSource(store);
                    const isUpdating = updatingId === store.id;
                    
                    return (
                      <TableRow key={store.id}>
                        <TableCell>
                          <div className="font-medium text-sm">{store.name}</div>
                          <div className="text-xs text-muted-foreground">/{store.slug}</div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="text-xs space-y-0.5">
                            {store.notification_phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {store.notification_phone}
                              </div>
                            )}
                            {store.whatsapp && !store.notification_phone && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {store.whatsapp} (WhatsApp)
                              </div>
                            )}
                            {!store.notification_phone && !store.whatsapp && (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {store.has_active_instance ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="default" className="text-[10px] cursor-help">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Conectada
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Esta loja tem uma instância WhatsApp própria conectada e ativa</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className="text-[10px] cursor-help">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Sem instância
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Esta loja não possui instância WhatsApp própria configurada</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant={source.variant} className="text-[10px] cursor-help">
                                {source.icon}
                                <span className="ml-1">{source.label}</span>
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {source.label === "Instância Própria" && "Notificações enviadas pela instância WhatsApp da própria loja"}
                                {source.label === "Master" && "Notificações enviadas pela instância Master do Mostralo"}
                                {source.label === "Sem Envio" && "Notificações ativadas, mas sem instância própria e sem autorização para usar Master"}
                                {source.label === "Desativado" && "Notificações de novos pedidos estão desativadas para esta loja"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="text-center">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                <Switch
                                  checked={store.notify_new_orders}
                                  onCheckedChange={() => toggleNotifyNewOrders(store.id, store.notify_new_orders)}
                                  disabled={isUpdating}
                                />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{store.notify_new_orders ? "Clique para desativar notificações" : "Clique para ativar notificações"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="text-center">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                <Switch
                                  checked={store.use_master_for_notifications}
                                  onCheckedChange={() => toggleUseMaster(store.id, store.use_master_for_notifications)}
                                  disabled={isUpdating || store.has_active_instance}
                                />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {store.has_active_instance 
                                  ? "Não disponível - loja já possui instância própria" 
                                  : store.use_master_for_notifications 
                                    ? "Clique para desativar uso da instância Master" 
                                    : "Clique para ativar uso da instância Master como fallback"
                                }
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Legend */}
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="text-xs font-medium mb-2">Legenda:</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
              <div className="flex items-center gap-1.5">
                <Badge variant="default" className="text-[9px] px-1.5">
                  <Wifi className="h-2.5 w-2.5 mr-0.5" />
                  Instância Própria
                </Badge>
                <span className="text-muted-foreground">Usa WhatsApp da loja</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant="secondary" className="text-[9px] px-1.5">
                  <Shield className="h-2.5 w-2.5 mr-0.5" />
                  Master
                </Badge>
                <span className="text-muted-foreground">Usa instância Mostralo</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant="destructive" className="text-[9px] px-1.5">
                  <WifiOff className="h-2.5 w-2.5 mr-0.5" />
                  Sem Envio
                </Badge>
                <span className="text-muted-foreground">Não envia (sem fallback)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-[9px] px-1.5">
                  <BellOff className="h-2.5 w-2.5 mr-0.5" />
                  Desativado
                </Badge>
                <span className="text-muted-foreground">Notificações off</span>
              </div>
            </div>
          </div>
        </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
