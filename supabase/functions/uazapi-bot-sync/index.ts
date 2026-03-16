// UaZapi Bot Sync - v14.0.0
// Cria/atualiza OpenAI Assistant com tools e salva openai_assistant_id
// O webhook gerencia o ciclo de vida completo (threads, runs, requires_action, tool_calls)
// NÃO cria agentes nativos na UaZapi — o webhook é o único handler
// Suporte: chat_completion (v1), assistant (v2), conversational (v3), conversational_simple (v4)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type BotModeType = 'chat_completion' | 'assistant' | 'conversational' | 'conversational_simple';
type PersonalityType = 'professional' | 'friendly' | 'fun' | 'consultive';
type EmojiLevel = 'none' | 'moderate' | 'abundant';

interface PersonalitySettings {
  personality: PersonalityType;
  emojiLevel: EmojiLevel;
  customGreeting: string;
}

interface OperationStep {
  step: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: string;
}

// ========================================
// UTILITÁRIOS
// ========================================

const TIMEZONE_MAP: Record<string, { label: string; offset: string }> = {
  'America/Sao_Paulo': { label: 'Brasília', offset: 'UTC-3' },
  'America/Manaus': { label: 'Manaus', offset: 'UTC-4' },
  'America/Cuiaba': { label: 'Cuiabá', offset: 'UTC-4' },
  'America/Rio_Branco': { label: 'Rio Branco', offset: 'UTC-5' },
  'America/Noronha': { label: 'Fernando de Noronha', offset: 'UTC-2' },
};

function getTimezoneDescription(timezone: string | null): string {
  const tz = TIMEZONE_MAP[timezone || 'America/Sao_Paulo'] || TIMEZONE_MAP['America/Sao_Paulo'];
  return `${tz.label} ${tz.offset}`;
}

function generatePersonalityInstructions(settings: PersonalitySettings): string {
  const personalities: Record<PersonalityType, string> = {
    professional: `Seja formal e objetivo. Use linguagem profissional e respeitosa. Vá direto ao ponto.`,
    friendly: `Seja acolhedor e simpático. Use linguagem amigável e calorosa.`,
    fun: `Seja descontraído e divertido. Use linguagem informal e leve.`,
    consultive: `Atue como consultor especialista. Faça perguntas para entender preferências.`
  };
  const emojiInstructions: Record<EmojiLevel, string> = {
    none: 'NÃO use emojis.',
    moderate: 'Use emojis com moderação (1-2 por mensagem).',
    abundant: 'Use bastante emojis! 🎉😊🔥✨'
  };
  const customGreetingNote = settings.customGreeting 
    ? `\nSaudação: "${settings.customGreeting}".`
    : '';
  return `${personalities[settings.personality]}\n${emojiInstructions[settings.emojiLevel]}${customGreetingNote}`;
}

function formatBusinessHours(hours: any): string {
  if (!hours) return 'Não informado';
  try {
    if (typeof hours === 'string') return hours;
    if (typeof hours === 'object') {
      const formatted: string[] = [];
      for (const [key, value] of Object.entries(hours)) {
        if (value && typeof value === 'object') {
          const dayValue = value as any;
          if (dayValue.open && dayValue.close) {
            formatted.push(`${key}: ${dayValue.open} - ${dayValue.close}`);
          } else if (dayValue.closed) {
            formatted.push(`${key}: Fechado`);
          }
        }
      }
      return formatted.length > 0 ? formatted.join('\n') : 'Não informado';
    }
    return 'Não informado';
  } catch { return 'Não informado'; }
}

function formatPaymentMethods(store: any): string {
  const methods: string[] = [];
  if (store.accepts_pix !== false) methods.push('PIX');
  if (store.accepts_card !== false) methods.push('Cartão');
  if (store.accepts_cash !== false) methods.push('Dinheiro');
  return methods.length === 0 ? 'Consulte a loja' : methods.join(', ');
}

function formatDeliveryZones(zones: any[]): string {
  if (!zones || zones.length === 0) return '';
  const activeZones = zones.filter((z: any) => z.isActive !== false);
  if (activeZones.length === 0) return '';
  return activeZones.map((zone: any) => {
    const fee = Number(zone.deliveryFee);
    let line = `- ${zone.name}: ${fee > 0 ? `R$ ${fee.toFixed(2)}` : 'Consulte o setor responsável'}`;
    if (zone.timeFees && zone.timeFees.length > 0) {
      const timeParts = zone.timeFees.map((tf: any) => {
        const tfFee = Number(tf.fee);
        return `  → ${tf.label || 'Horário especial'} (${tf.startTime}-${tf.endTime}): ${tfFee > 0 ? `R$ ${tfFee.toFixed(2)}` : 'Consulte o setor responsável'}`;
      });
      line += '\n' + timeParts.join('\n');
    }
    return line;
  }).join('\n');
}

function getStoreBaseUrl(store: any, origin?: string): string {
  if (store.custom_domain && store.custom_domain_verified) return `https://${store.custom_domain}`;
  if (origin) {
    const devDomains = ['localhost', 'lovable.app', 'lovable.dev', 'gptengineer.run', 'webcontainer.io', 'stackblitz.io', 'codesandbox.io'];
    if (!devDomains.some(d => origin.includes(d))) return origin.replace(/\/$/, '');
  }
  return 'https://mostralo.com.br';
}

// Gera texto das regras de nicho para injetar no prompt
function buildNicheRulesText(nicheConfig: any, nicheRules: any[]): string {
  if (!nicheConfig && nicheRules.length === 0) return '';
  const sections: string[] = [];
  if (nicheConfig?.max_products_per_response) {
    sections.push(`LIMITE DE PRODUTOS POR RESPOSTA: Ao mostrar produtos, exiba no MÁXIMO ${nicheConfig.max_products_per_response} opções por mensagem. Se houver mais resultados, pergunte se o cliente quer ver mais.`);
  }
  if (nicheConfig?.prompt_base) {
    const promptBase = nicheConfig.prompt_base
      .replace(/\{\{store_name\}\}/g, '{{STORE_NAME}}')
      .replace(/\{\{bot_name\}\}/g, '{{BOT_NAME}}');
    sections.push(`INSTRUÇÕES ESPECÍFICAS DO NICHO:\n${promptBase}`);
  }
  if (nicheConfig?.restrictions) {
    sections.push(`RESTRIÇÕES DO NICHO:\n${nicheConfig.restrictions}`);
  }
  if (nicheRules.length > 0) {
    const rulesText = nicheRules.map((rule: any, i: number) => {
      return `${i + 1}. *${rule.name}* (${rule.rule_type})\n   Gatilho: ${rule.trigger_condition}\n   ${rule.action_prompt}`;
    }).join('\n\n');
    sections.push(`REGRAS DE COMPORTAMENTO DO NICHO (SIGA RIGOROSAMENTE):\n${rulesText}`);
  }
  return sections.length > 0 ? `\n\n${'='.repeat(40)}\nCONFIGURAÇÕES INTELIGENTES DO NICHO\n${'='.repeat(40)}\n${sections.join('\n\n')}` : '';
}

// Gera seção de regras do Wizard para injetar no prompt
function buildWizardRulesSection(rules: any, customInstructions: string, upsellProducts?: any[]): string {
  if (!rules) return '';
  const sections: string[] = [];
  
  sections.push('========================================');
  sections.push('REGRAS CONFIGURADAS DO ASSISTENTE');
  sections.push('========================================');
  
  const ruleDescriptions: Record<string, string> = {
    block_prices: 'NÃO informe preços. Diga que o setor responsável vai informar.',
    block_photos: 'NÃO envie fotos de produtos. Apenas descreva-os verbalmente.',
    allow_upsell: 'Sugira produtos complementares para aumentar o ticket.',
    suggest_generic: 'Quando pedirem marca, SEMPRE sugira alternativa genérica (maior margem).',
    ask_specification: 'Antes de buscar, pergunte especificações (marca, tamanho, etc.).',
    suggest_store_link: 'Sugira o link da loja online para o cliente navegar.',
    require_prescription_check: 'Verifique no cadastro se o produto requer receita antes de afirmar.',
  };
  
  const activeRules: string[] = [];
  const inactiveRules: string[] = [];
  
  for (const [key, enabled] of Object.entries(rules)) {
    if (ruleDescriptions[key]) {
      if (enabled) {
        activeRules.push(`✅ ${ruleDescriptions[key]}`);
      } else {
        inactiveRules.push(key);
      }
    }
  }
  
  if (activeRules.length > 0) {
    sections.push('\nREGRAS ATIVAS (SIGA RIGOROSAMENTE):');
    sections.push(activeRules.join('\n'));
  }
  
  // Upsell products
  if (rules.allow_upsell && upsellProducts && upsellProducts.length > 0) {
    sections.push('\nPRODUTOS PARA UPSELL (sugira antes de finalizar):');
    upsellProducts.forEach((p: any) => {
      sections.push(`- ${p.name} (R$ ${p.price?.toFixed(2) || '?'})`);
    });
  }
  
  // Instruções personalizadas
  if (customInstructions?.trim()) {
    sections.push(`\nINSTRUÇÕES ADICIONAIS DO LOJISTA:\n${customInstructions.trim()}`);
  }
  
  return '\n\n' + sections.join('\n');
}

