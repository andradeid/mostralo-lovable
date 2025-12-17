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
  Filter
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

type IdeaStatus = 'idea' | 'analyzing' | 'development' | 'completed' | 'discarded';
type IdeaPriority = 'high' | 'medium' | 'low';

interface IdeaOption {
  name: string;
  description: string;
  pros: string[];
  cons: string[];
}

interface Idea {
  id: number;
  title: string;
  status: IdeaStatus;
  priority: IdeaPriority;
  createdAt: string;
  description: string;
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

// Dados das ideias
const ideasData: Idea[] = [
  {
    id: 1,
    title: '💳 PIX para Lojistas',
    status: 'analyzing',
    priority: 'high',
    createdAt: '2025-12-17',
    description: 'Permitir que lojistas recebam pagamentos PIX dos clientes diretamente no checkout da loja.',
    options: [
      {
        name: 'Modelo Centralizado',
        description: 'Mostralo recebe e repassa para o lojista',
        pros: [
          'Zero configuração para o lojista',
          'Nova receita para Mostralo (5% por transação)',
          'Onboarding simples',
          'Controle total sobre transações'
        ],
        cons: [
          'Questões regulatórias (possível necessidade de licença)',
          'Necessita capital de giro para repasses',
          'Sistema complexo de repasse automático',
          'Responsabilidade da Mostralo em chargebacks'
        ]
      },
      {
        name: 'Modelo Independente',
        description: 'Cada loja configura sua própria conta EFI',
        pros: [
          'Sem riscos legais para Mostralo',
          'Pagamento direto para o lojista',
          'Sem responsabilidade em chargebacks',
          'Arquitetura EFI existente pode ser adaptada'
        ],
        cons: [
          'Setup mais complexo para o lojista',
          'Maior carga de suporte',
          'Sem receita direta por transação',
          'Dependente de cada lojista ter conta EFI'
        ]
      }
    ],
    recommendation: 'Começar com Modelo Independente (mais seguro juridicamente). Futuramente, investigar Split Payment da EFI para modelo centralizado com divisão automática.',
    nextSteps: [
      'Adicionar campos EFI na tabela stores (efi_client_id, efi_client_secret, etc)',
      'Criar Edge Function store-efi-create-pix-charge',
      'Criar Edge Function store-efi-webhook para receber confirmações',
      'Atualizar checkout com opção PIX (quando loja tiver configurado)',
      'Criar interface de configuração EFI para o lojista',
      'Documentar processo de setup para suporte'
    ]
  },
  {
    id: 2,
    title: '💰 Split Payment EFI',
    status: 'idea',
    priority: 'medium',
    createdAt: '2025-12-17',
    description: 'Investigar funcionalidade de Split Payment da EFI para divisão automática de pagamentos (ex: 95% lojista / 5% Mostralo).',
    nextSteps: [
      'Estudar documentação Split Payment EFI',
      'Analisar requisitos regulatórios',
      'Consultar jurídico sobre modelo de negócio',
      'Prototipar integração'
    ]
  },
  {
    id: 3,
    title: '🖥️ App Nativo Desktop (Electron)',
    status: 'completed',
    priority: 'high',
    createdAt: '2025-11-15',
    description: 'Criar aplicativo desktop nativo usando Electron para resolver limitações de som/notificações do navegador.',
    nextSteps: [
      'Infraestrutura Electron criada',
      'Compilação manual pelo usuário',
      'Upload de binários no Supabase Storage'
    ]
  },
  {
    id: 4,
    title: '🔔 Push Notifications Nativas',
    status: 'idea',
    priority: 'medium',
    createdAt: '2025-12-01',
    description: 'Implementar push notifications nativas via Firebase Cloud Messaging para alertas de pedidos.',
    nextSteps: [
      'Configurar projeto Firebase',
      'Implementar service worker para receber notificações',
      'Criar Edge Function para enviar notificações',
      'Adicionar UI para gerenciar permissões'
    ]
  },
  {
    id: 5,
    title: '📊 Dashboard Analytics Avançado',
    status: 'idea',
    priority: 'low',
    createdAt: '2025-12-10',
    description: 'Dashboard com métricas avançadas: heatmap de pedidos, análise de cohort, previsão de demanda com ML.',
    nextSteps: [
      'Definir métricas prioritárias',
      'Criar queries de agregação otimizadas',
      'Implementar visualizações interativas',
      'Considerar integração com serviço de ML'
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
                <CardContent className="pt-0 space-y-4">
                  {/* Descrição */}
                  <p className="text-muted-foreground">{idea.description}</p>

                  {/* Opções/Modelos */}
                  {idea.options && idea.options.length > 0 && (
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
                  )}

                  {/* Recomendação */}
                  {idea.recommendation && (
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <p className="text-sm font-medium text-primary mb-1">
                        💡 Recomendação
                      </p>
                      <p className="text-sm">{idea.recommendation}</p>
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
                              {idea.status === 'completed' ? '✓' : '□'}
                            </span>
                            <span className={idea.status === 'completed' ? 'line-through text-muted-foreground' : ''}>
                              {step}
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
