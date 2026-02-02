import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { usePageSEO } from '@/hooks/useSEO';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { 
  Package, Menu, ShoppingCart, BarChart3, Palette, MessageCircle,
  Truck, Users, Printer, Tag, Megaphone, Calendar, ExternalLink, 
  Image, Search, Filter, CheckCircle, XCircle, Sparkles, Shield, Zap,
  Utensils, Settings2, Monitor, Wallet, Code, QrCode, MessageSquare, Target, Tablet,
  DollarSign, TrendingUp, AlertTriangle, Link2, FileText, Layers, Pencil, Bot
} from 'lucide-react';
import { ModulePriceEditModal } from '@/components/proposals/ModulePriceEditModal';

// Mapeamento de ícones string -> componente
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Menu, ShoppingCart, BarChart3, Palette, MessageCircle,
  Truck, Printer, Tag, Megaphone, Calendar, ExternalLink,
  Users, Image, Package, Utensils, Monitor, Wallet, Code, QrCode, MessageSquare, Target, Tablet, Bot
};

// Descrições detalhadas e categorias de cada módulo
const moduleDetails: Record<string, { description: string; category: 'core' | 'advanced' | 'premium' }> = {
  'digital_menu': {
    description: 'Permite criar e gerenciar o cardápio completo da loja, incluindo produtos, categorias, preços, variações e imagens. Este é um módulo essencial para o funcionamento da plataforma.',
    category: 'core'
  },
  'order_management': {
    description: 'Central de pedidos onde o lojista recebe, aceita, prepara e finaliza pedidos. Inclui notificações em tempo real, histórico completo e gestão de status.',
    category: 'core'
  },
  'reports': {
    description: 'Dashboard com métricas de vendas, faturamento, produtos mais vendidos, horários de pico, análises de desempenho e exportação de relatórios.',
    category: 'core'
  },
  'customization': {
    description: 'Customização visual completa da loja: cores, logo, banner, informações de contato, horários de funcionamento e configurações gerais.',
    category: 'core'
  },
  'whatsapp': {
    description: 'Notificações automáticas via WhatsApp para clientes sobre status do pedido, confirmações e comunicação direta com a loja.',
    category: 'advanced'
  },
  'delivery': {
    description: 'Configuração de áreas de entrega, taxas por região/distância, tempo estimado, raio de atendimento e integração com mapas interativos.',
    category: 'core'
  },
  'delivery_drivers': {
    description: 'Gestão completa de entregadores: cadastro, atribuição de pedidos, rastreamento em tempo real, cálculo de ganhos e pagamentos.',
    category: 'advanced'
  },
  'printing': {
    description: 'Configuração de impressoras térmicas para impressão automática de comandas, recibos e comprovantes. Suporte a QZ Tray e múltiplos métodos de corte.',
    category: 'advanced'
  },
  'promotions': {
    description: 'Sistema completo de cupons de desconto, promoções por período, combos, ofertas especiais, pop-ups promocionais e banners de campanha.',
    category: 'advanced'
  },
  'marketing': {
    description: 'Integração com plataforma de marketing digital para gerenciar redes sociais, agendamento de posts, campanhas e análise de engajamento.',
    category: 'premium'
  },
  'scheduled_orders': {
    description: 'Permite clientes agendarem pedidos para datas e horários futuros. Ideal para encomendas, eventos, festas e planejamento antecipado.',
    category: 'advanced'
  },
  'integrations': {
    description: 'Permite adicionar menus customizados via iframe para integrar sistemas externos ao painel admin. Conecte ferramentas de terceiros.',
    category: 'premium'
  },
  'attendants': {
    description: 'Cadastro e gestão de funcionários/atendentes com permissões limitadas para operar o painel de pedidos sem acesso às configurações.',
    category: 'advanced'
  },
  'banners': {
    description: 'Criação e gestão de banners promocionais rotativos para destacar ofertas, novidades e promoções na página inicial da loja.',
    category: 'advanced'
  },
  'ifood_integration': {
    description: 'Receba pedidos automaticamente do iFood. Configure credenciais, monitore eventos, acompanhe métricas de vendas e gerencie tudo integrado ao seu painel.',
    category: 'premium'
  },
  'digital_signage': {
    description: 'Exiba promoções, cardápios e conteúdo em TVs e totens de forma profissional. Configure slides, vídeos, tempo de exibição e orientação da tela.',
    category: 'premium'
  },
  'financial_management': {
    description: 'Gestão completa de entradas, saídas, contas a pagar/receber, fluxo de caixa e relatórios financeiros detalhados.',
    category: 'premium'
  },
  'marketing_material': {
    description: 'Geração de materiais de marketing com QR codes, cartazes promocionais e artes para redes sociais.',
    category: 'advanced'
  },
  'custom_scripts': {
    description: 'Adicione scripts personalizados (JavaScript, CSS, HTML) para integrações avançadas como pixels de rastreamento e chatbots.',
    category: 'premium'
  },
  'whatsapp_recovery': {
    description: 'Sistema automatizado de recuperação de carrinhos abandonados via WhatsApp, aumentando conversões.',
    category: 'premium'
  },
  'sentinela': {
    description: 'Sistema inteligente de recompra automática. Configure o ciclo de vida dos produtos (whey 30 dias, fralda 15 dias, ração 30 dias) e o sistema envia lembretes via WhatsApp quando estiver prestes a acabar, aumentando a recorrência de vendas.',
    category: 'premium'
  },
  'self_service_totem': {
    description: 'Totem de autoatendimento para clientes fazerem pedidos diretamente em tablets ou telas touch. Reduz filas, economiza com atendentes e funciona 24h. Tela de boas-vindas personalizável, identificação opcional, pagamento PIX integrado e sistema de senhas.',
    category: 'premium'
  },
  'self_service_table': {
    description: 'Cardápio digital na mesa com QR Code. Clientes fazem pedidos diretamente do celular, reduzindo tempo de atendimento e erros.',
    category: 'advanced'
  },
  'password_call': {
    description: 'Sistema de chamada de senhas para organizar a retirada de pedidos. Exibe na tela da loja e notifica clientes.',
    category: 'advanced'
  },
  'kds': {
    description: 'Kitchen Display System para visualização de pedidos na cozinha em tempo real. Gerencia preparo e priorização.',
    category: 'premium'
  },
  'pdv_comandas': {
    description: 'Sistema de PDV e comandas para controle de mesas, contas abertas, divisão de pagamentos e fechamento de caixa.',
    category: 'premium'
  },
  'booking': {
    description: 'Sistema completo de agendamento de serviços com gestão de profissionais, horários de trabalho, bloqueios manuais (férias/folgas), vínculo com serviços e automações via WhatsApp (confirmação, lembretes, satisfação).',
    category: 'premium'
  },
  'google_calendar': {
    description: 'Sincronização automática de agendamentos com o Google Agenda dos profissionais. Eventos criados, atualizados e removidos em tempo real conforme os agendamentos são gerenciados no sistema.',
    category: 'premium'
  },
  'intelligent_assistant_v2': {
    description: 'Assistente virtual com inteligência artificial para WhatsApp. Responde perguntas sobre produtos, estoque e promoções. Analisa fotos de receitas médicas e recomenda produtos. Envia fotos dos produtos automaticamente com preço e link de compra. Usa OpenAI Assistants API com function calling para consultas em tempo real.',
    category: 'premium'
  }
};

