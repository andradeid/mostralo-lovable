import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, 
  Settings, 
  TrendingUp, 
  BarChart3,
  Store,
  Smartphone,
  Truck,
  QrCode,
  ChefHat,
  ClipboardList,
  Package,
  Users,
  MessageSquare,
  CreditCard,
  Star,
  Calendar,
  DollarSign,
  PieChart,
  FileText,
  UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Pilar {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  modules: {
    name: string;
    icon: React.ElementType;
    description: string;
  }[];
}

const pilares: Pilar[] = [
  {
    id: "vender",
    title: "VENDER",
    description: "Venda em todos os canais, sem pagar taxas",
    icon: ShoppingCart,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    modules: [
      { name: "Cardápio Digital", icon: Store, description: "Seu catálogo online 24h" },
      { name: "PDV Completo", icon: Smartphone, description: "Vendas no balcão" },
      { name: "Totem Autoatendimento", icon: QrCode, description: "Cliente faz o pedido sozinho" },
      { name: "Delivery Próprio", icon: Truck, description: "Entrega sem taxas de marketplace" },
      { name: "Mesa QR Code", icon: QrCode, description: "Pedidos direto da mesa" },
    ]
  },
  {
    id: "operar",
    title: "OPERAR",
    description: "Automatize sua operação do dia a dia",
    icon: Settings,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    modules: [
      { name: "KDS / Cozinha", icon: ChefHat, description: "Gestão de pedidos na cozinha" },
      { name: "Comanda Digital", icon: ClipboardList, description: "Controle de mesas e comandas" },
      { name: "Gestão de Estoque", icon: Package, description: "Controle de produtos" },
      { name: "Equipe de Entrega", icon: Users, description: "Atribuição e rastreamento" },
    ]
  },
  {
    id: "crescer",
    title: "CRESCER",
    description: "Marketing e fidelização automáticos",
    icon: TrendingUp,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    modules: [
      { name: "WhatsApp Marketing", icon: MessageSquare, description: "Campanhas automáticas" },
      { name: "Cartão Digital", icon: CreditCard, description: "Link único por profissional" },
      { name: "Sistema de Avaliações", icon: Star, description: "Feedback pós-atendimento" },
      { name: "Agendamentos Online", icon: Calendar, description: "Clientes agendam 24h" },
    ]
  },
  {
    id: "controlar",
    title: "CONTROLAR",
    description: "Dados e relatórios em tempo real",
    icon: BarChart3,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
    modules: [
      { name: "Financeiro Completo", icon: DollarSign, description: "Contas a pagar/receber" },
      { name: "Dashboard BI", icon: PieChart, description: "Métricas em tempo real" },
      { name: "Relatórios Detalhados", icon: FileText, description: "Exportação e análises" },
      { name: "Gestão de Clientes", icon: UserCheck, description: "CRM integrado" },
    ]
  }
];

export function PilaresSection() {
  const [activePilar, setActivePilar] = useState<string>("vender");
  const currentPilar = pilares.find(p => p.id === activePilar) || pilares[0];

  return (
    <section className="py-20 md:py-32 bg-muted/30">
      <div className="container px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <Badge variant="outline" className="mb-4">
            INTERESSE
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Tudo que Você Precisa.{" "}
            <span className="text-primary">Em Um Só Lugar.</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            4 pilares que transformam seu negócio em uma máquina de resultados
          </p>
        </div>

        {/* Pilares Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-12">
          {pilares.map((pilar) => {
            const Icon = pilar.icon;
            const isActive = activePilar === pilar.id;
            
            return (
              <button
                key={pilar.id}
                onClick={() => setActivePilar(pilar.id)}
                className={cn(
                  "relative p-4 md:p-6 rounded-xl border-2 transition-all duration-300 text-left",
                  isActive 
                    ? `border-primary ${pilar.bgColor} shadow-lg` 
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                <Icon className={cn("w-8 h-8 md:w-10 md:h-10 mb-2", pilar.color)} />
                <h3 className={cn(
                  "text-lg md:text-xl font-bold",
                  isActive ? pilar.color : "text-foreground"
                )}>
                  {pilar.title}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-2">
                  {pilar.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Modules Grid */}
        <Card className="border-2 border-primary/30">
          <CardHeader className={currentPilar.bgColor}>
            <CardTitle className="flex items-center gap-3">
              <currentPilar.icon className={cn("w-6 h-6", currentPilar.color)} />
              <span>Módulos de {currentPilar.title}</span>
              <Badge variant="secondary" className="ml-auto">
                {currentPilar.modules.length} módulos
              </Badge>
            </CardTitle>
            <CardDescription>{currentPilar.description}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {currentPilar.modules.map((module) => {
                const ModuleIcon = module.icon;
                return (
                  <div
                    key={module.name}
                    className="group p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("p-2 rounded-lg bg-background", currentPilar.bgColor)}>
                        <ModuleIcon className={cn("w-5 h-5", currentPilar.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm">{module.name}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {module.description}
                        </p>
                        <Badge variant="outline" className="mt-2 text-[10px]">
                          INCLUSO
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Total Count */}
        <div className="text-center mt-8">
          <p className="text-muted-foreground">
            <span className="text-2xl font-bold text-primary">28+</span> módulos totalmente integrados
          </p>
        </div>
      </div>
    </section>
  );
}