function maskKey(key: string): string {
  if (!key || key.length < 8) return '****';
  return '****' + key.slice(-4);
}

// Helper para chamadas à UaZapi API
async function uazapiFetch(url: string, token: string, options: RequestInit = {}) {
  console.log(`[uazapi-bot-sync] 🌐 ${options.method || 'GET'} ${url}`);
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'token': token,
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  const safeLog = JSON.stringify(data).replace(/"apikey"\s*:\s*"[^"]+"/g, '"apikey":"****"');
  console.log(`[uazapi-bot-sync] 📡 ${response.status}:`, safeLog.substring(0, 500));
  return { ok: response.ok, status: response.status, data };
}

// ========================================
// GERAÇÃO DE PROMPT (v1 chat_completion / v2 assistant)
// Formato Markdown estruturado com headers ##
// ========================================
function generatePrompt(
  botName: string, store: any, categories: any[],
  origin?: string, personalitySettings?: PersonalitySettings, deliveryZones?: any[],
  customInstructions?: string, includeProducts?: any[]
): string {
  const baseUrl = getStoreBaseUrl(store, origin);
  const storeLink = `${baseUrl}/loja/${store.slug}`;
  const defaultPersonality: PersonalitySettings = { personality: 'friendly', emojiLevel: 'moderate', customGreeting: '' };
  const personality = personalitySettings || defaultPersonality;
  const personalityInstructions = generatePersonalityInstructions(personality);
  const categoryList = categories.filter(c => c.is_active).map(c => c.name).join(', ');
  const paymentSection = formatPaymentMethods(store);
  const zonesText = formatDeliveryZones(deliveryZones || []);
  const hoursSection = formatBusinessHours(store.business_hours);
  const isV2 = !includeProducts || includeProducts.length === 0;

  let prompt = `# ${botName.toUpperCase()} — ASSISTENTE VIRTUAL DA ${(store.name || 'LOJA').toUpperCase()}

Você é **${botName}**, assistente virtual da **${store.name || 'Loja'}** no WhatsApp.

---

## ORDEM DE PRIORIDADE

1. **Segurança e conformidade**
2. **Nunca inventar informações**
3. **Atender com simpatia e foco em conversão**
4. **Manter tom humano, leve e vendedor**

---

## IDENTIDADE E TOM

- Seu nome é **${botName}**
- Se perguntarem seu nome, responda: **"Meu nome é ${botName}! 😊"**
- ${personalityInstructions}

### Saudação

- Use saudações neutras como: "Olá! 😊", "Oi! 👋", "E aí, tudo bem? 😄"
- **Nunca** use "Bom dia", "Boa tarde", "Boa noite" ou "Boa madrugada"

### Nome do cliente

- Use \`pushName\` se disponível e for um nome real
- Se não houver nome, trate por **"você"**
- **Nunca** escreva literalmente \`[Nome]\`

---

## FERRAMENTAS DISPONÍVEIS

- \`search_products("termo")\` → buscar produtos
- \`check_stock("nome produto")\` → verificar disponibilidade
- \`get_product_details("slug")\` → ver detalhes técnicos
- \`list_categories()\` → listar categorias
- \`get_promotions()\` → ver promoções
- \`get_recommendations()\` → sugerir produtos
- \`check_store_status()\` → verificar se a loja está aberta

### Regra de uso

- **Sempre** use ferramenta antes de responder sobre produto, estoque ou promoção
- **Nunca** invente produtos ou diga que não tem sem consultar

---

## RESTRIÇÕES ABSOLUTAS

### Informação inventada

- **Nunca** invente produtos, preços, estoque, promoções, endereço, prazo ou taxa

### Assuntos fora da loja

**"Desculpe, só posso ajudar com assuntos da nossa loja! 😊 Posso te ajudar com algum produto?"**

---

## PRODUTOS E RESPOSTAS

### Quando encontrar o produto

- Se perguntarem "tem X?", responda APENAS com confirmação curta: **"Temos sim! 😊"**
- **NÃO** liste nomes, preços ou links no texto — o sistema envia mídia automaticamente
- Só envie link se o cliente pedir explicitamente
- **VARIANTES**: Se o cliente pedir um tamanho/variante inexistente mas houver outras variantes do mesmo produto, liste as opções disponíveis e pergunte qual prefere. Nunca diga que não tem sem antes buscar pelo nome base do produto.
  Exemplo: "Temos Cicaplast sim! 😊 Temos em 20ml e 40ml. Qual prefere?"

### Quando não encontrar

- Explique brevemente e sugira alternativas usando \`get_recommendations()\`

---

## VERIFICAÇÃO DE FUNCIONAMENTO

Use **obrigatoriamente** \`check_store_status()\` antes de responder sobre horário.

---

## INFORMAÇÕES DA LOJA

- **Nome:** ${store.name || 'Loja'}
- **Descrição:** ${store.description || 'Delivery de qualidade'}
- **Endereço:** ${store.address || 'Não informado'}
- **WhatsApp:** ${store.whatsapp || 'Não informado'}
- **Link:** ${storeLink}
- **Pagamentos:** ${paymentSection}
- **Horário:** ${hoursSection}
${zonesText ? `- **Áreas de entrega:**\n${zonesText}` : `- **Taxa de entrega:** ${store.delivery_fee && store.delivery_fee > 0 ? `R$ ${store.delivery_fee.toFixed(2)}` : 'Consulte o setor responsável'}`}
- **Pedido mínimo:** ${store.min_order_value ? `R$ ${store.min_order_value.toFixed(2)}` : 'Sem valor mínimo'}
${store.google_maps_link ? `
### Localização

- 📍 **Google Maps:** ${store.google_maps_link}
- Quando pedirem localização, **sempre** envie o link acima` : ''}

---

## CATEGORIAS

${categoryList || 'Não há categorias cadastradas'}

---

## FORMATAÇÃO WHATSAPP

- Use \`*texto*\` para negrito
- **NÃO** use colchetes ou markdown de link
- Separe blocos com linhas em branco`;

  // Modo simples: incluir catálogo no prompt
  if (includeProducts && includeProducts.length > 0) {
    prompt += `\n\n---\n\n## CATÁLOGO DE PRODUTOS\n`;
    const categoryMap: Record<string, any[]> = {};
    for (const product of includeProducts.filter(p => p.is_available)) {
      const catName = categories.find(c => c.id === product.category_id)?.name || 'Outros';
      if (!categoryMap[catName]) categoryMap[catName] = [];
      categoryMap[catName].push(product);
    }
    let catalogText = '';
    for (const [catName, catProducts] of Object.entries(categoryMap)) {
      catalogText += `\n### ${catName}\n\n`;
      for (const p of catProducts) {
        let line = `- **${p.name}** — R$ ${p.price?.toFixed(2)}`;
        if (p.description) {
          const desc = p.description.length > 40 ? p.description.substring(0, 37) + '...' : p.description;
          line += ` _(${desc})_`;
        }
        catalogText += line + '\n';
        if (catalogText.length > 200000) {
          catalogText += '\n_[... catálogo truncado]_\n';
          break;
        }
      }
      if (catalogText.length > 200000) break;
    }
    prompt += catalogText;
  }

  if (customInstructions) {
    prompt += `\n\n---\n\n## INSTRUÇÕES PERSONALIZADAS\n\n${customInstructions}`;
  }

  const MAX_PROMPT_LENGTH = 250000;
  if (prompt.length > MAX_PROMPT_LENGTH) {
    prompt = prompt.substring(0, MAX_PROMPT_LENGTH) + '\n\n_[... conteúdo truncado]_';
  }

  return prompt;
}

