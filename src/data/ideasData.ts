// Tipos para o sistema de ideias
export type IdeaStatus = 'idea' | 'analyzing' | 'development' | 'completed' | 'discarded';
export type IdeaPriority = 'high' | 'medium' | 'low';

export interface IdeaOption {
  name: string;
  description: string;
  pros: string[];
  cons: string[];
}

export interface MarketAnalysis {
  title: string;
  items: string[];
}

export interface TechnicalDetails {
  title: string;
  items: string[];
}

export interface ImplementationPhase {
  name: string;
  description: string;
  items: string[];
}

export interface RiskSection {
  level: 'low' | 'medium' | 'high';
  title: string;
  items: string[];
}

export interface RiskAnalysis {
  title: string;
  sections: RiskSection[];
}

export interface SafetyChecklist {
  title: string;
  keep: string[];
  remove: string[];
  attendantPages?: string[];
}

export interface Idea {
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
  riskAnalysis?: RiskAnalysis;
  safetyChecklist?: SafetyChecklist;
}

export const statusConfig: Record<IdeaStatus, { label: string; color: string }> = {
  idea: { label: '💡 Ideia', color: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' },
  analyzing: { label: '🔍 Em Análise', color: 'bg-blue-500/20 text-blue-600 dark:text-blue-400' },
  development: { label: '🚧 Em Desenvolvimento', color: 'bg-orange-500/20 text-orange-600 dark:text-orange-400' },
  completed: { label: '✅ Concluído', color: 'bg-green-500/20 text-green-600 dark:text-green-400' },
  discarded: { label: '❌ Descartado', color: 'bg-red-500/20 text-red-600 dark:text-red-400' }
};

export const priorityConfig: Record<IdeaPriority, { label: string; color: string }> = {
  high: { label: '🔴 Alta', color: 'text-red-500' },
  medium: { label: '🟡 Média', color: 'text-yellow-500' },
  low: { label: '🟢 Baixa', color: 'text-green-500' }
};

// Dados das ideias
export const ideasData: Idea[] = [
  // ==================== IDEIAS EXISTENTES ====================
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
  },

  // ==================== NOVAS IDEIAS ====================
  {
    id: 6,
    title: '🛒 Recuperação de Carrinho Abandonado',
    status: 'idea',
    priority: 'high',
    createdAt: '2025-12-17',
    description: 'Detectar carrinhos abandonados e enviar WhatsApp automático com cupom de desconto para recuperar a venda.',
    
    context: `O sistema já possui integração completa com WhatsApp via Evolution API, incluindo envio automático de mensagens, templates personalizáveis e sistema de cupons de desconto.

Componentes existentes que podem ser reaproveitados:
• whatsapp-auto-send Edge Function para envio de mensagens
• Sistema de cupons com validação e aplicação
• Tabela customers com telefone de cada cliente
• Sistema de templates com variáveis dinâmicas`,

    problem: `Estudos mostram que 70-80% dos carrinhos de e-commerce são abandonados. Atualmente o Mostralo não detecta nem tenta recuperar essas vendas perdidas.

Oportunidade:
• Recuperar 10-15% dos carrinhos abandonados com automação
• WhatsApp tem taxa de abertura de 98% (vs 20% email)
• Cupom de desconto como incentivo para completar a compra
• Dados de abandono ajudam a identificar fricções no checkout`,

    marketAnalysis: {
      title: '📊 Potencial de Impacto',
      items: [
        '100 lojas × 20 carrinhos abandonados/dia = 2.000 oportunidades/dia',
        'Taxa de recuperação de 10% = 200 vendas recuperadas/dia',
        'Ticket médio R$ 50 × 200 = R$ 10.000/dia em vendas recuperadas',
        'R$ 300.000/mês em receita adicional para lojistas',
        'Feature altamente valorizada - diferencial competitivo forte'
      ]
    },

    technicalDetails: {
      title: '🔧 Implementação Técnica',
      items: [
        'Criar tabela abandoned_carts (store_id, customer_id, cart_items, created_at, recovered_at)',
        'Implementar detecção de abandono (cliente fecha página ou X minutos sem finalizar)',
        'Criar CRON job para verificar carrinhos abandonados a cada 15 minutos',
        'Criar Edge Function send-abandoned-cart-recovery com template personalizado',
        'Integrar com sistema de cupons (criar cupom automático ou usar cupom padrão)',
        'Criar UI para lojista configurar: tempo de espera, cupom, mensagem',
        'Dashboard de métricas: carrinhos abandonados vs recuperados'
      ]
    },

    phases: [
      {
        name: 'Fase 1 - MVP',
        description: 'Detecção e envio básico',
        items: [
          'Detectar abandono por timeout (5-15 minutos configurável)',
          'Enviar mensagem WhatsApp simples com link para retomar',
          'Salvar carrinho no localStorage + banco de dados',
          'Permitir retomar carrinho via link único'
        ]
      },
      {
        name: 'Fase 2 - Cupom Automático',
        description: 'Incentivo para conversão',
        items: [
          'Criar cupom automático para carrinhos abandonados',
          'Configurar desconto padrão (5%, 10%, etc)',
          'Incluir código do cupom na mensagem WhatsApp',
          'Limite de uso único por carrinho'
        ]
      },
      {
        name: 'Fase 3 - Analytics',
        description: 'Métricas e otimização',
        items: [
          'Dashboard com taxa de abandono e recuperação',
          'A/B testing de mensagens e tempos',
          'Identificar etapas do checkout com maior abandono',
          'Relatório de ROI dos cupons de recuperação'
        ]
      }
    ],

    recommendation: `**Recomendação: Alta prioridade**

Esta feature tem excelente relação impacto/esforço:
• Reusa infraestrutura existente (WhatsApp, cupons)
• Implementação estimada: 1 semana
• Benefício imediato e mensurável para lojistas
• Diferencial forte vs concorrência

Começar com MVP simples (detecção + mensagem) e iterar com cupons automáticos e analytics.`,

    nextSteps: [
      '□ Criar tabela abandoned_carts com estrutura adequada',
      '□ Implementar lógica de detecção de abandono no checkout',
      '□ Criar CRON job para processar carrinhos abandonados',
      '□ Criar template de mensagem WhatsApp para recuperação',
      '□ Criar UI de configuração no painel do lojista',
      '□ Integrar com sistema de cupons existente',
      '□ Criar dashboard de métricas de recuperação'
    ]
  },
  {
    id: 7,
    title: '🎁 Cupons Inteligentes por Comportamento',
    status: 'idea',
    priority: 'high',
    createdAt: '2025-12-17',
    description: 'Sistema de cupons automáticos baseados em comportamento: cliente inativo, aniversário, primeira compra, valor acumulado.',
    
    context: `O sistema já possui infraestrutura completa de cupons (coupons table, validação, aplicação no checkout) e WhatsApp Marketing para envio automático de mensagens. A tabela customers armazena dados de clientes incluindo histórico de compras.

Componentes existentes:
• Sistema de cupons com tipos (percentual, valor fixo)
• WhatsApp auto-send com templates
• Dados de clientes (last_order_at, total_orders, total_spent)
• Sistema de recuperação de clientes inativos (23% de taxa)`,

    problem: `Atualmente os cupons são criados manualmente pelo lojista e aplicados genericamente. Não há inteligência para personalizar ofertas baseadas no comportamento individual do cliente.

Oportunidades:
• Cliente inativo há 30+ dias → cupom de "saudades"
• Aniversário do cliente → cupom de presente
• Primeira compra → cupom de boas-vindas
• Gastou R$ 500+ → cupom VIP
• X pedidos completados → cupom de fidelidade`,

    marketAnalysis: {
      title: '📊 Potencial de Impacto',
      items: [
        'Cupons personalizados têm taxa de uso 3x maior que genéricos',
        'Recuperação de clientes inativos: 23% de taxa já comprovada no sistema',
        'Aniversário: 60%+ dos clientes usam cupom de aniversário',
        'Primeira compra: aumenta conversão de novos clientes em 15-25%',
        'Fidelização: reduz churn em até 20%'
      ]
    },

    technicalDetails: {
      title: '🔧 Implementação Técnica',
      items: [
        'Criar tabela smart_coupon_rules (trigger_type, conditions, coupon_config)',
        'Criar CRON job diário para verificar triggers de comportamento',
        'Implementar triggers: inactive_30d, birthday, first_purchase, vip_threshold, order_milestone',
        'Integrar com WhatsApp auto-send para notificação',
        'Criar UI para lojista configurar regras e valores',
        'Dashboard de performance de cada tipo de cupom'
      ]
    },

    options: [
      {
        name: 'Cliente Inativo',
        description: 'Não compra há X dias',
        pros: [
          '23% de taxa de recuperação já validada',
          'Reativa clientes que iriam para concorrência',
          'Custo menor que adquirir novo cliente',
          'Dados já disponíveis (last_order_at)'
        ],
        cons: [
          'Pode criar expectativa de desconto',
          'Alguns clientes já perdidos não voltam',
          'Necessita calibrar período de inatividade'
        ]
      },
      {
        name: 'Aniversário',
        description: 'Cupom no dia do aniversário',
        pros: [
          'Conexão emocional forte com o cliente',
          'Alta taxa de uso (cliente quer "presente")',
          'Geralmente gera pedido acima da média',
          'Diferencial vs concorrência'
        ],
        cons: [
          'Necessita coletar data de nascimento',
          'Apenas 1 oportunidade/ano por cliente',
          'Alguns clientes não informam data'
        ]
      }
    ],

    recommendation: `**Recomendação: Alta prioridade**

Começar com os 2 triggers de maior impacto:
1. **Cliente Inativo** (30+ dias) - já validado com 23% de recuperação
2. **Primeira Compra** - incentiva conversão de novos clientes

Depois adicionar:
3. Aniversário (requer coleta de data)
4. Milestones de pedidos (5º, 10º, 20º pedido)
5. VIP por valor acumulado`,

    nextSteps: [
      '□ Criar tabela smart_coupon_rules com schema flexível',
      '□ Implementar trigger de cliente inativo (30 dias)',
      '□ Implementar trigger de primeira compra',
      '□ Criar CRON job para verificar triggers diariamente',
      '□ Criar UI de configuração para lojista',
      '□ Adicionar campo data_nascimento em customers',
      '□ Implementar trigger de aniversário',
      '□ Criar dashboard de performance dos cupons'
    ]
  },
  {
    id: 8,
    title: '⭐ Sistema de Avaliações e Reviews',
    status: 'idea',
    priority: 'high',
    createdAt: '2025-12-17',
    description: 'Permitir que clientes avaliem pedidos com estrelas e comentários, exibidos publicamente na loja.',
    
    context: `O sistema já envia mensagem de acompanhamento pós-pedido via WhatsApp. Esta mensagem pode incluir link para avaliação. A página pública da loja poderia exibir reviews como prova social.

Componentes existentes:
• WhatsApp follow-up após entrega
• Página pública da loja (store page)
• Sistema de autenticação de clientes`,

    problem: `Lojistas não têm feedback estruturado dos clientes. Avaliações são fundamentais para:
• Prova social para novos clientes
• Identificar problemas de qualidade
• Melhorar produtos/serviço
• SEO e descoberta da loja
• Diferencial vs concorrência (iFood tem reviews, loja própria não)`,

    marketAnalysis: {
      title: '📊 Potencial de Impacto',
      items: [
        '93% dos consumidores leem reviews antes de comprar',
        'Produtos com reviews têm conversão 270% maior',
        'Responder reviews aumenta confiança em 16%',
        'Reviews melhoram SEO da loja',
        'Feedback ajuda lojista a identificar problemas rapidamente'
      ]
    },

    technicalDetails: {
      title: '🔧 Implementação Técnica',
      items: [
        'Criar tabela reviews (order_id, customer_id, rating, comment, created_at, reply, is_public)',
        'Criar página de avaliação acessível via link único por pedido',
        'Implementar componente de exibição de reviews na página da loja',
        'Criar UI para lojista visualizar e responder reviews',
        'Implementar moderação (aprovar/ocultar reviews ofensivos)',
        'Enviar link de avaliação via WhatsApp após entrega',
        'Calcular e exibir média de estrelas na loja'
      ]
    },

    phases: [
      {
        name: 'Fase 1 - Coleta',
        description: 'Sistema básico de coleta de avaliações',
        items: [
          'Página de avaliação com 1-5 estrelas',
          'Campo de comentário opcional',
          'Link único por pedido (token)',
          'Envio via WhatsApp após entrega'
        ]
      },
      {
        name: 'Fase 2 - Exibição',
        description: 'Mostrar reviews na loja',
        items: [
          'Componente de reviews na página da loja',
          'Média de estrelas visível',
          'Filtros (mais recentes, melhores, piores)',
          'Paginação para lojas com muitos reviews'
        ]
      },
      {
        name: 'Fase 3 - Gestão',
        description: 'Ferramentas para o lojista',
        items: [
          'Dashboard de reviews recebidos',
          'Responder reviews publicamente',
          'Ocultar reviews ofensivos/spam',
          'Notificação de novo review'
        ]
      }
    ],

    recommendation: `**Recomendação: Alta prioridade**

Reviews são essenciais para lojas online modernas. A ausência de reviews faz a loja parecer "vazia" ou nova.

Implementar sistema simples primeiro:
1. Coleta via link no WhatsApp pós-entrega
2. Exibição básica na página da loja
3. Gestão pelo lojista

Priorizar simplicidade para garantir que clientes deixem reviews (muitos campos = menos reviews).`,

    nextSteps: [
      '□ Criar tabela reviews com campos essenciais',
      '□ Criar página de avaliação (link único por pedido)',
      '□ Integrar envio do link na mensagem pós-entrega',
      '□ Criar componente de exibição na página da loja',
      '□ Criar UI de gestão para lojista',
      '□ Implementar respostas do lojista',
      '□ Adicionar moderação básica'
    ]
  },
  {
    id: 9,
    title: '🔄 Pedidos Recorrentes / Clube de Assinaturas',
    status: 'idea',
    priority: 'medium',
    createdAt: '2025-12-17',
    description: 'Permitir que clientes assinem pedidos recorrentes (semanal/quinzenal/mensal) com desconto para assinantes.',
    
    context: `Alguns segmentos têm alto potencial para recorrência: suplementos (ciclo de 30 dias), hortifruti (semanal), padaria (diário/semanal), água/gás (conforme consumo).

O sistema já possui:
• Sistema de cupons para desconto de assinantes
• WhatsApp para lembretes automáticos
• Infraestrutura de pagamento (pode ser adaptada para cobrança recorrente)`,

    problem: `Clientes precisam refazer pedido manualmente a cada vez. Isso causa:
• Fricção para cliente (esquece, dá trabalho)
• Perda de vendas para concorrência mais conveniente
• Receita imprevisível para lojista

Clube de assinaturas resolve:
• Conveniência para cliente
• Receita previsível para lojista
• Fidelização forte (custa sair)
• Ticket médio maior (assinantes gastam mais)`,

    marketAnalysis: {
      title: '📊 Potencial de Impacto',
      items: [
        'Mercado de assinaturas cresce 15% ao ano no Brasil',
        'Assinantes têm LTV 3-5x maior que clientes pontuais',
        'Taxa de churn de assinaturas bem feitas: 5-8%/mês',
        'Suplementos: ciclo natural de 30 dias, ticket R$ 200-400',
        'Hortifruti: cestas semanais R$ 80-150, alta retenção'
      ]
    },

    technicalDetails: {
      title: '🔧 Implementação Técnica',
      items: [
        'Criar tabela subscriptions (customer_id, store_id, frequency, next_order_at, items, status)',
        'CRON job para gerar pedidos automáticos na data agendada',
        'Integrar com PIX para cobrança automática (se implementado)',
        'UI para cliente gerenciar assinatura (pausar, cancelar, alterar itens)',
        'Dashboard para lojista ver assinantes ativos e receita recorrente',
        'Desconto automático para assinantes (5-15%)',
        'Lembrete WhatsApp X dias antes do próximo pedido'
      ]
    },

    options: [
      {
        name: 'Assinatura com Pagamento Manual',
        description: 'Sistema cria pedido, cliente paga normalmente',
        pros: [
          'Implementação mais simples',
          'Não requer PIX automático',
          'Cliente confirma antes de pagar',
          'Menor risco de chargebacks'
        ],
        cons: [
          'Fricção para cliente (precisa pagar cada vez)',
          'Taxa de conversão menor',
          'Cliente pode "esquecer" de pagar'
        ]
      },
      {
        name: 'Assinatura com Cobrança Automática',
        description: 'Sistema cobra automaticamente via PIX',
        pros: [
          'Experiência premium para cliente',
          'Maior taxa de retenção',
          'Receita 100% previsível',
          'Sem esquecimento de pagamento'
        ],
        cons: [
          'Requer PIX para Lojistas implementado',
          'Complexidade de chargebacks',
          'Cliente precisa confiar na cobrança automática',
          'Necessita fluxo de cancelamento claro'
        ]
      }
    ],

    recommendation: `**Recomendação: Média prioridade**

Depende do PIX para Lojistas para versão completa. Pode começar com versão simplificada:

1. **Fase 1**: Assinatura com pedido automático + pagamento manual
2. **Fase 2**: Após PIX implementado, adicionar cobrança automática

Focar em segmentos com ciclo natural (suplementos, hortifruti) para validar demanda.`,

    nextSteps: [
      '□ Criar tabela subscriptions com schema flexível',
      '□ Implementar CRON job para gerar pedidos automáticos',
      '□ Criar UI de assinatura para cliente',
      '□ Criar dashboard de assinantes para lojista',
      '□ Implementar desconto automático para assinantes',
      '□ Enviar lembretes via WhatsApp',
      '□ [Após PIX] Implementar cobrança automática'
    ]
  },
  {
    id: 10,
    title: '🤖 Insights com IA para Lojistas',
    status: 'idea',
    priority: 'medium',
    createdAt: '2025-12-17',
    description: 'Análise automática de dados com IA: sugestões de produtos, alertas de anomalias, otimização de preços.',
    
    context: `O sistema já possui Lovable AI integrado via Edge Functions para o bot de WhatsApp. A infraestrutura de IA pode ser reaproveitada para análise de dados.

Dados disponíveis para análise:
• Pedidos (produtos, valores, horários, clientes)
• Clientes (frequência, ticket, preferências)
• Produtos (vendas, margem se informada)
• Tendências temporais (dia, semana, mês)`,

    problem: `Lojistas não têm tempo ou conhecimento para analisar dados. Insights ficam "escondidos" nos números.

IA pode automatizar:
• "Seu produto X está vendendo 30% menos esta semana"
• "Clientes que compram A também compram B - faça combo"
• "Terça-feira às 19h é seu horário de pico"
• "Você pode estar cobrando abaixo do mercado no produto Y"
• "5 clientes inativos há 30 dias - envie cupom"`,

    marketAnalysis: {
      title: '📊 Potencial de Impacto',
      items: [
        'Insights de IA podem aumentar receita em 5-15%',
        'Alertas de anomalias evitam problemas antes de escalarem',
        'Sugestões de combo aumentam ticket médio em 10-20%',
        'Feature premium de alto valor percebido',
        'Diferencial forte vs concorrência (nenhum oferece isso para pequenos)'
      ]
    },

    technicalDetails: {
      title: '🔧 Implementação Técnica',
      items: [
        'Criar Edge Function analyze-store-data que agrega métricas',
        'Chamar Lovable AI (Gemini) com prompt estruturado + dados',
        'Gerar insights semanais automaticamente via CRON',
        'Criar UI de "Insights da Semana" no dashboard do lojista',
        'Implementar alertas em tempo real para anomalias críticas',
        'Armazenar insights em tabela para histórico',
        'Permitir lojista pedir análise específica (chat com IA)'
      ]
    },

    phases: [
      {
        name: 'Fase 1 - Relatório Semanal',
        description: 'Insights automáticos uma vez por semana',
        items: [
          'Agregar dados da semana',
          'Enviar para Lovable AI com prompt de análise',
          'Gerar relatório com 3-5 insights principais',
          'Exibir no dashboard do lojista'
        ]
      },
      {
        name: 'Fase 2 - Alertas em Tempo Real',
        description: 'Notificações de anomalias',
        items: [
          'Detectar quedas/picos anormais de vendas',
          'Alertar quando produto popular acaba/diminui',
          'Notificar sobre clientes importantes inativos',
          'Enviar via WhatsApp ou push notification'
        ]
      },
      {
        name: 'Fase 3 - Chat com IA',
        description: 'Lojista conversa com IA sobre dados',
        items: [
          'Interface de chat no dashboard',
          '"Qual meu produto mais lucrativo?"',
          '"Quando devo fazer promoção?"',
          'Análise sob demanda personalizada'
        ]
      }
    ],

    recommendation: `**Recomendação: Média prioridade**

Começar com relatório semanal automatizado (baixo esforço, alto impacto percebido).

Lovable AI já está integrado, então custo de implementação é baixo. Principal trabalho é:
1. Estruturar agregação de dados
2. Criar prompts eficazes para insights
3. Criar UI de visualização

Feature diferencial que pode justificar plano premium.`,

    nextSteps: [
      '□ Criar Edge Function de agregação de métricas semanais',
      '□ Desenvolver prompt de análise para Lovable AI',
      '□ Criar CRON job semanal para gerar insights',
      '□ Criar componente "Insights da Semana" no dashboard',
      '□ Implementar detecção de anomalias básica',
      '□ Criar sistema de alertas via WhatsApp',
      '□ [Futuro] Implementar chat com IA'
    ]
  },
  {
    id: 11,
    title: '💵 Sistema de Gorjetas Digitais',
    status: 'idea',
    priority: 'medium',
    createdAt: '2025-12-17',
    description: 'Permitir que clientes adicionem gorjeta no checkout, com opção de direcionar para entregador ou loja.',
    
    context: `O checkout atual não tem opção de gorjeta. Muitos clientes dariam gorjeta se a opção estivesse disponível de forma conveniente.

Sistema já possui:
• Checkout funcional com cálculo de totais
• Sistema de entregadores com earnings tracking
• Múltiplas formas de pagamento`,

    problem: `Entregadores dependem de gorjetas em espécie, que estão cada vez mais raras com pagamentos digitais.

Gorjeta digital resolve:
• Conveniência para cliente (não precisa de dinheiro)
• Renda extra para entregadores
• Pode ser direcionada para loja ou entregador
• Aumenta satisfação de entregadores (reduz turnover)`,

    marketAnalysis: {
      title: '📊 Potencial de Impacto',
      items: [
        '30-40% dos clientes dão gorjeta quando opção está visível',
        'Gorjeta média: R$ 3-5 por pedido',
        '100 pedidos/dia × R$ 3 = R$ 300/dia extra para entregadores',
        'Entregadores mais satisfeitos = melhor serviço = mais pedidos',
        'Feature simples de implementar, alto valor percebido'
      ]
    },

    technicalDetails: {
      title: '🔧 Implementação Técnica',
      items: [
        'Adicionar campo tip_amount na tabela orders',
        'Adicionar opção de gorjeta no checkout (5%, 10%, 15%, outro)',
        'Configuração do lojista: gorjeta vai para entregador ou loja',
        'Integrar com sistema de earnings do entregador',
        'Relatório de gorjetas recebidas para lojista e entregador',
        'Se PIX implementado, incluir gorjeta no valor total'
      ]
    },

    options: [
      {
        name: 'Gorjeta para Entregador',
        description: '100% vai para quem fez a entrega',
        pros: [
          'Motivação direta para entregadores',
          'Modelo mais comum em apps de delivery',
          'Entregadores valorizam muito',
          'Reduz turnover de entregadores'
        ],
        cons: [
          'Loja não recebe nada',
          'Pode criar expectativa de gorjeta',
          'Precisa integrar com sistema de earnings'
        ]
      },
      {
        name: 'Gorjeta para Loja',
        description: 'Loja recebe e decide distribuição',
        pros: [
          'Loja tem controle total',
          'Pode distribuir entre equipe',
          'Mais simples de implementar',
          'Alguns clientes preferem valorizar a loja'
        ],
        cons: [
          'Entregadores não veem benefício direto',
          'Menos motivador para entregadores',
          'Pode gerar desconfiança sobre distribuição'
        ]
      }
    ],

    recommendation: `**Recomendação: Implementar com opção configurável**

Deixar lojista escolher: gorjeta vai 100% para entregador, 100% para loja, ou percentual dividido.

Implementação simples:
1. Adicionar campo no checkout
2. Adicionar campo na tabela orders
3. Integrar com earnings se for para entregador

Benefício imediato para entregadores = diferencial para atrair bons entregadores.`,

    nextSteps: [
      '□ Adicionar campo tip_amount e tip_destination em orders',
      '□ Criar componente de seleção de gorjeta no checkout',
      '□ Criar configuração de destino da gorjeta para lojista',
      '□ Integrar com sistema de earnings do entregador',
      '□ Criar relatório de gorjetas recebidas',
      '□ Exibir total de gorjetas no dashboard do entregador'
    ]
  },
  {
    id: 12,
    title: '📦 Gestão de Estoque Básica',
    status: 'idea',
    priority: 'medium',
    createdAt: '2025-12-17',
    description: 'Controle de quantidade em estoque por produto, com alertas de estoque baixo e indisponibilidade automática.',
    
    context: `O sistema atual tem campo is_available em products que é controlado manualmente. Não há tracking de quantidade em estoque.

Para segmentos como suplementos, farmácias e lojas de produtos, controle de estoque é fundamental. Para restaurantes, pode ser opcional.`,

    problem: `Sem controle de estoque:
• Lojista vende produto que não tem
• Precisa verificar manualmente e desativar
• Não sabe quando reabastecer
• Cliente frustrado quando pedido é cancelado

Com controle de estoque:
• Produto fica indisponível automaticamente quando acaba
• Alerta quando estoque está baixo
• Histórico de movimentações
• Previsão de reabastecimento`,

    marketAnalysis: {
      title: '📊 Potencial de Impacto',
      items: [
        'Reduz cancelamentos por falta de estoque (experiência do cliente)',
        'Evita vendas de produtos indisponíveis',
        'Alertas de estoque baixo evitam ruptura',
        'Histórico ajuda a planejar compras',
        'Feature esperada em sistemas de e-commerce'
      ]
    },

    technicalDetails: {
      title: '🔧 Implementação Técnica',
      items: [
        'Adicionar campos em products: stock_quantity, stock_alert_threshold, track_stock',
        'Criar tabela stock_movements (product_id, quantity_change, reason, created_at)',
        'Trigger para decrementar estoque quando pedido é confirmado',
        'Trigger para marcar is_available = false quando stock_quantity = 0',
        'CRON job para enviar alertas de estoque baixo',
        'UI para lojista visualizar e ajustar estoque',
        'Relatório de movimentações de estoque'
      ]
    },

    phases: [
      {
        name: 'Fase 1 - Controle Básico',
        description: 'Quantidade e indisponibilidade automática',
        items: [
          'Adicionar campo de quantidade em produtos',
          'Decrementar automaticamente nos pedidos',
          'Marcar indisponível quando zerado',
          'UI básica de edição de estoque'
        ]
      },
      {
        name: 'Fase 2 - Alertas',
        description: 'Notificações proativas',
        items: [
          'Configurar threshold de alerta por produto',
          'Enviar notificação quando estoque baixo',
          'Dashboard de produtos com estoque crítico',
          'Alerta visual na lista de produtos'
        ]
      },
      {
        name: 'Fase 3 - Histórico',
        description: 'Rastreabilidade completa',
        items: [
          'Registrar todas as movimentações',
          'Motivo da movimentação (venda, ajuste, perda)',
          'Relatório de histórico por produto',
          'Previsão de quando acabará baseado em vendas'
        ]
      }
    ],

    recommendation: `**Recomendação: Média prioridade**

Essencial para alguns segmentos (suplementos, farmácias, produtos), opcional para outros (restaurantes).

Implementar como feature configurável:
• track_stock = false por padrão
• Lojista ativa se quiser usar

Começar com Fase 1 (básico) e evoluir conforme demanda.`,

    nextSteps: [
      '□ Adicionar campos de estoque na tabela products',
      '□ Criar tabela stock_movements',
      '□ Implementar trigger de decremento nos pedidos',
      '□ Implementar trigger de indisponibilidade automática',
      '□ Criar UI de gestão de estoque para lojista',
      '□ Implementar alertas de estoque baixo',
      '□ Criar relatório de movimentações'
    ]
  },
  {
    id: 13,
    title: '📱 App Nativo para Clientes',
    status: 'idea',
    priority: 'low',
    createdAt: '2025-12-17',
    description: 'Aplicativo móvel para clientes fazerem pedidos, com push notifications e histórico centralizado.',
    
    context: `Atualmente clientes acessam lojas via navegador (PWA). Cada loja tem sua própria URL. Não existe app centralizado para clientes.

Infraestrutura de apps nativos já existe para lojistas (Electron/Capacitor). Poderia ser adaptada para app de clientes.`,

    problem: `PWA tem limitações para clientes:
• Notificações push inconsistentes
• Não aparece na home do celular por padrão
• Histórico de pedidos disperso (uma loja por vez)
• Experiência inferior a apps nativos

App nativo oferece:
• Presença constante na home do celular
• Push notifications confiáveis
• Histórico centralizado de todas as lojas
• Experiência mais fluida e rápida`,

    marketAnalysis: {
      title: '📊 Potencial de Impacto',
      items: [
        'Apps têm conversão 3x maior que mobile web',
        'Push notifications aumentam recompra em 30%',
        'Presença na home = lembrança constante da marca',
        'Histórico centralizado melhora experiência',
        'Pode ser diferencial para atrair mais clientes'
      ]
    },

    technicalDetails: {
      title: '🔧 Implementação Técnica',
      items: [
        'Adaptar estrutura Capacitor existente para app de cliente',
        'Criar tela de descoberta de lojas (por localização/busca)',
        'Implementar favoritos de lojas',
        'Histórico de pedidos de todas as lojas',
        'Push notifications para status de pedido e promoções',
        'Publicar nas stores (Google Play, App Store)',
        'Sistema de deep links para abrir loja específica'
      ]
    },

    options: [
      {
        name: 'App Multi-Loja',
        description: 'Um app com todas as lojas Mostralo',
        pros: [
          'Descoberta de novas lojas',
          'Histórico centralizado',
          'Uma instalação, várias lojas',
          'Mais downloads (utilidade geral)'
        ],
        cons: [
          'Lojista não tem "app próprio"',
          'Concorrência entre lojas no mesmo app',
          'Complexidade de moderação',
          'Lojista fica dependente do Mostralo'
        ]
      },
      {
        name: 'App White-Label por Loja',
        description: 'Cada loja tem seu próprio app',
        pros: [
          'Marca exclusiva do lojista',
          'Sem concorrência no app',
          'Maior fidelização',
          'Pode ser módulo premium caro'
        ],
        cons: [
          'Cliente precisa instalar app de cada loja',
          'Custo de manutenção maior',
          'Processo de publicação por loja',
          'Taxa das stores (R$ 25 Google, $99/ano Apple)'
        ]
      }
    ],

    recommendation: `**Recomendação: Baixa prioridade**

Alto esforço de desenvolvimento e manutenção. PWA atende bem a maioria dos casos.

Se implementar, começar com app multi-loja (mais simples):
1. Tela de busca de lojas
2. Favoritos
3. Histórico centralizado
4. Push notifications

App white-label por loja seria módulo super premium (custo alto).`,

    nextSteps: [
      '□ Avaliar demanda real de clientes por app',
      '□ Definir se multi-loja ou white-label',
      '□ Adaptar estrutura Capacitor para app de cliente',
      '□ Implementar tela de descoberta de lojas',
      '□ Implementar push notifications',
      '□ Testar em dispositivos reais',
      '□ Publicar nas stores (Google Play, App Store)'
    ]
  },
  {
    id: 14,
    title: '🔗 Integração com Marketplaces',
    status: 'idea',
    priority: 'low',
    createdAt: '2025-12-17',
    description: 'Receber pedidos do iFood, Rappi e outros marketplaces no mesmo painel, unificando gestão.',
    
    context: `Muitos lojistas usam Mostralo E marketplaces simultaneamente. Gerenciar múltiplos painéis é trabalhoso.

Mostralo poderia ser o "hub central" que recebe pedidos de todas as fontes:
• Loja própria (Mostralo)
• iFood
• Rappi
• Uber Eats
• Outros marketplaces`,

    problem: `Lojistas com múltiplos canais:
• Precisam monitorar 3-4 telas/apps diferentes
• Risco de perder pedidos
• Estoque não sincronizado
• Relatórios separados por plataforma

Integração resolve:
• Todos os pedidos em um lugar
• Alertas unificados
• Relatórios consolidados
• Comparação de performance por canal`,

    marketAnalysis: {
      title: '📊 Potencial de Impacto',
      items: [
        'Maioria dos restaurantes usa 2+ plataformas',
        'Reduz tempo de gestão em 50%+',
        'Evita pedidos perdidos',
        'Mostralo se torna indispensável (hub central)',
        'Dados comparativos (canal próprio vs marketplaces)'
      ]
    },

    technicalDetails: {
      title: '🔧 Implementação Técnica',
      items: [
        'Estudar APIs dos marketplaces (iFood, Rappi, Uber Eats)',
        'iFood: API parceiros requer aprovação e contrato',
        'Rappi: Integração via parceiro ou API direta',
        'Criar tabela marketplace_connections por loja',
        'Padronizar pedidos de diferentes fontes',
        'Adicionar campo source em orders (mostralo, ifood, rappi)',
        'Criar webhooks para receber pedidos em tempo real'
      ]
    },

    legalConsiderations: [
      '⚠️ APIs de marketplaces geralmente requerem parceria formal',
      '⚠️ iFood tem programa de parceiros com requisitos específicos',
      '⚠️ Termos de uso podem mudar a qualquer momento',
      '❓ Avaliar se Mostralo pode se tornar parceiro oficial',
      '💼 Provavelmente necessita time comercial/jurídico para negociar'
    ],

    recommendation: `**Recomendação: Baixa prioridade (alto esforço/risco)**

Integração com marketplaces é complexa:
• APIs proprietárias e restritivas
• Requer parceria formal (processo longo)
• Dependência de terceiros
• Mudanças unilaterais dos marketplaces

Focar em fazer a loja própria do Mostralo ser tão boa que lojistas migrem DO marketplace para o Mostralo, não integrem os dois.

Se demanda for muito forte, avaliar parceria com iFood primeiro (maior mercado).`,

    nextSteps: [
      '□ Pesquisar programa de parceiros iFood',
      '□ Avaliar APIs disponíveis de cada marketplace',
      '□ Estimar esforço de integração por plataforma',
      '□ Avaliar viabilidade comercial/jurídica',
      '□ [Se viável] Começar com iFood (maior share)',
      '□ Criar estrutura de pedidos multi-source'
    ]
  },
  {
    id: 15,
    title: '🤝 Programa de Indicação entre Lojistas',
    status: 'idea',
    priority: 'low',
    createdAt: '2025-12-17',
    description: 'Lojistas indicam outros lojistas e ganham desconto/bônus quando o indicado assina.',
    
    context: `O sistema já possui programa de vendedores/afiliados (salespeople) com comissão por indicação. A lógica de tracking por referral_code e pagamento de comissão já existe.

Esta ideia é adaptar o mesmo modelo para lojistas existentes indicarem novos lojistas.`,

    problem: `Custo de aquisição de cliente (CAC) é alto. Lojistas satisfeitos são os melhores vendedores, mas não têm incentivo formal para indicar.

Programa de indicação:
• Reduz CAC (indicação é marketing orgânico)
• Lojistas satisfeitos viram embaixadores
• Indicados chegam mais qualificados (recomendação)
• Win-win: quem indica ganha, Mostralo ganha cliente`,

    marketAnalysis: {
      title: '📊 Potencial de Impacto',
      items: [
        'Clientes indicados têm LTV 25% maior',
        'CAC de indicação é 50-70% menor que ads',
        'Dropbox cresceu 3900% com programa de indicação',
        'Lojistas conhecem outros lojistas (rede natural)',
        'Programa simples de implementar (estrutura existe)'
      ]
    },

    technicalDetails: {
      title: '🔧 Implementação Técnica',
      items: [
        'Criar referral_code único para cada lojista',
        'Adicionar campo referred_by_store_id em stores',
        'Definir benefício: desconto no próximo mês ou bônus em créditos',
        'Criar UI para lojista ver link de indicação e indicados',
        'Enviar notificação quando indicado assinar',
        'Aplicar desconto/crédito automaticamente'
      ]
    },

    options: [
      {
        name: 'Desconto no Plano',
        description: 'Quem indica ganha X% de desconto no próximo mês',
        pros: [
          'Benefício imediato e tangível',
          'Reduz churn (lojista quer manter desconto)',
          'Simples de implementar',
          'Não requer sistema de créditos'
        ],
        cons: [
          'Impacto na receita mensal',
          'Desconto limitado (não pode ser 100%)',
          'Benefício some quando para de indicar'
        ]
      },
      {
        name: 'Créditos Acumuláveis',
        description: 'Cada indicação = R$ X em créditos',
        pros: [
          'Pode acumular muitos créditos',
          'Incentiva indicações contínuas',
          'Flexibilidade de uso (pagar plano, módulos)',
          'Pode ser convertido em dinheiro (opcional)'
        ],
        cons: [
          'Necessita sistema de créditos',
          'Mais complexo de implementar',
          'Pode gerar expectativa de "ganhar dinheiro"'
        ]
      }
    ],

    recommendation: `**Recomendação: Baixa prioridade (fácil, mas não urgente)**

A estrutura de referral já existe no sistema de vendedores. Adaptar para lojistas é relativamente simples.

Priorizar outras features primeiro (carrinho abandonado, reviews, etc.) que têm impacto mais imediato.

Quando implementar:
• Começar com desconto simples (1 mês grátis para indicador)
• Indicado ganha desconto no primeiro mês
• Evoluir para sistema de créditos se demanda for alta`,

    nextSteps: [
      '□ Definir benefício para indicador e indicado',
      '□ Gerar referral_code para lojistas existentes',
      '□ Criar página de indicação no dashboard do lojista',
      '□ Adaptar fluxo de signup para capturar indicação',
      '□ Implementar aplicação automática do benefício',
      '□ Criar UI para acompanhar indicações e benefícios'
    ]
  },
  {
    id: 16,
    title: '📦 Estruturação de Planos por Módulos',
    status: 'analyzing',
    priority: 'high',
    createdAt: '2025-12-17',
    description: 'Análise estratégica dos 17 módulos do sistema e proposta de distribuição para os 3 planos: Essencial (R$ 397), Profissional (R$ 597) e Enterprise (R$ 997).',
    
    context: `O sistema Mostralo possui atualmente 17 módulos funcionais que controlam o acesso a diferentes funcionalidades. Utiliza modelo de permissão invertida: todos os módulos são habilitados por padrão, e o master admin pode bloquear módulos específicos para lojas específicas.

📊 INVENTÁRIO COMPLETO DOS MÓDULOS:

🟢 MÓDULOS CORE (Essenciais para operação):
1. digital_menu - Cardápio Digital (gestão de produtos e categorias)
2. order_management - Gestão de Pedidos (recebimento e acompanhamento)
3. reports - Relatórios Básicos (vendas e métricas)
4. customization - Personalização Visual (logo, cores, tema)
5. delivery - Configurações de Entrega (áreas, taxas)

🟡 MÓDULOS AVANÇADOS (Valor agregado):
6. banners - Banners Promocionais (vitrines na loja)
7. promotions - Promoções e Cupons (descontos e campanhas)
8. whatsapp - Notificações WhatsApp (alertas automáticos)
9. delivery_drivers - Gestão de Entregadores (equipe própria)
10. printing - Sistema de Impressão (comandas térmicas)
11. attendants - Gestão de Atendentes (multi-usuários)
12. scheduled_orders - Pedidos Agendados (delivery programado)
13. marketing_material - Material de Marketing (flyers, QR codes)

🔴 MÓDULOS PREMIUM (Alto valor):
14. whatsapp_recovery - Recuperação WhatsApp (carrinhos abandonados)
15. marketing - Marketing Digital (campanhas avançadas)
16. integrations - Integrações Externas (iframes customizados)
17. custom_scripts - Scripts Personalizados (JavaScript custom)`,

    problem: `A distribuição atual não está otimizada para maximizar conversão e upsell entre planos. Precisamos definir:

• Quais módulos incluir em cada faixa de preço?
• Como criar valor percebido claro entre os planos?
• Como incentivar upgrade do Essencial → Profissional → Enterprise?

💡 CRITÉRIOS DE DISTRIBUIÇÃO:
1. Plano Essencial (R$ 397) = Módulos CORE para funcionar
2. Plano Profissional (R$ 597) = CORE + Automação/Produtividade  
3. Plano Enterprise (R$ 997) = TUDO + Premium + Suporte Prioritário

📈 ESTRATÉGIA DE UPSELL:
• Essencial → Profissional: "Quer automatizar WhatsApp e gerenciar entregadores?"
• Profissional → Enterprise: "Quer recuperar carrinhos abandonados e integrações avançadas?"`,

    marketAnalysis: {
      title: '💰 Análise de Valor por Módulo',
      items: [
        'digital_menu + order_management = ESSENCIAL (sem isso não funciona)',
        'whatsapp + delivery_drivers = +R$ 100-150 valor percebido (automação)',
        'whatsapp_recovery = +R$ 200-300 valor percebido (recupera 23% clientes)',
        'integrations + custom_scripts = +R$ 300-500 valor percebido (personalização total)',
        'Suporte Prioritário = diferencial emocional para Enterprise',
        'R$ 397 → R$ 597 = +50% preço por +77% mais módulos (6→13 módulos)',
        'R$ 597 → R$ 997 = +67% preço por acesso total + suporte prioritário'
      ]
    },

    technicalDetails: {
      title: '🔧 Distribuição Proposta dos Planos',
      items: [
        '═══════════════════════════════════════════════════════════════',
        '📦 PLANO ESSENCIAL (R$ 397/mês) - 7 MÓDULOS',
        '═══════════════════════════════════════════════════════════════',
        '✅ digital_menu - Cardápio Digital',
        '✅ order_management - Gestão de Pedidos', 
        '✅ reports - Relatórios Básicos',
        '✅ customization - Personalização Visual',
        '✅ delivery - Configurações de Entrega',
        '✅ banners - Banners Promocionais',
        '✅ promotions - Promoções e Cupons',
        '❌ Bloqueados: whatsapp, delivery_drivers, printing, attendants, scheduled_orders, marketing_material, whatsapp_recovery, marketing, integrations, custom_scripts',
        '',
        '═══════════════════════════════════════════════════════════════',
        '📦 PLANO PROFISSIONAL (R$ 597/mês) - 13 MÓDULOS',
        '═══════════════════════════════════════════════════════════════',
        '✅ Todos do Essencial +',
        '✅ whatsapp - Notificações WhatsApp',
        '✅ delivery_drivers - Gestão de Entregadores',
        '✅ printing - Sistema de Impressão',
        '✅ attendants - Gestão de Atendentes',
        '✅ scheduled_orders - Pedidos Agendados',
        '✅ marketing_material - Material de Marketing',
        '❌ Bloqueados: whatsapp_recovery, marketing, integrations, custom_scripts',
        '',
        '═══════════════════════════════════════════════════════════════',
        '📦 PLANO ENTERPRISE (R$ 997/mês) - 17 MÓDULOS + SUPORTE',
        '═══════════════════════════════════════════════════════════════',
        '✅ TODOS os 17 módulos desbloqueados',
        '✅ whatsapp_recovery - Recuperação WhatsApp (23% clientes)',
        '✅ marketing - Marketing Digital Avançado',
        '✅ integrations - Integrações Externas',
        '✅ custom_scripts - Scripts Personalizados',
        '⭐ BÔNUS: Suporte Prioritário (resposta em 4h úteis)',
        '⭐ BÔNUS: Consultoria mensal de 30min'
      ]
    },

    phases: [
      {
        name: 'Fase 1 - Configurar Planos',
        description: 'Atualizar tabela plans com módulos de cada plano',
        items: [
          'Atualizar registro do plano Essencial (ID existente)',
          'Atualizar registro do plano Profissional (ID existente)',
          'Atualizar registro do plano Enterprise (ID existente)',
          'Definir lista de module_keys bloqueados por plano',
          'Criar coluna blocked_modules[] na tabela plans'
        ]
      },
      {
        name: 'Fase 2 - Implementar Bloqueio',
        description: 'Garantir que ModuleGate funcione com os planos',
        items: [
          'Verificar função is_module_blocked_for_store()',
          'Atualizar lógica para considerar plano da loja',
          'Testar bloqueio de módulos por plano',
          'Criar mensagem de upgrade quando módulo bloqueado',
          'Adicionar CTA para upgrade no modal de bloqueio'
        ]
      },
      {
        name: 'Fase 3 - Visualização de Planos',
        description: 'Atualizar página de planos com módulos visíveis',
        items: [
          'Mostrar lista de módulos inclusos em cada plano',
          'Destacar módulos exclusivos de planos superiores',
          'Adicionar comparativo visual entre planos',
          'Criar tooltip explicando cada módulo',
          'Atualizar landing page com novo comparativo'
        ]
      }
    ],

    legalConsiderations: [
      '✅ Sem implicações legais - apenas reorganização de features',
      '⚠️ Comunicar mudanças aos assinantes atuais com antecedência',
      '⚠️ Garantir que assinantes atuais mantenham benefícios contratados',
      '📋 Atualizar contrato de merchant com nova descrição de planos'
    ],

    options: [
      {
        name: 'Distribuição Conservadora',
        description: 'Mais módulos no Essencial para maximizar valor percebido',
        pros: [
          'Maior atratividade do plano de entrada',
          'Reduz barreira de entrada',
          'Menos reclamações de "falta de recursos"',
          'Bom para mercados sensíveis a preço'
        ],
        cons: [
          'Menor incentivo para upgrade',
          'Receita média por usuário (ARPU) mais baixa',
          'Enterprise pode parecer "caro demais"',
          'Menos diferenciação entre planos'
        ]
      },
      {
        name: 'Distribuição Agressiva (Recomendada)',
        description: 'Essencial enxuto, valor concentrado nos planos superiores',
        pros: [
          'Forte incentivo para upgrade',
          'ARPU potencialmente maior',
          'Clara diferenciação de valor entre planos',
          'Enterprise tem valor premium justificável'
        ],
        cons: [
          'Essencial pode parecer "limitado"',
          'Maior taxa de churn no plano básico',
          'Necessita comunicação clara do valor de cada plano',
          'Concorrentes podem oferecer mais no plano básico'
        ]
      }
    ],

    recommendation: `**Recomendação: Distribuição Agressiva com Comunicação Clara**

A distribuição proposta (7→13→17 módulos) cria:
• Escada clara de valor entre os planos
• Incentivo natural para upgrade conforme negócio cresce
• Margem saudável no Essencial (custo baixo, módulos básicos)
• Premium justificável no Enterprise (WhatsApp Recovery vale R$ 200+/mês)

📈 PROJEÇÃO DE RECEITA:
Se 100 lojas distribuídas em:
• 40% Essencial = 40 × R$ 397 = R$ 15.880
• 40% Profissional = 40 × R$ 597 = R$ 23.880  
• 20% Enterprise = 20 × R$ 997 = R$ 19.940
• MRR Total = R$ 59.700/mês

📊 TICKET MÉDIO: R$ 597 (média ponderada)

💡 ESTRATÉGIA DE MIGRAÇÃO:
1. Novos assinantes seguem nova estrutura
2. Assinantes atuais mantêm módulos até renovação
3. Oferecer upgrade com desconto para assinantes antigos
4. Comunicar mudanças 30 dias antes da renovação`,

    nextSteps: [
      '□ Confirmar distribuição final dos módulos com análise de uso',
      '□ Criar migração SQL para atualizar tabela plans',
      '□ Adicionar coluna blocked_modules[] na tabela plans',
      '□ Atualizar função is_module_blocked_for_store()',
      '□ Criar modal de "Módulo Premium" com CTA de upgrade',
      '□ Atualizar página de planos com comparativo de módulos',
      '□ Atualizar landing page com nova tabela de funcionalidades',
      '□ Comunicar mudanças aos assinantes atuais',
      '□ Preparar FAQ sobre nova estrutura de planos',
      '□ Treinar equipe de vendas sobre nova argumentação'
    ]
  },
  {
    id: 17,
    title: '💰 Gestão Financeira para Lojistas',
    status: 'idea',
    priority: 'high',
    createdAt: '2025-12-18',
    description: 'Módulo completo para lojistas gerenciarem despesas, registrarem ganhos por categoria, controlarem fluxo de caixa e visualizarem relatórios financeiros.',
    
    context: `Lojistas hoje não têm visibilidade clara sobre sua saúde financeira dentro do Mostralo. Eles sabem quanto venderam (via relatórios de pedidos), mas não sabem:
• Quanto gastaram no mês
• Qual o lucro real após despesas
• Como está o fluxo de caixa ao longo do tempo
• Quais categorias de despesa consomem mais recursos

A maioria usa planilhas externas ou simplesmente não controla. Isso é uma oportunidade de agregar valor significativo ao sistema.`,

    problem: `Sem controle financeiro integrado, lojistas enfrentam:
• Dificuldade em saber se estão tendo lucro real
• Despesas esquecidas que corroem margem
• Falta de visão do fluxo de caixa mensal
• Necessidade de planilhas externas ou sistemas separados
• Decisões de negócio baseadas em "achismo"

Oportunidade:
• Aumentar valor percebido do Mostralo (não é só delivery, é gestão)
• Aumentar retenção (lojista fica dependente dos dados financeiros)
• Possível módulo premium para planos superiores`,

    marketAnalysis: {
      title: '📊 Potencial de Valor',
      items: [
        'Controle financeiro é #1 necessidade de micro/pequenos negócios',
        'Reduz necessidade de contador para gestão diária',
        'Pode aumentar retenção de lojistas (feature de alto valor agregado)',
        'Diferencial competitivo (poucos sistemas de delivery oferecem isso)',
        'Pode ser módulo premium do plano Profissional/Enterprise',
        'Potencial para integração futura com contabilidade/NFe'
      ]
    },

    technicalDetails: {
      title: '🔧 Implementação Técnica',
      items: [
        'Tabela financial_categories (id, store_id, name, type, icon, color, is_system)',
        'Tabela financial_transactions (id, store_id, category_id, type, amount, description, transaction_date, payment_method, is_recurring, recurrence_type, order_id, attachment_url)',
        'RLS: lojistas só veem/editam dados da própria loja',
        'Trigger: criar categorias padrão ao criar loja',
        'Hooks: useFinancialTransactions, useFinancialCategories, useFinancialSummary',
        'Componentes: FinancialKPICards, FinancialChart, TransactionForm, CategoriesManager',
        'Página com tabs: Dashboard, Transações, Categorias, Relatórios',
        'Integração opcional: trigger ao completar pedido → criar transação automática'
      ]
    },

    phases: [
      {
        name: 'Fase 1 - MVP Básico',
        description: 'Funcionalidades essenciais de registro e visualização',
        items: [
          'Criar tabelas no banco (categories + transactions)',
          'CRUD de categorias personalizadas',
          'Registro manual de receitas e despesas',
          'Dashboard com saldo, receitas e despesas do mês',
          'Lista de transações com filtros básicos',
          'Gráfico de fluxo de caixa mensal (Recharts)'
        ]
      },
      {
        name: 'Fase 2 - Funcionalidades Avançadas',
        description: 'Automações e relatórios mais completos',
        items: [
          'Despesas recorrentes com frequência configurável (mensal, semanal, etc)',
          'Integração automática com vendas (trigger no pedido completo)',
          'Relatório de despesas por categoria (gráfico pizza)',
          'Comparativo mês a mês com variação percentual',
          'Exportação para Excel/PDF'
        ]
      },
      {
        name: 'Fase 3 - Recursos Premium',
        description: 'Funcionalidades diferenciadas para planos superiores',
        items: [
          'Metas financeiras com acompanhamento visual',
          'Alertas de despesas acima do normal',
          'Upload de comprovantes/notas fiscais (Storage)',
          'Previsão de fluxo de caixa com base em histórico',
          'Relatório de lucro/prejuízo detalhado (DRE simplificado)'
        ]
      }
    ],

    options: [
      {
        name: 'Apenas Registro Manual',
        description: 'Lojista registra todas as transações manualmente',
        pros: [
          'Implementação mais simples e rápida',
          'Controle total do lojista sobre o que registra',
          'Sem dependência de integrações complexas',
          'Menor risco de dados duplicados'
        ],
        cons: [
          'Mais trabalho manual para o lojista',
          'Possibilidade de esquecer registros',
          'Não captura vendas automaticamente',
          'Dados podem ficar incompletos'
        ]
      },
      {
        name: 'Integrado com Vendas',
        description: 'Vendas concluídas geram entrada automática de receita',
        pros: [
          'Menos trabalho manual para o lojista',
          'Dados de receita sempre precisos e atualizados',
          'Visão real do faturamento sem esforço',
          'Link direto entre pedido e receita'
        ],
        cons: [
          'Implementação mais complexa (trigger no banco)',
          'Pode gerar muitas transações (alto volume de pedidos)',
          'Lojista pode confundir vendas não pagas com receita',
          'Necessita lógica para evitar duplicação'
        ]
      }
    ],

    recommendation: `**Recomendação: Abordagem Progressiva**

1. **COMEÇAR com MVP Básico** (Fase 1)
   → Registro manual simples + dashboard de resumo
   → Categorias padrão já criadas para facilitar uso
   → Valida se lojistas realmente usam a feature
   → Tempo estimado: 2-3 dias de desenvolvimento

2. **ADICIONAR Integração com Vendas** (Fase 2)
   → Após validar uso, automatizar entrada de receitas
   → Adicionar despesas recorrentes (aluguel, energia, etc)
   → Implementar relatórios mais completos
   → Tempo estimado: 1-2 semanas

3. **PREMIUM Features** (Fase 3)
   → Metas, alertas e previsões como diferencial
   → Upload de comprovantes para compliance
   → Pode justificar plano Enterprise

📊 CATEGORIAS PADRÃO SUGERIDAS:

ENTRADAS:
• Vendas (automático se integrado)
• Gorjetas
• Outras receitas

SAÍDAS:
• Aluguel
• Energia elétrica
• Água
• Internet/Telefone
• Insumos/Mercadorias
• Salários
• Embalagens
• Combustível
• Marketing
• Manutenção
• Taxas bancárias
• Impostos
• Outras despesas`,

    nextSteps: [
      '□ Criar migração SQL para financial_categories e financial_transactions',
      '□ Configurar RLS policies para isolamento por loja',
      '□ Criar trigger para seed de categorias padrão',
      '□ Implementar hook useFinancialCategories',
      '□ Implementar hook useFinancialTransactions',
      '□ Implementar hook useFinancialSummary',
      '□ Criar componente FinancialKPICards',
      '□ Criar componente FinancialChart (fluxo de caixa)',
      '□ Criar componente TransactionsList',
      '□ Criar componente TransactionForm (modal)',
      '□ Criar componente CategoriesManager',
      '□ Criar página FinancialManagementPage com tabs',
      '□ Adicionar item no menu lateral (Gestão Financeira)',
      '□ Adicionar módulo financial_management na tabela modules',
      '□ Testar fluxo completo em ambiente de desenvolvimento',
      '□ (Fase 2) Criar trigger para transação automática em pedido concluído',
      '□ (Fase 2) Implementar despesas recorrentes',
      '□ (Fase 3) Adicionar metas financeiras',
      '□ (Fase 3) Implementar upload de comprovantes'
    ]
  },
  {
    id: 18,
    title: '⚡ Otimização de Performance - Painéis Atendente e Entregador',
    status: 'idea',
    priority: 'high',
    createdAt: '2025-12-19',
    description: 'Implementar lazy loading e layouts dedicados para reduzir drasticamente o tempo de carregamento dos painéis de Atendente e Entregador.',
    
    context: `Análise realizada mostra que atualmente o App.tsx importa estaticamente 149+ páginas, fazendo com que todos os usuários carreguem o bundle completo (~2-3MB) mesmo que acessem apenas algumas páginas.

Situação atual:
• Atendente: usa AdminLayout completo com hooks pesados desnecessários
• Entregador: DeliveryDriverLayout mais leve, mas sem lazy loading
• Sem code splitting por área de usuário
• Todos os chunks são carregados independente do perfil`,

    problem: `Problemas identificados:
• Atendente carrega AdminSidebar com useStoreModules, useImpersonation, verificação de assinatura
• Atendente só precisa de 9 páginas, mas carrega 149+
• Entregador só precisa de 6 páginas, mas também carrega tudo
• Tempo de carregamento ~3-5 segundos mesmo em conexões rápidas
• Experiência ruim em dispositivos móveis dos entregadores
• Consumo desnecessário de dados móveis`,

    marketAnalysis: {
      title: '📊 Impacto Esperado',
      items: [
        'Bundle inicial: de ~2-3MB para ~800KB (redução de ~70%)',
        'Tempo de load (Atendente): de ~3-5s para ~1-2s',
        'Tempo de load (Entregador): de ~3-5s para ~1-2s',
        'Chunks carregados (Atendente): de tudo para ~150KB',
        'Chunks carregados (Entregador): de tudo para ~120KB',
        'Redução de consumo de dados móveis em até 70%',
        'Melhor experiência em redes 3G/4G lentas'
      ]
    },

    technicalDetails: {
      title: '🔧 Implementação Técnica',
      items: [
        'React.lazy() e Suspense para todas as rotas de atendente e entregador',
        'Criar AttendantLayout.tsx simplificado (sem useStoreModules, useImpersonation)',
        'Criar AttendantSidebar.tsx com menu estático fixo (9 itens)',
        'Otimizar DeliveryDriverLayout removendo hooks desnecessários',
        'Configurar manualChunks no vite.config.ts para chunks separados',
        'Criar PageLoader.tsx para fallback de Suspense',
        'Separar chunks: admin-extra, salesperson, delivery'
      ]
    },

    phases: [
      {
        name: 'Fase 1 - Lazy Loading (Impacto Imediato)',
        description: 'Ganho rápido sem quebrar estrutura existente',
        items: [
          'Criar grupos de lazy import por tipo de usuário',
          'Envolver rotas de atendente com Suspense',
          'Envolver rotas de entregador com Suspense',
          'Criar componente PageLoader.tsx',
          'Testar carregamento sob demanda'
        ]
      },
      {
        name: 'Fase 2 - AttendantLayout Simplificado',
        description: 'Layout dedicado para atendentes sem hooks pesados',
        items: [
          'Criar src/components/attendant/AttendantLayout.tsx',
          'Criar src/components/attendant/AttendantSidebar.tsx',
          'Remover useStoreModules do contexto do atendente',
          'Remover useImpersonation (não aplicável a atendentes)',
          'Remover verificação de assinatura (responsabilidade do lojista)',
          'Menu fixo com os 9 itens permitidos'
        ]
      },
      {
        name: 'Fase 3 - Otimização do DeliveryDriverLayout',
        description: 'Refinamento do layout de entregadores',
        items: [
          'Lazy load do InvitationsDialog',
          'Mover lógica de presença para hook específico',
          'Remover imports desnecessários',
          'Otimizar re-renders com useMemo/useCallback'
        ]
      },
      {
        name: 'Fase 4 - Chunks Separados no Vite',
        description: 'Code splitting otimizado por área',
        items: [
          'Configurar manualChunks para admin-extra',
          'Configurar manualChunks para salesperson/atendente',
          'Configurar manualChunks para delivery',
          'Testar build e verificar tamanhos de chunks',
          'Validar que lazy loading funciona corretamente'
        ]
      },
      {
        name: 'Fase 5 - Migração de Rotas',
        description: 'Migrar rotas para novos layouts',
        items: [
          'Atualizar rotas de atendente para usar AttendantLayout',
          'Testar fluxo completo do atendente',
          'Testar fluxo completo do entregador',
          'Validar em dispositivos móveis reais',
          'Medir métricas antes/depois no diagnóstico'
        ]
      }
    ],

    riskAnalysis: {
      title: '⚠️ Análise de Riscos',
      sections: [
        {
          level: 'low',
          title: '🟢 Risco BAIXO (Fácil de implementar)',
          items: [
            'Lazy Loading: Mudança aditiva, não quebra funcionalidades',
            'PageLoader.tsx: Componente novo, sem impacto em código existente',
            'Vite Chunks: Afeta apenas build de produção, não muda comportamento'
          ]
        },
        {
          level: 'medium',
          title: '🟡 Risco MÉDIO (Requer cuidado)',
          items: [
            'AttendantLayout: AdminLayout atual tem NewOrdersProvider, useAuth, redirects, GlobalNewOrderAlert que DEVEM ser preservados',
            'AdminSidebar: Carrega useStoreModules (remover) mas PRECISA de useStoreAccess para validação de acesso à loja',
            'Migração de Rotas: Risco de esquecer rotas ou validação incorreta expor páginas indevidas'
          ]
        }
      ]
    },

    safetyChecklist: {
      title: '✅ Checklist de Segurança para AttendantLayout',
      keep: [
        'NewOrdersProvider (alerta de novos pedidos)',
        'useAuth (autenticação)',
        'useStoreAccess (validação de acesso à loja)',
        'GlobalNewOrderAlert (notificação de pedidos)',
        'Sidebar mobile toggle',
        'useLocation para rotas ativas'
      ],
      remove: [
        'useStoreModules (módulos dinâmicos)',
        'useImpersonation (não aplicável)',
        'ImpersonationBanner (não aplicável)',
        'Verificação de assinatura (responsabilidade do lojista)',
        'Título dinâmico da página'
      ],
      attendantPages: [
        '/dashboard/orders',
        '/dashboard/customers',
        '/dashboard/reports',
        '/dashboard/promotions',
        '/dashboard/products',
        '/dashboard/categories',
        '/dashboard/addons',
        '/dashboard/addon-categories',
        '/dashboard/profile'
      ]
    },

    recommendation: `**Recomendação: Implementação Incremental (Risco Mínimo)**

🎯 ESTRATÉGIA DE MITIGAÇÃO:

**Etapa 1 - Lazy Loading Puro (Testar 2-3 dias em produção)**
• Apenas adiciona React.lazy() e Suspense
• Zero mudança em layouts existentes
• Fácil rollback se necessário
• Já entrega ~50% do ganho de performance

**Etapa 2 - Criar AttendantLayout (Manter AdminLayout como backup)**
• Criar novo layout SEM remover o antigo
• Feature flag para escolher qual usar
• Testar com atendente real antes de migrar todos

**Etapa 3 - Migrar rotas gradualmente**
• Migrar 1-2 rotas por vez
• Validar cada migração antes de prosseguir
• Manter AdminLayout funcional até 100% migrado

**Etapa 4 - Remover código redundante**
• Só após validação completa
• Documentar mudanças para manutenção futura

📋 PONTOS SEM RISCO (Já estão OK):
• DeliveryDriverLayout já é separado
• ProtectedRoute é independente
• useAuth é centralizado e robusto`,

    nextSteps: [
      '□ [FASE 1] Criar PageLoader.tsx',
      '□ [FASE 1] Implementar lazy loading nas rotas de atendente',
      '□ [FASE 1] Implementar lazy loading nas rotas de entregador',
      '□ [FASE 1] Testar lazy loading por 2-3 dias em produção',
      '□ [FASE 2] Criar AttendantLayout.tsx preservando funcionalidades críticas',
      '□ [FASE 2] Criar AttendantSidebar.tsx com menu fixo (9 páginas)',
      '□ [FASE 2] Implementar feature flag para escolher layout',
      '□ [FASE 2] Testar com atendente real',
      '□ [FASE 3] Migrar rotas de atendente gradualmente',
      '□ [FASE 3] Validar cada rota antes de prosseguir',
      '□ [FASE 4] Otimizar DeliveryDriverLayout',
      '□ [FASE 4] Configurar manualChunks no vite.config.ts',
      '□ [FASE 4] Testar em dispositivos móveis reais',
      '□ [FASE 4] Medir métricas antes/depois no diagnóstico',
      '□ [FASE 5] Remover AdminLayout das rotas de atendente (após validação)',
      '□ [FASE 5] Documentar arquitetura de chunks'
    ]
  },
  {
    id: 19,
    title: '📍 Rastreamento em Tempo Real do Entregador',
    status: 'idea',
    priority: 'high',
    createdAt: '2025-12-20',
    description: 'Implementar rastreamento GPS em tempo real do entregador usando Mapbox, permitindo que clientes vejam a localização exata do entregador no mapa durante a entrega.',
    
    context: `O sistema já possui integração com Mapbox funcional:
• Edge Function get-mapbox-token para token público
• Mapbox GL JS instalado e configurado
• Usado atualmente para geolocalização de clientes e áreas de entrega
• Supabase Realtime já implementado para presença de entregadores (useDriverPresence)

Infraestrutura existente que pode ser aproveitada:
• Tabela orders com assigned_driver_id
• Sistema de status de pedidos (saiu_para_entrega)
• Hook useDriverPresence com channel global
• Componente OrderTracking.tsx para clientes`,

    problem: `Clientes não sabem onde o entregador está após o pedido sair para entrega:
• Não há visibilidade do progresso da entrega
• Aumenta ansiedade e ligações perguntando "cadê meu pedido?"
• Concorrentes (iFood, Rappi) oferecem rastreamento em tempo real
• Entregadores não têm como informar localização sem ligar

Benefícios do rastreamento:
• Reduz ligações de "onde está meu pedido" em até 70%
• Aumenta confiança e satisfação do cliente
• Diferencial competitivo vs delivery manual
• Lojista pode acompanhar todos os entregadores ativos`,

    technicalDetails: {
      title: '🔧 Arquitetura Técnica',
      items: [
        'Tabela driver_locations: id, driver_id, latitude, longitude, heading, accuracy, speed, updated_at',
        'REPLICA IDENTITY FULL para Realtime na tabela driver_locations',
        'RLS: Entregador atualiza própria localização, cliente lê localização do entregador do SEU pedido',
        'Hook useDriverLocationTracking: navigator.geolocation.watchPosition() no app do entregador',
        'Hook useDriverLiveLocation: Supabase Realtime subscription filtrado por driver_id do pedido',
        'Componente DriverLiveMap: Mapa Mapbox com marcador do entregador atualizado em tempo real',
        'Frequência de updates: a cada 10 segundos (balanceio bateria vs precisão)',
        'Ativar tracking apenas quando status = saiu_para_entrega'
      ]
    },

    phases: [
      {
        name: 'Fase 1 - Infraestrutura de Banco de Dados',
        description: 'Criar tabela e políticas para armazenar localização dos entregadores',
        items: [
          'Criar tabela driver_locations com campos de geolocalização',
          'Habilitar Realtime na tabela (REPLICA IDENTITY FULL)',
          'Criar política RLS para entregador atualizar própria localização',
          'Criar política RLS para cliente ler localização do entregador do seu pedido',
          'Criar política RLS para lojista ver entregadores da sua loja',
          'Criar índice em driver_id para queries rápidas'
        ]
      },
      {
        name: 'Fase 2 - Tracking no App do Entregador',
        description: 'Implementar captura e envio de localização GPS do entregador',
        items: [
          'Criar hook useDriverLocationTracking.ts',
          'Usar navigator.geolocation.watchPosition() para tracking contínuo',
          'Enviar updates para Supabase a cada 10 segundos',
          'Ativar apenas quando entregador tem pedido em saiu_para_entrega',
          'Criar componente LocationPermissionBanner para solicitar permissão',
          'Adicionar indicador de GPS ativo no header do painel',
          'Implementar fallback para última localização conhecida'
        ]
      },
      {
        name: 'Fase 3 - Mapa ao Vivo para o Cliente',
        description: 'Exibir posição do entregador em tempo real na página de tracking',
        items: [
          'Criar hook useDriverLiveLocation.ts com subscription Realtime',
          'Criar componente DriverLiveMap.tsx com Mapbox GL JS',
          'Marcador fixo: destino (endereço do cliente)',
          'Marcador móvel: entregador (atualizado em tempo real)',
          'Integrar mapa na página OrderTracking.tsx',
          'Exibir mapa apenas quando status = saiu_para_entrega',
          'Mostrar distância aproximada até a entrega'
        ]
      },
      {
        name: 'Fase 4 - Visualização para Lojista (Opcional)',
        description: 'Mapa com todos os entregadores ativos da loja',
        items: [
          'Criar componente DriversMapOverview.tsx',
          'Mostrar posição de todos os entregadores ativos',
          'Indicar qual pedido cada entregador está transportando',
          'Útil para gestão de entregas e redistribuição'
        ]
      }
    ],

    riskAnalysis: {
      title: '⚠️ Análise de Riscos',
      sections: [
        {
          level: 'low',
          title: '🟢 Risco BAIXO',
          items: [
            'Tabela driver_locations: Nova tabela, sem impacto em código existente',
            'Componente DriverLiveMap: Novo, usado apenas em OrderTracking',
            'Mapbox já configurado: Apenas adiciona marcadores no mapa existente'
          ]
        },
        {
          level: 'medium',
          title: '🟡 Risco MÉDIO',
          items: [
            'Consumo de bateria do entregador: watchPosition pode drenar bateria rapidamente',
            'Permissão de localização: Usuário pode negar, precisa de fallback',
            'Privacidade: Entregador pode não querer ser rastreado, considerar toggle',
            'Performance Realtime: Muitos entregadores = muitos updates, monitorar'
          ]
        }
      ]
    },

    recommendation: `**Recomendação: Implementação em 3 Fases Incrementais**

🎯 ESTRATÉGIA:

**Etapa 1 - MVP Simples (1 semana)**
• Tabela driver_locations + políticas RLS
• Hook básico de tracking no entregador
• Mapa simples no OrderTracking apenas com marcador do entregador
• Sem rota traçada, sem distância (adicionar depois)

**Etapa 2 - Refinamentos (1 semana)**
• Indicador de GPS ativo no painel do entregador
• Banner de permissão de localização
• Distância aproximada até a entrega
• Toggle para entregador pausar tracking

**Etapa 3 - Features Avançadas (opcional)**
• Rota traçada entre entregador e destino
• Mapa de todos entregadores para lojista
• Histórico de rotas para análise

📋 CONSIDERAÇÕES:
• Frequência de 10s é suficiente (não precisa de updates a cada segundo)
• Parar tracking automaticamente ao entregar ou fechar app
• Considerar economia de bateria com precisão média
• Fallback se GPS falhar: manter última posição conhecida`,

    nextSteps: [
      '□ [FASE 1] Criar migração SQL para tabela driver_locations',
      '□ [FASE 1] Habilitar Realtime na tabela',
      '□ [FASE 1] Criar políticas RLS apropriadas',
      '□ [FASE 2] Criar hook useDriverLocationTracking.ts',
      '□ [FASE 2] Integrar tracking no DeliveryDriverPanel',
      '□ [FASE 2] Criar componente LocationPermissionBanner.tsx',
      '□ [FASE 3] Criar hook useDriverLiveLocation.ts',
      '□ [FASE 3] Criar componente DriverLiveMap.tsx',
      '□ [FASE 3] Integrar mapa na página OrderTracking.tsx',
      '□ [FASE 3] Testar fluxo completo com entregador real',
      '□ [FASE 4] Criar mapa de entregadores para lojista (opcional)'
    ]
  },
  {
    id: 20,
    title: '🧾 Integração Focus NFe (NFC-e)',
    status: 'analyzing',
    priority: 'high',
    createdAt: '2025-12-23',
    description: 'Integrar com API Focus NFe para permitir que lojistas emitam NFC-e (Nota Fiscal de Consumidor Eletrônica) diretamente pelo sistema Mostralo.',
    
    context: `Cliente real de Brasília/DF solicitou emissão de NFC-e para venda de marmitas.

Pesquisa realizada sobre APIs de NF-e disponíveis no Brasil:
• Focus NFe - Plano Growth (R$ 548/mês) com CNPJs ilimitados + R$ 0.05-0.06/nota
• Enotas - Programa de parceria para plataformas
• NFE.io - White-label para Software Houses
• Plug Notas - API simples e intuitiva

Decisão: Focus NFe escolhido pelos seguintes motivos:
• Precificação clara e previsível
• CNPJs ilimitados no Plano Growth (ideal para multi-tenant)
• Custo baixo por nota emitida (R$ 0.05-0.06)
• Período de teste de 30 dias gratuito
• Documentação completa e API REST moderna
• Suporte a ambiente de homologação

Modelo de negócio: Mostralo gerencia tudo via API (multi-tenant). Cada lojista é registrado como uma empresa no Focus NFe e recebe um token único. O lojista NUNCA acessa o painel Focus NFe diretamente. Certificado digital A1 é enviado pelo cliente no painel do Focus NFe.`,

    problem: `Lojistas precisam emitir notas fiscais eletrônicas mas enfrentam dificuldades:
• Não têm sistema integrado (precisam usar sistemas externos como Nota Fácil, ContaAzul, etc)
• Processo manual é trabalhoso e sujeito a erros de digitação
• Difícil rastrear quais pedidos têm nota fiscal emitida
• Sem integração, dados do pedido precisam ser digitados novamente no outro sistema
• Perdem vendas para concorrentes que oferecem nota fiscal automaticamente

Benefícios da integração Focus NFe:
• Emissão automática ou com 1 clique no pedido
• Dados do pedido (itens, valores, cliente) preenchidos automaticamente
• Histórico de notas fiscais vinculado aos pedidos
• PDF/XML gerados automaticamente e armazenados
• Novo diferencial competitivo para Mostralo vs iFood/99Food
• Possibilidade de monetização (cobrar por nota ou incluir em planos premium)`,

    technicalDetails: {
      title: '🔧 Arquitetura Técnica Proposta',
      items: [
        '📦 BANCO DE DADOS (3 novas tabelas):',
        '• store_fiscal_config: CNPJ, Razão Social, IE, endereço, regime tributário, tokens Focus NFe, CSC, série NFC-e',
        '• fiscal_notes: tipo, série, número, chave acesso, status, XML/PDF URLs, dados do Focus NFe',
        '• product_fiscal_data: NCM, CEST, CFOP, origem, CSOSN/CST, alíquotas',
        '',
        '🔐 SECRETS:',
        '• FOCUSNFE_API_TOKEN: Token master da conta Mostralo no Focus NFe (Plano Growth)',
        '',
        '⚡ EDGE FUNCTIONS (4 funções):',
        '• focusnfe-register-company: Registrar empresa e obter token único',
        '• focusnfe-issue-nfce: Emitir NFC-e para um pedido',
        '• focusnfe-get-nfce-status: Consultar status de uma nota',
        '• focusnfe-cancel-nfce: Cancelar NFC-e autorizada',
        '',
        '🖥️ FRONTEND (4 telas):',
        '• FiscalConfigPage: Configuração fiscal da loja (CNPJ, IE, CSC)',
        '• ProductFiscalDataPage: Dados fiscais dos produtos (NCM, CFOP)',
        '• FiscalNotesPage: Listagem de notas emitidas',
        '• Botão "Emitir NFC-e" na tela de detalhes do pedido'
      ]
    },

    phases: [
      {
        name: 'Fase 1 - Banco de Dados',
        description: 'Criar estrutura de dados para configuração fiscal e notas',
        items: [
          'Criar tabela store_fiscal_config (CNPJ, IE, endereço, tokens)',
          'Criar tabela fiscal_notes (notas emitidas)',
          'Criar tabela product_fiscal_data (NCM, CFOP dos produtos)',
          'Configurar RLS para cada tabela',
          'Criar triggers para updated_at automático'
        ]
      },
      {
        name: 'Fase 2 - Edge Functions',
        description: 'Implementar integração com API Focus NFe',
        items: [
          'Adicionar secret FOCUSNFE_API_TOKEN',
          'Criar focusnfe-register-company (POST /v2/empresas)',
          'Criar focusnfe-issue-nfce (POST /v2/nfce)',
          'Criar focusnfe-get-nfce-status (GET /v2/nfce/:ref)',
          'Criar focusnfe-cancel-nfce (DELETE /v2/nfce/:ref)',
          'Implementar tratamento de erros SEFAZ'
        ]
      },
      {
        name: 'Fase 3 - Frontend Configuração',
        description: 'Telas de configuração fiscal e dados de produtos',
        items: [
          'Criar FiscalConfigPage.tsx (dados empresa + CSC)',
          'Criar ProductFiscalDataPage.tsx (NCM/CFOP produtos)',
          'Adicionar rotas /admin/fiscal e /admin/fiscal/products',
          'Adicionar menu "Fiscal" no sidebar admin',
          'Criar validações de CNPJ e campos obrigatórios'
        ]
      },
      {
        name: 'Fase 4 - Emissão e Gestão de Notas',
        description: 'Emitir notas e gerenciar histórico',
        items: [
          'Criar FiscalNotesPage.tsx (listagem de notas)',
          'Adicionar botão "Emitir NFC-e" nos pedidos',
          'Implementar download de PDF/XML',
          'Implementar cancelamento de nota',
          'Criar modal de detalhes da nota',
          'Adicionar filtros (data, status, tipo)'
        ]
      }
    ],

    legalConsiderations: [
      '📜 CERTIFICADO DIGITAL A1:',
      '• Cliente precisa ter certificado digital A1 (arquivo .pfx)',
      '• Upload é feito diretamente no painel Focus NFe (NÃO armazenamos)',
      '• Mostralo apenas guarda flag indicando se certificado foi enviado',
      '• Custo do certificado: R$ 100-200/ano (cliente paga à parte)',
      '',
      '🏛️ SEFAZ E HOMOLOGAÇÃO:',
      '• Ambiente de homologação para testes (notas sem validade fiscal)',
      '• Ambiente de produção requer certificado válido',
      '• Cada estado tem suas regras específicas (SEFAZ-DF para Brasília)',
      '',
      '📋 DADOS OBRIGATÓRIOS:',
      '• CNPJ e Inscrição Estadual da empresa',
      '• NCM (código fiscal) de cada produto',
      '• CFOP (código da operação) - geralmente 5102 para venda interna',
      '• CSC (Código de Segurança do Contribuinte) para NFC-e',
      '',
      '💰 MONETIZAÇÃO SUGERIDA:',
      '• Incluir emissão de NF-e em planos premium',
      '• OU cobrar taxa por nota emitida (ex: R$ 0.15/nota)',
      '• OU criar plano específico "Plano Fiscal" (R$ XX/mês)'
    ],

    recommendation: `**Recomendação: Implementação em 4 Fases**

🎯 ESTRATÉGIA:

**Fase 1 - Infraestrutura (1-2 dias)**
• Criar tabelas SQL + RLS policies
• Adicionar secret FOCUSNFE_API_TOKEN
• Definir tipos TypeScript

**Fase 2 - Backend (2-3 dias)**
• Edge Functions para API Focus NFe
• Testar em ambiente de homologação
• Tratar erros comuns (certificado, dados inválidos)

**Fase 3 - Configuração (2-3 dias)**
• Tela de configuração fiscal
• Tela de dados fiscais de produtos
• Wizard de primeiro setup

**Fase 4 - Emissão (2-3 dias)**
• Botão de emitir no pedido
• Tela de notas emitidas
• Download/cancelamento

📋 PRÓXIMOS PASSOS IMEDIATOS:
1. Criar conta de teste no Focus NFe (30 dias grátis)
2. Enviar mensagem para Focus NFe sobre modelo multi-tenant
3. Aguardar resposta sobre registro de empresas via API
4. Iniciar Fase 1 após confirmação do Focus NFe`,

    nextSteps: [
      '□ Criar conta de teste no Focus NFe',
      '□ Enviar mensagem explicando modelo multi-tenant',
      '□ Aguardar resposta do Focus NFe sobre API de empresas',
      '□ [FASE 1] Criar migração SQL para store_fiscal_config',
      '□ [FASE 1] Criar migração SQL para fiscal_notes',
      '□ [FASE 1] Criar migração SQL para product_fiscal_data',
      '□ [FASE 1] Configurar RLS policies',
      '□ [FASE 2] Adicionar secret FOCUSNFE_API_TOKEN',
      '□ [FASE 2] Criar Edge Function focusnfe-register-company',
      '□ [FASE 2] Criar Edge Function focusnfe-issue-nfce',
      '□ [FASE 2] Criar Edge Function focusnfe-get-nfce-status',
      '□ [FASE 2] Criar Edge Function focusnfe-cancel-nfce',
      '□ [FASE 3] Criar FiscalConfigPage.tsx',
      '□ [FASE 3] Criar ProductFiscalDataPage.tsx',
      '□ [FASE 3] Adicionar rotas e menu',
      '□ [FASE 4] Criar FiscalNotesPage.tsx',
      '□ [FASE 4] Adicionar botão emitir NFC-e nos pedidos',
      '□ [FASE 4] Implementar download PDF/XML',
      '□ [FASE 4] Testar fluxo completo em homologação'
    ]
  },
  {
    id: 21,
    title: '🛠️ Módulo de Serviços para Sentinela',
    status: 'idea',
    priority: 'medium',
    createdAt: '2025-12-24',
    description: 'Criar módulo de registro de serviços para alimentar o Sentinela com dados de atendimentos, permitindo lembretes inteligentes baseados no último serviço realizado.',
    
    context: `Discussão iniciada sobre como o Sentinela poderia funcionar para negócios de serviços (ex: barbearias, salões) onde não há "compra de produto", mas sim "realização de serviço".

O Sentinela atual funciona bem para produtos (baseado em pedidos), mas para serviços precisaria de uma forma de registrar atendimentos.

O desafio é criar algo simples que não "bagunce" o sistema existente de pedidos/produtos.`,

    problem: `O modelo atual de "lembrete a cada X dias" é "burro" porque:
• Se o cliente não retorna, o sistema continua mandando lembretes sem sentido
• Não há registro de quando o serviço foi feito
• Não tem como saber se o cliente realmente voltou

O ideal seria:
• Registrar quando o serviço foi realizado
• Sentinela calcular próximo lembrete baseado nessa data
• Se cliente não voltar, não enviar novos lembretes (ou enviar apenas X tentativas)

Porém, um sistema completo de agendamento (calendário, horários, profissionais) seria MUITO complexo e arriscado de implementar.`,

    options: [
      {
        name: 'Versão Simples (Recomendada)',
        description: 'Registro básico de atendimentos para alimentar Sentinela - sem agendamento',
        pros: [
          'Implementação rápida (1-2 dias)',
          'Não afeta sistema de pedidos existente',
          'Fácil de entender para lojistas',
          'Integra naturalmente com Sentinela',
          'Sem calendário/agenda (evita complexidade)',
          'Registro manual simples pelo lojista'
        ],
        cons: [
          'Não tem agendamento/calendário',
          'Lojista precisa registrar manualmente após cada atendimento',
          'Não gerencia profissionais individualmente'
        ]
      },
      {
        name: 'Versão Completa (Futuro Distante)',
        description: 'Módulo completo com tipos de serviço, profissionais e agenda',
        pros: [
          'Sistema robusto e profissional',
          'Gestão de equipe (profissionais)',
          'Relatórios por profissional',
          'Histórico detalhado do cliente',
          'Agendamento online pelo cliente'
        ],
        cons: [
          'Implementação muito complexa (semanas/meses)',
          'Alto risco de bagunçar sistema existente',
          'Agendamento é extremamente trabalhoso (calendário, horários, conflitos, disponibilidade)',
          'Configuração de agenda por profissional é complexa',
          'Quase um "sistema novo" dentro do sistema'
        ]
      }
    ],

    technicalDetails: {
      title: '🔧 Implementação Versão Simples',
      items: [
        'Criar tabela service_attendances (customer_id, store_id, service_name, price, attended_at, notes)',
        'Criar tela "Registrar Atendimento" no painel do lojista (formulário simples)',
        'Adaptar Sentinela para verificar última data de atendimento ao invés de último pedido',
        'Opcional: campo service_type para categorizar serviços básicos',
        'Fluxo: Cliente fez serviço → Lojista registra → Sentinela agenda lembrete'
      ]
    },

    recommendation: `**Recomendação: NÃO fazer a versão completa**

A versão completa com agendamento, calendário e gestão de profissionais seria praticamente um sistema novo. O risco de:
• Criar bugs no sistema existente
• Confundir lojistas com dois fluxos diferentes
• Gastar muito tempo de desenvolvimento

É muito alto comparado ao benefício.

**Se for fazer, fazer APENAS a versão simples:**
1. Validar se há demanda real de lojistas de serviços
2. Implementar registro básico de atendimentos (1-2 dias)
3. Integrar com Sentinela existente
4. Avaliar feedback antes de qualquer expansão

**Alternativa:** Talvez seja melhor focar em melhorar o Sentinela atual (pausar regras, melhorar mensagens, etc.) antes de criar novos módulos.`,

    nextSteps: [
      '□ Validar demanda: quantos lojistas são de serviços vs produtos?',
      '□ Avaliar se vale a pena investir nesse módulo',
      '□ Se sim: criar tabela service_attendances',
      '□ Se sim: criar tela de registro de atendimento',
      '□ Se sim: adaptar processamento do Sentinela',
      '□ Se sim: testar fluxo completo',
      '□ Coletar feedback antes de expandir funcionalidades'
    ]
  }
];
