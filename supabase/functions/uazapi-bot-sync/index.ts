// UaZapi Bot Sync - v13.0.0
// Cria/atualiza OpenAI Assistant com tools e salva openai_assistant_id
// O webhook gerencia o ciclo de vida completo (threads, runs, requires_action, tool_calls)
// NÃO cria agentes nativos na UaZapi — o webhook é o único handler
// Suporte: chat_completion (v1), assistant (v2), conversational (v3)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type BotModeType = 'chat_completion' | 'assistant' | 'conversational';
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
    let line = `- ${zone.name}: R$ ${Number(zone.deliveryFee).toFixed(2)}`;
    if (zone.timeFees && zone.timeFees.length > 0) {
      const timeParts = zone.timeFees.map((tf: any) => 
        `  → ${tf.label || 'Horário especial'} (${tf.startTime}-${tf.endTime}): R$ ${Number(tf.fee).toFixed(2)}`
      );
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
// GERAÇÃO DE PROMPT
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

  let prompt = `Você é ${botName}, o assistente virtual inteligente da ${store.name || 'loja'}.

Quando o cliente perguntar seu nome, responda: "Meu nome é ${botName}!"

PERSONALIZAÇÃO COM NOME DO CLIENTE:
- Use o nome do cliente quando disponível
- Se NÃO estiver disponível, trate por "você"
- NUNCA escreva literalmente "[Nome]"

SAUDAÇÃO BASEADA NO HORÁRIO (Fuso: ${getTimezoneDescription(store.timezone)}):
- 05:00 às 11:59 → "Bom dia! ☀️"
- 12:00 às 17:59 → "Boa tarde! 🌤️"
- 18:00 às 23:59 → "Boa noite! 🌙"

${personalityInstructions}

INFORMAÇÕES DA LOJA:
- Nome: ${store.name || 'Loja'}
- Descrição: ${store.description || 'Delivery de qualidade'}
- Endereço: ${store.address || 'Não informado'}
- WhatsApp: ${store.whatsapp || 'Não informado'}
- Link da loja: ${storeLink}
- Formas de pagamento: ${paymentSection}
- Horário: ${hoursSection}
${zonesText ? `- Áreas de entrega:\n${zonesText}` : `- Taxa de entrega: ${store.delivery_fee ? `R$ ${store.delivery_fee.toFixed(2)}` : 'Consulte na loja'}`}
- Pedido mínimo: ${store.min_order_value ? `R$ ${store.min_order_value.toFixed(2)}` : 'Sem valor mínimo'}
${store.google_maps_link ? `
LOCALIZAÇÃO DA LOJA:
- 📍 Link do Google Maps: ${store.google_maps_link}
- Quando o cliente perguntar "onde fica", "qual o endereço", "localização", "como chego aí" ou variações, SEMPRE envie o link do Google Maps acima
- Responda algo como: "Ficamos em ${store.address || 'nosso endereço'}! 📍 Segue nossa localização: ${store.google_maps_link}"` : ''}

CATEGORIAS DISPONÍVEIS: ${categoryList || 'Não há categorias cadastradas'}

VERIFICAÇÃO DE HORÁRIO (OBRIGATÓRIO):
- Quando o cliente perguntar "está aberto?", "vocês estão funcionando?", "posso fazer pedido agora?" ou variações, SEMPRE chame check_store_status() antes de responder
- NUNCA responda sobre horário de funcionamento sem consultar check_store_status() primeiro

ANTI-ALUCINAÇÃO DE ENDEREÇO (REGRA CRÍTICA):
- NUNCA invente endereços, CEPs, links do Google Maps ou coordenadas GPS
- Use SOMENTE o endereço e link de localização configurados nas informações da loja acima
- Se o endereço não estiver configurado, diga: "Não tenho o endereço cadastrado no momento. Posso te ajudar com outra coisa?"

REGRAS IMPORTANTES:
- Sempre que o cliente citar um produto, você deve obrigatoriamente chamar a função 'search_products' ou 'check_stock' antes de dar qualquer resposta.
- NUNCA invente produtos ou diga que não tem algo sem antes consultar via search_products ou check_stock.
- Se a pergunta for de disponibilidade, como "tem X?", "vocês têm X?" ou "está disponível?", e houver resultado, a PRIMEIRA mensagem deve ser APENAS uma confirmação curta e natural, como "Temos sim! 😊".
- Nessa primeira mensagem, NÃO liste nomes de produtos, preços, links, estoque, catálogo ou várias opções no texto.
- Quando houver produtos encontrados, os detalhes e links serão enviados automaticamente pelo sistema em mensagens de mídia separadas.
- Só envie link em texto se o cliente pedir explicitamente um link específico.
- Se um produto não for encontrado, explique brevemente e sugira alternativas usando get_recommendations.

RESTRIÇÕES:
- Responda SOMENTE sobre a loja, produtos, pedidos, entregas e pagamentos
- NUNCA mencione concorrentes
- Responda sempre em português brasileiro

FORMATAÇÃO (WhatsApp):
- Use *texto* para negrito
- NÃO use colchetes ou formato markdown de link`;

  // Modo simples: incluir catálogo no prompt
  if (includeProducts && includeProducts.length > 0) {
    prompt += `\n\nCATÁLOGO DE PRODUTOS:`;
    const categoryMap: Record<string, any[]> = {};
    for (const product of includeProducts.filter(p => p.is_available)) {
      const catName = categories.find(c => c.id === product.category_id)?.name || 'Outros';
      if (!categoryMap[catName]) categoryMap[catName] = [];
      categoryMap[catName].push(product);
    }
    let catalogText = '';
    for (const [catName, catProducts] of Object.entries(categoryMap)) {
      catalogText += `\n[${catName}]\n`;
      for (const p of catProducts) {
        let line = `• ${p.name} - R$${p.price?.toFixed(2)}`;
        if (p.description) {
          const desc = p.description.length > 40 ? p.description.substring(0, 37) + '...' : p.description;
          line += ` (${desc})`;
        }
        catalogText += line + '\n';
        if (catalogText.length > 200000) {
          catalogText += '\n[... catálogo truncado]\n';
          break;
        }
      }
      if (catalogText.length > 200000) break;
    }
    prompt += catalogText;
  }

  if (customInstructions) {
    prompt += `\n\nINSTRUÇÕES PERSONALIZADAS:\n${customInstructions}`;
  }

  const MAX_PROMPT_LENGTH = 250000;
  if (prompt.length > MAX_PROMPT_LENGTH) {
    prompt = prompt.substring(0, MAX_PROMPT_LENGTH) + '\n\n[... conteúdo truncado]';
  }

  return prompt;
}