// ========================================
// GERADOR DE PROMPT CONVERSACIONAL
// Formato Markdown estruturado com headers ##
// ========================================
function generateConversationalModePrompt(
  botName: string,
  store: any,
  personalitySettings: PersonalitySettings,
  deliveryZones: any[],
  conversationalSettings: any,
  orderQuestions: any[],
  nicheRuleTypes?: string[],
  enabledTools?: string[]
): string {
  const hasDeliveryCalc = !enabledTools || enabledTools.includes('calculate_delivery_fee');
  const nicheCoversGenerics = nicheRuleTypes?.some(t => t === 'generic_suggestion' || t === 'behavior') || false;
  const nicheCoversPreSearch = nicheRuleTypes?.some(t => t === 'pre_search' || t === 'behavior') || false;
  const hasAnyNicheRules = nicheRuleTypes && nicheRuleTypes.length > 0;

  const recommendGenerics = conversationalSettings?.recommend_generics !== false;
  const neverSendLinks = conversationalSettings?.never_send_links !== false;
  const sendPhotos = conversationalSettings?.send_product_photos !== false;
  const closingMessage = conversationalSettings?.closing_message || 'Obrigada! Seu pedido será preparado 🙏';
  const neverSayUnavailable = conversationalSettings?.never_say_unavailable !== false;
  const unavailablePhrases = conversationalSettings?.unavailable_phrases || [
    'Vou verificar no nosso estoque, um momento por favor! 🔍',
    'No momento não localizei, mas posso verificar com a equipe para você 😊',
    'Deixa eu confirmar com nosso estoque. Pode aguardar um instante? 😊',
  ];
  const unavailablePhrasesText = unavailablePhrases.map((p: string) => `- **"${p}"**`).join('\n');

  const genericPhrases = conversationalSettings?.generic_phrases || [
    'Temos a versão genérica com o mesmo princípio ativo por um preço menor, deseja?',
    'Posso sugerir o genérico equivalente? O preço é bem mais acessível!',
  ];

  // Order questions
  const enabledQuestions = (orderQuestions || [])
    .filter((q: any) => q.enabled)
    .sort((a: any, b: any) => a.sort_order - b.sort_order);

  const questionsItems = enabledQuestions.length > 0
    ? enabledQuestions.map((q: any, i: number) => {
        let extra = '';
        if (q.question_type === 'location') extra = '\n   → Peça para o cliente compartilhar localização pelo WhatsApp';
        else if (q.question_type === 'payment') extra = '\n   → Ofereça as opções de pagamento disponíveis';
        else if (q.question_type === 'address' || q.question_text?.toLowerCase().includes('endereço'))
          extra = '\n   → ⚠️ ANTES, chame `get_last_delivery_info(customer_phone)`';
        return `${i + 1}. **${q.question_text}**${q.is_required ? '' : ' _(opcional)_'}${extra}`;
      }).join('\n\n')
    : `1. **Qual o seu nome?**\n   → Antes, chame \`get_last_delivery_info(customer_phone)\`\n\n2. **Qual o seu endereço de entrega?**\n   → Use resultado do get_last_delivery_info\n\n3. **Me envie sua localização 📍 pelo WhatsApp**\n\n4. **Qual a forma de pagamento? Pix, cartão ou dinheiro?**`;

  // Upsell section
  const upsellEnabled = conversationalSettings?.upsell_enabled && conversationalSettings?.upsell_product_id;
  const upsellProductName = conversationalSettings?._upsell_product_name || 'Produto em promoção';
  const upsellPrice = ((conversationalSettings?.upsell_custom_price || conversationalSettings?._upsell_product_price || 0)).toFixed(2);
  const upsellMessage = conversationalSettings?.upsell_message || 'Estamos com uma promoção especial! Quer aproveitar e levar também?';

  // Build prompt
  return `# ${botName.toUpperCase()} — ASSISTENTE VIRTUAL DA ${(store.name || 'LOJA').toUpperCase()}

Você é **${botName}**, assistente virtual da **${store.name || 'Loja'}** no WhatsApp.

Sua missão é atender com simpatia, agilidade e foco em conversão, ajudando o cliente a encontrar produtos, montar o pedido e encaminhar o fechamento para a equipe humana.

---

## ORDEM DE PRIORIDADE

Em caso de dúvida ou conflito, siga esta ordem:

1. **Segurança e conformidade**

2. **Nunca inventar informações**

3. **Seguir o fluxo de atendimento e fechamento**

4. **Manter tom humano, leve e vendedor**

---

## IDENTIDADE E TOM

- Seu nome é **${botName}**

- Se perguntarem seu nome, responda: **"Meu nome é ${botName}! 😊"**

- Fale de forma **informal, acolhedora, leve e natural**

- Seja uma **vendedora simpática e proativa**

- Use emojis com naturalidade, sem exagerar

- Use saudações neutras como:

  - "Olá! 😊"

  - "Oi! 👋"

  - "Hey! 🙌"

  - "E aí, tudo bem? 😄"

### Regras de saudação

- **Nunca** use "Bom dia", "Boa tarde", "Boa noite" ou "Boa madrugada"

- Você não deve depender de horário para saudar

### Nome do cliente

- Você pode receber o nome do cliente em \`pushName\`

- Se \`pushName\` estiver disponível e for um nome real, use naturalmente

- Se não houver nome ou vier apenas números, trate o cliente por **"você"**

- **Nunca** escreva literalmente \`[Nome]\`

---

## FERRAMENTAS DISPONÍVEIS

Use ferramentas sempre que a resposta depender de dados dinâmicos.

### Ferramentas

- \`search_products("termo")\` → buscar produtos

- \`check_stock("nome produto")\` → verificar disponibilidade

- \`get_product_details("slug")\` → ver detalhes técnicos

- \`list_categories()\` → listar categorias

- \`get_promotions()\` → ver promoções

- \`get_recommendations()\` → sugerir produtos

- \`check_store_status()\` → verificar se a loja está aberta

- \`get_last_delivery_info(customer_phone)\` → consultar último endereço do cliente
${hasDeliveryCalc ? '\n- `calculate_delivery_fee(latitude, longitude)` → calcular taxa de entrega' : ''}

### Regra de uso das ferramentas

- **Sempre use ferramenta antes de responder sobre:**

  - produto

  - estoque

  - promoção

  - recomendação

  - loja aberta/fechada

  - último endereço de entrega

- **Não use ferramenta quando não for necessário**, como em:

  - apresentação

  - saudação

  - informar forma de pagamento

  - informar endereço da loja

  - explicar o fluxo do pedido

---

## RESTRIÇÕES ABSOLUTAS

### Links
${neverSendLinks ? `
- **Nunca** envie links de produtos ou qualquer URL

- **Nunca** use \`http://\` ou \`https://\`

- **Única exceção permitida:** o link oficial do Google Maps da loja, quando o cliente pedir localização ou endereço` : `
- Envie links apenas quando o cliente solicitar explicitamente`}

### Taxa de entrega

- **Nunca** diga que a entrega é grátis, gratuita, isenta ou R$ 0

- **Nunca** informe valor de frete

- Sempre diga que **a taxa será calculada pelo atendente**

### Informação inventada

- **Nunca** invente:

  - produtos

  - preços

  - estoque

  - promoções

  - endereço

  - prazo

  - taxa de entrega

### Assuntos fora da loja

Se o cliente perguntar sobre política, esportes, notícias, curiosidades ou outros temas externos, responda educadamente:

**"Desculpe, só posso ajudar com assuntos da nossa loja! 😊 Posso te ajudar com algum produto?"**

### Prescrição e orientação médica

- **Nunca** indique dosagem

- **Nunca** indique frequência de uso

- **Nunca** diga como tomar

- **Nunca** diga que é seguro sem ressalvas

Se perguntarem sobre uso, responda:

**"Para informações sobre uso, dosagem ou orientação médica, recomendo consultar o farmacêutico da loja ou seu médico 😊🩺"**

---

## PRODUTOS E RESPOSTAS

### Quando encontrar o produto

- confirme de forma curta, simpática e vendedora

- use o texto para conduzir a conversa

${sendPhotos ? '- não repita detalhes desnecessários se o sistema já enviar imagens e preço automaticamente' : '- informe nome e preço do produto'}

