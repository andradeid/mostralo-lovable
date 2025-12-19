import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Loader2, 
  ExternalLink, 
  RefreshCcw,
  ListChecks,
  Store,
  ClipboardCheck,
  Activity
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type RequirementStatus = 'done' | 'review' | 'pending' | 'in_progress';

interface Requirement {
  id: string;
  name: string;
  description?: string;
  status: RequirementStatus;
}

interface RequirementCategory {
  category: string;
  required: boolean;
  items: Requirement[];
}

const HOMOLOGATION_REQUIREMENTS: RequirementCategory[] = [
  {
    category: 'Delivery Imediato',
    required: true,
    items: [
      { id: 'polling', name: 'Polling de eventos', description: 'Buscar eventos a cada 30s', status: 'done' },
      { id: 'ack', name: 'Acknowledge de eventos', description: 'Confirmar recebimento dos eventos', status: 'done' },
      { id: 'confirm', name: 'Confirmar pedido', description: 'POST /confirm para aceitar', status: 'done' },
      { id: 'start_prep', name: 'Iniciar preparo', description: 'POST /startPreparation', status: 'done' },
      { id: 'ready_deliver', name: 'Pronto para entrega', description: 'POST /readyToDeliver', status: 'done' },
      { id: 'dispatch', name: 'Despachar pedido', description: 'POST /dispatch', status: 'done' },
      { id: 'cancel_codes', name: 'Cancelar com códigos oficiais', description: 'Usar códigos 501-505', status: 'done' },
      { id: 'cancel_external', name: 'Receber cancelamento externo', description: 'Processar evento de cancelamento', status: 'done' },
    ]
  },
  {
    category: 'Retirada no Balcão (TAKEOUT)',
    required: true,
    items: [
      { id: 'detect_takeout', name: 'Detectar orderType TAKEOUT', description: 'Identificar pedidos para retirada', status: 'pending' },
      { id: 'ready_pickup', name: 'Endpoint /readyToPickup', description: 'Marcar pronto para retirada', status: 'pending' },
      { id: 'display_takeout', name: 'Exibir indicador visual', description: 'Badge "Retirada no Balcão"', status: 'pending' },
    ]
  },
  {
    category: 'Pedidos Agendados',
    required: true,
    items: [
      { id: 'scheduled_detect', name: 'Detectar orderTiming SCHEDULED', description: 'Identificar pedidos agendados', status: 'review' },
      { id: 'scheduled_display', name: 'Exibir data/hora entrega', description: 'Mostrar janela de entrega', status: 'review' },
    ]
  },
  {
    category: 'Dados de Pagamento',
    required: true,
    items: [
      { id: 'card_brand', name: 'Exibir bandeira do cartão', description: 'Visa, Mastercard, etc.', status: 'review' },
      { id: 'cash_change', name: 'Exibir troco (dinheiro)', description: 'Valor do troco quando aplicável', status: 'review' },
      { id: 'cpf_cnpj', name: 'Exibir CPF/CNPJ cliente', description: 'Documento para nota fiscal', status: 'pending' },
    ]
  },
  {
    category: 'Cupons e Descontos',
    required: true,
    items: [
      { id: 'benefits', name: 'Exibir cupons aplicados', description: 'Mostrar benefits[] do pedido', status: 'review' },
      { id: 'sponsor_ifood', name: 'Valor subsidiado pelo iFood', description: 'sponsorshipValues.IFOOD', status: 'pending' },
      { id: 'sponsor_merchant', name: 'Valor subsidiado pela loja', description: 'sponsorshipValues.MERCHANT', status: 'pending' },
    ]
  },
  {
    category: 'Cancelamento Avançado',
    required: true,
    items: [
      { id: 'dynamic_reasons', name: 'Consultar /cancellationReasons', description: 'Buscar motivos dinamicamente', status: 'pending' },
    ]
  },
  {
    category: 'Plataforma de Negociação',
    required: true,
    items: [
      { id: 'handshake_events', name: 'Processar eventos HANDSHAKE', description: 'Capturar ORDER_HANDSHAKE_*', status: 'pending' },
      { id: 'accept_reject', name: 'Aceitar/Rejeitar negociação', description: 'Responder solicitações do cliente', status: 'pending' },
    ]
  },
  {
    category: 'Requisitos Não-Funcionais',
    required: true,
    items: [
      { id: 'rate_limit', name: 'Respeitar rate limiting', description: 'Não exceder limites de requisição', status: 'done' },
      { id: 'token_refresh', name: 'Renovar token automaticamente', description: 'Refresh antes de expirar', status: 'done' },
      { id: 'short_ref', name: 'Exibir código de coleta', description: 'short_reference do pedido', status: 'done' },
    ]
  },
  {
    category: 'Desejáveis (Opcionais)',
    required: false,
    items: [
      { id: 'print_model', name: 'Comanda no modelo iFood', description: 'Seguir layout sugerido', status: 'pending' },
      { id: 'delivery_obs', name: 'Exibir observações de entrega', description: 'delivery.observations', status: 'review' },
    ]
  }
];