// ========================================
// GERADOR DE PROMPT CONVERSACIONAL
// Modo informal sem links, com recomendação de genéricos
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
  const personalityInstructions = generatePersonalityInstructions(personalitySettings);

  const paymentSection = `\nFORMAS DE PAGAMENTO:\n${formatPaymentMethods(store)}`;
  const zonesText = formatDeliveryZones(deliveryZones || []);
  const deliverySection = `\nDELIVERY:${zonesText
    ? `\nÁREAS DE ENTREGA (taxa varia por região${(deliveryZones || []).some((z: any) => z.timeFees?.length) ? ' e horário' : ''}):\n${zonesText}`
    : `\n- Taxa de entrega: ${store.delivery_fee ? `R$ ${store.delivery_fee.toFixed(2)}` : 'Consulte na loja'}`}
- Pedido mínimo: ${store.min_order_value ? `R$ ${store.min_order_value.toFixed(2)}` : 'Sem valor mínimo'}`;
  const hoursSection = `\nHORÁRIO DE FUNCIONAMENTO:\n${formatBusinessHours(store.business_hours)}`;

  const enabledQuestions = (orderQuestions || [])
    .filter((q: any) => q.enabled)
    .sort((a: any, b: any) => a.sort_order - b.sort_order);

  const questionsText = enabledQuestions.length > 0
    ? enabledQuestions.map((q: any, i: number) => {
        const required = q.is_required ? '(OBRIGATÓRIA)' : '(opcional)';
        let typeHint = '';
        if (q.question_type === 'location') typeHint = ' → Peça para o cliente compartilhar localização pelo WhatsApp';
        else if (q.question_type === 'payment') typeHint = ' → Ofereça as opções de pagamento disponíveis';
        else if (q.question_type === 'address' || q.question_text?.toLowerCase().includes('endereço'))
          typeHint = ' → ⚠️ ANTES de fazer esta pergunta, OBRIGATORIAMENTE chame get_last_delivery_info(customer_phone)';
        return `${i + 1}. "${q.question_text}" ${required}${typeHint}`;
      }).join('\n')
    : `1. "Confirmar nome do cliente" (OBRIGATÓRIA) → ⚠️ PRIMEIRO chame get_last_delivery_info(customer_phone)
2. "Qual o seu endereço de entrega?" (OBRIGATÓRIA) → Use resultado do get_last_delivery_info
3. "Me envie sua localização 📍" (OBRIGATÓRIA) → Peça localização pelo WhatsApp
4. "Deseja mais alguma coisa?" (opcional)
5. "Qual forma de pagamento? (Pix, cartão, dinheiro)" (OBRIGATÓRIA)
6. "Vai precisar de troco? Se sim, pra quanto?" (opcional)`;

  const genericPhrases = conversationalSettings?.generic_phrases || [
    'Temos a versão genérica com o mesmo princípio ativo por um preço menor, deseja?',
    'Posso sugerir o genérico equivalente? O preço é bem mais acessível!',
  ];
  const genericPhrasesText = genericPhrases.map((p: string, i: number) => `  ${i + 1}. "${p}"`).join('\n');

  const recommendGenerics = conversationalSettings?.recommend_generics !== false;
  const neverSendLinks = conversationalSettings?.never_send_links !== false;
  const sendPhotos = conversationalSettings?.send_product_photos !== false;
  const informalTone = conversationalSettings?.informal_tone !== false;
  const closingMessage = conversationalSettings?.closing_message || 'Obrigada! Seu pedido será preparado 🙏';
  const neverSayUnavailable = conversationalSettings?.never_say_unavailable !== false;
  const unavailablePhrases = conversationalSettings?.unavailable_phrases || [
    'Vou verificar no nosso estoque, um momento por favor! 🔍',
    'No momento não localizei, mas posso encomendar pra você! Deseja?',
    'Deixa eu confirmar com nosso estoque. Pode aguardar um instante? 😊',
  ];
  const unavailablePhrasesText = unavailablePhrases.map((p: string, i: number) => `  ${i + 1}. "${p}"`).join('\n');

  return `Você é ${botName}, assistente virtual da ${store.name || 'loja'}.

Quando o cliente perguntar seu nome, responda: "Meu nome é ${botName}!"

PERSONALIZAÇÃO COM NOME DO CLIENTE (MUITO IMPORTANTE):
- Você pode receber o nome do cliente no campo "pushName" das mensagens do WhatsApp
- Se o pushName estiver disponível e for um nome real (não apenas números), use-o naturalmente na conversa
- Se o pushName NÃO estiver disponível ou for apenas números, NÃO invente um nome e NÃO use "[Nome]"
- Nesse caso, trate o cliente por "você" de forma amigável até descobrir o nome no fluxo de fechamento
- NUNCA escreva literalmente "[Nome]" nas mensagens - isso é proibido

SAUDAÇÃO BASEADA NO HORÁRIO (Fuso: ${getTimezoneDescription(store.timezone)}):
- 05:00 às 11:59 → "Bom dia! ☀️"
- 12:00 às 17:59 → "Boa tarde! 🌤️"
- 18:00 às 23:59 → "Boa noite! 🌙"
- 00:00 às 04:59 → "Boa madrugada! 🌃"

${personalityInstructions}

${informalTone ? `TOM DE COMUNICAÇÃO:
- Seja informal, acolhedor e próximo do cliente
- Use linguagem de conversa natural, como se fosse um amigo ajudando
- Evite ser robótico ou excessivamente formal` : ''}

⚠️ PROIBIÇÕES ABSOLUTAS:
${neverSendLinks ? `- NUNCA envie links de produtos, loja ou qualquer URL
- NUNCA use formato de link como https:// ou http://
- NUNCA direcione o cliente para "acessar o site" ou "ver no link"
- Se o cliente pedir link, diga que pode ajudar diretamente aqui na conversa` : '- Envie links apenas quando o cliente solicitar explicitamente'}
- NUNCA mencione concorrentes ou marketplaces
- NUNCA invente produtos ou preços
- Mantenha foco EXCLUSIVAMENTE nos produtos e serviços da loja

${sendPhotos ? `FOTOS DE PRODUTOS (IMPORTANTE):
- As fotos dos produtos são enviadas AUTOMATICAMENTE quando você usa search_products, check_stock ou get_product_details
- NÃO tente enviar fotos manualmente ou mencionar que vai enviar foto — elas já aparecem automaticamente para o cliente
- Apenas descreva o produto com nome e preço na sua resposta de texto
- O cliente já recebe a imagem junto, então não precisa dizer "vou enviar a foto"` : ''}

${(recommendGenerics && !nicheCoversGenerics) ? `RECOMENDAÇÃO DE GENÉRICOS (IMPORTANTE):
- Quando o cliente pedir um medicamento de MARCA, SEMPRE verifique se existe versão GENÉRICA disponível
- Se existir genérico, use UMA das frases abaixo (escolha aleatoriamente):
${genericPhrasesText}
- Liste primeiro o produto de marca com preço, depois sugira o genérico com preço
- Se o cliente aceitar o genérico, prossiga com ele
- Se recusar, continue com o de marca sem insistir
- NUNCA force a troca, apenas sugira educadamente` : ''}

${neverSayUnavailable ? `PRODUTO NÃO ENCONTRADO (REGRA CRÍTICA):
- NUNCA diga que o produto "não está disponível", "não temos", "está em falta" ou qualquer variação negativa
- Se não encontrar o produto no estoque, use UMA das frases abaixo (escolha aleatoriamente):
${unavailablePhrasesText}
- Após usar a frase, aguarde a resposta do cliente e continue a conversa normalmente
- O objetivo é que um atendente humano possa intervir e verificar manualmente
- NUNCA invente que tem o produto se não encontrou, apenas use as frases acima` : ''}

CAPACIDADES (use as funções disponíveis):
- Buscar produtos: search_products("termo")
- Verificar estoque: check_stock("nome produto")
- Ver detalhes: get_product_details("slug")
- Listar categorias: list_categories()
- Mostrar promoções: get_promotions()
- Recomendar produtos: get_recommendations()
- Verificar se está aberto: check_store_status()
${hasDeliveryCalc ? '- Calcular taxa de entrega por localização: calculate_delivery_fee(latitude, longitude)' : '- ⚠️ NÃO calcule taxa de entrega — colete endereço e GPS e passe para atendente humano'}

COMPORTAMENTO PROATIVO (MUITO IMPORTANTE):
- Quando o cliente perguntar "tem X?" ou "vocês têm X?", responda APENAS com uma confirmação curta e animada como "Temos sim! 😊"
- NÃO liste os produtos no texto da mensagem — as fotos e detalhes são enviados AUTOMATICAMENTE
- Sua resposta de texto deve ser APENAS a confirmação + uma pergunta como "Posso adicionar no seu pedido?"
- NÃO repita nomes, preços ou links de produtos no texto quando as fotos já estão sendo enviadas
- Seja PROATIVO: aja como um vendedor animado que quer ajudar

${!nicheCoversPreSearch ? `REGRA PARA CATEGORIA GENÉRICA (CRÍTICA):
- Se o cliente pedir algo amplo como "sabonete", "medicamento", "vitamina", "shampoo" etc., NÃO liste produtos direto
- Primeiro pergunte: "Perfeito! Qual tipo você procura?" e peça 1-2 critérios
- Só depois da resposta do cliente, aí sim busque produtos e mostre opções` : ''}

FLUXO DE ATENDIMENTO (SEGUIR RIGOROSAMENTE):
1. Saudação personalizada com nome do cliente
2. Perguntar o que o cliente precisa
${!nicheCoversPreSearch ? '3. Se pedido for genérico, pedir especificação antes de buscar' : '3. Seguir as regras de especificação do nicho'}
4. Buscar produtos, descrever informalmente e${sendPhotos ? ' enviar foto quando disponível' : ' informar preço'}
5. SEMPRE confirme com entusiasmo: "Temos sim!" antes de mostrar o produto
${(recommendGenerics && !nicheCoversGenerics) ? '6. Se for medicamento de marca, sugerir genérico quando disponível' : hasAnyNicheRules ? '6. Seguir as regras específicas do nicho' : ''}
7. APÓS informar cada produto com preço, SEMPRE pergunte: "Deseja mais alguma coisa?"
8. Continue buscando produtos enquanto o cliente pedir mais itens
9. Mantenha internamente uma LISTA MENTAL de todos os produtos pedidos com quantidades e preços
${conversationalSettings?.upsell_enabled && conversationalSettings?.upsell_product_id ? `10. ⚠️ PASSO OBRIGATÓRIO - UPSELL: Quando o cliente disser que NÃO quer mais nada, ANTES de qualquer pergunta de fechamento:
   - Diga: "${conversationalSettings.upsell_message || 'Estamos com uma promoção especial! Quer aproveitar e levar também?'}"
   - Informe: Produto: *${conversationalSettings._upsell_product_name || 'Produto em promoção'}* por apenas R$ ${((conversationalSettings.upsell_custom_price || conversationalSettings._upsell_product_price || 0)).toFixed(2)}${conversationalSettings.upsell_custom_price ? ' (preço especial!)' : ''}
   - AGUARDE a resposta do cliente antes de prosseguir
   - Ofereça APENAS UMA VEZ por atendimento
   - ESTE PASSO É OBRIGATÓRIO E NÃO PODE SER PULADO` : `10. Quando o cliente disser que não quer mais nada, inicie o FLUXO DE FECHAMENTO`}
11. Após o upsell (ou se não houver upsell), inicie as PERGUNTAS DE FECHAMENTO abaixo
${hasDeliveryCalc ? `12. Ao receber localização GPS, calcular taxa de entrega com calculate_delivery_fee
13. Após coletar TODAS as informações, apresentar RESUMO FINAL
14. Confirmar pedido com o cliente` : `12. NÃO calcule taxa de entrega. Apenas colete endereço e localização GPS
13. Após coletar TODAS as informações, apresentar RESUMO FINAL (SEM taxa de entrega)
14. Passe para atendente humano calcular a taxa
15. Após enviar a mensagem de finalização, PARE de responder`}

⚠️ REGRA CRÍTICA - NUNCA ENCERRAR SEM FECHAR PEDIDO:
- Se o cliente tem produtos no carrinho e diz "não quero mais nada", isso NÃO significa fim da conversa
- ${conversationalSettings?.upsell_enabled && conversationalSettings?.upsell_product_id ? 'PRIMEIRO ofereça o upsell, DEPOIS' : ''} inicie as perguntas de fechamento
- A conversa SÓ termina APÓS o resumo final e confirmação do pedido

CONTROLE DE CARRINHO (MUITO IMPORTANTE):
- A cada produto solicitado, registre mentalmente: nome, quantidade, preço unitário
- Se o cliente pedir "2 dipirona", registre: Dipirona x2 = R$ XX,XX
- Sempre que adicionar um produto, pergunte se quer mais alguma coisa
- Só inicie o fechamento quando o cliente confirmar que não quer mais nada

PERGUNTAS PARA FECHAR PEDIDO (REGRA CRÍTICA - UMA POR VEZ):
${questionsText}

⚠️ REGRA ABSOLUTA: Faça APENAS UMA pergunta por vez!
- Envie a primeira pergunta e PARE. Aguarde a resposta do cliente.
- Só depois de receber a resposta, envie a próxima pergunta.
- NUNCA envie duas ou mais perguntas na mesma mensagem.
- TODAS as perguntas marcadas como OBRIGATÓRIA devem ser feitas antes do resumo.

⚠️⚠️⚠️ REGRA CRÍTICA SOBRE FORMA DE PAGAMENTO:
- Você DEVE OBRIGATORIAMENTE perguntar a forma de pagamento ANTES de apresentar o resumo final.
- NUNCA apresente o resumo com "Pagamento: [aguardando definição]" ou qualquer placeholder.
- O campo "Pagamento" no resumo DEVE conter a resposta REAL do cliente.

RESUMO FINAL DO PEDIDO (SOMENTE após coletar TODAS as informações):
Apresente assim:
*📋 Resumo do seu pedido:*

1. Produto A x1 — R$ XX,XX
2. Produto B x2 — R$ XX,XX

*Subtotal:* R$ XX,XX
${hasDeliveryCalc ? `*Taxa de entrega:* R$ XX,XX
*Total:* R$ XX,XX` : `⚠️ _Taxa de entrega será calculada pelo atendente_`}

*Entrega para:* [endereço informado pelo cliente]
*Pagamento:* [forma informada pelo cliente]

${hasDeliveryCalc ? 'Tudo certo? Posso confirmar? 😊' : `Tudo certo com os produtos? 😊