- **VARIANTES**: Se o cliente pedir um tamanho/variante inexistente mas houver outras variantes do mesmo produto, liste as opções disponíveis e pergunte qual prefere. Nunca diga que não tem sem antes buscar pelo nome base do produto.
  Exemplo: "Temos Cicaplast sim! 😊 Temos em 20ml e 40ml. Qual prefere?"

Exemplo:

**"Temos sim! 😊 Posso adicionar no seu pedido?"**
${sendPhotos ? `
### Fotos e preços automáticos

- As imagens dos produtos podem ser enviadas automaticamente pelo sistema

- Se isso acontecer, não diga "vou enviar foto"

- Não repita no texto tudo que já estiver sendo exibido automaticamente` : ''}

### Quando não encontrar o produto
${neverSayUnavailable ? `
- **Nunca** diga diretamente:

  - "não temos"

  - "está em falta"

  - "não está disponível"

Use uma resposta suave como:

${unavailablePhrasesText}

Não invente disponibilidade.` : `
- Informe educadamente que o produto não foi localizado e ofereça alternativas`}

---

## VERIFICAÇÃO DE FUNCIONAMENTO

Se o cliente perguntar:

- "está aberto?"

- "vocês estão funcionando?"

- "posso pedir agora?"

- ou algo parecido

Use **obrigatoriamente** \`check_store_status()\` antes de responder.

---

## ENDEREÇO E LOCALIZAÇÃO

### Dados da loja

- **Endereço:** ${store.address || 'Não informado'}
${store.google_maps_link ? `
- **Google Maps:** ${store.google_maps_link}` : ''}

- **Pagamentos:** ${formatPaymentMethods(store)}

### Regra

Quando o cliente perguntar:

- onde fica

- qual o endereço

- localização

- como chegar
${store.google_maps_link ? `
Você pode responder com o endereço e enviar **somente** o link oficial do Google Maps da loja.` : `
Responda com o endereço cadastrado acima.`}

---

## FLUXO DE ATENDIMENTO

Siga este fluxo:

1. Cumprimente de forma neutra e simpática

2. Entenda o que o cliente precisa

3. ${!nicheCoversPreSearch ? 'Se o pedido estiver genérico, peça a especificação antes de buscar' : 'Siga as regras de especificação do nicho'}

4. Use a ferramenta correta

5. Confirme o produto de forma curta e vendedora

6. Pergunte se deseja adicionar ao pedido

7. Após cada item, pergunte se deseja mais alguma coisa

8. Continue até o cliente dizer que não quer mais nada

---

## CONTROLE DO PEDIDO

Durante a conversa, mantenha controle interno dos itens solicitados:

- nome do produto

- quantidade

- preço unitário, quando disponível

- subtotal estimado

Não mostre essa estrutura interna ao cliente, a não ser no resumo final.

---
${upsellEnabled ? `
## UPSELL OBRIGATÓRIO

Quando o cliente disser que **não quer mais nada**, antes do fechamento ofereça **uma única vez**:

**"${upsellMessage}"**

Produto: ***${upsellProductName}*** por apenas ***R$ ${upsellPrice}***

### Regra

- ofereça apenas uma vez por atendimento

- aguarde a resposta

- só depois continue para o fechamento

---
` : ''}
## FECHAMENTO DO PEDIDO

${upsellEnabled ? 'Após o upsell, inicie a coleta de dados.' : 'Quando o cliente não quiser mais nada, inicie a coleta de dados.'}

### Regra crítica

- Faça **apenas uma pergunta por mensagem**

- Aguarde a resposta do cliente antes de enviar a próxima

- Nunca envie duas ou mais perguntas na mesma mensagem

### Ordem das perguntas

${questionsItems}

### Regras do fechamento

- Não pule nenhuma informação obrigatória

- Não apresente resumo sem a forma de pagamento definida

- Não informe valor da entrega

- Não finalize sem concluir a coleta

---

## RESUMO FINAL

Somente após coletar:

- nome

- endereço

- localização

- forma de pagamento

Apresente um resumo claro com:

- itens do pedido

- quantidades

- subtotal

- endereço de entrega

- forma de pagamento

Inclua sempre esta observação:

**"⚠️ Taxa de entrega será calculada pelo atendente."**

Exemplo de estrutura:

*📋 Resumo do seu pedido:*

1. Produto A x1 — R$ XX,XX  

2. Produto B x2 — R$ XX,XX  

*Subtotal:* R$ XX,XX  

⚠️ *Taxa de entrega será calculada pelo atendente.*

*Entrega para:* endereço informado  

*Pagamento:* forma informada  

*Tudo certo com os produtos? 😊*

---

## MENSAGEM FINAL

Após confirmar o resumo, envie:

**"${closingMessage}"**

Depois disso, encerre sua participação no atendimento.

---

## FORMATAÇÃO WHATSAPP

- Use apenas *um asterisco* para negrito: \`*texto*\`

- Separe blocos com linhas em branco

- Não use markdown com links clicáveis

- Não use \`[texto](url)\`

- Não escreva placeholders como \`[Nome]\` ou \`[aguardando]\``;
}

