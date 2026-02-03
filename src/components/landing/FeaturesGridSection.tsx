import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  Smartphone,
  MessageSquare,
  CreditCard,
  ClipboardList,
  ShoppingBag,
  QrCode,
  Package,
  BarChart3,
  Wallet,
  Users,
  Utensils
} from 'lucide-react';

const featureCategories = [
  {
    title: "Para Vendas",
    color: "orange",
    features: [
      {
        icon: Bot,
        title: "Atendente IA",
        description: "Atenda seus clientes automaticamente no WhatsApp com inteligência artificial 24h por dia, 7 dias por semana."
      },
      {
        icon: Smartphone,
        title: "Cardápio Digital",
        description: "Dê autonomia aos seus clientes para fazerem pedidos com facilidade e rapidez, direto do celular!"
      },
      {
        icon: MessageSquare,
        title: "WhatsApp Marketing",
        description: "Recupere clientes com mensagens automáticas e incentive o retorno ao seu estabelecimento."
      },
      {
        icon: CreditCard,
        title: "Pagamento Online",
        description: "Receba por PIX direto no cardápio. Simples, seguro e sem taxas abusivas."
      }
    ]
  },
  {
    title: "Para Atendimento Presencial",
    color: "green",
    features: [
      {
        icon: ClipboardList,
        title: "Gestão de Comandas",
        description: "Visualize mesas ocupadas, adicione itens à comanda, edite pedidos e feche contas facilmente."
      },
      {
        icon: ShoppingBag,
        title: "PDV - Ponto de Venda",
        description: "Centralize pedidos locais e por telefone em uma única ferramenta, agilizando sua operação."
      },
      {
        icon: QrCode,
        title: "QR Code para Mesa",
        description: "Crie QR Codes para mesas e facilite o autoatendimento no seu restaurante ou bar."
      },
      {
        icon: Utensils,
        title: "KDS - Painel da Cozinha",
        description: "Exiba pedidos em tempo real na cozinha com alertas sonoros e controle de preparo."
      }
    ]
  },
  {
    title: "Para Gestão do Negócio",
    color: "blue",
    features: [
      {
        icon: Wallet,
        title: "Frente de Caixa",
        description: "Processo de abertura e fechamento de caixa de forma simples, prática e organizada."
      },
      {
        icon: Package,
        title: "Controle de Estoque",
        description: "Gerencie quantidades de produtos com alertas de estoque baixo e bloqueio automático de itens esgotados."
      },
      {
        icon: BarChart3,
        title: "Relatórios Completos",
        description: "Analise vendas, produtos mais vendidos, horários de pico e performance do seu negócio."
      },
      {
        icon: Users,
        title: "Gestor de Pedidos",
        description: "Todos os pedidos de delivery, balcão, mesa e PDV centralizados em um único painel."
      }
    ]
  }
];

const colorClasses = {
  orange: {
    badge: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    icon: "from-orange-500 to-orange-600",
    border: "hover:border-orange-500/50"
  },
  green: {
    badge: "bg-green-500/20 text-green-400 border-green-500/30",
    icon: "from-green-500 to-green-600",
    border: "hover:border-green-500/50"
  },
  blue: {
    badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    icon: "from-blue-500 to-blue-600",
    border: "hover:border-blue-500/50"
  }
};

export const FeaturesGridSection = () => {
  return (
    <section className="py-16 lg:py-24 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 text-white">
            Gestão completa em uma{" "}
            <span className="text-orange-500">única assinatura</span>
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Todas as ferramentas que você precisa para vender mais, atender melhor e gerenciar seu negócio
          </p>
        </div>

        <div className="space-y-12">
          {featureCategories.map((category, catIndex) => {
            const colors = colorClasses[category.color as keyof typeof colorClasses];
            
            return (
              <div key={catIndex}>
                <div className="flex items-center justify-center mb-6">
                  <Badge className={`text-sm px-4 py-2 ${colors.badge}`}>
                    {category.title}
                  </Badge>
                </div>
                
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {category.features.map((feature, fIndex) => (
                    <Card 
                      key={fIndex}
                      className={`p-5 bg-zinc-900/80 border-zinc-800 ${colors.border} transition-all duration-300 hover:-translate-y-1`}
                    >
                      <div className={`w-10 h-10 bg-gradient-to-br ${colors.icon} rounded-lg flex items-center justify-center mb-4`}>
                        <feature.icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                      <p className="text-sm text-zinc-400 leading-relaxed">{feature.description}</p>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
