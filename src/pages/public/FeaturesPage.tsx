import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Store, Menu, X, ChevronRight, Smartphone, Package, Truck, MessageCircle, 
  BarChart3, Tag, Calendar, Printer, Palette, Map, Users, Megaphone, 
  Link2, Image, AlertTriangle, Check, ArrowRight, Star, Shield, Database,
  Heart, Clock, Target, Zap, TrendingUp, Bell, MapPin, CreditCard, Copy, FileText,
  Wallet, PieChart, ArrowUpDown, Filter, RefreshCw, Monitor, QrCode, Code, Volume2,
  ShoppingCart, ClipboardList, UtensilsCrossed, PlayCircle, GraduationCap
} from 'lucide-react';
import { WhatsAppLeadButton } from '@/components/leads/WhatsAppLeadButton';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { DashboardFooter } from '@/components/admin/DashboardFooter';

const sections = [
  { id: 'porque-sair', title: 'Por Que Sair do iFood', icon: AlertTriangle },
  { id: 'cardapio', title: 'Cardápio Digital', icon: Smartphone },
  { id: 'pedidos', title: 'Central de Pedidos', icon: Package },
  { id: 'entregadores', title: 'Sistema de Entregadores', icon: Truck },
  { id: 'whatsapp', title: 'WhatsApp Marketing', icon: MessageCircle },
  { id: 'sentinela', title: '🎯 SENTINELA - Recompra', icon: RefreshCw },
  { id: 'relatorios', title: 'Relatórios', icon: BarChart3 },
  { id: 'financeiro', title: 'Gestão Financeira', icon: Wallet },
  { id: 'promocoes', title: 'Promoções e Cupons', icon: Tag },
  { id: 'agendados', title: 'Pedidos Agendados', icon: Calendar },
  { id: 'agendamento-servicos', title: '🆕 Agendamento de Serviços', icon: Calendar },
  { id: 'clube-assinaturas', title: '🆕 Clube de Assinaturas', icon: CreditCard },
  { id: 'impressao', title: 'Impressão Automática', icon: Printer },
  { id: 'pdv', title: 'PDV (Ponto de Venda)', icon: ShoppingCart },
  { id: 'comandas', title: 'Comandas Digitais', icon: ClipboardList },
  { id: 'garcom', title: 'App do Garçom', icon: Smartphone },
  { id: 'kds', title: 'KDS (Cozinha)', icon: UtensilsCrossed },
  { id: 'painel-digital', title: 'Painel Digital (TV)', icon: Monitor },
  { id: 'chamada-senhas', title: 'Chamada de Senhas', icon: Volume2 },
  { id: 'totem', title: '🆕 Totem Autoatendimento', icon: Smartphone },
  { id: 'personalizacao', title: 'Personalização', icon: Palette },
  { id: 'delivery', title: 'Delivery Inteligente', icon: Map },
  { id: 'atendentes', title: 'Gestão de Atendentes', icon: Users },
  { id: 'marketing', title: 'Marketing Digital', icon: Megaphone },
  { id: 'integracoes', title: 'Integrações', icon: Link2 },
  { id: 'banners', title: 'Banners Promocionais', icon: Image },
  { id: 'material-marketing', title: 'Material de Marketing', icon: QrCode },
  { id: 'scripts', title: 'Scripts Personalizados', icon: Code },
  { id: 'tutoriais', title: '🎓 Academia de Tutoriais', icon: PlayCircle },
];

const whatsappTexts: Record<string, string> = {
  'porque-sair': `🚨 *POR QUE SAIR DO IFOOD?*

❌ *Problemas:*
• 25% de taxa por pedido
• Clientes fiéis ao app, não a você
• Seus dados vendidos para concorrentes
• Sem controle sobre promoções

✅ *Solução Mostralo:*
• 0% de taxa por pedido
• 100% dos clientes são SEUS
• Seus dados nunca são compartilhados
• Total liberdade para criar promoções`,

  'cardapio': `📱 *CARDÁPIO DIGITAL PROFISSIONAL*

✅ Produtos Ilimitados com fotos de alta qualidade
✅ Categorias Organizadas
✅ Variações e Tamanhos (P, M, G, sabores, bordas)
✅ Adicionais/Complementos
✅ Preços Promocionais com destaque
✅ Disponibilidade controlada com um clique

📊 *Benefícios:*
• Fotos profissionais aumentam 35% das vendas
• Adicionais geram ticket médio maior
• Atualize a qualquer momento!`,

  'pedidos': `📦 *CENTRAL DE PEDIDOS EM TEMPO REAL*

✅ Recebimento instantâneo sem atrasos
✅ Notificações sonoras e visuais
✅ Kanban visual: Entrada → Preparo → Saída → Entregue
✅ Aceitar ou rejeitar pedidos com motivo
✅ Histórico completo de pedidos
✅ Detalhes do cliente salvos

📊 *Benefícios:*
• Nunca perde um pedido
• Controle visual de onde está cada pedido
• Dados do cliente salvos para remarketing`,

  'entregadores': `🛵 *SISTEMA COMPLETO DE ENTREGADORES*

✅ Cadastro de motoboys próprios
✅ App exclusivo para entregadores (PWA)
✅ Rastreamento GPS em tempo real
✅ Pagamento fixo ou por comissão
✅ Mínimo garantido para o motoboy

📊 *Benefícios:*
• Não depende de entregador terceirizado
• Cliente acompanha entrega em tempo real
• Sem taxas de apps de entrega`,

  'whatsapp': `💬 *WHATSAPP MARKETING - EXCLUSIVO!*

⚠️ *Problema:* 68% dos clientes nunca mais voltam após primeira compra

✅ Conexão via QR Code do seu WhatsApp
✅ Sincronização automática de contatos
✅ Etiquetas coloridas (VIP, Novo, Inativo)
✅ Recuperação automática de inativos
✅ Templates personalizados com variáveis
✅ Campanhas agendadas anti-bloqueio

📊 *Resultados:*
• 23% dos inativos voltam a comprar
• R$ 2.400/mês de aumento médio
• 98% de taxa de abertura`,

  'relatorios': `📊 *RELATÓRIOS E ANÁLISES*

✅ Dashboard em tempo real
✅ Faturamento diário, semanal, mensal
✅ Produtos mais vendidos
✅ Horários de pico
✅ Clientes top (mais compraram)
✅ Exportação de dados (CSV, Excel)

📊 *Benefícios:*
• Decisões baseadas em dados reais
• SEUS DADOS SÃO SEUS - exporte quando quiser`,

  'financeiro': `💰 *GESTÃO FINANCEIRA - NOVO!*

✅ Dashboard com KPIs de receitas e despesas
✅ Controle de entradas e saídas por categoria
✅ Gráficos de evolução mensal
✅ Categorias personalizáveis
✅ Filtros avançados
✅ Relatórios financeiros completos

📊 *Benefícios:*
• Fluxo de caixa em tempo real
• Decisões estratégicas baseadas em dados`,

  'promocoes': `🏷️ *PROMOÇÕES E CUPONS*

✅ Cupons de desconto (% ou valor fixo)
✅ Frete grátis condicional
✅ Happy Hour automático
✅ Combos e kits promocionais
✅ Descontos por categoria
✅ Pop-ups promocionais

📊 *Benefícios:*
• Total liberdade para criar promoções
• Sem pedir permissão, sem limites`,

  'agendados': `📅 *PEDIDOS AGENDADOS*

✅ Encomendas para datas futuras
✅ Calendário visual de pedidos
✅ Confirmação antecipada

📊 *Benefícios:*
• Ideal para festas e eventos
• Planeje a produção com antecedência`,

  'agendamento-servicos': `📅 *SISTEMA DE AGENDAMENTO DE SERVIÇOS* 🆕 COMPLETO!

⭐ *IDEAL PARA:* Barbearias, salões, clínicas, consultórios, estúdios

✅ *AGENDAMENTO ONLINE 24/7*
• Página pública para clientes agendarem
• Escolha de serviço, profissional, data e hora
• Validação de WhatsApp com foto do perfil
• Detecção automática de conflitos (sem double booking)

✅ *GESTÃO DE PROFISSIONAIS*
• Cadastro com foto, especialidade e descrição
• Horários de trabalho por dia da semana
• Bloqueios de agenda (férias, feriados)
• Sistema de comissões (% ou fixo)
• Preços personalizados por profissional

✅ *CONFIGURAÇÕES AVANÇADAS*
• Intervalos de 15, 30, 45 ou 60 minutos
• Limite de dias para agendar no futuro
• Antecedência mínima para agendamento
• Sistema de sinal/depósito opcional

✅ *WHATSAPP AUTOMÁTICO*
• Confirmação de agendamento
• Lembrete X horas antes do atendimento
• Pesquisa de satisfação após o serviço
• Templates personalizáveis com variáveis

✅ *CALENDÁRIO E RELATÓRIOS*
• Visualização diária, semanal e mensal
• Grade de disponibilidade por profissional
• KPIs: agendamentos, taxa de comparecimento, receita
• Ranking de profissionais e serviços populares

✅ *AVALIAÇÕES DOS CLIENTES*
• Link de avaliação pós-atendimento
• Estrelas + feedback
• Dashboard de reputação

📊 *Benefícios:*
• Cliente agenda 24/7 sem ligar
• Fim dos conflitos de horário
• Automação total do processo
• Redução de faltas com lembretes`,

  'clube-assinaturas': `💳 *CLUBE DE ASSINATURAS - FIDELIZAÇÃO PREMIUM* 🆕 EXCLUSIVO!

⭐ *IDEAL PARA:* Barbearias, salões, academias, clínicas, estúdios

⚠️ *Problema:* Cliente gosta do serviço mas não volta mensalmente

✅ *PLANOS DE ASSINATURA MENSAL*
• Crie planos como "Corte Ilimitado", "Plano VIP", "Pacote Mensal"
• Defina serviços inclusos (ex: corte + barba ilimitados)
• Configure limite de uso (ilimitado ou X vezes por mês)
• Ciclos: mensal, trimestral, semestral ou anual

✅ *GESTÃO DE ASSINANTES*
• Dashboard com todos os assinantes ativos
• Controle de período atual e vencimento
• Status: ativo, pausado, cancelado, expirado
• Histórico completo de uso por cliente

✅ *INTEGRAÇÃO COM AGENDAMENTO*
• Cliente agenda e sistema reconhece a assinatura
• Serviços inclusos aparecem como "Incluso no plano"
• Registro automático de uso
• Indicador visual de usos restantes

✅ *CONTROLE DE PAGAMENTOS*
• Registro de pagamentos manuais
• PIX automático com QR Code (usa EFI da loja)
• Histórico de pagamentos por assinante
• Renovação automática opcional

📊 *BENEFÍCIOS:*
• Receita recorrente previsível
• Cliente fidelizado por contrato
• Menos trabalho vendendo todo mês
• Valor percebido maior para o cliente`,

  'impressao': `🖨️ *IMPRESSÃO AUTOMÁTICA*

✅ Compatível com impressoras térmicas
✅ Impressão automática ao aceitar pedido
✅ Múltiplas impressoras (cozinha, caixa, bar)
✅ Integração com QZ Tray

📊 *Benefícios:*
• Pedido entra, comanda sai automaticamente
• Reduz erros e agiliza a produção`,

  'personalizacao': `🎨 *PERSONALIZAÇÃO DA LOJA*

✅ Logo e banner da sua marca
✅ Cores personalizadas
✅ Horários de funcionamento
✅ Scripts personalizados (chat, pixels)
✅ Domínio próprio (seurestaurante.com.br)
✅ Informações de contato

📊 *Benefícios:*
• Cliente acessa seu site, não o iFood
• Profissionalismo e credibilidade`,

  'delivery': `🗺️ *DELIVERY INTELIGENTE*

✅ Mapa interativo para desenhar áreas
✅ Frete por distância (cálculo automático)
✅ Múltiplas zonas com preços diferentes
✅ Tempo estimado de entrega
✅ Frete grátis configurável
✅ Verificação instantânea de cobertura

📊 *Benefícios:*
• Cliente sabe na hora se você entrega
• Taxas justas por região`,

  'atendentes': `👥 *GESTÃO DE ATENDENTES*

✅ Cadastro de funcionários
✅ Permissões limitadas por função
✅ Múltiplos atendentes simultâneos
✅ Controle de acesso (auditoria)

📊 *Benefícios:*
• Cada um vê só o que precisa
• Saiba quem fez o quê`,

  'marketing': `📣 *MARKETING DIGITAL - INCLUSO!*

✅ 1 perfil de rede social incluso
✅ Posts ilimitados agendados
✅ IA para criar legendas
✅ Análise de concorrentes
✅ Integração com Facebook e Google Ads
✅ Relatórios de performance

📊 *Economia:*
• Valor de mercado: R$ 800-2.000/mês
• INCLUSO no seu plano Mostralo!`,

  'integracoes': `🔗 *INTEGRAÇÕES EXTERNAS*

✅ Menus customizados (iframes)
✅ APIs para agentes de IA
✅ Feeds para Google Shopping
✅ Feeds para Instagram/Meta Shopping

📊 *Benefícios:*
• Conecte suas ferramentas favoritas
• Automação e escalabilidade`,

  'banners': `🖼️ *BANNERS PROMOCIONAIS*

✅ Banners rotativos na entrada da loja
✅ Destaques de ofertas
✅ Links diretos para produtos/categorias

📊 *Benefícios:*
• Chame atenção para suas promoções
• Aumente a conversão de visitantes`,

  'sentinela': `🎯 *SENTINELA - RECOMPRA INTELIGENTE* 🔥 EXCLUSIVO!

⚠️ *Problema:* Produto acabou? Cliente esquece de pedir de novo

✅ Sistema inteligente de lembretes automáticos
✅ Ciclo de recompra por produto (30, 60, 90 dias)
✅ WhatsApp automático quando o produto "acaba"
✅ Mensagens personalizadas com nome do cliente
✅ Disparo por lotes para não bloquear WhatsApp
✅ Dashboard de conversões

📊 *Resultados:*
• 23% de aumento em vendas recorrentes
• Cliente lembra de você no momento certo
• Funciona 100% automático`,

  'painel-digital': `📺 *PAINEL DIGITAL (DIGITAL SIGNAGE)* ⭐ PROFISSIONAL

✅ TVs e totens com cardápio digital animado
✅ Slides rotativos com promoções
✅ Suporte a vídeos promocionais
✅ Orientação vertical ou horizontal
✅ Tempo de exibição configurável
✅ Atualização em tempo real

📊 *Benefícios:*
• Visual profissional de grandes redes
• Promoções chamam atenção automaticamente
• Sem custo de impressão de banners`,

  'chamada-senhas': `🔔 *CHAMADA DE SENHAS* 📢 NOVO!

🎙️ *3 OPÇÕES DE ÁUDIO:*
• Bipe simples - Toque sonoro discreto
• Voz do Navegador - Text-to-speech gratuito
• 🔥 *VOZ IA ELEVENLABS* - Ultra-realista como locutor!

✅ Texto Personalizado: "Senha 42, retire no balcão 2!"
✅ Painel de senhas para exibir na TV
✅ WhatsApp automático quando pedido fica pronto
✅ Histórico de todas as chamadas
✅ Modo fila inteligente

🎯 *Ideal para:*
• Fast-food e lanchonetes
• Padarias e confeitarias
• Pizzarias e restaurantes com retirada`,

  'material-marketing': `📱 *MATERIAL DE MARKETING - QR CODES*

✅ QR Codes personalizados para cardápio
✅ Cartões de mesa com link direto
✅ Adesivos para delivery
✅ Arte pronta para impressão
✅ Materiais para redes sociais

📊 *Benefícios:*
• Profissionalismo sem contratar designer
• QR Code leva direto pro cardápio
• Materiais padronizados da sua marca`,

'scripts': `⚙️ *SCRIPTS PERSONALIZADOS* 🔧 AVANÇADO

✅ Integração com chatbots externos
✅ Pixels de rastreamento (Facebook, Google)
✅ Scripts de conversão
✅ Códigos de remarketing
✅ Botões flutuantes personalizados

📊 *Para quem precisa:*
• Agências de marketing configurando clientes
• Lojas com estratégias avançadas de ads
• Integrações personalizadas`,

  'totem': `📱 *TOTEM AUTOATENDIMENTO* 🆕 NOVO!

⚠️ *Problema:* Filas, erros de anotação, custos com atendentes

✅ Cliente faz pedido sozinho no tablet/totem
✅ Tela de boas-vindas personalizada com logo
✅ Identificação opcional (telefone, nome, CPF)
✅ Cardápio visual com fotos e adicionais
✅ Pagamento PIX com QR Code automático
✅ Senha de retirada integrada com chamada
✅ Funciona 24h sem supervisão
✅ Relatórios unificados com outros canais

📊 *Benefícios:*
• Reduz filas e tempo de espera
• Economiza com atendentes
• Zero erros de anotação
• Visual moderno de grandes redes
• Ideal para fast-food, padarias, lanchonetes`,

  'tutoriais': `🎓 *ACADEMIA DE TUTORIAIS - CAPACITAÇÃO PREMIUM*

✅ Biblioteca de vídeos organizados por módulos
✅ Interface estilo Netflix - moderna e intuitiva
✅ Aprenda no seu ritmo, quando quiser
✅ Novos conteúdos adicionados constantemente
✅ Sistema de favoritos para acesso rápido
✅ Notificações quando novos tutoriais são lançados
✅ Pesquisa e filtros por categoria

📊 *Benefícios:*
• Onboarding acelerado - domine o sistema em dias
• Suporte 24/7 em formato de vídeo
• Atualizações explicadas em tutoriais dedicados
• Acesso ilimitado a todo o conteúdo
• Acompanhamento de progresso`,

  'pdv': `🛒 *PDV - PONTO DE VENDA* ⭐ PRESENCIAL

✅ Vendas rápidas no balcão
✅ Tela touch otimizada
✅ Busca rápida de produtos
✅ Múltiplas formas de pagamento
✅ PIX, Cartão, Dinheiro, Fiado
✅ Integrado com comandas e cozinha

📊 *Benefícios:*
• Atendimento em segundos
• Sem filas no caixa
• Relatórios unificados (delivery + balcão)`,

  'comandas': `📋 *COMANDAS DIGITAIS* 📱 MESAS

✅ Abertura de mesa em 2 toques
✅ Status em tempo real por mesa
✅ Divisão de conta automática
✅ Histórico completo da mesa
✅ Transferência entre mesas
✅ Fechamento parcial ou total

📊 *Benefícios:*
• Controle visual de todas as mesas
• Sem papel, sem perda de pedidos
• Cliente acompanha consumo pelo celular`,

  'garcom': `👨‍🍳 *APP DO GARÇOM* 📲 EXCLUSIVO

✅ Celular vira terminal de pedidos
✅ Fotos dos produtos para não errar
✅ Modal de confirmação antes de enviar
✅ Funciona offline (PWA)
✅ Envia direto para cozinha
✅ Sem investir em equipamento caro

📊 *Benefícios:*
• Zero erros de anotação
• Atendimento mais rápido
• Garçom não precisa ir até a cozinha`,

  'kds': `🍳 *KDS - KITCHEN DISPLAY SYSTEM* 🔥 NOVO!

⚠️ *Problema:* Cozinha depende de gritos, papéis e confusão

✅ Tela com pedidos em tempo real
✅ Cores por tempo de espera:
   🟢 Verde: menos de 5 minutos
   🟡 Amarelo: 5-10 minutos
   🔴 Vermelho: mais de 10 minutos
✅ Alertas sonoros para novos pedidos
✅ Marcar itens como "preparando" ou "pronto"
✅ Estatísticas de pendentes/em preparo/prontos
✅ Sincronizado com garçom e PDV

📊 *Benefícios:*
• Fim da bagunça de papéis
• Cozinheiro sabe a prioridade
• Garçom vê quando pedido fica pronto
• Funciona em TV, tablet ou monitor`,
};