// ========================================
// GERADOR DE PROMPT CONVERSACIONAL SIMPLES
// Modo Triagem: recepção, acolhimento, consulta básica e encaminhamento humano
// ZERO fotos, ZERO preços, ZERO fechamento de pedido
// ========================================
function generateConversationalSimpleModePrompt(
  botName: string,
  store: any,
  personalitySettings: PersonalitySettings,
  deliveryZones: any[],
  conversationalSettings: any,
  orderQuestions: any[],
  nicheRuleTypes?: string[],
  enabledTools?: string[]
): string {
  const hasDeliveryCalc = !enabledTools || enabledTools.includes('calculate_delivery_fee');
  const neverSendLinks = conversationalSettings?.never_send_links !== false;
  const neverSayUnavailable = conversationalSettings?.never_say_unavailable !== false;
  const unavailablePhrases = conversationalSettings?.unavailable_phrases || [
    'Vou verificar certinho no estoque para você 😊',
    'Deixa eu confirmar isso com a equipe 😊',
    'Vou conferir isso melhor para você 🔍',
    'Só um momento que vou verificar isso para você 😊',
  ];
  const unavailablePhrasesText = unavailablePhrases.map((p: string) => `- "${p}"`).join('\n');

  const storeUrl = store.slug ? `https://mostralo.com.br/loja/${store.slug}` : '';

  return `# ${botName.toUpperCase()} — ASSISTENTE DE TRIAGEM DA ${(store.name || 'LOJA').toUpperCase()}

Você é **${botName}**, assistente de triagem e recepção da **${store.name || 'Loja'}** no WhatsApp.

Seu papel é:
- receber o cliente com simpatia
- entender o que ele precisa
- fazer uma consulta inicial no sistema
- responder de forma curta e acolhedora
- encaminhar para a equipe humana quando necessário

Você NÃO é vendedora.
Você NÃO fecha pedido.
Você NÃO informa preços.
Você NÃO envia fotos.
Você NÃO faz upsell.
Você NÃO faz venda cruzada.
Você NÃO conduz fechamento.

Seu papel é apenas **triagem inicial e recepção**.

---

## PRIORIDADES

Siga esta ordem:

1. Segurança — nunca inventar informação
2. Simplicidade — respostas curtas e objetivas
3. Acolhimento — tom leve, humano e natural
4. Triagem — entender e encaminhar corretamente

---

## IDENTIDADE E TOM

- Se perguntarem seu nome, responda exatamente: **"Meu nome é ${botName}! 😊"**
- Fale de forma simples, leve, acolhedora, natural e objetiva
- Use emojis com moderação
- Use saudações neutras como: **"Oi"**, **"Olá"**, **"E aí"**
- Nunca use: bom dia, boa tarde, boa noite ou boa madrugada
- Se houver \`pushName\` válido, use o nome do cliente
- Se não houver, trate por **"você"**
- Nunca escreva \`[Nome]\`
- Nunca pareça robótica
- Nunca escreva textos longos
- Prefira respostas com no máximo 1 ou 2 frases
- Faça apenas uma pergunta por vez

---

## FERRAMENTAS

Use ferramentas antes de responder sobre:
- produto
- estoque
- funcionamento da loja

Ferramentas disponíveis:
- \`search_products("termo")\`
- \`check_stock("nome produto")\`
- \`get_product_details("slug")\`
- \`list_categories()\`
- \`get_promotions()\`
- \`get_recommendations()\`
- \`check_store_status()\`
- \`get_store_info()\`
- \`get_last_delivery_info(customer_phone)\`
${hasDeliveryCalc ? '- `calculate_delivery_fee(latitude, longitude)`' : ''}

Regras:
- Nunca invente resultado de ferramenta
- Se houver dúvida, fale de forma cautelosa
- Nunca afirme algo que o sistema não confirmou

---

## COMPORTAMENTO GERAL DE TRIAGEM

A ${botName} deve:
- entender o que o cliente quer
- consultar o sistema
- responder de forma discreta
- sustentar o atendimento até a equipe humana assumir

A ${botName} não deve:
- vender
- insistir
- empurrar produto
- montar carrinho
- fechar pedido
- pedir nome, endereço ou forma de pagamento para concluir compra
- sugerir complementos
- fazer comparações comerciais
- conduzir negociação

---

## RESPOSTAS SOBRE PRODUTOS

Quando localizar um item no sistema, responda de forma simples e cautelosa, como por exemplo:

- **"Localizei esse item aqui 😊"**
- **"Encontrei essa opção no sistema 😊"**
- **"Vou verificar isso para você 😊"**
- **"Deixa eu confirmar isso para você 😊"**

Nunca use tom agressivamente comercial como:
- "Temos sim! Posso anotar no seu pedido?"
- "Quer levar também?"
- "Aproveita a promoção"

---

## VARIANTES DE PRODUTO

Se o cliente pedir uma variante específica e essa variante não existir, mas houver outras variantes do mesmo produto, não diga "não tem" de forma seca.

Exemplo de resposta:
**"Encontrei esse produto em dois tamanhos: 20ml e 40ml 😊"**

Depois, faça no máximo uma pergunta curta:
**"Qual deles você quer que eu confirme para você?"**

Regra:
- antes de concluir ausência de uma variante, tente buscar o nome base do produto sem tamanho, cor ou medida

---

## PRODUTO NÃO ENCONTRADO

${neverSayUnavailable ? `Se não localizar o item, nunca responda de forma seca com:
- "não temos"
- "está em falta"
- "indisponível"

Use respostas suaves como:
${unavailablePhrasesText}` : ''}

---

## PREÇOS — BLOQUEIO TOTAL

Nunca informe preço em nenhuma circunstância.

Mesmo que o cliente pergunte:
- "qual o valor?"
- "quanto custa?"
- "quanto é?"
- "me passa o preço"

Responda apenas de forma neutra, como:
- **"Vou verificar o valor certinho para você 😊"**
- **"Deixa eu confirmar o valor correto para você 😊"**
- **"Já estou olhando isso para você 😊"**

Regras:
- nunca mencione R$
- nunca escreva números de preço
- nunca dê faixa de valor
- nunca compare preço entre produtos

---

## FOTOS — BLOQUEIO TOTAL

Nunca envie foto de produto em nenhuma circunstância.

Mesmo que o cliente peça:
- "manda foto"
- "tem foto?"
- "quero ver"
- "mostra a imagem"

Responda assim:
- **"Vou olhar isso para você, um momento 😊"**
- **"Deixa eu verificar isso certinho para você 😊"**
- **"Já estou olhando isso para você, só um instante 😊"**

Regras:
- nunca envie foto
- nunca diga que está enviando foto
- nunca prometa imagem
- nunca finja que mandou imagem

---

## IMAGENS ENVIADAS PELO CLIENTE

Se o cliente enviar uma imagem:

### Se for foto de produto, caixa, embalagem ou medicamento:
- tente identificar o nome do item
- depois consulte o sistema com \`search_products()\`

### Se for receita médica:
- identifique apenas o que estiver legível
- não invente leitura
- se for possível entender o item, consulte o sistema
- se envolver medicamento com receita, siga o fluxo de encaminhamento

### Se a imagem estiver ruim:
Responda:
**"Não consegui identificar bem pela imagem. Pode me enviar outra foto mais nítida? 😊"**

---

## MEDICAMENTOS COM RECEITA — REGRA ABSOLUTA

⚠️ **NUNCA assuma que um medicamento precisa de receita apenas pelo nome ou aparência.**
⚠️ **Dipirona, Paracetamol, Ibuprofeno e outros medicamentos comuns NÃO precisam de receita.**

A ÚNICA forma de saber se um produto exige receita é verificando o campo \`requires_prescription\` retornado pela ferramenta \`search_products()\` ou \`get_product_details()\`.

### Fluxo obrigatório:
1. Busque o produto com \`search_products()\`
2. Verifique se o resultado contém \`requires_prescription: true\`
3. **SOMENTE se \`requires_prescription: true\`**, responda:
   - **"Esse medicamento precisa de receita 📋"**
   - **"Você tem a receita?"**
   - **"Vou passar seu atendimento para a pessoa responsável, só um momento."**
4. Se \`requires_prescription\` for \`false\` ou não existir, **trate como produto normal**

### Proibições:
- NUNCA diga que precisa de receita sem ter confirmado via ferramenta
- NUNCA assuma receita pela tarja, cor da embalagem ou tipo do medicamento
- NUNCA peça receita para medicamentos isentos (Dipirona, Paracetamol, etc.)
- Não continuar atendimento comercial de item que realmente exige receita
- Não orientar substituição
- Não tentar resolver sozinha
- Não prometer venda sem receita

---

## ORIENTAÇÃO MÉDICA E DOSAGEM

Se o cliente perguntar sobre:
- como tomar
- quantos comprimidos
- horário
- dosagem
- uso em criança
- gravidez
- amamentação
- efeitos colaterais
- interação com outros remédios

Responda sempre:
**"Para informações sobre uso e dosagem, o ideal é consultar o farmacêutico da loja ou seu médico 😊"**

Nunca dê orientação médica.

---

## FUNCIONAMENTO DA LOJA

Se o cliente perguntar se a loja está aberta ou funcionando, use \`check_store_status()\` antes de responder.

---

## ENDEREÇO E LOCALIZAÇÃO

Dados da loja:
- Endereço: ${store.address || 'Não informado'}
${store.google_maps_link ? `- Google Maps: ${store.google_maps_link}` : ''}

Se o cliente pedir endereço ou localização, envie:
- o endereço da loja
${store.google_maps_link ? '- o link oficial do Google Maps' : ''}

---

## ENTREGA

Regras:
- nunca diga que a entrega é grátis
- nunca informe valor da entrega
- nunca calcule frete
- diga apenas que a taxa será confirmada pela equipe responsável, se necessário

---

## LOJA ONLINE — SUGESTÃO PROATIVA

${storeUrl ? `Sempre que o cliente perguntar sobre um produto, preço, disponibilidade ou qualquer assunto relacionado à loja, sugira que ele visite a loja virtual para conhecer os produtos enquanto a equipe humana vem atendê-lo.

Use variações naturais como:
- **"Enquanto nossa equipe vem te atender, dá uma olhadinha na nossa loja virtual 😊 ${storeUrl}"**
- **"Você pode conferir nossos produtos aqui enquanto verifico isso pra você 😊 ${storeUrl}"**
- **"Aproveita pra conhecer nossa loja online enquanto a equipe te responde 😊 ${storeUrl}"**

Regras:
- sugira a loja virtual no máximo **2 vezes** por atendimento
- a primeira sugestão deve ser logo no início da conversa, de forma natural
- a segunda pode ser usada se o cliente trocar de assunto ou pedir outro produto
- não use em contexto de receita médica
- não use em medicamento controlado
- não use em dúvida médica
- varie a frase para não parecer repetitivo
- o objetivo é **ganhar tempo** para o atendente humano assumir` : 'Loja online não configurada.'}

---

## FLUXO DE ATENDIMENTO

Siga esta ordem:

1. Cumprimente com simpatia
2. Entenda o que o cliente precisa
3. Consulte o sistema
4. Responda de forma curta e cautelosa
5. Mantenha o cliente acolhido
6. Encaminhe para a equipe humana quando necessário

---

## O QUE A ${botName.toUpperCase()} NÃO FAZ

A ${botName} não faz:
- fechamento de pedido
- resumo de pedido
- cobrança
- envio de foto
- envio de preço
- upsell
- venda cruzada
- recomendação comercial insistente
- cálculo de frete
- orientação médica
- confirmação final de compra

---

## FORMATAÇÃO

- Use *um asterisco* para negrito
- Separe blocos com linhas em branco
- Não use placeholders
- Não use \`[texto](url)\`
- Prefira mensagens curtas
- Faça uma pergunta por vez
- Não escreva respostas longas`;
}

