// Tipos do Wizard de Criação de Assistente

export type AssistantType = 'triage' | 'sales' | 'support' | 'custom';
export type PersonalityStyle = 'professional' | 'friendly' | 'fun' | 'consultive';
export type EmojiLevel = 'none' | 'moderate' | 'abundant';

export interface AssistantIdentity {
  name: string;
  nicheDescription: string;
  personality: PersonalityStyle;
  emojiLevel: EmojiLevel;
  greeting: string;
}

export interface AssistantRules {
  block_prices: boolean;
  block_photos: boolean;
  allow_upsell: boolean;
  suggest_generic: boolean;
  ask_specification: boolean;
  suggest_store_link: boolean;
  send_link_on_greeting: boolean;
  require_prescription_check: boolean;
}

export interface AssistantStoreInfo {
  includeLocation: boolean;
  includeBusinessHours: boolean;
  includePaymentMethods: boolean;
  includeDeliveryFee: boolean;
  includeMinOrder: boolean;
}

export interface UpsellProduct {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
}

export interface WizardData {
  assistantType: AssistantType;
  identity: AssistantIdentity;
  enabledTools: string[];
  rules: AssistantRules;
  storeInfo: AssistantStoreInfo;
  customInstructions: string;
  upsellProducts: UpsellProduct[];
}

// Tools disponíveis
export const AVAILABLE_TOOLS = [
  { id: 'search_products', label: 'Buscar produtos', description: 'Busca no catálogo por nome ou termo', icon: '🔍', category: 'catalog' },
  { id: 'check_stock', label: 'Verificar estoque', description: 'Preço e disponibilidade do produto', icon: '📦', category: 'catalog' },
  { id: 'get_product_details', label: 'Detalhes do produto', description: 'Informações completas via slug', icon: '📋', category: 'catalog' },
  { id: 'list_categories', label: 'Listar categorias', description: 'Categorias disponíveis na loja', icon: '📂', category: 'catalog' },
  { id: 'get_promotions', label: 'Ver promoções', description: 'Produtos em promoção', icon: '🏷️', category: 'catalog' },
  { id: 'get_recommendations', label: 'Recomendações', description: 'Sugestões inteligentes de produtos', icon: '💡', category: 'catalog' },
  { id: 'check_store_status', label: 'Status da loja', description: 'Verificar se a loja está aberta', icon: '🏪', category: 'store' },
  { id: 'get_store_info', label: 'Info da loja', description: 'Endereço, horário e contato', icon: 'ℹ️', category: 'store' },
  { id: 'analyze_image', label: 'Analisar imagens', description: 'Lê fotos enviadas pelo cliente', icon: '📷', category: 'advanced' },
  { id: 'calculate_delivery_fee', label: 'Calcular entrega', description: 'Taxa de entrega via GPS', icon: '🚚', category: 'advanced' },
  { id: 'get_last_delivery_info', label: 'Último pedido', description: 'Dados do último pedido do cliente', icon: '📜', category: 'advanced' },
  { id: 'send_location', label: 'Enviar localização', description: 'Envia localização da loja no mapa', icon: '📍', category: 'store' },
] as const;

// Presets por tipo
export const TYPE_PRESETS: Record<AssistantType, {
  defaultTools: string[];
  defaultRules: Partial<AssistantRules>;
  lockedRules?: Partial<Record<keyof AssistantRules, boolean>>;
  description: string;
  icon: string;
  color: string;
}> = {
  triage: {
    defaultTools: ['search_products', 'check_stock', 'get_product_details', 'check_store_status', 'get_store_info', 'analyze_image', 'send_location'],
    defaultRules: {
      block_prices: true,
      block_photos: true,
      allow_upsell: false,
      suggest_generic: false,
      ask_specification: true,
      suggest_store_link: true,
      send_link_on_greeting: true,
      require_prescription_check: true,
    },
    lockedRules: { block_prices: true, block_photos: true, allow_upsell: true },
    description: 'Recepção e acolhimento. Não vende, não fecha pedido. Encaminha para equipe humana.',
    icon: '🛎️',
    color: 'text-teal-500',
  },
  sales: {
    defaultTools: ['search_products', 'check_stock', 'get_product_details', 'list_categories', 'get_promotions', 'get_recommendations', 'check_store_status', 'get_store_info', 'analyze_image', 'calculate_delivery_fee', 'send_location'],
    defaultRules: {
      block_prices: false,
      block_photos: false,
      allow_upsell: true,
      suggest_generic: true,
      ask_specification: true,
      suggest_store_link: false,
      send_link_on_greeting: false,
      require_prescription_check: true,
    },
    description: 'Atendimento completo com fechamento de pedido, upsell e fotos.',
    icon: '💰',
    color: 'text-green-500',
  },
  support: {
    defaultTools: ['search_products', 'check_stock', 'get_product_details', 'check_store_status', 'get_store_info', 'get_last_delivery_info', 'send_location'],
    defaultRules: {
      block_prices: false,
      block_photos: false,
      allow_upsell: false,
      suggest_generic: false,
      ask_specification: false,
      suggest_store_link: false,
      send_link_on_greeting: false,
      require_prescription_check: false,
    },
    description: 'Atendimento pós-venda. Consulta pedidos, status e informações.',
    icon: '🎧',
    color: 'text-blue-500',
  },
  custom: {
    defaultTools: ['search_products', 'check_stock', 'get_product_details', 'list_categories', 'get_promotions', 'check_store_status', 'get_store_info', 'send_location'],
    defaultRules: {
      block_prices: false,
      block_photos: false,
      allow_upsell: false,
      suggest_generic: false,
      ask_specification: false,
      suggest_store_link: false,
      send_link_on_greeting: false,
      require_prescription_check: false,
    },
    description: 'Controle total. Configure cada ferramenta e regra manualmente.',
    icon: '⚙️',
    color: 'text-purple-500',
  },
};

export const DEFAULT_WIZARD_DATA: WizardData = {
  assistantType: 'custom',
  identity: {
    name: 'Assistente Virtual',
    nicheDescription: '',
    personality: 'friendly',
    emojiLevel: 'moderate',
    greeting: '',
  },
  enabledTools: TYPE_PRESETS.custom.defaultTools,
  rules: {
    block_prices: false,
    block_photos: false,
    allow_upsell: false,
    suggest_generic: false,
    ask_specification: false,
    suggest_store_link: false,
    require_prescription_check: false,
  },
  storeInfo: {
    includeLocation: true,
    includeBusinessHours: true,
    includePaymentMethods: true,
    includeDeliveryFee: true,
    includeMinOrder: true,
  },
  customInstructions: '',
  upsellProducts: [],
};
