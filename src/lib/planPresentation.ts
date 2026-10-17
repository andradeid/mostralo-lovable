import { publicModuleName, type CatalogModule } from './mostraloPricing';

/** Short editorial highlights; entitlements and full details still come from plan_modules. */
export const PLAN_PRESENTATION: Record<string, { audience: string; highlights: string[] }> = {
  Agenda: { audience: 'Para barbearias, salões e serviços com hora marcada.', highlights: ['Agendamento online', 'Avisos automáticos no WhatsApp', 'Clube de assinaturas', 'Agenda integrada ao Google'] },
  Essencial: { audience: 'Para quem vende produtos e faz entregas.', highlights: ['Sua loja online', 'Pedidos e entregas organizados', 'Promoções para vender mais', 'Impressão de pedidos'] },
  Completo: { audience: 'Para quem precisa conectar vendas e atendimento.', highlights: ['Tudo do Essencial', 'Caixa e comandas', 'Tela da cozinha', 'WhatsApp com chat e IA'] },
  'Sob medida': { audience: 'Para operações que precisam ir além.', highlights: ['Todos os recursos', 'Autoatendimento por totem', 'Integração com iFood', 'Automação e marketing'] },
};

export type ModuleGroup = 'Vender' | 'Atender' | 'Operar' | 'Gerir';
const MODULE_LABELS: Record<string, { group: ModuleGroup; label: string }> = {
  digital_menu: { group: 'Vender', label: 'Loja virtual e catálogo' },
  promotions: { group: 'Vender', label: 'Promoções' },
  marketing: { group: 'Vender', label: 'Material de marketing' },
  whatsapp_marketing: { group: 'Vender', label: 'Campanhas no WhatsApp' },
  ifood: { group: 'Vender', label: 'Integração com iFood' },
  booking: { group: 'Atender', label: 'Agendamento online' },
  whatsapp: { group: 'Atender', label: 'Avisos pelo WhatsApp' },
  whatsapp_chat: { group: 'Atender', label: 'Central de WhatsApp com chat e IA' },
  google_calendar: { group: 'Atender', label: 'Agenda integrada ao Google' },
  client_subscriptions: { group: 'Atender', label: 'Clube de assinaturas' },
  kds: { group: 'Operar', label: 'Tela da cozinha' },
  table_menu: { group: 'Operar', label: 'Pedido pela mesa com QR Code' },
  table_service: { group: 'Operar', label: 'Pedido pela mesa com QR Code' },
  pdv_comandas: { group: 'Operar', label: 'Caixa e comandas' },
  order_management: { group: 'Operar', label: 'Gestão de pedidos' },
  delivery: { group: 'Operar', label: 'Entregas' },
  delivery_drivers: { group: 'Operar', label: 'Gestão de entregadores' },
  printing: { group: 'Operar', label: 'Impressão de pedidos' },
  scheduled_orders: { group: 'Operar', label: 'Pedidos agendados' },
  self_service_totem: { group: 'Operar', label: 'Autoatendimento por totem' },
  password_call: { group: 'Operar', label: 'Chamada de senhas' },
  digital_signage: { group: 'Operar', label: 'Painel de TV' },
  reports: { group: 'Gerir', label: 'Relatórios' },
  customization: { group: 'Gerir', label: 'Personalização da sua marca' },
  sentinela: { group: 'Gerir', label: 'Acompanhamento automático de clientes' },
};

export function groupedPlanModules(modules: CatalogModule[]) {
  const groups: Record<ModuleGroup, string[]> = { Vender: [], Atender: [], Operar: [], Gerir: [] };
  for (const module of modules) {
    const name = publicModuleName(module.modules.name);
    const known = MODULE_LABELS[module.modules.key ?? ''];
    const group: ModuleGroup = known?.group ?? (/whatsapp|agend|assinatu|calendar/i.test(name) ? 'Atender' : /venda|promo|marketing|loja|ifood/i.test(name) ? 'Vender' : /pedido|cozinha|kds|mesa|impress|entrega|totem|senha|tv|caixa|comanda/i.test(name) ? 'Operar' : 'Gerir');
    const label = known?.label ?? name.replace(/\bKDS\b/gi, 'Tela da cozinha').replace(/Pedidos na mesa/gi, 'Pedido pela mesa com QR Code');
    if (!groups[group].includes(label)) groups[group].push(label);
  }
  return Object.entries(groups).filter(([, labels]) => labels.length > 0);
}