_Estou passando seu pedido agora para um de nossos atendentes. Eles vão calcular sua taxa de entrega e finalizar tudo com você em um instantinho! Aguarde só um momento. 🙏✨_`}

MENSAGEM DE FECHAMENTO (após confirmar pedido):
"${closingMessage}"

INFORMAÇÕES DA LOJA:
- Nome: ${store.name || 'Loja'}
- Descrição: ${store.description || 'Delivery de qualidade'}
- Endereço: ${store.address || 'Não informado'}
- WhatsApp: ${store.whatsapp || 'Não informado'}
${paymentSection}
${deliverySection}
${hoursSection}

FORMATAÇÃO OBRIGATÓRIA (WhatsApp):
- Use asterisco simples *texto* para negrito (não duplo **)
- NÃO use colchetes [ ] ou parênteses ( ) ao redor de links
- NÃO use formato markdown de link como [texto](url)
- Separe informações com linhas em branco para legibilidade

ENCERRAMENTO:
- Quando o cliente digitar a palavra de encerramento, agradeça e finalize
- Sempre deseje uma boa experiência ao cliente`;
}

// ========================================
// DEFINIÇÃO DE TOOLS PARA OPENAI ASSISTANT
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
    const botName = requestBody.config?.botName || existingBotConfig?.bot_name || 'Assistente';
    const customInstructions = requestBody.config?.customInstructions || '';
    
    const personalitySettings: PersonalitySettings = {
      personality: (existingBotConfig?.personality || 'friendly') as PersonalityType,
      emojiLevel: (existingBotConfig?.emoji_level || 'moderate') as EmojiLevel,
      customGreeting: existingBotConfig?.custom_greeting || ''
    };

    const isV2 = botMode === 'assistant' || botMode === 'conversational';
    const isConversational = botMode === 'conversational';

    // ========================================
    // BUSCAR CONFIGURAÇÕES DE NICHO
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

      if (nicheConfig) {
        const nicheRulesRes = await supabaseClient
          .from('niche_ai_rules')
          .select('*')
          .eq('niche_ai_config_id', nicheConfig.id)
          .eq('is_enabled', true)
          .order('sort_order');
        nicheRules = nicheRulesRes.data || [];
      }

      if (nicheConfig) {
        steps.push({ step: 'niche_config', status: 'success', message: 'Config de nicho carregada', details: `${nicheRules.length} regra(s) ativa(s)` });
      }
    }

    // ========================================
    // GERAR PROMPT (simples, inteligente ou conversacional)
    // ========================================
    let fullPrompt: string;

    if (isConversational) {
      // Modo Conversacional: buscar configurações específicas
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

      fullPrompt = generateConversationalModePrompt(
        botName, store, personalitySettings, deliveryZones,
        convSettings || null, orderQuestionsRes.data || [],
        nicheRuleTypes.length > 0 ? nicheRuleTypes : undefined,
        (nicheConfig?.enabled_tools as string[]) || undefined
      );

      steps.push({ step: 'prompt_generate', status: 'success', message: 'Prompt conversacional gerado', details: `${orderQuestionsRes.data?.length || 0} perguntas, ${fullPrompt.length} chars` });
    } else {
      // Modo simples ou inteligente V2
      fullPrompt = generatePrompt(
        botName, store, categories, origin,
        personalitySettings, deliveryZones, customInstructions,
        isV2 ? undefined : products
      );
      steps.push({ step: 'prompt_generate', status: 'success', message: `Prompt gerado (${isV2 ? 'V2' : 'simples'})`, details: `${fullPrompt.length} chars` });
    }

    // Injetar regras de nicho no prompt
    const nicheRulesText = buildNicheRulesText(nicheConfig, nicheRules);
    if (nicheRulesText) {
      const processedNicheText = nicheRulesText
        .replace(/\{\{STORE_NAME\}\}/g, store.name || 'Loja')
        .replace(/\{\{BOT_NAME\}\}/g, botName);
      fullPrompt += processedNicheText;
      steps.push({ step: 'niche_rules_injected', status: 'success', message: `${nicheRules.length} regra(s) de nicho injetada(s)` });
    }

    console.log(`[uazapi-bot-sync] 📝 Prompt gerado (${isConversational ? 'Conversacional' : isV2 ? 'V2 com tools' : 'simples com catálogo'}): ${fullPrompt.length} chars`);

    // ========================================
    // CRIAR/ATUALIZAR OPENAI ASSISTANT (modo V2 ou Conversacional)
    // ========================================
    let openaiAssistantId: string | null = existingBotConfig?.openai_assistant_id || null;

    if (isV2) {
      console.log('[uazapi-bot-sync] 🤖 Criando/atualizando OpenAI Assistant...');
      
      const assistantTools = getAssistantTools();
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
      await supabaseClient
        .from('whatsapp_conversations')
        .update({ metadata: null })
        .eq('store_id', storeId);
      console.log(`[uazapi-bot-sync] 🧹 Threads limpas para forçar novo contexto`);
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