const categoryConfig = {
  core: { label: 'Core', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: Shield },
  advanced: { label: 'Avançado', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: Zap },
  premium: { label: 'Premium', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20', icon: Sparkles }
};

interface Module {
  id: string;
  name: string;
  description: string | null;
  key: string | null;
  icon: string | null;
  is_active: boolean | null;
  created_at: string;
  suggested_price: number | null;
  price_reference: string | null;
  dependencies: string | null;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const ModulesPage = () => {
  usePageSEO({
    title: 'Módulos - Mostralo | Gerenciamento',
    description: 'Gerencie os módulos e funcionalidades disponíveis no sistema Mostralo.',
    keywords: 'módulos mostralo, recursos, funcionalidades, gestão'
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'core' | 'advanced' | 'premium'>('all');
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const { data: modules = [], isLoading, refetch } = useQuery({
    queryKey: ['modules-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Module[];
    }
  });

  const filteredModules = useMemo(() => {
    return modules.filter(module => {
      const matchesSearch = 
        module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        module.key?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        module.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const details = module.key ? moduleDetails[module.key] : null;
      const matchesCategory = categoryFilter === 'all' || details?.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });
  }, [modules, searchTerm, categoryFilter]);

  const stats = useMemo(() => ({
    total: modules.length,
    active: modules.filter(m => m.is_active).length,
    inactive: modules.filter(m => !m.is_active).length,
    core: modules.filter(m => m.key && moduleDetails[m.key]?.category === 'core').length,
    advanced: modules.filter(m => m.key && moduleDetails[m.key]?.category === 'advanced').length,
    premium: modules.filter(m => m.key && moduleDetails[m.key]?.category === 'premium').length
  }), [modules]);

  // Cálculo do valor total dos módulos
  const totalModulesValue = useMemo(() => {
    return modules.reduce((sum, m) => sum + (m.suggested_price || 0), 0);
  }, [modules]);

  const planPrice = 397.90;
  const savings = totalModulesValue - planPrice;
  const savingsPercent = totalModulesValue > 0 ? Math.round((savings / totalModulesValue) * 100) : 0;

  // Função para obter nomes dos módulos dependentes
  const getDependencyNames = (dependencies: string | null): string[] => {
    if (!dependencies) return [];
    try {
      const depKeys = JSON.parse(dependencies) as string[];
      return depKeys.map(key => {
        const mod = modules.find(m => m.key === key);
        return mod?.name || key;
      });
    } catch {
      return [];
    }
  };

  const getIcon = (iconName: string | null) => {
    if (!iconName) return Package;
    return iconMap[iconName] || Package;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-7 h-7 text-primary" />
            Gerenciamento de Módulos
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualize todos os módulos disponíveis no sistema
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to="/dashboard/propostas/nova">
            <Button>
              <FileText className="w-4 h-4 mr-2" />
              Criar Proposta
            </Button>
          </Link>
          <Link to="/dashboard/propostas/templates">
            <Button variant="outline">
              <Layers className="w-4 h-4 mr-2" />
              Templates por Nicho
            </Button>
          </Link>
          <Link to="/dashboard/modulos/gerenciar-acesso">
            <Button variant="outline">
              <Settings2 className="w-4 h-4 mr-2" />
              Gerenciar Acesso
            </Button>
          </Link>
        </div>
      </div>

      {/* Card de Valor Total */}
      <Card className="bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-red-500/10 border-amber-500/30">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-500/20">
                <DollarSign className="w-8 h-8 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  💰 Valor Total dos Módulos
                </h3>
                <p className="text-sm text-muted-foreground">
                  Soma dos preços sugeridos se vendidos individualmente
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-8">
              <div className="text-center sm:text-right">
                <p className="text-sm text-muted-foreground">Se comprados separados</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(totalModulesValue)}<span className="text-sm font-normal">/mês</span></p>
              </div>
              <div className="text-center sm:text-right">
                <p className="text-sm text-muted-foreground">No plano Mostralo</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(planPrice)}<span className="text-sm font-normal">/mês</span></p>
              </div>
              <div className="text-center sm:text-right">
                <p className="text-sm text-muted-foreground">Economia do cliente</p>
                <div className="flex items-center justify-center sm:justify-end gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(savings)}</p>
                  <Badge className="bg-green-600 text-white">{savingsPercent}%</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-xs text-muted-foreground">Ativos</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/5 to-red-500/10">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
            <div className="text-xs text-muted-foreground">Inativos</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.core}</div>
            <div className="text-xs text-muted-foreground">Core</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.advanced}</div>
            <div className="text-xs text-muted-foreground">Avançado</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.premium}</div>
            <div className="text-xs text-muted-foreground">Premium</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, key ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={categoryFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategoryFilter('all')}
              >
                <Filter className="w-4 h-4 mr-1" />
                Todos
              </Button>
              <Button
                variant={categoryFilter === 'core' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategoryFilter('core')}
                className={categoryFilter === 'core' ? '' : 'text-green-600 border-green-500/30 hover:bg-green-500/10'}
              >
                <Shield className="w-4 h-4 mr-1" />
                Core
              </Button>
              <Button
                variant={categoryFilter === 'advanced' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategoryFilter('advanced')}
                className={categoryFilter === 'advanced' ? '' : 'text-blue-600 border-blue-500/30 hover:bg-blue-500/10'}
              >
                <Zap className="w-4 h-4 mr-1" />
                Avançado
              </Button>
              <Button
                variant={categoryFilter === 'premium' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategoryFilter('premium')}
                className={categoryFilter === 'premium' ? '' : 'text-purple-600 border-purple-500/30 hover:bg-purple-500/10'}
              >
                <Sparkles className="w-4 h-4 mr-1" />
                Premium
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Módulos */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredModules.map((module) => {
          const IconComponent = getIcon(module.icon);
          const details = module.key ? moduleDetails[module.key] : null;
          const category = details?.category || 'advanced';
          const categoryInfo = categoryConfig[category];
          const CategoryIcon = categoryInfo.icon;
          const dependencyNames = getDependencyNames(module.dependencies);
          const isCore = (module.suggested_price || 0) === 0;

          return (
            <Card key={module.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-primary/10">
                      <IconComponent className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{module.name}</CardTitle>
                      {module.key && (
                        <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {module.key}
                        </code>
                      )}
                    </div>
                  </div>
                  {module.is_active ? (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 shrink-0">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Ativo
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 shrink-0">
                      <XCircle className="w-3 h-3 mr-1" />
                      Inativo
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <CardDescription className="text-sm leading-relaxed">
                  {details?.description || module.description || 'Sem descrição disponível.'}
                </CardDescription>
                
                {/* Preço Sugerido */}
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={categoryInfo.color}>
                    <CategoryIcon className="w-3 h-3 mr-1" />
                    {categoryInfo.label}
                  </Badge>
                  {isCore ? (
                    <Badge className="bg-green-600 text-white">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      INCLUSO
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                      <DollarSign className="w-3 h-3 mr-0.5" />
                      {formatCurrency(module.suggested_price || 0)}/mês
                    </Badge>
                  )}
                </div>

                {/* Referência de Mercado */}
                {module.price_reference && (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
                    <BarChart3 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>📊 Ref: {module.price_reference}</span>
                  </div>
                )}

                {/* Dependências */}
                {dependencyNames.length > 0 && (
                  <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-500/10 rounded-md p-2">
                    <Link2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>⚠️ Requer: {dependencyNames.join(', ')}</span>
                  </div>
                )}

                {/* Botão Editar Preço */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setEditingModule(module);
                    setEditModalOpen(true);
                  }}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar Preço
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredModules.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              Nenhum módulo encontrado com os filtros aplicados.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dica informativa */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="p-4 flex items-start gap-3">
          <div className="p-2 rounded-full bg-primary/10 shrink-0">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Sobre o Sistema de Módulos</p>
            <p className="text-sm text-muted-foreground mt-1">
              Todos os módulos estão habilitados por padrão para todas as lojas. 
              Para bloquear módulos específicos para uma loja individual, acesse a 
              página de <strong>Assinantes</strong> e edite as permissões da loja desejada.
              Os preços sugeridos são baseados em pesquisa de mercado e servem como referência para precificação individual.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Edição de Preço */}
      <ModulePriceEditModal
        module={editingModule}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={() => refetch()}
      />
    </div>
  );
};

export default ModulesPage;