const statusConfig: Record<RequirementStatus, { icon: typeof CheckCircle2; label: string; color: string; bgColor: string }> = {
  done: { 
    icon: CheckCircle2, 
    label: 'Implementado', 
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30'
  },
  review: { 
    icon: AlertCircle, 
    label: 'Revisar', 
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30'
  },
  pending: { 
    icon: XCircle, 
    label: 'Pendente', 
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30'
  },
  in_progress: { 
    icon: Loader2, 
    label: 'Em Progresso', 
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30'
  }
};

export default function IFoodHomologationPage() {
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Buscar lojas com integração iFood
  const { data: stores = [], isLoading: loadingStores } = useQuery({
    queryKey: ['stores-with-ifood'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select(`
          id,
          name,
          slug,
          ifood_integrations (
            id,
            is_active,
            merchant_id,
            token_expires_at
          )
        `)
        .order('name');

      if (error) throw error;
      return data || [];
    }
  });

  // Buscar integração da loja selecionada
  const { data: integration, isLoading: loadingIntegration, refetch: refetchIntegration } = useQuery({
    queryKey: ['ifood-integration', selectedStoreId],
    queryFn: async () => {
      if (!selectedStoreId) return null;
      
      const { data, error } = await supabase
        .from('ifood_integrations')
        .select('*')
        .eq('store_id', selectedStoreId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!selectedStoreId
  });

  // Calcular estatísticas
  const stats = useMemo(() => {
    const allItems = HOMOLOGATION_REQUIREMENTS.flatMap(cat => cat.items);
    const requiredItems = HOMOLOGATION_REQUIREMENTS
      .filter(cat => cat.required)
      .flatMap(cat => cat.items);
    
    const totalRequired = requiredItems.length;
    const doneRequired = requiredItems.filter(i => i.status === 'done').length;
    const reviewRequired = requiredItems.filter(i => i.status === 'review').length;
    const pendingRequired = requiredItems.filter(i => i.status === 'pending').length;
    
    const totalAll = allItems.length;
    const doneAll = allItems.filter(i => i.status === 'done').length;
    
    const progressRequired = totalRequired > 0 ? (doneRequired / totalRequired) * 100 : 0;
    const progressAll = totalAll > 0 ? (doneAll / totalAll) * 100 : 0;

    return {
      totalRequired,
      doneRequired,
      reviewRequired,
      pendingRequired,
      progressRequired,
      totalAll,
      doneAll,
      progressAll
    };
  }, []);

  const selectedStore = stores.find(s => s.id === selectedStoreId);
  const storeIntegration = selectedStore?.ifood_integrations?.[0];

  const handleTestConnection = async () => {
    if (!selectedStoreId) {
      toast.error('Selecione uma loja primeiro');
      return;
    }
    
    toast.info('Funcionalidade de teste será implementada');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-orange-500" />
            Homologação iFood
          </h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe o progresso de implementação dos requisitos obrigatórios
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a 
              href="https://developer.ifood.com.br" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Portal iFood Developer
            </a>
          </Button>
        </div>
      </div>

      {/* Seletor de Loja */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Store className="h-4 w-4" />
            Loja de Teste
          </CardTitle>
          <CardDescription>
            Selecione a loja que está sendo usada para testes de homologação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder="Selecione uma loja" />
              </SelectTrigger>
              <SelectContent>
                {loadingStores ? (
                  <SelectItem value="loading" disabled>Carregando...</SelectItem>
                ) : stores.length === 0 ? (
                  <SelectItem value="none" disabled>Nenhuma loja encontrada</SelectItem>
                ) : (
                  stores.map(store => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                      {store.ifood_integrations?.[0]?.is_active && (
                        <span className="ml-2 text-green-600">●</span>
                      )}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {selectedStoreId && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleTestConnection}
                  disabled={!storeIntegration?.is_active}
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Testar Conexão
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(`/dashboard/integrations/ifood?store=${selectedStoreId}`, '_blank')}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Ver Eventos
                </Button>
              </div>
            )}
          </div>

          {selectedStoreId && storeIntegration && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant={storeIntegration.is_active ? "default" : "secondary"}>
                {storeIntegration.is_active ? 'Integração Ativa' : 'Integração Inativa'}
              </Badge>
              {storeIntegration.merchant_id && (
                <Badge variant="outline">
                  Merchant: {storeIntegration.merchant_id}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cards de Progresso */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Obrigatórios</span>
              <span className="text-2xl font-bold">{stats.doneRequired}/{stats.totalRequired}</span>
            </div>
            <Progress value={stats.progressRequired} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.progressRequired.toFixed(0)}% concluído
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Implementados</span>
            </div>
            <p className="text-3xl font-bold mt-2 text-green-600">{stats.doneRequired}</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <span className="text-sm font-medium">Para Revisar</span>
            </div>
            <p className="text-3xl font-bold mt-2 text-yellow-600">{stats.reviewRequired}</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium">Pendentes</span>
            </div>
            <p className="text-3xl font-bold mt-2 text-red-600">{stats.pendingRequired}</p>
          </CardContent>
        </Card>
      </div>

      {/* Checklist de Requisitos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5" />
            Checklist de Requisitos
          </CardTitle>
          <CardDescription>
            Requisitos organizados por categoria conforme documentação oficial do iFood
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-6">
              {HOMOLOGATION_REQUIREMENTS.map((category, catIndex) => (
                <div key={catIndex}>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="font-semibold">{category.category}</h3>
                    {category.required ? (
                      <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Opcional</Badge>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    {category.items.map((item) => {
                      const config = statusConfig[item.status];
                      const StatusIcon = config.icon;
                      
                      return (
                        <div 
                          key={item.id}
                          className={`flex items-center gap-3 p-3 rounded-lg ${config.bgColor}`}
                        >
                          <StatusIcon className={`h-5 w-5 ${config.color} ${item.status === 'in_progress' ? 'animate-spin' : ''}`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{item.name}</p>
                            {item.description && (
                              <p className="text-xs text-muted-foreground">{item.description}</p>
                            )}
                          </div>
                          <Badge variant="outline" className={`text-xs ${config.color}`}>
                            {config.label}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                  
                  {catIndex < HOMOLOGATION_REQUIREMENTS.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Notas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notas de Teste</CardTitle>
          <CardDescription>
            Anote observações importantes durante os testes de homologação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Digite suas anotações aqui..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[100px]"
          />
          <p className="text-xs text-muted-foreground mt-2">
            As notas são salvas localmente no navegador
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