export default function FeaturesPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyPageText = async () => {
    const pageText = `# GUIA COMPLETO DO MOSTRALO - TODAS AS FUNCIONALIDADES

## POR QUE SAIR DO IFOOD?

### O Problema do iFood:
- 25% de taxa por pedido = Você trabalha para eles crescerem
- Clientes fiéis ao app, não a você - Se você sair, os clientes ficam lá
- Seus dados vendidos para concorrentes - O marketplace promove seu concorrente
- Você não tem controle - Não pode fazer promoções do seu jeito

### A Solução Mostralo:
✅ 0% de taxa por pedido - Pague apenas mensalidade fixa
✅ 100% dos clientes são seus - Você constrói sua própria base
✅ Seus dados nunca são compartilhados - Exporte quando quiser
✅ Total liberdade para criar promoções - Faça do seu jeito

## CARDÁPIO DIGITAL PROFISSIONAL
- Produtos Ilimitados com fotos de alta qualidade
- Categorias Organizadas (Pizzas, Bebidas, Sobremesas)
- Variações e Tamanhos (P, M, G, sabores, bordas)
- Adicionais/Complementos (bacon extra, queijo, molho)
- Preços Promocionais com destaque
- Disponibilidade controlada com um clique

## CENTRAL DE PEDIDOS EM TEMPO REAL
- Recebimento instantâneo sem atrasos
- Notificações sonoras e visuais
- Kanban visual: Entrada → Preparo → Saída → Entregue
- Aceitar ou rejeitar pedidos com motivo
- Atribuição de entregadores
- Histórico completo de pedidos

## SISTEMA DE ENTREGADORES
- Cadastro de entregadores próprios
- Rastreamento GPS em tempo real
- Configuração de taxas por distância/bairro
- App exclusivo para entregadores
- Histórico de entregas e pagamentos

## WHATSAPP MARKETING
Problema: 68% dos clientes nunca mais voltam após primeira compra
Solução Mostralo:
- 23% dos clientes inativos recuperados automaticamente
- R$ 2.400/mês de aumento médio em vendas
- 98% de taxa de abertura de mensagens
- 8 horas/mês economizadas em trabalho manual

Funcionalidades:
- Campanhas automáticas de recuperação
- Mensagens personalizadas por nome
- Segmentação por comportamento de compra
- Integração direta com WhatsApp Business

## RELATÓRIOS E ANÁLISES
- Vendas por período (diário, semanal, mensal)
- Produtos mais vendidos
- Ticket médio e crescimento
- Horários de pico
- Clientes fiéis x novos
- Exportação de dados (CSV, Excel)

## GESTÃO FINANCEIRA (NOVO!)
- Dashboard com KPIs de receitas, despesas e saldo
- Controle de entradas e saídas por categoria
- Gráficos de evolução mensal do fluxo de caixa
- Categorias personalizáveis (receita/despesa)
- Filtros por tipo, categoria e busca
- Relatórios financeiros completos

## PROMOÇÕES E CUPONS
- Cupons de desconto personalizados
- Promoções por categoria ou produto
- Happy Hour automático
- Frete grátis condicional
- Combos e kits promocionais
- Limite de uso por cliente

## PEDIDOS AGENDADOS
- Cliente escolhe data e hora de entrega
- Alertas automáticos antes do preparo
- Calendário visual de pedidos
- Controle de capacidade por horário

## SISTEMA DE AGENDAMENTO DE SERVIÇOS (NOVO!)
⭐ IDEAL PARA: Barbearias, Salões de Beleza, Clínicas, Consultórios, Estúdios

### Agendamento Online 24/7
- Página pública para clientes agendarem a qualquer hora
- Escolha de serviço, profissional, data e horário
- Validação de WhatsApp com foto do perfil
- Detecção automática de conflitos (sem double booking)

### Gestão de Profissionais
- Cadastro com foto, especialidade e descrição
- Horários de trabalho por dia da semana
- Bloqueios de agenda (férias, feriados)
- Sistema de comissões (% ou fixo)
- Preços personalizados por profissional

### Mensagens Automáticas WhatsApp
- Confirmação de agendamento
- Lembrete X horas antes do atendimento
- Pesquisa de satisfação após o serviço
- Templates personalizáveis com variáveis

### Calendário e Relatórios
- Visualização diária, semanal e mensal
- Grade de disponibilidade por profissional
- KPIs: agendamentos, taxa de comparecimento, receita
- Ranking de profissionais e serviços populares

### Sistema de Avaliações
- Link de avaliação pós-atendimento
- Estrelas + feedback
- Dashboard de reputação

## CLUBE DE ASSINATURAS (NOVO!) - Módulo Premium
IDEAL PARA: Barbearias, Salões, Clínicas, Academias, Estúdios

### Planos de Assinatura
- Crie planos como "Corte Ilimitado" ou "Plano VIP"
- Defina serviços inclusos de forma flexível
- Configure limites: ilimitado ou X usos por mês
- Ciclos: mensal, trimestral, semestral ou anual

### Gestão de Assinantes
- Dashboard com assinantes ativos e inativos
- Controle de período e vencimento
- Status em tempo real (ativo, pausado, cancelado)
- Histórico de uso por cliente

### Integração com Agendamento
- Sistema reconhece assinatura ao agendar
- Serviços inclusos marcados automaticamente
- Registro de uso sem ação manual
- Indicador de usos restantes no período

### Controle de Pagamentos
- Pagamentos manuais ou PIX automático
- QR Code PIX integrado (usa conta EFI da loja)
- Histórico completo de cobranças
- Renovação automática opcional

### Benefícios
- Receita recorrente e previsível
- Clientes fidelizados
- Menos esforço comercial
- Maior valor percebido

## IMPRESSÃO AUTOMÁTICA
- Integração com impressoras térmicas
- Impressão automática ao aceitar pedido
- Personalização do layout do pedido
- Múltiplas cópias (cozinha, entrega, cliente)

## PDV - PONTO DE VENDA (PRESENCIAL)
- Vendas rápidas no balcão sem comandas
- Tela touch otimizada para velocidade
- Busca rápida de produtos por nome
- Aceita PIX, Cartão, Dinheiro, Fiado
- Integrado com cozinha automaticamente
- Relatórios unificados (delivery + balcão + mesas)

## COMANDAS DIGITAIS POR MESA
- Abertura de mesa em 2 toques
- Status em tempo real (ocupada, aguardando, fechando)
- Divisão de conta automática entre clientes
- Transferência de itens entre mesas
- Histórico completo de consumo
- Fechamento parcial ou total

## APP DO GARÇOM
- Celular do garçom vira terminal de pedidos
- Fotos dos produtos para não errar nunca
- Modal de confirmação antes de enviar
- Funciona offline (tecnologia PWA)
- Pedido vai direto para cozinha
- Sem investir em equipamento caro

## KDS - KITCHEN DISPLAY SYSTEM (NOVO!)
- Tela da cozinha com pedidos em tempo real
- Cores por tempo de espera (verde → amarelo → vermelho)
- Alertas sonoros para novos pedidos
- Marcar itens como "preparando" ou "pronto"
- Estatísticas ao vivo (pendentes, preparando, prontos)
- Sincronizado com garçom, PDV e comandas
- Funciona em TV, tablet ou monitor

## TOTEM DE AUTOATENDIMENTO (NOVO!)
- Cliente faz pedido sozinho no tablet ou totem
- Tela de boas-vindas com logo e cores da loja
- Identificação opcional (telefone, nome, CPF)
- Cardápio visual com fotos e adicionais
- Pagamento PIX com QR Code automático
- Senha de retirada integrada com chamada
- Reduz filas e economiza com atendentes
- Funciona 24h sem supervisão
- Ideal para fast-food, padarias, restaurantes self-service

## PERSONALIZAÇÃO DA LOJA
- Logo e cores da sua marca
- Domínio próprio (sualoja.com.br)
- Layout customizável
- Scripts personalizados (chat, pixels)
- Horários de funcionamento

## DELIVERY INTELIGENTE
- Zonas de entrega por polígono no mapa
- Taxas diferentes por região
- Bloqueio de áreas não atendidas
- Cálculo automático de distância
- Entrega ou retirada

## GESTÃO DE ATENDENTES
- Múltiplos usuários por loja
- Permissões personalizadas
- Acesso restrito por função
- Auditoria de ações

## MARKETING DIGITAL INTEGRADO
- Gerenciamento de redes sociais
- Agendamento de posts
- Análise de desempenho
- Integração mLabs inclusa

## INTEGRAÇÕES
- APIs para sistemas externos
- Webhook para automações
- Integração com Evolution API (WhatsApp)
- Export para Google Shopping e Meta

## BANNERS PROMOCIONAIS
- Banners rotativos na loja
- Vídeos promocionais
- Links para promoções específicas
- Agendamento de exibição

## COMPARATIVO: IFOOD vs MOSTRALO

| Funcionalidade | iFood | Mostralo |
|---|---|---|
| Taxa por pedido | 25% | 0% |
| Dados do cliente | Deles | SEUS |
| Controle do cardápio | Limitado | Total |
| Marketing próprio | Proibido | Incluso |
| WhatsApp Marketing | ❌ | ✅ |
| Domínio próprio | ❌ | ✅ |
| App para entregadores | ❌ | ✅ |
| Relatórios detalhados | Básico | Completo |

## ECONOMIA MENSAL ESTIMADA

Exemplo com 300 pedidos/mês de R$ 45:
- Faturamento: R$ 13.500
- Taxa iFood (25%): R$ 3.375
- Mostralo (plano): R$ 597,90
- ECONOMIA: R$ 2.777/mês = R$ 33.324/ano

## PLANOS

### Essencial: R$ 397,90/mês
- Cardápio digital completo
- Central de pedidos
- WhatsApp Marketing básico
- Relatórios essenciais

### Profissional: R$ 597,90/mês (Mais Popular)
- Tudo do Essencial +
- Sistema de entregadores
- Promoções avançadas
- Marketing digital integrado

### Empresarial: R$ 997,90/mês
- Tudo do Profissional +
- Multi-lojas
- API completa
- Suporte prioritário

---
Conteúdo do Mostralo - Plataforma de Delivery + Marketing Digital
Site: mostralo.com.br`;

    try {
      await navigator.clipboard.writeText(pageText);
      setCopied(true);
      toast.success("Texto copiado para área de transferência!");
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      toast.error("Erro ao copiar texto");
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setSidebarOpen(false);
    }
  };

  const copyWhatsAppText = async (sectionId: string) => {
    const text = whatsappTexts[sectionId];
    if (text) {
      try {
        await navigator.clipboard.writeText(text);
        toast.success('Texto copiado!');
      } catch {
        toast.error('Erro ao copiar texto');
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                <Store className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Mostralo</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Início
              </Link>
              <Link to="/#recursos" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Recursos
              </Link>
              <Link to="/#plans" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Planos
              </Link>
              <span className="text-primary font-medium text-sm">
                Funcionalidades
              </span>
            </nav>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link to="/auth" className="hidden md:block">
                <Button variant="outline" size="sm">Entrar</Button>
              </Link>
              <Link to="/signup" className="hidden md:block">
                <Button size="sm">Começar</Button>
              </Link>
              <button
                className="md:hidden p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <nav className="md:hidden py-4 border-t border-border mt-3 space-y-3">
              <Link to="/" className="block text-muted-foreground hover:text-foreground">Início</Link>
              <Link to="/#recursos" className="block text-muted-foreground hover:text-foreground">Recursos</Link>
              <Link to="/#plans" className="block text-muted-foreground hover:text-foreground">Planos</Link>
              <span className="block text-primary font-medium">Funcionalidades</span>
              <div className="flex gap-2 pt-2">
                <Link to="/auth"><Button variant="outline" size="sm" className="flex-1">Entrar</Button></Link>
                <Link to="/signup"><Button size="sm" className="flex-1">Começar</Button></Link>
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Sidebar Toggle (Mobile) */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed bottom-4 right-4 z-50 lg:hidden bg-primary text-primary-foreground p-3 rounded-full shadow-lg"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Sidebar Navigation */}
      <aside className={`fixed top-20 left-0 h-[calc(100vh-5rem)] w-64 bg-background border-r border-border overflow-y-auto z-40 transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <nav className="p-4 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">Navegação</p>
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors text-left"
            >
              <section.icon className="h-4 w-4" />
              {section.title}
            </button>
          ))}
          <button
            onClick={() => scrollToSection('comparativo')}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary font-medium hover:bg-primary/10 rounded-lg transition-colors text-left mt-4"
          >
            <Target className="h-4 w-4" />
            Comparativo Final
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-orange-500/10 dark:from-primary/5 dark:to-orange-500/5 py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Seus dados. Seus clientes. Seu lucro.</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Guia Completo: Todas as Funcionalidades
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Descubra como sair do iFood e ter controle total do seu negócio com o Mostralo
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="gap-2">
                  Começar Agora <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/#plans">
                <Button variant="outline" size="lg">Ver Planos</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Section: Por Que Sair do iFood */}
        <section id="porque-sair" className="py-16 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">Por Que Sair do iFood?</h2>
                  <button
                    onClick={() => copyWhatsAppText('porque-sair')}
                    className="text-muted-foreground/50 hover:text-green-600 transition-colors p-1"
                    title="Copiar texto para WhatsApp"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-muted-foreground">O problema de depender de marketplaces</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card className="bg-destructive/5 border-destructive/20">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-destructive mb-4">❌ O Problema do iFood</h3>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <X className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">25% de taxa por pedido</p>
                        <p className="text-sm text-muted-foreground">Você trabalha para eles crescerem, não você</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <X className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">Clientes fiéis ao app, não a você</p>
                        <p className="text-sm text-muted-foreground">Se você sair do iFood, os clientes ficam lá</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <X className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">Seus dados vendidos para concorrentes</p>
                        <p className="text-sm text-muted-foreground">O marketplace promove seu concorrente na sua cara</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <X className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">Você não tem controle</p>
                        <p className="text-sm text-muted-foreground">Não pode fazer promoções do seu jeito</p>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-green-500/5 border-green-500/20">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-4">✅ A Solução Mostralo</h3>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">0% de taxa por pedido</p>
                        <p className="text-sm text-muted-foreground">Pague apenas uma mensalidade fixa</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">100% dos clientes são seus</p>
                        <p className="text-sm text-muted-foreground">Você constrói sua própria base de clientes</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">Seus dados nunca são compartilhados</p>
                        <p className="text-sm text-muted-foreground">Exporte quando quiser, são seus</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">Total liberdade para criar promoções</p>
                        <p className="text-sm text-muted-foreground">Faça do seu jeito, sem pedir permissão</p>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6 text-center">
                <Database className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">SEUS DADOS SÃO SEUS!</h3>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  No Mostralo, você tem acesso completo a todos os dados dos seus clientes: nome, telefone, endereço, histórico de compras. 
                  Você pode exportar, fazer campanhas de marketing, e construir relacionamentos duradouros.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section: Cardápio Digital */}
        <section id="cardapio" className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Smartphone className="h-6 w-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">Cardápio Digital Profissional</h2>
                  <button
                    onClick={() => copyWhatsAppText('cardapio')}
                    className="text-muted-foreground/50 hover:text-green-600 transition-colors p-1"
                    title="Copiar texto para WhatsApp"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-muted-foreground">Seu cardápio completo online, sempre atualizado</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[
                { title: 'Produtos Ilimitados', desc: 'Cadastre quantos produtos quiser com fotos de alta qualidade', icon: Image },
                { title: 'Categorias Organizadas', desc: 'Pizzas, Bebidas, Sobremesas - tudo organizado para o cliente', icon: Package },
                { title: 'Variações e Tamanhos', desc: 'P, M, G, sabores, bordas recheadas - configure como quiser', icon: Tag },
                { title: 'Adicionais/Complementos', desc: 'Bacon extra, queijo, molho - aumente o ticket médio', icon: Star },
                { title: 'Preços Promocionais', desc: 'Configure preço normal e preço de oferta com destaque', icon: TrendingUp },
                { title: 'Disponibilidade', desc: 'Produto acabou? Marque como indisponível com um clique', icon: Clock },
              ].map((item, i) => (
                <Card key={i} className="bg-card hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <item.icon className="h-8 w-8 text-blue-500 mb-3" />
                    <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" /> Benefícios
              </h4>
              <ul className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><ChevronRight className="h-4 w-4 text-primary" /> Cliente vê TUDO que você vende de forma organizada</li>
                <li className="flex items-center gap-2"><ChevronRight className="h-4 w-4 text-primary" /> Fotos profissionais aumentam 35% das vendas</li>
                <li className="flex items-center gap-2"><ChevronRight className="h-4 w-4 text-primary" /> Adicionais geram ticket médio maior</li>
                <li className="flex items-center gap-2"><ChevronRight className="h-4 w-4 text-primary" /> Atualize a qualquer momento, sem depender de ninguém</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section: Central de Pedidos */}
        <section id="pedidos" className="py-16 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <Package className="h-6 w-6 text-purple-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">Central de Pedidos em Tempo Real</h2>
                  <button
                    onClick={() => copyWhatsAppText('pedidos')}
                    className="text-muted-foreground/50 hover:text-green-600 transition-colors p-1"
                    title="Copiar texto para WhatsApp"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-muted-foreground">Gerencie todos os pedidos em um só lugar</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[
                { title: 'Recebimento Instantâneo', desc: 'Pedidos chegam em tempo real, sem atrasos', icon: Zap },
                { title: 'Notificações Sonoras e Visuais', desc: 'Alerta mesmo com navegador fechado (app nativo)', icon: Bell },
                { title: 'Kanban Visual', desc: 'Entrada → Preparo → Saída → Entregue - veja onde está cada pedido', icon: BarChart3 },
                { title: 'Aceitar ou Rejeitar', desc: 'Pedido chegou? Aceite ou rejeite com motivo', icon: Check },
                { title: 'Histórico Completo', desc: 'Todos os pedidos salvos para consulta futura', icon: Database },
                { title: 'Detalhes do Cliente', desc: 'Nome, telefone, endereço, observações - tudo registrado', icon: Users },
              ].map((item, i) => (
                <Card key={i} className="bg-card hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <item.icon className="h-8 w-8 text-purple-500 mb-3" />
                    <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6">
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" /> Benefícios
              </h4>
              <ul className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><ChevronRight className="h-4 w-4 text-primary" /> Nunca perde um pedido</li>
                <li className="flex items-center gap-2"><ChevronRight className="h-4 w-4 text-primary" /> Controle visual de onde está cada pedido</li>
                <li className="flex items-center gap-2"><ChevronRight className="h-4 w-4 text-primary" /> Histórico completo para resolver qualquer problema</li>
                <li className="flex items-center gap-2"><ChevronRight className="h-4 w-4 text-primary" /> Dados do cliente salvos para remarketing</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section: Sistema de Entregadores */}
        <section id="entregadores" className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <Truck className="h-6 w-6 text-green-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">Sistema Completo de Entregadores</h2>
                  <button
                    onClick={() => copyWhatsAppText('entregadores')}
                    className="text-muted-foreground/50 hover:text-green-600 transition-colors p-1"
                    title="Copiar texto para WhatsApp"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-muted-foreground">Gerencie seus motoboys de forma profissional</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[
                { title: 'Cadastro de Entregadores', desc: 'Cadastre seus motoboys próprios com foto e dados', icon: Users },
                { title: 'App Exclusivo (PWA)', desc: 'Entregador acessa pelo celular, vê pedidos e rotas', icon: Smartphone },
                { title: 'Rastreamento em Tempo Real', desc: 'Saiba onde seu motoboy está no mapa', icon: MapPin },
                { title: 'Pagamento Fixo', desc: 'R$ X por entrega - valor fixo configurável', icon: CreditCard },
                { title: 'Pagamento por Comissão', desc: 'X% do valor da entrega - motivação extra', icon: TrendingUp },
                { title: 'Mínimo Garantido', desc: 'Maior valor entre taxa ou mínimo - segurança para o motoboy', icon: Shield },
              ].map((item, i) => (
                <Card key={i} className="bg-card hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <item.icon className="h-8 w-8 text-green-500 mb-3" />
                    <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" /> Benefícios
              </h4>
              <ul className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><ChevronRight className="h-4 w-4 text-primary" /> Não depende de entregador terceirizado</li>
                <li className="flex items-center gap-2"><ChevronRight className="h-4 w-4 text-primary" /> Motoboy vê onde entregar direto no celular</li>
                <li className="flex items-center gap-2"><ChevronRight className="h-4 w-4 text-primary" /> Cliente acompanha entrega em tempo real</li>
                <li className="flex items-center gap-2"><ChevronRight className="h-4 w-4 text-primary" /> Sem taxas de apps de entrega</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section: WhatsApp Marketing - DESTAQUE */}
        <section id="whatsapp" className="py-16 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">WhatsApp Marketing</h2>
                  <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">EXCLUSIVO!</span>
                  <button
                    onClick={() => copyWhatsAppText('whatsapp')}
                    className="text-muted-foreground/50 hover:text-green-600 transition-colors p-1"
                    title="Copiar texto para WhatsApp"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-muted-foreground">Recupere clientes e aumente suas vendas automaticamente</p>
              </div>
            </div>

            {/* Problema que resolve */}
            <Card className="bg-destructive/5 border-destructive/20 mb-8">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-destructive mb-4">⚠️ O Problema que Resolve</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-background/50 rounded-lg">
                    <p className="text-3xl font-bold text-destructive">68%</p>
                    <p className="text-sm text-muted-foreground">dos clientes que compram uma vez nunca mais voltam</p>
                  </div>
                  <div className="text-center p-4 bg-background/50 rounded-lg">
                    <p className="text-3xl font-bold text-destructive">R$ 2.400</p>
                    <p className="text-sm text-muted-foreground">perdidos por mês por não fazer remarketing</p>
                  </div>
                  <div className="text-center p-4 bg-background/50 rounded-lg">
                    <p className="text-3xl font-bold text-destructive">15 dias</p>
                    <p className="text-sm text-muted-foreground">é o tempo que o cliente esquece de você</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[
                { title: 'Conexão via QR Code', desc: 'Conecte o MESMO WhatsApp da sua loja em segundos', icon: Smartphone },
                { title: 'Sincronização de Contatos', desc: 'Todos os contatos sincronizados com foto de perfil', icon: Users },
                { title: 'Etiquetas Coloridas', desc: 'VIP (dourado), Novo (verde), Inativo (vermelho)', icon: Tag },
                { title: 'Recuperação Automática', desc: '15 dias sem comprar? Mensagem automática!', icon: Clock },
                { title: 'Templates Personalizados', desc: '{nome}, {primeiro_nome}, {dias_inativo} - variáveis dinâmicas', icon: MessageCircle },
                { title: 'Campanhas Agendadas', desc: 'Programe envios com limites anti-bloqueio', icon: Calendar },
                { title: 'Métricas em Tempo Real', desc: 'Mensagens enviadas, taxa de entrega, vendas geradas', icon: BarChart3 },
                { title: 'Integração com Grupos', desc: 'Gerencie grupos e extraia contatos', icon: Users },
                { title: 'Link com Clientes', desc: 'Contato automaticamente vinculado ao cadastro', icon: Link2 },
              ].map((item, i) => (
                <Card key={i} className="bg-card hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <item.icon className="h-8 w-8 text-green-500 mb-3" />
                    <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Resultados Comprovados */}
            <Card className="bg-green-500/10 border-green-500/20 mb-8">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-green-600 dark:text-green-400 mb-4">📊 Resultados Comprovados</h3>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-background/50 rounded-lg">
                    <p className="text-3xl font-bold text-green-600">23%</p>
                    <p className="text-sm text-muted-foreground">clientes inativos voltam a comprar</p>
                  </div>
                  <div className="text-center p-4 bg-background/50 rounded-lg">
                    <p className="text-3xl font-bold text-green-600">R$ 2.400</p>
                    <p className="text-sm text-muted-foreground">aumento médio mensal em vendas</p>
                  </div>
                  <div className="text-center p-4 bg-background/50 rounded-lg">
                    <p className="text-3xl font-bold text-green-600">8h</p>
                    <p className="text-sm text-muted-foreground">economizadas por mês em trabalho manual</p>
                  </div>
                  <div className="text-center p-4 bg-background/50 rounded-lg">
                    <p className="text-3xl font-bold text-green-600">98%</p>
                    <p className="text-sm text-muted-foreground">taxa de abertura (vs 20% do email)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Destaque Principal */}
            <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
              <CardContent className="p-8 text-center">
                <Heart className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">SEUS CONTATOS SÃO SEUS!</h3>
                <p className="text-green-100 max-w-2xl mx-auto">
                  Diferente do iFood onde você não tem acesso aos dados do cliente, aqui você tem nome, telefone, 
                  histórico de compras e pode se comunicar diretamente. Construa relacionamentos reais com seus clientes!
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section: SENTINELA - Recompra Inteligente */}
        <section id="sentinela" className="py-16 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-red-950/20 dark:via-orange-950/20 dark:to-yellow-950/20 relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 w-64 h-64 bg-red-500 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 left-10 w-64 h-64 bg-orange-500 rounded-full blur-3xl"></div>
          </div>
          
          <div className="container mx-auto px-4 relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <Target className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">SENTINELA</h2>
                  <span className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">🔥 EXCLUSIVO!</span>
                  <button
                    onClick={() => copyWhatsAppText('sentinela')}
                    className="text-muted-foreground/50 hover:text-green-600 transition-colors p-1"
                    title="Copiar texto para WhatsApp"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-lg font-medium text-primary">Recompra Inteligente - Nunca mais perca uma venda de reposição!</p>
              </div>
            </div>

            {/* O Problema */}
            <Card className="bg-destructive/5 border-destructive/20 mb-8">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-destructive mb-4">⚠️ O Problema que o SENTINELA Resolve</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-background/50 rounded-lg">
                    <p className="text-3xl font-bold text-destructive">30 dias</p>
                    <p className="text-sm text-muted-foreground">e o suplemento do cliente acaba</p>
                  </div>
                  <div className="text-center p-4 bg-background/50 rounded-lg">
                    <p className="text-3xl font-bold text-destructive">72%</p>
                    <p className="text-sm text-muted-foreground">esquecem de pedir de novo</p>
                  </div>
                  <div className="text-center p-4 bg-background/50 rounded-lg">
                    <p className="text-3xl font-bold text-destructive">Perdeu</p>
                    <p className="text-sm text-muted-foreground">a venda para o concorrente</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Como Funciona */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[
                { title: 'Ciclo de Recompra', desc: 'Configure: Whey dura 30 dias, Creatina dura 60 dias, etc', icon: RefreshCw },
                { title: 'Disparo Automático', desc: 'Quando o produto "acaba", WhatsApp automático!', icon: MessageCircle },
                { title: 'Mensagem Personalizada', desc: '"Oi João, seu Whey deve estar acabando, que tal pedir mais?"', icon: Heart },
                { title: 'Lotes Anti-Bloqueio', desc: 'Envios espaçados para não bloquear seu WhatsApp', icon: Shield },
                { title: 'Dashboard de Conversão', desc: 'Veja quantos clientes recompraram pelo lembrete', icon: BarChart3 },
                { title: '100% Automático', desc: 'Configure uma vez e esqueça - funciona sozinho!', icon: Zap },
              ].map((item, i) => (
                <Card key={i} className="bg-card hover:shadow-md transition-shadow border-2 hover:border-primary/20">
                  <CardContent className="p-5">
                    <item.icon className="h-8 w-8 text-orange-500 mb-3" />
                    <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Resultados */}
            <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20 mb-8">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-green-600 dark:text-green-400 mb-4">📊 Resultados do SENTINELA</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-background/50 rounded-lg">
                    <p className="text-4xl font-bold text-green-600">+23%</p>
                    <p className="text-sm text-muted-foreground">aumento em vendas recorrentes</p>
                  </div>
                  <div className="text-center p-4 bg-background/50 rounded-lg">
                    <p className="text-4xl font-bold text-green-600">R$ 3.500</p>
                    <p className="text-sm text-muted-foreground">recuperados por mês em média</p>
                  </div>
                  <div className="text-center p-4 bg-background/50 rounded-lg">
                    <p className="text-4xl font-bold text-green-600">0h</p>
                    <p className="text-sm text-muted-foreground">de trabalho manual - 100% automático</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTA Especial */}
            <Card className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-white">
              <CardContent className="p-8 text-center">
                <Target className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">SENTINELA - Só no Mostralo!</h3>
                <p className="text-white/90 max-w-2xl mx-auto mb-4">
                  Nenhum outro sistema de delivery tem essa funcionalidade. O cliente compra um produto de ciclo, 
                  e o sistema automaticamente lembra quando está na hora de comprar de novo. 
                  Ideal para farmácias, lojas de suplementos, pet shops e qualquer negócio com produtos de reposição.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="bg-white/20 text-white text-sm px-3 py-1 rounded-full">💊 Farmácias</span>
                  <span className="bg-white/20 text-white text-sm px-3 py-1 rounded-full">💪 Suplementos</span>
                  <span className="bg-white/20 text-white text-sm px-3 py-1 rounded-full">🐕 Pet Shops</span>
                  <span className="bg-white/20 text-white text-sm px-3 py-1 rounded-full">🧹 Produtos de Limpeza</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section: Relatórios */}
        <section id="relatorios" className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-amber-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">Relatórios e Análises</h2>
                  <button
                    onClick={() => copyWhatsAppText('relatorios')}
                    className="text-muted-foreground/50 hover:text-green-600 transition-colors p-1"
                    title="Copiar texto para WhatsApp"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-muted-foreground">Tome decisões baseadas em dados reais</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[
                { title: 'Dashboard em Tempo Real', desc: 'Métricas atualizadas instantaneamente', icon: Zap },
                { title: 'Faturamento Detalhado', desc: 'Diário, semanal, mensal - compare períodos', icon: TrendingUp },
                { title: 'Produtos Mais Vendidos', desc: 'Saiba o que mais vende e o que não vende', icon: Star },
                { title: 'Horários de Pico', desc: 'Identifique quando você mais vende', icon: Clock },
                { title: 'Clientes Top', desc: 'Quem mais compra de você - valorize-os!', icon: Heart },
                { title: 'Exportação de Dados', desc: 'CSV, Excel - seus dados são seus', icon: Database },
              ].map((item, i) => (
                <Card key={i} className="bg-card hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <item.icon className="h-8 w-8 text-amber-500 mb-3" />
                    <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6">
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" /> SEUS DADOS SÃO SEUS
              </h4>
              <p className="text-sm text-muted-foreground">
                Exporte todos os seus dados quando quiser. Diferente de marketplaces que escondem suas métricas, 
                aqui você tem acesso completo a tudo sobre seu negócio.
              </p>
            </div>
          </div>
        </section>

        {/* Section: Gestão Financeira - NOVO */}
        <section id="financeiro" className="py-16 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <Wallet className="h-6 w-6 text-emerald-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">Gestão Financeira</h2>
                  <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full">NOVO!</span>
                  <button
                    onClick={() => copyWhatsAppText('financeiro')}
                    className="text-muted-foreground/50 hover:text-green-600 transition-colors p-1"
                    title="Copiar texto para WhatsApp"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-muted-foreground">Controle total das finanças do seu negócio</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[
                { title: 'Dashboard Financeiro', desc: 'KPIs de receitas, despesas e saldo em tempo real', icon: TrendingUp },
                { title: 'Controle de Entradas', desc: 'Registre todas as receitas por categoria', icon: ArrowUpDown },
                { title: 'Controle de Saídas', desc: 'Gerencie despesas e custos operacionais', icon: CreditCard },
                { title: 'Gráficos de Evolução', desc: 'Visualize a evolução mensal do fluxo de caixa', icon: PieChart },
                { title: 'Categorias Personalizáveis', desc: 'Crie categorias de receita e despesa do seu jeito', icon: Tag },
                { title: 'Filtros Avançados', desc: 'Filtre por tipo, categoria, período e busca', icon: Filter },
              ].map((item, i) => (
                <Card key={i} className="bg-card hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <item.icon className="h-8 w-8 text-emerald-500 mb-3" />
                    <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6">
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Wallet className="h-5 w-5 text-emerald-500" /> Fluxo de Caixa em Tempo Real
              </h4>
              <p className="text-sm text-muted-foreground">
                Saiba exatamente quanto entra e quanto sai do seu negócio. Relatórios financeiros completos 
                para tomar decisões estratégicas e manter suas finanças sob controle.
              </p>
            </div>
          </div>
        </section>

        {/* Section: Promoções e Cupons */}
        <section id="promocoes" className="py-16 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center">
                <Tag className="h-6 w-6 text-pink-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">Promoções e Cupons</h2>
                  <button
                    onClick={() => copyWhatsAppText('promocoes')}
                    className="text-muted-foreground/50 hover:text-green-600 transition-colors p-1"
                    title="Copiar texto para WhatsApp"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-muted-foreground">Crie ofertas do seu jeito, sem pedir permissão</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[
                { title: 'Cupons de Desconto', desc: 'Porcentagem (%) ou valor fixo (R$)', icon: Tag },
                { title: 'Frete Grátis Condicional', desc: 'Acima de R$ X o frete é grátis', icon: Truck },
                { title: 'Happy Hour Automático', desc: 'Promoções em horários específicos', icon: Clock },
                { title: 'Combos e Kits', desc: 'Leve 2 pague 1, combos especiais', icon: Package },
                { title: 'Descontos por Categoria', desc: 'Todas as pizzas com 20% off', icon: Star },
                { title: 'Pop-ups Promocionais', desc: 'Destaque ofertas na entrada da loja', icon: Bell },
              ].map((item, i) => (
                <Card key={i} className="bg-card hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <item.icon className="h-8 w-8 text-pink-500 mb-3" />
                    <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-pink-500/10 border border-pink-500/20 rounded-xl p-6">
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" /> Total Liberdade
              </h4>
              <p className="text-sm text-muted-foreground">
                Faça promoções do SEU jeito. Não precisa pedir aprovação, não tem limite. 
                Atraia clientes em horários de baixo movimento, fidelize com cupons exclusivos.
              </p>
            </div>
          </div>
        </section>

        {/* Section: Pedidos Agendados */}
        <section id="agendados" className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                <Calendar className="h-6 w-6 text-indigo-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">Pedidos Agendados</h2>
                  <button
                    onClick={() => copyWhatsAppText('agendados')}
                    className="text-muted-foreground/50 hover:text-green-600 transition-colors p-1"
                    title="Copiar texto para WhatsApp"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-muted-foreground">Encomendas para datas futuras</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {[
                { title: 'Encomendas Futuras', desc: 'Cliente faz pedido para entregar em data/hora específica', icon: Calendar },
                { title: 'Calendário de Pedidos', desc: 'Visualize todos os pedidos agendados em um calendário', icon: BarChart3 },
                { title: 'Confirmação Antecipada', desc: 'Confirme disponibilidade antes da data', icon: Check },
              ].map((item, i) => (
                <Card key={i} className="bg-card hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <item.icon className="h-8 w-8 text-indigo-500 mb-3" />
                    <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-6">
              <h4 className="font-semibold text-foreground mb-2">Ideal para festas e eventos!</h4>
              <p className="text-sm text-muted-foreground">
                Planeje a produção com antecedência. Nunca perca uma encomenda importante.
              </p>
            </div>
          </div>
        </section>

        {/* Section: Sistema de Agendamento de Serviços */}
        <section id="agendamento-servicos" className="py-16 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center">
                <Calendar className="h-6 w-6 text-pink-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">Sistema de Agendamento de Serviços</h2>
                  <span className="bg-pink-500 text-white text-xs font-bold px-2 py-1 rounded">🆕 NOVO!</span>
                  <button
                    onClick={() => copyWhatsAppText('agendamento-servicos')}
                    className="text-muted-foreground/50 hover:text-green-600 transition-colors p-1"
                    title="Copiar texto para WhatsApp"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-muted-foreground">Ideal para barbearias, salões, clínicas, consultórios e estúdios</p>
              </div>
            </div>

            {/* Agendamento Online */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center">
                  <Smartphone className="h-4 w-4 text-pink-500" />
                </div>
                Agendamento Online 24/7
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { title: 'Página Pública', desc: 'Cliente agenda direto pelo celular, 24 horas', icon: Smartphone },
                  { title: 'Escolha Completa', desc: 'Serviço, profissional, data e horário', icon: Calendar },
                  { title: 'Validação WhatsApp', desc: 'Confirma telefone com foto do perfil', icon: MessageCircle },
                  { title: 'Sem Conflitos', desc: 'Sistema detecta automaticamente double booking', icon: Shield },
                ].map((item, i) => (
                  <Card key={i} className="bg-card hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <item.icon className="h-6 w-6 text-pink-500 mb-2" />
                      <h4 className="font-semibold text-foreground text-sm mb-1">{item.title}</h4>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Gestão de Profissionais */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-pink-500" />
                </div>
                Gestão de Profissionais
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { title: 'Cadastro Completo', desc: 'Foto, especialidade e descrição', icon: Users },
                  { title: 'Horários Flexíveis', desc: 'Configuração por dia da semana', icon: Clock },
                  { title: 'Bloqueios de Agenda', desc: 'Férias, feriados, consultas médicas', icon: AlertTriangle },
                  { title: 'Comissões', desc: 'Percentual ou valor fixo por atendimento', icon: Wallet },
                ].map((item, i) => (
                  <Card key={i} className="bg-card hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <item.icon className="h-6 w-6 text-pink-500 mb-2" />
                      <h4 className="font-semibold text-foreground text-sm mb-1">{item.title}</h4>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* WhatsApp Automático */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 text-green-500" />
                </div>
                Mensagens Automáticas WhatsApp
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { title: 'Confirmação', desc: 'Mensagem automática ao agendar com todos os detalhes', icon: Check },
                  { title: 'Lembrete', desc: 'Aviso X horas antes do atendimento para reduzir faltas', icon: Bell },
                  { title: 'Satisfação', desc: 'Pesquisa pós-atendimento com link de avaliação', icon: Star },
                ].map((item, i) => (
                  <Card key={i} className="bg-card hover:shadow-md transition-shadow border-green-500/20">
                    <CardContent className="p-4">
                      <item.icon className="h-6 w-6 text-green-500 mb-2" />
                      <h4 className="font-semibold text-foreground text-sm mb-1">{item.title}</h4>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Calendário e Relatórios */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-pink-500" />
                </div>
                Calendário e Relatórios
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { title: 'Calendário Visual', desc: 'Visualização diária, semanal e mensal', icon: Calendar },
                  { title: 'Grade de Disponibilidade', desc: 'Veja slots livres e ocupados por profissional', icon: BarChart3 },
                  { title: 'KPIs Completos', desc: 'Agendamentos, comparecimento, receita', icon: TrendingUp },
                  { title: 'Ranking', desc: 'Profissionais e serviços mais populares', icon: Star },
                ].map((item, i) => (
                  <Card key={i} className="bg-card hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <item.icon className="h-6 w-6 text-pink-500 mb-2" />
                      <h4 className="font-semibold text-foreground text-sm mb-1">{item.title}</h4>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Avaliações */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Star className="h-4 w-4 text-yellow-500" />
                </div>
                Sistema de Avaliações
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { title: 'Link de Avaliação', desc: 'Enviado automaticamente após o atendimento', icon: Link2 },
                  { title: 'Estrelas + Feedback', desc: 'Avaliação de 1 a 5 estrelas com comentário', icon: Star },
                  { title: 'Dashboard', desc: 'Acompanhe sua reputação e filtre por profissional', icon: BarChart3 },
                ].map((item, i) => (
                  <Card key={i} className="bg-card hover:shadow-md transition-shadow border-yellow-500/20">
                    <CardContent className="p-4">
                      <item.icon className="h-6 w-6 text-yellow-500 mb-2" />
                      <h4 className="font-semibold text-foreground text-sm mb-1">{item.title}</h4>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Benefícios */}
            <div className="bg-pink-500/10 border border-pink-500/20 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Zap className="h-6 w-6 text-pink-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Automatize seu negócio de serviços!</h4>
                  <div className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <p>✅ Cliente agenda 24/7 sem precisar ligar</p>
                    <p>✅ Fim dos conflitos de horário</p>
                    <p>✅ Lembretes reduzem faltas em até 40%</p>
                    <p>✅ Avaliações melhoram sua reputação</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Clube de Assinaturas */}
        <section id="clube-assinaturas" className="py-16 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-violet-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">Clube de Assinaturas</h2>
                  <span className="bg-violet-500 text-white text-xs font-bold px-2 py-1 rounded">🆕 PREMIUM!</span>
                  <button
                    onClick={() => copyWhatsAppText('clube-assinaturas')}
                    className="text-muted-foreground/50 hover:text-green-600 transition-colors p-1"
                    title="Copiar texto para WhatsApp"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-muted-foreground">Fidelização com receita recorrente - ideal para barbearias, salões, academias, clínicas e estúdios</p>
              </div>
            </div>

            {/* Problema que resolve */}
            <Card className="bg-destructive/5 border-destructive/20 mb-8">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-destructive mb-4">⚠️ O Problema que Resolve</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-background/50 rounded-lg">
                    <p className="text-3xl font-bold text-destructive">80%</p>
                    <p className="text-sm text-muted-foreground">dos clientes não voltam todo mês espontaneamente</p>
                  </div>
                  <div className="text-center p-4 bg-background/50 rounded-lg">
                    <p className="text-3xl font-bold text-destructive">Incerteza</p>
                    <p className="text-sm text-muted-foreground">receita variável mês a mês sem previsibilidade</p>
                  </div>
                  <div className="text-center p-4 bg-background/50 rounded-lg">
                    <p className="text-3xl font-bold text-destructive">Esforço</p>
                    <p className="text-sm text-muted-foreground">vendendo todo mês para os mesmos clientes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Planos de Assinatura */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-violet-500" />
                </div>
                Planos de Assinatura
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { title: 'Planos Personalizados', desc: 'Crie planos como "Corte Ilimitado" ou "Plano VIP"', icon: CreditCard },
                  { title: 'Serviços Inclusos', desc: 'Defina quais serviços fazem parte do plano', icon: Package },
                  { title: 'Limites Flexíveis', desc: 'Ilimitado ou X usos por mês - você escolhe', icon: Target },
                  { title: 'Ciclos de Cobrança', desc: 'Mensal, trimestral, semestral ou anual', icon: Calendar },
                ].map((item, i) => (
                  <Card key={i} className="bg-card hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <item.icon className="h-6 w-6 text-violet-500 mb-2" />
                      <h4 className="font-semibold text-foreground text-sm mb-1">{item.title}</h4>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Gestão de Assinantes */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-violet-500" />
                </div>
                Gestão de Assinantes
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { title: 'Dashboard Completo', desc: 'Veja todos os assinantes em um só lugar', icon: Users },
                  { title: 'Controle de Período', desc: 'Visualize início, fim e renovação', icon: Clock },
                  { title: 'Histórico de Uso', desc: 'Acompanhe quantas vezes o cliente usou', icon: BarChart3 },
                  { title: 'Status em Tempo Real', desc: 'Ativo, pausado, cancelado, expirado', icon: Shield },
                ].map((item, i) => (
                  <Card key={i} className="bg-card hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <item.icon className="h-6 w-6 text-violet-500 mb-2" />
                      <h4 className="font-semibold text-foreground text-sm mb-1">{item.title}</h4>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Integração com Agendamento */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-pink-500" />
                </div>
                Integração com Agendamento
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { title: 'Reconhecimento Automático', desc: 'Ao agendar, sistema identifica assinante', icon: Zap },
                  { title: 'Marca Visual', desc: 'Badge "Incluso no Plano" nos serviços', icon: Star },
                  { title: 'Registro de Uso', desc: 'Desconta do limite automaticamente', icon: Check },
                  { title: 'Usos Restantes', desc: 'Indicador visual do saldo no período', icon: Target },
                ].map((item, i) => (
                  <Card key={i} className="bg-card hover:shadow-md transition-shadow border-pink-500/20">
                    <CardContent className="p-4">
                      <item.icon className="h-6 w-6 text-pink-500 mb-2" />
                      <h4 className="font-semibold text-foreground text-sm mb-1">{item.title}</h4>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Controle de Pagamentos */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-green-500" />
                </div>
                Controle de Pagamentos
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { title: 'Pagamento Manual', desc: 'Registre dinheiro, cartão ou PIX externo', icon: Wallet },
                  { title: 'PIX Automático', desc: 'QR Code gerado direto no sistema (EFI)', icon: QrCode },
                  { title: 'Histórico de Pagamentos', desc: 'Todas as cobranças registradas', icon: Database },
                  { title: 'Renovação Automática', desc: 'Configure renovação mensal opcional', icon: RefreshCw },
                ].map((item, i) => (
                  <Card key={i} className="bg-card hover:shadow-md transition-shadow border-green-500/20">
                    <CardContent className="p-4">
                      <item.icon className="h-6 w-6 text-green-500 mb-2" />
                      <h4 className="font-semibold text-foreground text-sm mb-1">{item.title}</h4>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Destaque Principal */}
            <Card className="bg-gradient-to-r from-violet-500 to-purple-500 text-white">
              <CardContent className="p-8 text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">RECEITA RECORRENTE E PREVISÍVEL</h3>
                <p className="text-violet-100 max-w-2xl mx-auto mb-4">
                  Transforme clientes ocasionais em assinantes fiéis. Com planos mensais, você tem previsibilidade de caixa 
                  e o cliente percebe mais valor no serviço. Todo mundo ganha!
                </p>
                <div className="grid md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-2xl font-bold">💰</p>
                    <p className="text-sm text-violet-100">Receita previsível</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-2xl font-bold">🤝</p>
                    <p className="text-sm text-violet-100">Cliente fidelizado</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-2xl font-bold">⏰</p>
                    <p className="text-sm text-violet-100">Menos esforço comercial</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-2xl font-bold">⭐</p>
                    <p className="text-sm text-violet-100">Maior valor percebido</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section: Impressão Automática */}
        <section id="impressao" className="py-16 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-slate-500/10 rounded-xl flex items-center justify-center">
                <Printer className="h-6 w-6 text-slate-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">Impressão Automática</h2>
                  <button
                    onClick={() => copyWhatsAppText('impressao')}
                    className="text-muted-foreground/50 hover:text-green-600 transition-colors p-1"
                    title="Copiar texto para WhatsApp"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-muted-foreground">Comandas direto na cozinha</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { title: 'Impressoras Térmicas', desc: 'Compatível com modelos populares', icon: Printer },
                { title: 'Impressão Automática', desc: 'Pedido aceito = comanda impressa', icon: Zap },
                { title: 'Múltiplas Impressoras', desc: 'Cozinha, caixa, bar - configure várias', icon: Package },
                { title: 'QZ Tray', desc: 'Integração profissional com QZ Tray', icon: Link2 },
              ].map((item, i) => (
                <Card key={i} className="bg-card hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <item.icon className="h-8 w-8 text-slate-500 mb-3" />
                    <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-slate-500/10 border border-slate-500/20 rounded-xl p-6">
              <h4 className="font-semibold text-foreground mb-2">Sem redigitar nada!</h4>
              <p className="text-sm text-muted-foreground">
                Pedido entra, comanda sai automaticamente na cozinha. Reduz erros de anotação e agiliza a produção.
              </p>
            </div>
          </div>
        </section>

        {/* Section: PDV (Ponto de Venda) */}
        <section id="pdv" className="py-16 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-orange-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">PDV - Ponto de Venda</h2>
                  <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">PRESENCIAL</span>
                  <button
                    onClick={() => copyWhatsAppText('pdv')}
                    className="text-muted-foreground/50 hover:text-green-600 transition-colors p-1"
                    title="Copiar texto para WhatsApp"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-muted-foreground">Vendas rápidas no balcão sem complicação</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[
                { title: 'Vendas Rápidas', desc: 'Atenda clientes no balcão em segundos', icon: Zap },
                { title: 'Tela Touch Otimizada', desc: 'Interface pensada para velocidade e praticidade', icon: Smartphone },
                { title: 'Busca Inteligente', desc: 'Encontre produtos rapidamente por nome ou código', icon: Target },
                { title: 'Múltiplos Pagamentos', desc: 'PIX, cartão, dinheiro, fiado - tudo aceito', icon: CreditCard },
                { title: 'Integração Total', desc: 'Sincronizado com comandas, cozinha e estoque', icon: Link2 },
                { title: 'Relatórios Unificados', desc: 'Veja vendas de delivery + balcão + mesas juntos', icon: BarChart3 },
              ].map((item, i) => (
                <Card key={i} className="bg-card hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <item.icon className="h-8 w-8 text-orange-500 mb-3" />
                    <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-6">
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" /> Atendimento Ágil
              </h4>
              <p className="text-sm text-muted-foreground">
                Cliente chegou? Em poucos segundos o pedido está registrado e enviado para a cozinha. 
                Sem filas, sem demora, sem erros de anotação manual.
              </p>
            </div>
          </div>
        </section>

        {/* Section: Comandas Digitais */}
        <section id="comandas" className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <ClipboardList className="h-6 w-6 text-purple-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">Comandas Digitais</h2>
                  <span className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded">MESAS</span>
                  <button
                    onClick={() => copyWhatsAppText('comandas')}
                    className="text-muted-foreground/50 hover:text-green-600 transition-colors p-1"
                    title="Copiar texto para WhatsApp"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-muted-foreground">Controle total das mesas do seu estabelecimento</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[
                { title: 'Abertura Rápida', desc: 'Abra uma mesa em apenas 2 toques', icon: Zap },
                { title: 'Status em Tempo Real', desc: 'Veja ocupação, pedidos pendentes e tempo de mesa', icon: Clock },
                { title: 'Divisão de Conta', desc: 'Divida automaticamente entre os clientes', icon: Users },
                { title: 'Histórico Completo', desc: 'Tudo que foi consumido na mesa, item por item', icon: FileText },
                { title: 'Transferência', desc: 'Transfira itens ou toda a mesa para outra', icon: ArrowUpDown },
                { title: 'Fechamento Flexível', desc: 'Feche parcial ou totalmente como preferir', icon: Check },
              ].map((item, i) => (
                <Card key={i} className="bg-card hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <item.icon className="h-8 w-8 text-purple-500 mb-3" />
                    <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6">
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-purple-500" /> Adeus Papel!
              </h4>
              <p className="text-sm text-muted-foreground">
                Sem comandas de papel que se perdem, rasgam ou ficam ilegíveis. 
                Tudo digital, organizado, com histórico completo e controle visual de todas as mesas.
              </p>
            </div>
          </div>
        </section>

        {/* Section: App do Garçom */}
        <section id="garcom" className="py-16 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Smartphone className="h-6 w-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">App do Garçom</h2>
                  <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">EXCLUSIVO</span>
                  <button
                    onClick={() => copyWhatsAppText('garcom')}
                    className="text-muted-foreground/50 hover:text-green-600 transition-colors p-1"
                    title="Copiar texto para WhatsApp"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-muted-foreground">O celular do garçom vira terminal de pedidos</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[
                { title: 'Celular = Terminal', desc: 'Sem investir em equipamentos caros - usa o próprio celular', icon: Smartphone },
                { title: 'Fotos dos Produtos', desc: 'Garçom vê a foto do prato para não errar nunca', icon: Image },
                { title: 'Confirmação Visual', desc: 'Modal de confirmação antes de enviar o pedido', icon: Check },
                { title: 'Funciona Offline', desc: 'Tecnologia PWA - funciona mesmo sem internet', icon: Zap },
                { title: 'Direto pra Cozinha', desc: 'Pedido vai automaticamente para o KDS/impressora', icon: UtensilsCrossed },
                { title: 'Zero Investimento', desc: 'Não precisa comprar tablets ou terminais', icon: CreditCard },
              ].map((item, i) => (
                <Card key={i} className="bg-card hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <item.icon className="h-8 w-8 text-blue-500 mb-3" />
                    <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-500" /> Atendimento Mais Rápido
              </h4>
              <p className="text-sm text-muted-foreground">
                Zero erros de anotação, atendimento muito mais rápido, e o garçom não precisa ir até a cozinha. 
                O pedido aparece instantaneamente na tela da cozinha assim que é confirmado.
              </p>
            </div>
          </div>
        </section>

        {/* Section: KDS (Cozinha) */}
        <section id="kds" className="py-16 bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/20 dark:to-red-950/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center">
                <UtensilsCrossed className="h-6 w-6 text-rose-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">KDS - Kitchen Display System</h2>
                  <span className="bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded-full">🔥 NOVO!</span>
                  <button
                    onClick={() => copyWhatsAppText('kds')}
                    className="text-muted-foreground/50 hover:text-green-600 transition-colors p-1"
                    title="Copiar texto para WhatsApp"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-muted-foreground">Tela da cozinha com pedidos em tempo real</p>
              </div>
            </div>

            {/* Destaque de cores */}
            <div className="bg-gradient-to-r from-green-500/10 via-yellow-500/10 to-red-500/10 border border-rose-500/30 rounded-xl p-6 mb-8">
              <h4 className="font-bold text-foreground text-lg mb-4 text-center">Sistema de Cores por Tempo de Espera</h4>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-green-500/20 rounded-lg p-4 border border-green-500/30 text-center">
                  <span className="text-3xl mb-2 block">🟢</span>
                  <h5 className="font-semibold text-green-700 dark:text-green-400">Verde</h5>
                  <p className="text-sm text-muted-foreground">Menos de 5 minutos</p>
                </div>
                <div className="bg-yellow-500/20 rounded-lg p-4 border border-yellow-500/30 text-center">
                  <span className="text-3xl mb-2 block">🟡</span>
                  <h5 className="font-semibold text-yellow-700 dark:text-yellow-400">Amarelo</h5>
                  <p className="text-sm text-muted-foreground">5-10 minutos</p>
                </div>
                <div className="bg-red-500/20 rounded-lg p-4 border border-red-500/30 text-center">
                  <span className="text-3xl mb-2 block">🔴</span>
                  <h5 className="font-semibold text-red-700 dark:text-red-400">Vermelho</h5>
                  <p className="text-sm text-muted-foreground">Mais de 10 minutos</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[
                { title: 'Pedidos em Tempo Real', desc: 'Veja todos os pedidos assim que entram', icon: Zap },
                { title: 'Alertas Sonoros', desc: 'Bipe quando entra novo pedido na fila', icon: Bell },
                { title: 'Marcar Status', desc: '"Preparando" ou "Pronto" com um toque', icon: Check },
                { title: 'Estatísticas ao Vivo', desc: 'Pendentes, em preparo e prontos em tempo real', icon: BarChart3 },
                { title: 'Multi-dispositivo', desc: 'Funciona em TV, tablet, monitor ou celular', icon: Monitor },
                { title: 'Sincronizado', desc: 'Integrado com garçom, PDV e comandas', icon: RefreshCw },
              ].map((item, i) => (
                <Card key={i} className="bg-card hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <item.icon className="h-8 w-8 text-rose-500 mb-3" />
                    <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-6">
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5 text-rose-500" /> Fim da Bagunça na Cozinha!
              </h4>
              <p className="text-sm text-muted-foreground">
                Chega de papéis voando, gritos e confusão. O cozinheiro sabe exatamente a prioridade de cada pedido 
                pelas cores, e o garçom vê automaticamente quando o pedido fica pronto. Tudo sincronizado!
              </p>
            </div>
          </div>
        </section>

        {/* Section: Painel Digital (Digital Signage) */}
        <section id="painel-digital" className="py-16 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <Monitor className="h-6 w-6 text-purple-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">Painel Digital (Digital Signage)</h2>
                  <span className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded">📺 PROFISSIONAL</span>
                  <button
                    onClick={() => copyWhatsAppText('painel-digital')}
                    className="text-muted-foreground/50 hover:text-green-600 transition-colors p-1"
                    title="Copiar texto para WhatsApp"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-muted-foreground">TVs e totens com cardápio digital animado</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[
                { title: 'Cardápio em TV', desc: 'Exiba seu cardápio em TVs ou monitores na loja', icon: Monitor },
                { title: 'Slides Rotativos', desc: 'Promoções e produtos em rotação automática', icon: RefreshCw },
                { title: 'Suporte a Vídeos', desc: 'Vídeos promocionais entre os slides', icon: Image },
                { title: 'Orientação Flexível', desc: 'Vertical (totem) ou horizontal (TV)', icon: Palette },
                { title: 'Tempo Configurável', desc: 'Defina duração de cada slide/promoção', icon: Clock },
                { title: 'Atualização em Tempo Real', desc: 'Mude preços/produtos e atualiza na TV', icon: Zap },
              ].map((item, i) => (
                <Card key={i} className="bg-card hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <item.icon className="h-8 w-8 text-purple-500 mb-3" />
                    <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6">
              <h4 className="font-semibold text-foreground mb-2">Visual de Grandes Redes!</h4>
              <p className="text-sm text-muted-foreground">
                O mesmo visual profissional do McDonald's e Burger King na sua loja. 
                Promoções chamam atenção automaticamente e você economiza com impressão de banners.
              </p>
            </div>
          </div>
        </section>

        {/* Section: Chamada de Senhas */}
        <section id="chamada-senhas" className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Volume2 className="h-6 w-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">Chamada de Senhas</h2>
                  <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">🔔 NOVO!</span>
                  <button
                    onClick={() => copyWhatsAppText('chamada-senhas')}
                    className="text-muted-foreground/50 hover:text-green-600 transition-colors p-1"
                    title="Copiar texto para WhatsApp"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-muted-foreground">Sistema de totem para chamar clientes</p>
              </div>
            </div>

            {/* Destaque ElevenLabs IA */}
            <div className="bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10 border border-purple-500/30 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🎙️</span>
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-lg flex items-center gap-2">
                    Powered by ElevenLabs AI
                    <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">PREMIUM</span>
                  </h4>
                  <p className="text-muted-foreground text-sm">Vozes ultra-realistas como um locutor profissional</p>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4 mt-4">
                <div className="bg-background/50 rounded-lg p-3 border border-border/50">
                  <span className="text-2xl mb-1 block">🔔</span>
                  <h5 className="font-medium text-foreground text-sm">Bipe Simples</h5>
                  <p className="text-xs text-muted-foreground">Toque sonoro discreto e rápido</p>
                </div>
                <div className="bg-background/50 rounded-lg p-3 border border-border/50">
                  <span className="text-2xl mb-1 block">🗣️</span>
                  <h5 className="font-medium text-foreground text-sm">Voz do Navegador</h5>
                  <p className="text-xs text-muted-foreground">Web Speech API gratuita</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg p-3 border border-purple-500/30">
                  <span className="text-2xl mb-1 block">🎙️</span>
                  <h5 className="font-medium text-foreground text-sm flex items-center gap-1">
                    ElevenLabs IA <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  </h5>
                  <p className="text-xs text-muted-foreground">Voz premium de qualidade broadcast</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[
                { title: 'Painel de Senhas', desc: 'Exiba na TV as senhas sendo chamadas em tempo real', icon: Monitor },
                { title: 'Texto Personalizado', desc: '"Senha 42, retire no balcão 2!" - Configure a mensagem', icon: FileText },
                { title: 'WhatsApp ao Cliente', desc: 'Notifica automaticamente quando pedido fica pronto', icon: MessageCircle },
                { title: 'Fila Inteligente', desc: 'Gerenciamento automático da fila de preparo', icon: Users },
                { title: 'Histórico de Chamadas', desc: 'Veja todas as senhas chamadas no dia', icon: Database },
                { title: 'Modo Cozinha', desc: 'Painel separado para a equipe de preparo', icon: Printer },
              ].map((item, i) => (
                <Card key={i} className="bg-card hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <item.icon className="h-8 w-8 text-blue-500 mb-3" />
                    <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-blue-500" /> Ideal Para:
              </h4>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="bg-blue-500/20 text-blue-700 dark:text-blue-300 text-sm px-3 py-1 rounded-full">🍔 Fast-food</span>
                <span className="bg-blue-500/20 text-blue-700 dark:text-blue-300 text-sm px-3 py-1 rounded-full">🥐 Padarias</span>
                <span className="bg-blue-500/20 text-blue-700 dark:text-blue-300 text-sm px-3 py-1 rounded-full">🍕 Pizzarias</span>
                <span className="bg-blue-500/20 text-blue-700 dark:text-blue-300 text-sm px-3 py-1 rounded-full">☕ Cafeterias</span>
                <span className="bg-blue-500/20 text-blue-700 dark:text-blue-300 text-sm px-3 py-1 rounded-full">🍜 Restaurantes com Retirada</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Totem Autoatendimento */}
        <section id="totem" className="py-16 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-teal-500/10 rounded-xl flex items-center justify-center">
                <Smartphone className="h-6 w-6 text-teal-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">Totem Autoatendimento</h2>
                  <span className="bg-teal-500 text-white text-xs font-bold px-2 py-1 rounded-full">🆕 NOVO!</span>
                  <button
                    onClick={() => copyWhatsAppText('totem')}
                    className="text-muted-foreground/50 hover:text-green-600 transition-colors p-1"
                    title="Copiar texto para WhatsApp"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-muted-foreground">Seu cliente faz o pedido sozinho, sem fila</p>
              </div>
            </div>

            {/* Problema que resolve */}
            <div className="bg-gradient-to-r from-red-500/10 via-orange-500/10 to-teal-500/10 border border-teal-500/30 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-lg">Problema que o Totem Resolve</h4>
                  <p className="text-muted-foreground text-sm">Filas no caixa, erros de anotação, custos com atendentes</p>
                </div>
              </div>
              <div className="grid md:grid-cols-4 gap-4 mt-4">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
                  <span className="text-2xl mb-1 block">😫</span>
                  <p className="text-xs text-muted-foreground">Filas no horário de pico</p>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 text-center">
                  <span className="text-2xl mb-1 block">📝</span>
                  <p className="text-xs text-muted-foreground">Erros de anotação manual</p>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-center">
                  <span className="text-2xl mb-1 block">💸</span>
                  <p className="text-xs text-muted-foreground">Custos com atendentes</p>
                </div>
                <div className="bg-teal-500/10 border border-teal-500/20 rounded-lg p-3 text-center">
                  <span className="text-2xl mb-1 block">✅</span>
                  <p className="text-xs text-muted-foreground font-medium">Totem resolve tudo!</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[
                { title: 'Autoatendimento', desc: 'Cliente faz pedido sozinho no tablet ou totem', icon: Smartphone },
                { title: 'Tela de Boas-Vindas', desc: 'Logo e mensagem personalizada da sua marca', icon: Image },
                { title: 'Identificação Opcional', desc: 'Por telefone, nome ou CPF - você escolhe', icon: Users },
                { title: 'Cardápio Visual', desc: 'Fotos, variações e adicionais interativos', icon: Package },
                { title: 'Pagamento PIX', desc: 'QR Code com confirmação automática integrada', icon: QrCode },
                { title: 'Senha Automática', desc: 'Integrada com sistema de chamada de senhas', icon: Volume2 },
              ].map((item, i) => (
                <Card key={i} className="bg-card hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <item.icon className="h-8 w-8 text-teal-500 mb-3" />
                    <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Benefícios */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-6">
                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-teal-500" /> Benefícios Comprovados
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-teal-500" />
                    <span className="text-sm text-muted-foreground">Reduz filas em até 70%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-teal-500" />
                    <span className="text-sm text-muted-foreground">Aumenta ticket médio em 15-25%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-teal-500" />
                    <span className="text-sm text-muted-foreground">Zero erros de anotação</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-teal-500" />
                    <span className="text-sm text-muted-foreground">Funciona 24h sem supervisão</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-teal-500" />
                    <span className="text-sm text-muted-foreground">Libera equipe para produção</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30 rounded-xl p-6">
                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-teal-500" /> Visual de Grandes Redes
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  O mesmo visual profissional do McDonald's e Burger King na sua loja. 
                  Funciona em tablet horizontal, vertical ou totem dedicado.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-teal-500/20 text-teal-700 dark:text-teal-300 text-xs px-2 py-1 rounded">Modo Escuro</span>
                  <span className="bg-teal-500/20 text-teal-700 dark:text-teal-300 text-xs px-2 py-1 rounded">Modo Claro</span>
                  <span className="bg-teal-500/20 text-teal-700 dark:text-teal-300 text-xs px-2 py-1 rounded">Horizontal</span>
                  <span className="bg-teal-500/20 text-teal-700 dark:text-teal-300 text-xs px-2 py-1 rounded">Vertical</span>
                  <span className="bg-teal-500/20 text-teal-700 dark:text-teal-300 text-xs px-2 py-1 rounded">Timer Inteligente</span>
                </div>
              </div>
            </div>

            <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-6">
              <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Target className="h-5 w-5 text-teal-500" /> Ideal Para:
              </h4>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="bg-teal-500/20 text-teal-700 dark:text-teal-300 text-sm px-3 py-1 rounded-full">🍔 Fast-food</span>
                <span className="bg-teal-500/20 text-teal-700 dark:text-teal-300 text-sm px-3 py-1 rounded-full">🥐 Padarias</span>
                <span className="bg-teal-500/20 text-teal-700 dark:text-teal-300 text-sm px-3 py-1 rounded-full">🍕 Pizzarias</span>
                <span className="bg-teal-500/20 text-teal-700 dark:text-teal-300 text-sm px-3 py-1 rounded-full">☕ Cafeterias</span>
                <span className="bg-teal-500/20 text-teal-700 dark:text-teal-300 text-sm px-3 py-1 rounded-full">🍜 Restaurantes</span>
                <span className="bg-teal-500/20 text-teal-700 dark:text-teal-300 text-sm px-3 py-1 rounded-full">🏪 Conveniências</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Personalização */}
        <section id="personalizacao" className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center">
                <Palette className="h-6 w-6 text-violet-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">Personalização da Loja</h2>
                  <button
                    onClick={() => copyWhatsAppText('personalizacao')}
                    className="text-muted-foreground/50 hover:text-green-600 transition-colors p-1"
                    title="Copiar texto para WhatsApp"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-muted-foreground">Sua identidade visual completa</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[
                { title: 'Logo e Banner', desc: 'Sua marca em destaque na loja', icon: Image },
                { title: 'Cores Personalizadas', desc: 'Use as cores da sua identidade visual', icon: Palette },
                { title: 'Horários de Funcionamento', desc: 'Configure quando sua loja está aberta', icon: Clock },
                { title: 'Scripts Personalizados', desc: 'WhatsApp buttons, chatbots, pixels de anúncios', icon: Link2 },
                { title: 'Domínio Próprio', desc: 'seurestaurante.com.br - sem iFood no link!', icon: Store },
                { title: 'Informações de Contato', desc: 'Telefone, endereço, redes sociais', icon: MessageCircle },
              ].map((item, i) => (
                <Card key={i} className="bg-card hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <item.icon className="h-8 w-8 text-violet-500 mb-3" />
                    <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-6">
              <h4 className="font-semibold text-foreground mb-2">Domínio Próprio - Profissionalismo!</h4>
              <p className="text-sm text-muted-foreground">
                Clientes acessam seurestaurante.com.br, não ifood.com/loja. Passa credibilidade e profissionalismo.
              </p>
            </div>
          </div>
        </section>

        {/* Section: Delivery Inteligente */}
        <section id="delivery" className="py-16 bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-950/20 dark:to-teal-950/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center">
                <Map className="h-6 w-6 text-cyan-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">Delivery Inteligente</h2>
                  <button
                    onClick={() => copyWhatsAppText('delivery')}
                    className="text-muted-foreground/50 hover:text-green-600 transition-colors p-1"
                    title="Copiar texto para WhatsApp"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-muted-foreground">Mapa interativo e frete automático</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[
                { title: 'Mapa Interativo', desc: 'Desenhe suas áreas de entrega no mapa', icon: Map },
                { title: 'Frete por Distância', desc: 'Cálculo automático baseado em km', icon: MapPin },
                { title: 'Múltiplas Zonas', desc: 'Áreas diferentes com preços diferentes', icon: Target },
                { title: 'Tempo Estimado', desc: 'Previsão automática de entrega', icon: Clock },
                { title: 'Frete Grátis', desc: 'Configure valor mínimo para frete grátis', icon: Tag },
                { title: 'Verificação Instantânea', desc: 'Cliente sabe na hora se você entrega', icon: Check },
              ].map((item, i) => (
                <Card key={i} className="bg-card hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <item.icon className="h-8 w-8 text-cyan-500 mb-3" />
                    <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Section: Gestão de Atendentes */}
        <section id="atendentes" className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-orange-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">Gestão de Atendentes</h2>
                  <button
                    onClick={() => copyWhatsAppText('atendentes')}
                    className="text-muted-foreground/50 hover:text-green-600 transition-colors p-1"
                    title="Copiar texto para WhatsApp"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-muted-foreground">Múltiplos usuários com permissões</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { title: 'Cadastro de Funcionários', desc: 'Crie contas para seus atendentes', icon: Users },
                { title: 'Permissões Limitadas', desc: 'Cada um vê só o que precisa', icon: Shield },
                { title: 'Múltiplos Simultâneos', desc: 'Vários atendentes ao mesmo tempo', icon: Zap },
                { title: 'Controle de Acesso', desc: 'Saiba quem fez o quê', icon: Database },
              ].map((item, i) => (
                <Card key={i} className="bg-card hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <item.icon className="h-8 w-8 text-orange-500 mb-3" />
                    <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Section: Marketing Digital */}
        <section id="marketing" className="py-16 bg-gradient-to-br from-fuchsia-50 to-purple-50 dark:from-fuchsia-950/20 dark:to-purple-950/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-fuchsia-500/10 rounded-xl flex items-center justify-center">
                <Megaphone className="h-6 w-6 text-fuchsia-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">Marketing Digital</h2>
                  <span className="bg-fuchsia-500 text-white text-xs font-bold px-2 py-1 rounded">INCLUSO!</span>
                  <button
                    onClick={() => copyWhatsAppText('marketing')}
                    className="text-muted-foreground/50 hover:text-green-600 transition-colors p-1"
                    title="Copiar texto para WhatsApp"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-muted-foreground">Gestão de redes sociais integrada (mLabs)</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[
                { title: '1 Perfil Incluso', desc: 'Uma rede social já incluída no plano', icon: Users },
                { title: 'Posts Ilimitados', desc: 'Agende quantos posts quiser', icon: Calendar },
                { title: 'IA para Legendas', desc: 'Inteligência artificial cria textos pra você', icon: Zap },
                { title: 'Análise de Concorrentes', desc: 'Veja o que seus concorrentes estão fazendo', icon: Target },
                { title: 'Integração com Ads', desc: 'Facebook e Google Ads integrados', icon: TrendingUp },
                { title: 'Relatórios de Performance', desc: 'Métricas das suas redes sociais', icon: BarChart3 },
              ].map((item, i) => (
                <Card key={i} className="bg-card hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <item.icon className="h-8 w-8 text-fuchsia-500 mb-3" />
                    <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white">
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold mb-2">Valor de mercado: R$ 800-2.000/mês</p>
                <p className="text-fuchsia-100">INCLUSO no seu plano Mostralo! Economize com marketing digital profissional.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section: Integrações */}
        <section id="integracoes" className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Link2 className="h-6 w-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">Integrações Externas</h2>
                  <button
                    onClick={() => copyWhatsAppText('integracoes')}
                    className="text-muted-foreground/50 hover:text-green-600 transition-colors p-1"
                    title="Copiar texto para WhatsApp"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-muted-foreground">Conecte outras ferramentas</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { title: 'Menus Customizados', desc: 'Adicione iframes de outras ferramentas', icon: Link2 },
                { title: 'APIs para IA', desc: 'Conecte agentes de inteligência artificial', icon: Zap },
                { title: 'Feeds de Produtos', desc: 'Google Shopping e Instagram/Meta Shopping', icon: Image },
              ].map((item, i) => (
                <Card key={i} className="bg-card hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <item.icon className="h-8 w-8 text-blue-500 mb-3" />
                    <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Section: Material de Marketing */}
        <section id="material-marketing" className="py-16 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-teal-500/10 rounded-xl flex items-center justify-center">
                <QrCode className="h-6 w-6 text-teal-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">Material de Marketing</h2>
                  <button
                    onClick={() => copyWhatsAppText('material-marketing')}
                    className="text-muted-foreground/50 hover:text-green-600 transition-colors p-1"
                    title="Copiar texto para WhatsApp"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-muted-foreground">QR Codes e materiais prontos para impressão</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[
                { title: 'QR Codes Personalizados', desc: 'QR Code direto para seu cardápio digital', icon: QrCode },
                { title: 'Cartões de Mesa', desc: 'Arte pronta com QR Code para mesas', icon: FileText },
                { title: 'Adesivos para Delivery', desc: 'Adesivos com QR Code para caixas e sacolas', icon: Package },
                { title: 'Artes para Redes Sociais', desc: 'Templates prontos para Instagram e Facebook', icon: Image },
                { title: 'Banner de Inauguração', desc: 'Material de divulgação profissional', icon: Megaphone },
                { title: 'Sua Marca Destacada', desc: 'Todas as artes com logo e cores da sua loja', icon: Palette },
              ].map((item, i) => (
                <Card key={i} className="bg-card hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <item.icon className="h-8 w-8 text-teal-500 mb-3" />
                    <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-6">
              <h4 className="font-semibold text-foreground mb-2">Profissionalismo sem Designer!</h4>
              <p className="text-sm text-muted-foreground">
                Materiais prontos para você imprimir ou usar nas redes sociais. 
                QR Code leva direto pro cardápio - o cliente só escaneia e já pode pedir!
              </p>
            </div>
          </div>
        </section>

        {/* Section: Scripts Personalizados */}
        <section id="scripts" className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gray-500/10 rounded-xl flex items-center justify-center">
                <Code className="h-6 w-6 text-gray-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">Scripts Personalizados</h2>
                  <span className="bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded">AVANÇADO</span>
                  <button
                    onClick={() => copyWhatsAppText('scripts')}
                    className="text-muted-foreground/50 hover:text-green-600 transition-colors p-1"
                    title="Copiar texto para WhatsApp"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-muted-foreground">Integrações avançadas para marketing digital</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[
                { title: 'Pixel do Facebook', desc: 'Rastreie conversões para anúncios no Facebook/Instagram', icon: Target },
                { title: 'Google Analytics', desc: 'Acompanhe o comportamento dos visitantes', icon: BarChart3 },
                { title: 'Google Tag Manager', desc: 'Gerencie todas as tags em um só lugar', icon: Code },
                { title: 'Chatbots Externos', desc: 'Integre seu chatbot de atendimento preferido', icon: MessageCircle },
                { title: 'Remarketing', desc: 'Mostre anúncios para quem visitou sua loja', icon: RefreshCw },
                { title: 'Scripts Customizados', desc: 'Adicione qualquer código JavaScript', icon: Link2 },
              ].map((item, i) => (
                <Card key={i} className="bg-card hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <item.icon className="h-8 w-8 text-gray-500 mb-3" />
                    <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-gray-500/10 border border-gray-500/20 rounded-xl p-6">
              <h4 className="font-semibold text-foreground mb-2">Para Estratégias Avançadas de Ads</h4>
              <p className="text-sm text-muted-foreground">
                Ideal para agências de marketing configurando lojas de clientes ou negócios que investem em anúncios online.
                Adicione pixels de conversão, scripts de remarketing e chatbots externos.
              </p>
            </div>
          </div>
        </section>

        {/* Section: Banners */}
        <section id="banners" className="py-16 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                <Image className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">Banners Promocionais</h2>
                  <button
                    onClick={() => copyWhatsAppText('banners')}
                    className="text-muted-foreground/50 hover:text-green-600 transition-colors p-1"
                    title="Copiar texto para WhatsApp"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-muted-foreground">Destaque suas ofertas</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { title: 'Banners Rotativos', desc: 'Carrossel de imagens na entrada da loja', icon: Image },
                { title: 'Destaques de Ofertas', desc: 'Chame atenção para promoções', icon: Star },
                { title: 'Links para Produtos', desc: 'Direcione para categorias ou produtos', icon: Link2 },
              ].map((item, i) => (
                <Card key={i} className="bg-card hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <item.icon className="h-8 w-8 text-yellow-500 mb-3" />
                    <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Section: Comparativo Final */}
        <section id="comparativo" className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-8">
              Comparativo: iFood vs Mostralo
            </h2>

            <div className="overflow-x-auto mb-12">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border p-4 text-left">Funcionalidade</th>
                    <th className="border border-border p-4 text-center text-destructive">iFood</th>
                    <th className="border border-border p-4 text-center text-green-600">Mostralo</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'Taxa por pedido', ifood: '25%', mostralo: '0%' },
                    { feature: 'Dados do cliente', ifood: 'Deles', mostralo: 'SEUS' },
                    { feature: 'Contatos para remarketing', ifood: '❌', mostralo: '✅' },
                    { feature: 'Domínio próprio', ifood: '❌', mostralo: '✅' },
                    { feature: 'WhatsApp Marketing', ifood: '❌', mostralo: '✅' },
                    { feature: 'Marketing Digital incluso', ifood: '❌', mostralo: '✅' },
                    { feature: 'Entregadores próprios', ifood: '❌', mostralo: '✅' },
                    { feature: 'Promoções livres', ifood: 'Limitado', mostralo: '✅ Ilimitado' },
                    { feature: 'Exportar dados', ifood: '❌', mostralo: '✅' },
                    { feature: 'Impressão automática', ifood: '❌', mostralo: '✅' },
                  ].map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
                      <td className="border border-border p-4 font-medium">{row.feature}</td>
                      <td className="border border-border p-4 text-center text-destructive">{row.ifood}</td>
                      <td className="border border-border p-4 text-center text-green-600 font-semibold">{row.mostralo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* CTA Final */}
            <Card className="bg-gradient-to-r from-primary to-orange-500 text-white">
              <CardContent className="p-8 md:p-12 text-center">
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  Pronto para ter controle total do seu negócio?
                </h3>
                <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
                  Seus dados. Seus clientes. Seu lucro. Comece agora e veja a diferença.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link to="/signup">
                    <Button size="lg" variant="secondary" className="gap-2">
                      Começar Agora <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/#plans">
                    <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                      Ver Planos e Preços
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Copiar Texto para IA */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <h4 className="font-semibold text-foreground">Usar com IA</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Copie todo o conteúdo desta página para usar em prompts de IA como ChatGPT, Claude ou outros assistentes.
                </p>
                <Button 
                  onClick={copyPageText}
                  variant={copied ? "secondary" : "outline"}
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      Texto Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copiar Todo o Texto da Página
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <DashboardFooter />
      </main>

      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <WhatsAppLeadButton />
    </div>
  );
}
