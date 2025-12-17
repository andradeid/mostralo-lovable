import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Lightbulb, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  XCircle, 
  Clock,
  AlertTriangle,
  Filter,
  MapPin,
  Target,
  BarChart3,
  Wrench,
  Calendar,
  Scale,
  ArrowRight
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

type IdeaStatus = 'idea' | 'analyzing' | 'development' | 'completed' | 'discarded';
type IdeaPriority = 'high' | 'medium' | 'low';

interface IdeaOption {
  name: string;
  description: string;
  pros: string[];
  cons: string[];
}

interface MarketAnalysis {
  title: string;
  items: string[];
}

interface TechnicalDetails {
  title: string;
  items: string[];
}

interface ImplementationPhase {
  name: string;
  description: string;
  items: string[];
}

interface Idea {
  id: number;
  title: string;
  status: IdeaStatus;
  priority: IdeaPriority;
  createdAt: string;
  description: string;
  context?: string;
  problem?: string;
  marketAnalysis?: MarketAnalysis;
  technicalDetails?: TechnicalDetails;
  phases?: ImplementationPhase[];
  legalConsiderations?: string[];
  options?: IdeaOption[];
  recommendation?: string;
  nextSteps?: string[];
}

const statusConfig: Record<IdeaStatus, { label: string; icon: React.ReactNode; color: string }> = {
  idea: { label: '💡 Ideia', icon: <Lightbulb className="w-4 h-4" />, color: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' },
  analyzing: { label: '🔍 Em Análise', icon: <Clock className="w-4 h-4" />, color: 'bg-blue-500/20 text-blue-600 dark:text-blue-400' },
  development: { label: '🚧 Em Desenvolvimento', icon: <AlertTriangle className="w-4 h-4" />, color: 'bg-orange-500/20 text-orange-600 dark:text-orange-400' },
  completed: { label: '✅ Concluído', icon: <CheckCircle2 className="w-4 h-4" />, color: 'bg-green-500/20 text-green-600 dark:text-green-400' },
  discarded: { label: '❌ Descartado', icon: <XCircle className="w-4 h-4" />, color: 'bg-red-500/20 text-red-600 dark:text-red-400' }
};

const priorityConfig: Record<IdeaPriority, { label: string; color: string }> = {
  high: { label: '🔴 Alta', color: 'text-red-500' },
  medium: { label: '🟡 Média', color: 'text-yellow-500' },
  low: { label: '🟢 Baixa', color: 'text-green-500' }
};

// Dados das ideias com informações expandidas
const ideasData: Idea[] = [
  {
    id: 1,
    title: '💳 PIX para Lojistas',
    status: 'analyzing',
    priority: 'high',
    createdAt: '2025-12-17',
    description: 'Permitir que lojistas recebam pagamentos PIX dos clientes diretamente no checkout da loja.',
    
    context: `Atualmente a integração EFI (Gerencianet) está implementada apenas para pagamento de assinaturas do sistema. O master admin configura as credenciais EFI em /dashboard/gateway-config e os pagamentos de planos são processados via PIX com QR Code dinâmico.

Arquivos existentes no sistema:
• supabase/functions/efi-create-pix-charge - Cria cobrança PIX
• subscription_payment_config - Armazena credenciais EFI do master admin  
• Interface de configuração em GatewayConfigPage.tsx
• Fluxo completo de geração de QR Code e confirmação de pagamento`,

    problem: `Os lojistas hoje dependem de meios externos para receber pagamentos (PIX manual, maquininha própria, transferência bancária, etc). Isso cria fricção no checkout e dificulta o controle de pedidos pagos.

Oportunidade identificada:
• Aumentar conversão no checkout (menos abandono por falta de opção de pagamento)
• Dar controle total sobre status de pagamento dos pedidos
• Criar nova fonte de receita para Mostralo (se modelo centralizado)
• Diferenciar da concorrência (poucos sistemas de delivery oferecem PIX integrado)
• Melhorar experiência do cliente final (pagamento rápido e seguro)`,

    marketAnalysis: {
      title: '📊 Potencial de Receita (Modelo Centralizado)',
      items: [
        '100 lojas ativas × R$ 15.000/mês faturamento médio = R$ 1.500.000 em transações',
        'Taxa de 5% sobre transações = R$ 75.000/mês de receita para Mostralo',
        'Projeção anual: R$ 900.000/ano apenas com taxa de transação',
        'Escalando para 500 lojas = R$ 375.000/mês (R$ 4.5M/ano)',
        'Receita passiva que cresce com o volume de pedidos dos lojistas'
      ]
    },

    technicalDetails: {
      title: '🔧 Implementação Técnica (Modelo Independente)',
      items: [
        'Adicionar campos na tabela stores: efi_client_id, efi_client_secret, efi_certificate_pem, efi_pix_key, efi_environment',
        'Criar Edge Function store-efi-create-pix-charge (similar ao existente, mas usando credenciais da loja)',
        'Criar Edge Function store-efi-webhook para receber confirmações de pagamento da EFI',
        'Atualizar componente de Checkout para exibir opção PIX quando loja tiver configurado',
        'Criar interface de configuração EFI no painel do lojista (similar ao GatewayConfigPage do master)',
        'Implementar status de pagamento no pedido (pending_payment, paid, payment_failed)',
        'Criar lógica para verificar pagamento antes de confirmar/processar pedido',
        'Adicionar timeout e expiração de QR Code (padrão EFI: 3600 segundos)'
      ]
    },

    phases: [
      {
        name: 'Fase 1 - Modelo Independente',
        description: 'Mais seguro juridicamente, sem riscos regulatórios para Mostralo',
        items: [
          'Cada lojista configura sua própria conta EFI (Gerencianet)',
          'Pagamento vai direto para a conta bancária do lojista',
          'Mostralo apenas fornece a integração técnica como feature',
          'Pode ser oferecido como módulo premium (valor agregado no plano)',
          'Tempo estimado de implementação: 1-2 semanas',
          'Risco jurídico: ZERO (apenas integração técnica)'
        ]
      },
      {
        name: 'Fase 2 - Investigar Split Payment',
        description: 'Funcionalidade nativa da EFI para divisão automática de pagamentos',
        items: [
          'Estudar documentação de Split Payment da EFI em detalhes',
          'Permite divisão automática no momento do pagamento (ex: 95% lojista / 5% Mostralo)',
          'Dinheiro vai direto para cada parte, sem intermediação',
          'Requer análise jurídica sobre modelo de negócio',
          'Potencialmente resolve questões regulatórias mantendo receita',
          'Pode necessitar conta EFI empresarial da Mostralo'
        ]
      },
      {
        name: 'Fase 3 - Modelo Centralizado (Futuro)',
        description: 'Apenas se viável juridicamente após análise especializada',
        items: [
          'Mostralo recebe todos os pagamentos e repassa para lojistas',
          'Máxima simplicidade para o lojista (zero configuração)',
          'Requer capital de giro significativo para repasses',
          'Pode necessitar licença de Instituição de Pagamento do Banco Central',
          'Análise custo/benefício considerando requisitos regulatórios',
          'Maior potencial de receita, porém maior complexidade operacional'
        ]
      }
    ],

    legalConsiderations: [
      '⚠️ Modelo centralizado pode caracterizar Mostralo como Instituição de Pagamento',
      '⚠️ Instituição de Pagamento requer autorização do Banco Central do Brasil',
      '✅ Split Payment da EFI pode ser alternativa sem necessidade de licença',
      '💼 Consultar advogado especializado em fintechs/meios de pagamento antes de implementar modelo centralizado',
      '✅ Modelo independente NÃO tem riscos legais (apenas integração técnica)',
      '📋 Guardar documentação de compliance para auditoria futura'
    ],

    options: [
      {
        name: 'Modelo Centralizado',
        description: 'Mostralo recebe e repassa para o lojista',
        pros: [
          'Zero configuração para o lojista (onboarding simples)',
          'Nova receita para Mostralo (5% por transação)',
          'Controle total sobre transações e fluxo de caixa',
          'Potencial de R$ 75.000+/mês com 100 lojas ativas',
          'Dados valiosos sobre volume de transações do mercado'
        ],
        cons: [
          'Questões regulatórias sérias (possível licença de IP do BC)',
          'Necessita capital de giro para repasses (pode precisar de R$ 100k+)',
          'Sistema complexo de repasse automático e conciliação',
          'Responsabilidade em chargebacks, estornos e fraudes',
          'Risco jurídico alto sem análise especializada prévia'
        ]
      },
      {
        name: 'Modelo Independente',
        description: 'Cada loja configura sua própria conta EFI',
        pros: [
          'Sem riscos legais para Mostralo (apenas integração)',
          'Pagamento direto para o lojista (sem intermediação)',
          'Sem responsabilidade em chargebacks ou estornos',
          'Arquitetura EFI existente pode ser 90% reaproveitada',
          'Pode ser módulo premium (receita via valor do plano)',
          'Implementação mais rápida (1-2 semanas)'
        ],
        cons: [
          'Setup mais complexo para o lojista (criar conta EFI)',
          'Maior carga de suporte para auxiliar configuração',
          'Sem receita direta por transação processada',
          'Dependente de cada lojista ter/criar conta EFI'
        ]
      }
    ],

    recommendation: `**Recomendação: Abordagem Híbrida em 3 Fases**

1. **COMEÇAR com Modelo Independente** (Fase 1)
   → Sem riscos jurídicos, pode ser oferecido como módulo premium
   → Implementação rápida (1-2 semanas) para testar demanda real
   → Valida se lojistas realmente querem/usam PIX integrado

2. **INVESTIGAR Split Payment** (Fase 2)  
   → Estudar documentação EFI e consultar jurídico
   → Pode permitir modelo misto com receita sem licença de IP
   → Menor risco que modelo totalmente centralizado

3. **AVALIAR Modelo Centralizado** (Fase 3)
   → Apenas após validação jurídica completa
   → Se Split Payment viável, usar como base
   → Se não, avaliar custo/benefício de obter licença IP`,

    nextSteps: [
      '□ Criar migração SQL para campos EFI na tabela stores',
      '□ Criar Edge Function store-efi-create-pix-charge',
      '□ Criar Edge Function store-efi-webhook',
      '□ Criar interface de configuração EFI para lojista (copiar padrão GatewayConfigPage)',
      '□ Atualizar checkout com opção PIX (condicional)',
      '□ Criar documentação de setup para lojistas',
      '□ Testar fluxo completo em ambiente sandbox',
      '□ Investigar documentação Split Payment EFI',
      '□ Consultar advogado sobre modelo centralizado'
    ]
  },
  {
    id: 2,
    title: '💰 Split Payment EFI',
    status: 'idea',
    priority: 'medium',
    createdAt: '2025-12-17',
    description: 'Investigar funcionalidade de Split Payment da EFI para divisão automática de pagamentos (ex: 95% lojista / 5% Mostralo).',
    
    context: `O Split Payment é uma funcionalidade nativa da EFI (Gerencianet) que permite dividir automaticamente um pagamento entre múltiplas contas no momento da transação. Isso é diferente de receber e depois repassar.

Esta ideia está diretamente relacionada à implementação de PIX para Lojistas, sendo uma possível evolução do modelo independente para um modelo com receita por transação.`,

    problem: `O modelo independente de PIX para Lojistas não gera receita direta por transação para Mostralo. O modelo centralizado tem riscos regulatórios.

O Split Payment pode ser o "meio termo" ideal:
• Receita por transação SEM ser considerado Instituição de Pagamento
• Dinheiro vai direto para cada parte (lojista e Mostralo)
• Não há intermediação de valores (não precisa de capital de giro)`,

    technicalDetails: {
      title: '🔧 Pontos Técnicos a Investigar',
      items: [
        'Estudar endpoint de Split Payment na API EFI',
        'Entender requisitos para conta recebedora (Mostralo precisa de conta EFI empresarial?)',
        'Verificar se split funciona com PIX ou apenas cartão',
        'Analisar limites e taxas do Split Payment',
        'Verificar requisitos de KYC/compliance para recebedores',
        'Testar em ambiente sandbox antes de produção'
      ]
    },

    legalConsiderations: [
      '❓ Verificar se Split Payment caracteriza Mostralo como subcredenciador',
      '❓ Consultar jurídico sobre implicações regulatórias',
      '❓ Analisar se necessita algum tipo de registro no BC',
      '✅ Potencialmente mais seguro que modelo centralizado tradicional'
    ],

    nextSteps: [
      '□ Estudar documentação Split Payment EFI em detalhes',
      '□ Criar conta teste empresarial EFI para Mostralo',
      '□ Testar divisão de pagamento em sandbox',
      '□ Consultar jurídico sobre modelo de negócio',
      '□ Analisar viabilidade econômica (taxas vs receita)',
      '□ Prototipar integração se viável'
    ]
  },
  {
    id: 3,
    title: '🖥️ App Nativo Desktop (Electron)',
    status: 'completed',
    priority: 'high',
    createdAt: '2025-11-15',
    description: 'Criar aplicativo desktop nativo usando Electron para resolver limitações de som/notificações do navegador.',
    
    context: `Navegadores modernos bloqueiam autoplay de áudio e limitam notificações por políticas de segurança. Isso causava problemas críticos para lojistas que dependiam de alertas sonoros para novos pedidos.

Infraestrutura criada para 3 plataformas:
• Windows (Electron) - .exe compilável
• Android (Capacitor) - .apk compilável  
• iOS (Capacitor + Firebase) - .ipa compilável

Usuário compila manualmente em suas máquinas e faz upload dos binários para Supabase Storage para distribuição.`,

    problem: `Problema original: Lojistas perdiam pedidos porque:
• Som de alerta era bloqueado pelo navegador
• Notificações push não funcionavam consistentemente
• PWA tinha limitações em diferentes navegadores

Solução: Apps nativos têm permissões completas para:
• Tocar som sem interação do usuário
• Mostrar notificações do sistema
• Rodar em background
• Iniciar com o sistema operacional`,

    technicalDetails: {
      title: '🔧 Estrutura Implementada',
      items: [
        'electron/ - Estrutura do app Windows',
        'capacitor.config.ts - Configuração Android/iOS',
        'Scripts de build para cada plataforma',
        'Integração com Supabase Storage para distribuição de binários',
        'Documentação de compilação para cada sistema'
      ]
    },

    nextSteps: [
      '✓ Infraestrutura Electron criada',
      '✓ Infraestrutura Capacitor (Android/iOS) criada',
      '✓ Compilação manual pelo usuário configurada',
      '✓ Upload de binários no Supabase Storage',
      '□ Documentar processo de atualização de versões',
      '□ Considerar auto-update para versões futuras'
    ]
  },
  {
    id: 4,
    title: '🔔 Push Notifications Nativas',
    status: 'idea',
    priority: 'medium',
    createdAt: '2025-12-01',
    description: 'Implementar push notifications nativas via Firebase Cloud Messaging para alertas de pedidos.',
    
    context: `Atualmente o sistema usa alertas sonoros e notificações do navegador. Com os apps nativos, push notifications são uma alternativa/complemento para garantir que lojistas recebam alertas de novos pedidos.

Firebase Cloud Messaging (FCM) é gratuito e funciona em:
• Web (Service Workers)
• Android (nativo)
• iOS (via APNs)`,

    problem: `Mesmo com apps nativos, push notifications oferecem benefícios adicionais:
• Funcionam mesmo com app fechado
• Chegam ao celular do lojista em qualquer lugar
• Redundância de alertas (som local + push)
• Histórico de notificações no dispositivo`,

    technicalDetails: {
      title: '🔧 Implementação Técnica',
      items: [
        'Criar projeto no Firebase Console',
        'Configurar Firebase Admin SDK no backend (Edge Function)',
        'Implementar Service Worker para receber notificações web',
        'Criar tabela para armazenar tokens FCM dos dispositivos',
        'Criar Edge Function send-push-notification',
        'Integrar com fluxo de criação de pedidos',
        'Adicionar UI para gerenciar permissões e preferências'
      ]
    },

    nextSteps: [
      '□ Criar projeto Firebase',
      '□ Configurar Firebase Admin SDK',
      '□ Implementar Service Worker',
      '□ Criar tabela device_tokens',
      '□ Criar Edge Function para envio',
      '□ Integrar com webhook de novos pedidos',
      '□ Criar UI de configuração para lojista'
    ]
  },
  {
    id: 5,
    title: '📊 Dashboard Analytics Avançado',
    status: 'idea',
    priority: 'low',
    createdAt: '2025-12-10',
    description: 'Dashboard com métricas avançadas: heatmap de pedidos, análise de cohort, previsão de demanda com ML.',
    
    context: `O sistema atual tem dashboards básicos com métricas de pedidos, receita e clientes. Para lojistas que querem otimizar operações, métricas avançadas podem fazer diferença significativa.`,

    problem: `Lojistas não têm visibilidade sobre:
• Horários de pico (para escalar equipe)
• Retenção de clientes ao longo do tempo
• Previsão de demanda para estoque
• Produtos que performam melhor em cada horário
• Impacto de promoções nas vendas`,

    marketAnalysis: {
      title: '📊 Potencial de Valor',
      items: [
        'Heatmap de pedidos pode reduzir custos de mão de obra em 15-20%',
        'Previsão de demanda pode reduzir desperdício de estoque em 10-30%',
        'Análise de cohort ajuda a entender valor do cliente ao longo do tempo (LTV)',
        'Pode ser feature diferencial vs concorrência (iFood não oferece isso para pequenos)',
        'Potencial para ser módulo premium de alto valor'
      ]
    },

    technicalDetails: {
      title: '🔧 Implementação Técnica',
      items: [
        'Criar views materializadas para agregações pesadas',
        'Implementar heatmap com Recharts ou similar',
        'Criar queries de análise de cohort (retenção mensal)',
        'Avaliar serviços de ML para previsão (AWS Forecast, Google Cloud ML)',
        'Otimizar queries para não impactar performance do sistema',
        'Considerar processamento assíncrono/batch para relatórios pesados'
      ]
    },

    nextSteps: [
      '□ Definir métricas prioritárias com base em feedback de lojistas',
      '□ Criar queries de agregação otimizadas (views materializadas)',
      '□ Implementar heatmap de pedidos por hora/dia',
      '□ Implementar análise de cohort básica',
      '□ Avaliar viabilidade/custo de ML para previsões',
      '□ Criar UI de visualização interativa'
    ]
  }
];

export default function IdeasPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [expandedIds, setExpandedIds] = useState<number[]>([1]); // PIX já expandido

  const toggleExpanded = (id: number) => {
    setExpandedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredIdeas = ideasData.filter(idea => {
    const matchesSearch = idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         idea.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || idea.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || idea.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-yellow-500" />
          Ideias e Funcionalidades Futuras
        </h1>
        <p className="text-muted-foreground mt-1">
          Registro de ideias para evolução do sistema Mostralo
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar ideias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="idea">💡 Ideia</SelectItem>
                  <SelectItem value="analyzing">🔍 Em Análise</SelectItem>
                  <SelectItem value="development">🚧 Em Dev</SelectItem>
                  <SelectItem value="completed">✅ Concluído</SelectItem>
                  <SelectItem value="discarded">❌ Descartado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="high">🔴 Alta</SelectItem>
                  <SelectItem value="medium">🟡 Média</SelectItem>
                  <SelectItem value="low">🟢 Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Ideias */}
      <div className="space-y-4">
        {filteredIdeas.map((idea) => (
          <Collapsible 
            key={idea.id} 
            open={expandedIds.includes(idea.id)}
            onOpenChange={() => toggleExpanded(idea.id)}
          >
            <Card className="overflow-hidden">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-lg">{idea.title}</CardTitle>
                        <Badge className={statusConfig[idea.status].color}>
                          {statusConfig[idea.status].label}
                        </Badge>
                      </div>
                      <CardDescription className="mt-1 flex items-center gap-4">
                        <span className={priorityConfig[idea.priority].color}>
                          Prioridade: {priorityConfig[idea.priority].label}
                        </span>
                        <span className="text-xs">{idea.createdAt}</span>
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon">
                      {expandedIds.includes(idea.id) ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="pt-0 space-y-6">
                  {/* Descrição */}
                  <p className="text-muted-foreground">{idea.description}</p>

                  {/* Contexto Atual */}
                  {idea.context && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <MapPin className="w-4 h-4 text-blue-500" />
                          <span>📍 Contexto Atual</span>
                        </div>
                        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                          <p className="text-sm whitespace-pre-line">{idea.context}</p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Problema/Oportunidade */}
                  {idea.problem && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Target className="w-4 h-4 text-orange-500" />
                        <span>🎯 Problema / Oportunidade</span>
                      </div>
                      <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                        <p className="text-sm whitespace-pre-line">{idea.problem}</p>
                      </div>
                    </div>
                  )}

                  {/* Análise de Mercado */}
                  {idea.marketAnalysis && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <BarChart3 className="w-4 h-4 text-green-500" />
                        <span>{idea.marketAnalysis.title}</span>
                      </div>
                      <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                        <ul className="text-sm space-y-2">
                          {idea.marketAnalysis.items.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-green-500 mt-0.5">💰</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Detalhes Técnicos */}
                  {idea.technicalDetails && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Wrench className="w-4 h-4 text-purple-500" />
                        <span>{idea.technicalDetails.title}</span>
                      </div>
                      <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        <ul className="text-sm space-y-2">
                          {idea.technicalDetails.items.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-purple-500 mt-0.5">•</span>
                              <span className="font-mono text-xs">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Fases de Implementação */}
                  {idea.phases && idea.phases.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Calendar className="w-4 h-4 text-cyan-500" />
                        <span>📅 Fases de Implementação</span>
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        {idea.phases.map((phase, idx) => (
                          <Card key={idx} className="bg-cyan-500/5 border-cyan-500/20">
                            <CardHeader className="pb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30">
                                  {idx + 1}
                                </Badge>
                                <CardTitle className="text-sm">{phase.name}</CardTitle>
                              </div>
                              <CardDescription className="text-xs">{phase.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <ul className="text-xs space-y-1">
                                {phase.items.map((item, i) => (
                                  <li key={i} className="flex items-start gap-1">
                                    <ArrowRight className="w-3 h-3 text-cyan-500 mt-0.5 shrink-0" />
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Questões Legais */}
                  {idea.legalConsiderations && idea.legalConsiderations.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Scale className="w-4 h-4 text-amber-500" />
                        <span>⚖️ Considerações Legais/Regulatórias</span>
                      </div>
                      <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <ul className="text-sm space-y-2">
                          {idea.legalConsiderations.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Opções/Modelos */}
                  {idea.options && idea.options.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium">🔀 Comparativo de Modelos/Opções</p>
                      <div className="grid md:grid-cols-2 gap-4">
                        {idea.options.map((option, idx) => (
                          <Card key={idx} className="bg-muted/30">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">{option.name}</CardTitle>
                              <CardDescription>{option.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div>
                                <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">
                                  ✅ Prós
                                </p>
                                <ul className="text-sm space-y-1">
                                  {option.pros.map((pro, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <span className="text-green-500">•</span>
                                      <span>{pro}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">
                                  ❌ Contras
                                </p>
                                <ul className="text-sm space-y-1">
                                  {option.cons.map((con, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <span className="text-red-500">•</span>
                                      <span>{con}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recomendação */}
                  {idea.recommendation && (
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <p className="text-sm font-medium text-primary mb-2">
                        💡 Recomendação
                      </p>
                      <p className="text-sm whitespace-pre-line">{idea.recommendation}</p>
                    </div>
                  )}

                  {/* Próximos Passos */}
                  {idea.nextSteps && idea.nextSteps.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">📋 Próximos Passos</p>
                      <ul className="space-y-1">
                        {idea.nextSteps.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <span className="text-muted-foreground">
                              {step.startsWith('✓') ? '✓' : idea.status === 'completed' ? '✓' : '□'}
                            </span>
                            <span className={step.startsWith('✓') || idea.status === 'completed' ? 'line-through text-muted-foreground' : ''}>
                              {step.replace(/^[✓□]\s*/, '')}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}

        {filteredIdeas.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Lightbulb className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma ideia encontrada com os filtros aplicados.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
