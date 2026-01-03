import { useState } from "react";
import { 
  ShoppingCart, 
  MonitorSmartphone, 
  Tablet, 
  UtensilsCrossed,
  ChefHat,
  Clock,
  CalendarClock,
  Printer,
  Truck,
  MapPin,
  MessageSquare,
  Bell,
  Share2,
  Image,
  QrCode,
  Ticket,
  BarChart3,
  Wallet,
  Users,
  Tv,
  Palette,
  Link2,
  Code,
  Calendar,
  Sparkles,
  Bot,
  Store
} from "lucide-react";
import { cn } from "@/lib/utils";

type Category = "vendas" | "operacao" | "delivery" | "marketing" | "gestao" | "visual" | "integracoes";

interface Module {
  name: string;
  description: string;
  icon: React.ElementType;
  badge?: "novo" | "exclusivo" | "popular";
}

const categories: { id: Category; label: string }[] = [
  { id: "vendas", label: "Vendas e Atendimento" },
  { id: "operacao", label: "Operação e Cozinha" },
  { id: "delivery", label: "Delivery" },
  { id: "marketing", label: "Marketing e Fidelização" },
  { id: "gestao", label: "Gestão e Finanças" },
  { id: "visual", label: "Visual e Experiência" },
  { id: "integracoes", label: "Integrações" },
];

const modules: Record<Category, Module[]> = {
  vendas: [
    { name: "Cardápio Digital", description: "Catálogo online profissional com fotos e descrições", icon: Store, badge: "popular" },
    { name: "PDV e Comandas", description: "Sistema de ponto de venda completo com comandas eletrônicas", icon: MonitorSmartphone, badge: "novo" },
    { name: "Totem Autoatendimento", description: "Terminal para clientes fazerem pedidos sozinhos", icon: Tablet, badge: "novo" },
    { name: "Cardápio na Mesa", description: "Self-service com QR Code para pedidos na mesa", icon: UtensilsCrossed },
  ],
  operacao: [
    { name: "Gestão de Pedidos", description: "Painel centralizado para gerenciar todos os pedidos", icon: ShoppingCart, badge: "popular" },
    { name: "KDS - Kitchen Display", description: "Tela da cozinha para organizar produção", icon: ChefHat, badge: "novo" },
    { name: "Chamada de Senhas", description: "Sistema de senhas para retirada de pedidos", icon: Clock },
    { name: "Pedidos Agendados", description: "Receba pedidos programados para horários específicos", icon: CalendarClock },
    { name: "Impressão Automática", description: "Impressão de comandas em impressoras térmicas", icon: Printer },
  ],
  delivery: [
    { name: "Delivery Inteligente", description: "Zonas de entrega, taxas dinâmicas e raio de atendimento", icon: MapPin, badge: "popular" },
    { name: "App de Entregadores", description: "Aplicativo para motoboys com GPS e roteirização", icon: Truck, badge: "exclusivo" },
  ],
  marketing: [
    { name: "WhatsApp Marketing", description: "Disparo de mensagens e campanhas via WhatsApp", icon: MessageSquare, badge: "popular" },
    { name: "SENTINELA", description: "Sistema de recompra inteligente baseado em comportamento", icon: Bell, badge: "exclusivo" },
    { name: "Marketing Digital", description: "Criação automática de posts para redes sociais", icon: Share2 },
    { name: "Banners Promocionais", description: "Banners rotativos na loja virtual", icon: Image },
    { name: "Material de Marketing", description: "QR Codes, panfletos e materiais para divulgação", icon: QrCode },
    { name: "Promoções e Cupons", description: "Cupons de desconto e promoções temporárias", icon: Ticket },
  ],
  gestao: [
    { name: "Relatórios e Análises", description: "Dashboards com métricas de vendas e performance", icon: BarChart3, badge: "popular" },
    { name: "Gestão Financeira", description: "Fluxo de caixa, receitas e despesas", icon: Wallet },
    { name: "Gestão de Atendentes", description: "Permissões e controle de equipe", icon: Users },
  ],
  visual: [
    { name: "Painel Digital", description: "Digital signage para TVs na loja", icon: Tv },
    { name: "Personalização da Loja", description: "Cores, logo, horários e aparência", icon: Palette },
  ],
  integracoes: [
    { name: "Integração iFood", description: "Sincronize pedidos do iFood automaticamente", icon: Link2 },
    { name: "Integrações Externas", description: "APIs para conectar sistemas externos", icon: Code },
    { name: "Scripts Personalizados", description: "JavaScript customizado para funcionalidades extras", icon: Code },
    { name: "Agendamento Online", description: "Sistema de agendamento para serviços", icon: Calendar, badge: "novo" },
    { name: "Diagnóstico IA", description: "Análise inteligente do seu negócio", icon: Bot, badge: "novo" },
  ],
};

const badgeStyles = {
  novo: "bg-green-500/10 text-green-600 dark:text-green-400",
  exclusivo: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  popular: "bg-primary/10 text-primary",
};

const badgeLabels = {
  novo: "Novo",
  exclusivo: "Exclusivo",
  popular: "Popular",
};

export const AboutModules = () => {
  const [activeCategory, setActiveCategory] = useState<Category>("vendas");

  return (
    <section className="py-16 md:py-24">
      <div className="container px-4 md:px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            28+ Módulos
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-foreground mb-3">
            Todos os Módulos da Plataforma
          </h2>
          <p className="text-muted-foreground">
            Funcionalidades integradas que crescem com o seu negócio
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8 md:mb-10">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                activeCategory === category.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Modules Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {modules[activeCategory].map((module) => {
            const Icon = module.icon;
            return (
              <div
                key={module.name}
                className="bg-card border rounded-xl p-4 md:p-5 hover:border-primary/50 hover:shadow-md transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground text-sm md:text-base truncate">
                        {module.name}
                      </h3>
                      {module.badge && (
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0",
                          badgeStyles[module.badge]
                        )}>
                          {badgeLabels[module.badge]}
                        </span>
                      )}
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                      {module.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
