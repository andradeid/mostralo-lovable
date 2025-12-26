import { 
  Smartphone, Package, Truck, MessageCircle, 
  BarChart3, Tag, Calendar, Printer, Palette, Map, Users, Megaphone, 
  Link2, Image, AlertTriangle, QrCode, Code, Volume2, RefreshCw,
  ShoppingCart, ClipboardList, UtensilsCrossed, Monitor, Wallet
} from 'lucide-react';

export const sections = [
  { id: 'porque-sair', title: 'Por Que Sair do iFood', icon: AlertTriangle },
  { id: 'cardapio', title: 'Cardápio Digital', icon: Smartphone },
  { id: 'cardapio-mesa', title: 'Cardápio na Mesa', icon: QrCode },
  { id: 'pedidos', title: 'Central de Pedidos', icon: Package },
  { id: 'entregadores', title: 'Sistema de Entregadores', icon: Truck },
  { id: 'whatsapp', title: 'WhatsApp Marketing', icon: MessageCircle },
  { id: 'sentinela', title: '🎯 SENTINELA - Recompra', icon: RefreshCw },
  { id: 'relatorios', title: 'Relatórios', icon: BarChart3 },
  { id: 'financeiro', title: 'Gestão Financeira', icon: Wallet },
  { id: 'promocoes', title: 'Promoções e Cupons', icon: Tag },
  { id: 'agendados', title: 'Pedidos Agendados', icon: Calendar },
  { id: 'impressao', title: 'Impressão Automática', icon: Printer },
  { id: 'pdv', title: 'PDV (Ponto de Venda)', icon: ShoppingCart },
  { id: 'comandas', title: 'Comandas Digitais', icon: ClipboardList },
  { id: 'garcom', title: 'App do Garçom', icon: Smartphone },
  { id: 'kds', title: 'KDS (Cozinha)', icon: UtensilsCrossed },
  { id: 'painel-digital', title: 'Painel Digital (TV)', icon: Monitor },
  { id: 'chamada-senhas', title: 'Chamada de Senhas', icon: Volume2 },
  { id: 'personalizacao', title: 'Personalização', icon: Palette },
  { id: 'delivery', title: 'Delivery Inteligente', icon: Map },
  { id: 'atendentes', title: 'Gestão de Atendentes', icon: Users },
  { id: 'marketing', title: 'Marketing Digital', icon: Megaphone },
  { id: 'integracoes', title: 'Integrações', icon: Link2 },
  { id: 'banners', title: 'Banners Promocionais', icon: Image },
  { id: 'material-marketing', title: 'Material de Marketing', icon: QrCode },
  { id: 'scripts', title: 'Scripts Personalizados', icon: Code },
];

export const whatsappTexts: Record<string, string> = {
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

  'cardapio-mesa': `📱 *CARDÁPIO NA MESA - QR CODE* 🆕 NOVO!

✅ Cliente escaneia QR Code na mesa
✅ Visualiza cardápio no próprio celular
✅ Adiciona itens à comanda digital
✅ Aprovação opcional pelo garçom
✅ Sem precisar baixar app (PWA)
✅ Rastreamento de consumo em tempo real

📊 *Benefícios:*
• Reduz 70% do tempo de atendimento
• Cliente controla o próprio pedido
• Zero erros de anotação
• Garçom só aprova e entrega
• Aumenta +25% rotatividade de mesas

🔒 *Segurança:*
• Senha por mesa configurável
• Histórico completo de consumo
• Integração com KDS/Cozinha`,

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

  'impressao': `🖨️ *IMPRESSÃO AUTOMÁTICA*

✅ Compatível com impressoras térmicas
✅ Impressão automática ao aceitar pedido
✅ Múltiplas impressoras (cozinha, caixa, bar)
✅ Integração com QZ Tray

📊 *Benefícios:*
• Pedido entra, comanda sai automaticamente
• Reduz erros e agiliza a produção`,

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
};