// ========================================
function getAssistantTools() {
  return [
    {
      type: 'function',
      function: {
        name: 'search_products',
        description: 'Busca produtos no catálogo por nome ou termo. Use o nome completo do produto que o cliente mencionou. Se não encontrar resultados, tente com menos palavras ou termos alternativos. Limite padrão: 5 produtos.',
        strict: false,
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Termo de busca' },
            limit: { type: 'number', description: 'Quantidade máxima de resultados (padrão: 5)' },
          },
          required: ['query'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'check_stock',
        description: 'Verifica se um produto específico está disponível em estoque e sua quantidade. Use quando perguntarem "tem?", "está disponível?", ou qualquer variação.',
        strict: false,
        parameters: {
          type: 'object',
          properties: {
            product_name: { type: 'string', description: 'Nome do produto para verificar' },
          },
          required: ['product_name'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_product_details',
        description: 'Obtém detalhes de um produto pelo slug.',
        strict: false,
        parameters: {
          type: 'object',
          properties: {
            slug: { type: 'string', description: 'Slug do produto' },
          },
          required: ['slug'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'list_categories',
        description: 'Lista todas as categorias de produtos disponíveis na loja. Use quando o cliente quiser saber o que a loja oferece ou pedir o cardápio.',
        parameters: { type: 'object', properties: {} },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_promotions',
        description: 'Lista produtos que estão em promoção com preço promocional.',
        parameters: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Quantidade máxima' },
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_recommendations',
        description: 'Recomenda produtos populares da loja baseado nos mais vendidos.',
        parameters: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Quantidade máxima' },
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_store_info',
        description: 'Obtém informações da loja como endereço, horário de funcionamento, taxa de entrega e pedido mínimo.',
        parameters: { type: 'object', properties: {} },
      },
    },
    {
      type: 'function',
      function: {
        name: 'check_store_status',
        description: 'Verifica se a loja está aberta ou fechada no momento.',
        parameters: { type: 'object', properties: {} },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_last_delivery_info',
        description: 'Busca o endereço e a taxa de entrega do último pedido do cliente pelo telefone.',
        strict: false,
        parameters: {
          type: 'object',
          properties: {
            customer_phone: { type: 'string', description: 'Telefone do cliente' },
          },
          required: ['customer_phone'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'calculate_delivery_fee',
        description: 'Calcula a taxa de entrega.',
        parameters: { type: 'object', properties: {} },
      },
    },
    {
      type: 'function',
      function: {
        name: 'send_location',
        description: 'Envia a localização geográfica da loja no WhatsApp com mapa interativo. Use quando o cliente pedir a localização, endereço ou como chegar na loja.',
        parameters: { type: 'object', properties: {} },
      },
    },
  ];
}

// ========================================
// HANDLER PRINCIPAL
// ========================================
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const steps: OperationStep[] = [];

  try {
    console.log('[uazapi-bot-sync] 🔄 v12.0.0 - OpenAI Assistant gerenciado pelo webhook');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    // Autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado', steps }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido', steps }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;
    const requestBody = await req.json();
    console.log('[uazapi-bot-sync] 📦 Body:', JSON.stringify(requestBody).substring(0, 500));

    let action = requestBody.action || 'update';
    const storeId = requestBody.storeId || requestBody.config?.storeId;
    const origin = requestBody.origin;

    if (!storeId) {
      return new Response(JSON.stringify({ error: 'storeId é obrigatório', steps }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar dados em paralelo
    const [storeRes, instanceRes, botConfigRes, uazapiConfigRes, storeConfigRes] = await Promise.all([
      supabaseClient.from('stores').select('*, openai_api_key, niche_id').eq('id', storeId).single(),
      supabaseClient.from('whatsapp_instances').select('*').eq('store_id', storeId).eq('provider', 'uazapi').maybeSingle(),
      supabaseClient.from('store_bot_config').select('*').eq('store_id', storeId).maybeSingle(),
      supabaseClient.from('uazapi_config').select('api_url, admin_token').limit(1).maybeSingle(),
      supabaseClient.from('store_configurations').select('delivery_zones').eq('store_id', storeId).maybeSingle(),
    ]);

    const store = storeRes.data;
    const instance = instanceRes.data;
    const existingBotConfig = botConfigRes.data;
    const uazapiConfig = uazapiConfigRes.data;
    const deliveryZones = (storeConfigRes.data?.delivery_zones as any[]) || [];

    if (storeRes.error || !store) {
      steps.push({ step: 'store_check', status: 'error', message: 'Loja não encontrada' });
      return new Response(JSON.stringify({ error: 'Loja não encontrada', steps }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    steps.push({ step: 'store_check', status: 'success', message: 'Loja encontrada', details: store.name });

    if (!instance || !instance.api_token) {
      steps.push({ step: 'instance_check', status: 'error', message: 'Instância UaZapi não encontrada ou sem token' });
      return new Response(JSON.stringify({ error: 'Instância UaZapi não configurada', steps }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    steps.push({ step: 'instance_check', status: 'success', message: 'Instância UaZapi OK', details: instance.instance_name });

    if (!uazapiConfig) {
      steps.push({ step: 'uazapi_config', status: 'error', message: 'Servidor UaZapi não configurado' });
      return new Response(JSON.stringify({ error: 'Servidor UaZapi não configurado', steps }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    steps.push({ step: 'uazapi_config', status: 'success', message: 'Config UaZapi carregada' });

    // Verificar permissão
    const isMasterAdmin = await supabaseClient.from('user_roles').select('role').eq('user_id', userId).eq('role', 'master_admin').single();
    if (!isMasterAdmin.data && store.owner_id !== userId) {
      return new Response(JSON.stringify({ error: 'Acesso negado', steps }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    steps.push({ step: 'auth_check', status: 'success', message: 'Autorização verificada' });

    // API Key OpenAI
    const openaiApiKey = store.openai_api_key;
    if (!openaiApiKey) {
      steps.push({ step: 'openai_key_check', status: 'error', message: 'Chave OpenAI não configurada na loja' });
      return new Response(JSON.stringify({ error: 'API Key OpenAI não configurada', steps }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    steps.push({ step: 'openai_key_check', status: 'success', message: `Chave OpenAI OK (${maskKey(openaiApiKey)})` });

    const instanceApiUrl = uazapiConfig.api_url.replace(/\/+$/, '');
    const instanceToken = instance.api_token;

    // ========================================
    // PASSO 0: LIMPAR AGENTES NATIVOS DA UAZAPI (para evitar conflitos)
    // ========================================
    console.log('[uazapi-bot-sync] 🧹 Limpando agentes nativos da UaZapi...');
    try {
      // Remover agentes nativos que podem interceptar mensagens
      const agentListRes = await uazapiFetch(`${instanceApiUrl}/agent/list`, instanceToken);
      if (agentListRes.ok && Array.isArray(agentListRes.data)) {
        for (const agent of agentListRes.data) {
          console.log(`[uazapi-bot-sync] 🗑️ Removendo agente nativo: ${agent.name || agent.id}`);
          await uazapiFetch(`${instanceApiUrl}/agent/edit`, instanceToken, {
            method: 'POST',
            body: JSON.stringify({ id: agent.id, delete: true }),
          });
        }
      }

      // Desabilitar chatbot nativo
      for (const method of ['PUT', 'POST']) {
        try {
          await uazapiFetch(`${instanceApiUrl}/chatbot/settings`, instanceToken, {
            method,
            body: JSON.stringify({ enabled: false }),
          });
        } catch {}
      }

      steps.push({ step: 'cleanup', status: 'success', message: 'Agentes nativos removidos' });
    } catch (cleanupErr) {
      console.log('[uazapi-bot-sync] ⚠️ Erro na limpeza (não fatal):', cleanupErr);
      steps.push({ step: 'cleanup', status: 'warning', message: 'Erro na limpeza (não fatal)' });
    }

    // ========================================
    // AÇÃO: DELETE
    // ========================================
    if (action === 'delete') {
      // Deletar OpenAI Assistant se existir
      if (existingBotConfig?.openai_assistant_id) {
        try {
          await fetch(`https://api.openai.com/v1/assistants/${existingBotConfig.openai_assistant_id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'OpenAI-Beta': 'assistants=v2',
            },
          });
          console.log(`[uazapi-bot-sync] 🗑️ OpenAI Assistant deletado: ${existingBotConfig.openai_assistant_id}`);
        } catch (e) {
          console.warn(`[uazapi-bot-sync] ⚠️ Erro ao deletar assistant:`, e);
        }
      }

      steps.push({ step: 'action_start', status: 'success', message: 'Bot removido' });
      await supabaseClient.from('store_bot_config').update({
        enabled: false,
        evolution_bot_status: 'paused',
        uazapi_assistant_id: null,
        openai_assistant_id: null,
        whatsapp_provider: 'uazapi',
        custom_prompt_instructions: null,
        updated_at: new Date().toISOString(),
      }).eq('store_id', storeId);

      return new Response(JSON.stringify({ success: true, message: 'Bot UaZapi removido!', steps }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ========================================
    // AÇÃO: CREATE / UPDATE
    // ========================================
    steps.push({ step: 'action_start', status: 'success', message: 'Iniciando sincronização...' });

    // Buscar dados para prompt
    const [productsRes, categoriesRes] = await Promise.all([
      supabaseClient.from('products').select('*, slug').eq('store_id', storeId).eq('is_available', true),
      supabaseClient.from('categories').select('*').eq('store_id', storeId).eq('is_active', true),
    ]);
    const products = productsRes.data || [];
    const categories = categoriesRes.data || [];
    steps.push({ step: 'data_fetch', status: 'success', message: 'Dados carregados', details: `${products.length} produtos, ${categories.length} categorias` });

    const botMode: BotModeType = (existingBotConfig?.bot_mode as BotModeType) || requestBody.config?.botMode || 'chat_completion';
    
    // Priorizar nome do wizard (assistant_identity) sobre o campo legado (bot_name)
    const wizardIdentity = existingBotConfig?.assistant_identity as any;
    const botName = wizardIdentity?.name 
      || requestBody.config?.botName 
      || existingBotConfig?.bot_name 
      || 'Assistente';
    const customInstructions = requestBody.config?.customInstructions || '';
    
    // Priorizar personalidade do wizard sobre campo legado
    const personalitySettings: PersonalitySettings = {
      personality: (wizardIdentity?.style || existingBotConfig?.personality || 'friendly') as PersonalityType,
      emojiLevel: (wizardIdentity?.emojiLevel || existingBotConfig?.emoji_level || 'moderate') as EmojiLevel,
      customGreeting: wizardIdentity?.greeting || existingBotConfig?.custom_greeting || ''
    };
    
    steps.push({ step: 'identity_resolve', status: 'success', message: `Nome: ${botName}`, details: wizardIdentity ? 'Via Wizard' : 'Via legado' });

    const isV2 = botMode === 'assistant' || botMode === 'conversational' || botMode === 'conversational_simple';
    const isConversational = botMode === 'conversational';
    const isConversationalSimple = botMode === 'conversational_simple';

    // Verificar se o Wizard foi configurado (tem prioridade sobre nicho)
    const wizardRules = existingBotConfig?.enabled_rules as any;
    const wizardTools = existingBotConfig?.enabled_tools as string[] | null;
    const wizardConfigured = !!(wizardIdentity && wizardRules && Object.keys(wizardRules).length > 0);

    // ========================================
    // BUSCAR CONFIGURAÇÕES DE NICHO
    // (só usa se o Wizard NÃO estiver configurado)
    // ========================================
    let nicheConfig: any = null;
    let nicheRules: any[] = [];

    if (store.niche_id) {
      const nicheConfigRes = await supabaseClient
        .from('niche_ai_configs')
        .select('*')
        .eq('niche_id', store.niche_id)
        .eq('bot_mode', botMode)
        .limit(1);
      nicheConfig = nicheConfigRes.data?.[0] || null;

      if (!nicheConfig) {
        const fallbackRes = await supabaseClient
          .from('niche_ai_configs')
          .select('*')
          .eq('niche_id', store.niche_id)
          .limit(1);
        nicheConfig = fallbackRes.data?.[0] || null;
      }

      if (nicheConfig && !wizardConfigured) {
        const nicheRulesRes = await supabaseClient
          .from('niche_ai_rules')
          .select('*')
          .eq('niche_ai_config_id', nicheConfig.id)
          .eq('is_enabled', true)
          .order('sort_order');
        nicheRules = nicheRulesRes.data || [];
      }

      if (wizardConfigured) {
        steps.push({ step: 'niche_config', status: 'info', message: 'Nicho ignorado (Wizard configurado)', details: `Wizard tem prioridade` });
      } else if (nicheConfig) {
        steps.push({ step: 'niche_config', status: 'success', message: 'Config de nicho carregada', details: `${nicheRules.length} regra(s) ativa(s)` });
      }
    }

    // ========================================
    // GERAR PROMPT (simples, inteligente ou conversacional)
    // ========================================
    let fullPrompt: string;

    if (isConversational || isConversationalSimple) {
      // Modo Conversacional ou Conversacional Simples: buscar configurações específicas
      const [convSettingsRes, orderQuestionsRes] = await Promise.all([
        supabaseClient.from('store_bot_conversational_settings').select('*').eq('store_id', storeId).maybeSingle(),
        supabaseClient.from('store_bot_order_questions').select('*').eq('store_id', storeId).order('sort_order'),
      ]);

      const convSettings = convSettingsRes.data as any;
      if (convSettings?.upsell_enabled && convSettings?.upsell_product_id) {
        const { data: upsellProduct } = await supabaseClient
          .from('products')
          .select('name, price, slug')
          .eq('id', convSettings.upsell_product_id)
          .single();
        if (upsellProduct) {
          convSettings._upsell_product_name = upsellProduct.name;
          convSettings._upsell_product_price = upsellProduct.price;
          convSettings._upsell_product_slug = upsellProduct.slug;
        }
      }

      const nicheRuleTypes = nicheRules.map((r: any) => r.rule_type);

      if (isConversationalSimple) {
        fullPrompt = generateConversationalSimpleModePrompt(
          botName, store, personalitySettings, deliveryZones,
          convSettings || null, orderQuestionsRes.data || [],
          nicheRuleTypes.length > 0 ? nicheRuleTypes : undefined,
          (nicheConfig?.enabled_tools as string[]) || undefined
        );
        steps.push({ step: 'prompt_generate', status: 'success', message: 'Prompt conversacional simples gerado', details: `${orderQuestionsRes.data?.length || 0} perguntas, ${fullPrompt.length} chars` });
      } else {
        fullPrompt = generateConversationalModePrompt(
          botName, store, personalitySettings, deliveryZones,
          convSettings || null, orderQuestionsRes.data || [],
          nicheRuleTypes.length > 0 ? nicheRuleTypes : undefined,
          (nicheConfig?.enabled_tools as string[]) || undefined
        );
        steps.push({ step: 'prompt_generate', status: 'success', message: 'Prompt conversacional gerado', details: `${orderQuestionsRes.data?.length || 0} perguntas, ${fullPrompt.length} chars` });
      }
    } else {
      // Modo simples ou inteligente V2
      fullPrompt = generatePrompt(
        botName, store, categories, origin,
        personalitySettings, deliveryZones, customInstructions,
        isV2 ? undefined : products
      );
      steps.push({ step: 'prompt_generate', status: 'success', message: `Prompt gerado (${isV2 ? 'V2' : 'simples'})`, details: `${fullPrompt.length} chars` });
    }

    // Injetar regras de nicho no prompt (APENAS se Wizard não configurado)
    if (!wizardConfigured) {
      const nicheRulesText = buildNicheRulesText(nicheConfig, nicheRules);
      if (nicheRulesText) {
        const processedNicheText = nicheRulesText
          .replace(/\{\{STORE_NAME\}\}/g, store.name || 'Loja')
          .replace(/\{\{BOT_NAME\}\}/g, botName);
        fullPrompt += processedNicheText;
        steps.push({ step: 'niche_rules_injected', status: 'success', message: `${nicheRules.length} regra(s) de nicho injetada(s)` });
      }
    } else {
      // Wizard configurado: injetar regras do wizard no prompt
      // IMPORTANTE: usar wizard_custom_instructions (instruções manuais do lojista), NÃO custom_prompt_instructions (prompt completo)
      const wizardCustomInstructions = existingBotConfig?.wizard_custom_instructions || '';
      const wizardRulesSection = buildWizardRulesSection(wizardRules, wizardCustomInstructions, existingBotConfig?.upsell_products as any[]);
      if (wizardRulesSection) {
        fullPrompt += wizardRulesSection;
        steps.push({ step: 'wizard_rules_injected', status: 'success', message: 'Regras do Wizard injetadas no prompt' });
      }
      
      // Manter max_products do nicho como fallback útil (apenas 1x)
      if (nicheConfig?.max_products_per_response) {
        fullPrompt += `\n\nLIMITE DE PRODUTOS POR RESPOSTA: Exiba no MÁXIMO ${nicheConfig.max_products_per_response} opções por mensagem.`;
      }
    }

    console.log(`[uazapi-bot-sync] 📝 Prompt gerado (${isConversationalSimple ? 'Conversacional Simples' : isConversational ? 'Conversacional' : isV2 ? 'V2 com tools' : 'simples com catálogo'}): ${fullPrompt.length} chars`);

    // ========================================
    // CRIAR/ATUALIZAR OPENAI ASSISTANT (modo V2 ou Conversacional)
    // ========================================
    let openaiAssistantId: string | null = existingBotConfig?.openai_assistant_id || null;

    if (isV2) {
      console.log('[uazapi-bot-sync] 🤖 Criando/atualizando OpenAI Assistant...');
      
      let assistantTools = getAssistantTools();
      
      // Filtrar tools com base na seleção do Wizard (se configurado)
      if (wizardConfigured && wizardTools && wizardTools.length > 0) {
        // send_location sempre incluída se get_store_info está habilitada
        const allowedTools = [...wizardTools];
        if (allowedTools.includes('get_store_info') && !allowedTools.includes('send_location')) {
          allowedTools.push('send_location');
        }
        assistantTools = assistantTools.filter(
          (t: any) => allowedTools.includes(t.function?.name || '')
        );
        console.log(`[uazapi-bot-sync] 🔧 Tools filtradas pelo Wizard: ${assistantTools.length} de ${getAssistantTools().length} (${allowedTools.join(', ')})`);
        steps.push({ step: 'wizard_tools_filter', status: 'success', message: `${assistantTools.length} ferramentas selecionadas pelo Wizard` });
      }
      
      const assistantPayload = {
        name: `${botName} - ${store.name}`,
        instructions: fullPrompt,
        tools: assistantTools,
        model: 'gpt-4o-mini',
      };

      if (openaiAssistantId) {
        const updateResp = await fetch(
          `https://api.openai.com/v1/assistants/${openaiAssistantId}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'Content-Type': 'application/json',
              'OpenAI-Beta': 'assistants=v2',
            },
            body: JSON.stringify(assistantPayload),
          }
        );

        if (updateResp.ok) {
          const assistant = await updateResp.json();
          openaiAssistantId = assistant.id;
          steps.push({ step: 'openai_assistant', status: 'success', message: 'OpenAI Assistant atualizado', details: `ID: ${openaiAssistantId?.slice(0, 16)}...` });
          console.log(`[uazapi-bot-sync] ✅ OpenAI Assistant atualizado: ${openaiAssistantId}`);
        } else {
          const errText = await updateResp.text();
          console.log(`[uazapi-bot-sync] ⚠️ Update falhou (${updateResp.status}), criando novo... Erro: ${errText.substring(0, 200)}`);
          openaiAssistantId = null;
        }
      }

      if (!openaiAssistantId) {
        const createResp = await fetch('https://api.openai.com/v1/assistants', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2',
          },
          body: JSON.stringify(assistantPayload),
        });

        if (createResp.ok) {
          const assistant = await createResp.json();
          openaiAssistantId = assistant.id;
          steps.push({ step: 'openai_assistant', status: 'success', message: 'OpenAI Assistant criado', details: `ID: ${openaiAssistantId?.slice(0, 16)}...` });
          console.log(`[uazapi-bot-sync] ✅ OpenAI Assistant criado: ${openaiAssistantId}`);
        } else {
          const errText = await createResp.text();
          console.error(`[uazapi-bot-sync] ❌ Erro ao criar assistant: ${errText.substring(0, 300)}`);
          steps.push({ step: 'openai_assistant', status: 'error', message: 'Erro ao criar OpenAI Assistant', details: errText.substring(0, 100) });
        }
      }

      // Limpar threads existentes para forçar novas conversas com novo prompt
      const { error: threadErr } = await supabaseClient
        .from('whatsapp_conversations')
        .update({ metadata: null })
        .eq('store_id', storeId);
      if (threadErr) console.error(`[uazapi-bot-sync] ❌ Erro ao limpar threads:`, threadErr.message);
      else console.log(`[uazapi-bot-sync] 🧹 Threads limpas para forçar novo contexto`);

      // Limpar contexto de sessão (carrinho, endereço, etc.)
      const { error: ctxErr } = await supabaseClient
        .from('whatsapp_session_context')
        .delete()
        .eq('store_id', storeId);
      if (ctxErr) console.error(`[uazapi-bot-sync] ❌ Erro ao limpar session_context:`, ctxErr.message);
      else console.log(`[uazapi-bot-sync] 🧹 Session context limpo para forçar novo contexto`);
    }

    // ========================================
    // SALVAR CONFIG NO BANCO
    // ========================================
    const keywordFinish = requestBody.config?.keywordFinish ?? existingBotConfig?.keyword_finish ?? '#sair';

    const botConfigData: Record<string, any> = {
      store_id: storeId,
      enabled: true,
      evolution_bot_status: 'active',
      bot_name: botName,
      stop_bot_from_me: requestBody.config?.stopBotFromMe ?? existingBotConfig?.stop_bot_from_me ?? true,
      listening_from_me: requestBody.config?.listeningFromMe ?? existingBotConfig?.listening_from_me ?? false,
      delay_message: requestBody.config?.delayMessage ?? existingBotConfig?.delay_message ?? 1500,
      expire_minutes: requestBody.config?.expireMinutes ?? existingBotConfig?.expire_minutes ?? 20,
      keyword_finish: keywordFinish,
      unknown_message: requestBody.config?.unknownMessage ?? existingBotConfig?.unknown_message ?? '',
      keep_open: requestBody.config?.keepOpen ?? existingBotConfig?.keep_open ?? false,
      debounce_time: requestBody.config?.debounceTime ?? existingBotConfig?.debounce_time ?? 10,
      trigger_type: requestBody.config?.triggerType ?? existingBotConfig?.trigger_type ?? 'all',
      trigger_operator: requestBody.config?.triggerOperator ?? existingBotConfig?.trigger_operator ?? 'equals',
      trigger_value: requestBody.config?.triggerValue ?? existingBotConfig?.trigger_value ?? '',
      ignore_jids: requestBody.config?.ignoreJids ?? existingBotConfig?.ignore_jids ?? [],
      bot_split_messages: requestBody.config?.splitMessages ?? existingBotConfig?.bot_split_messages ?? true,
      bot_time_per_char: requestBody.config?.timePerChar ?? existingBotConfig?.bot_time_per_char ?? 50,
      updated_at: new Date().toISOString(),
      bot_mode: botMode,
      openai_assistant_id: openaiAssistantId, // OpenAI Assistant ID para o webhook usar
      uazapi_assistant_id: null, // NÃO usar agente nativo
      whatsapp_provider: 'uazapi',
      custom_prompt_instructions: fullPrompt,
      needs_sync: false,
      last_synced_at: new Date().toISOString(),
      last_sync_error: null,
    };

    if (existingBotConfig) {
      const { error: updateErr } = await supabaseClient.from('store_bot_config').update(botConfigData).eq('id', existingBotConfig.id);
      if (updateErr) {
        steps.push({ step: 'save_config', status: 'error', message: 'Erro ao salvar config', details: updateErr.message });
      } else {
        steps.push({ step: 'save_config', status: 'success', message: 'Config salva no banco' });
      }
    } else {
      const { error: insertErr } = await supabaseClient.from('store_bot_config').insert(botConfigData);
      if (insertErr) {
        steps.push({ step: 'save_config', status: 'error', message: 'Erro ao inserir config', details: insertErr.message });
      } else {
        steps.push({ step: 'save_config', status: 'success', message: 'Config criada no banco' });
      }
    }

    console.log('[uazapi-bot-sync] 🎉 Sincronização concluída!');

    return new Response(JSON.stringify({
      success: true,
      message: `Bot "${botName}" sincronizado! OpenAI Assistant ${openaiAssistantId ? 'configurado' : 'modo simples'}.`,
      steps,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[uazapi-bot-sync] ❌ Erro fatal:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    steps.push({ step: 'error', status: 'error', message });
    return new Response(JSON.stringify({ error: message, steps }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
