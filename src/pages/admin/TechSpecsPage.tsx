import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Code2, Database, Cloud, Server, Zap, Shield, 
  Package, Palette, FormInput, BarChart3, Map, 
  PlayCircle, Smartphone, MessageCircle, Brain,
  CreditCard, ShoppingCart, Share2, Globe, Building2,
  ExternalLink
} from "lucide-react";

// Stack Principal
const mainStack = [
  {
    name: "React",
    version: "18.3.1",
    description: "Biblioteca JavaScript para construção de interfaces de usuário",
    icon: Code2,
    color: "bg-blue-500",
    companies: ["Meta", "Netflix", "Airbnb", "Discord", "Uber", "Twitter"]
  },
  {
    name: "TypeScript",
    version: "5.x",
    description: "JavaScript com tipagem estática para maior segurança e produtividade",
    icon: Code2,
    color: "bg-blue-600",
    companies: ["Microsoft", "Google", "Slack", "Asana", "Figma"]
  },
  {
    name: "Vite",
    version: "5.x",
    description: "Build tool ultrarrápido para desenvolvimento moderno",
    icon: Zap,
    color: "bg-purple-500",
    companies: ["Shopify", "Laravel", "Astro", "SvelteKit"]
  },
  {
    name: "Tailwind CSS",
    version: "3.x",
    description: "Framework CSS utility-first para design responsivo e consistente",
    icon: Palette,
    color: "bg-cyan-500",
    companies: ["GitHub", "Shopify", "Vercel", "OpenAI", "Netflix"]
  },
  {
    name: "Supabase",
    version: "2.55",
    description: "Backend-as-a-Service com PostgreSQL, Auth, Storage e Realtime",
    icon: Database,
    color: "bg-green-500",
    companies: ["Mozilla", "Humata AI", "Replicate", "Pika", "Resend"]
  }
];

// Bibliotecas organizadas por categoria
const libraries = {
  "UI Components": [
    { name: "Radix UI", description: "15+ componentes acessíveis e customizáveis", version: "^1.x" },
    { name: "Lucide Icons", description: "Biblioteca de ícones SVG modernos", version: "0.462" },
    { name: "shadcn/ui", description: "Componentes reutilizáveis com Radix + Tailwind", version: "latest" },
    { name: "Sonner", description: "Notificações toast elegantes", version: "1.7" },
    { name: "Vaul", description: "Drawer/Modal responsivo", version: "0.9" },
    { name: "CMDK", description: "Command palette (busca rápida)", version: "1.1" }
  ],
  "Formulários & Validação": [
    { name: "React Hook Form", description: "Gerenciamento de formulários performático", version: "7.61" },
    { name: "Zod", description: "Schema validation TypeScript-first", version: "4.1" },
    { name: "@hookform/resolvers", description: "Integração RHF + Zod", version: "5.2" }
  ],
  "State & Data": [
    { name: "TanStack Query", description: "Cache e sincronização de dados", version: "5.83" },
    { name: "React Context", description: "Estado global nativo React", version: "built-in" },
    { name: "React Router DOM", description: "Roteamento SPA", version: "6.30" }
  ],
  "Mapas & Geolocalização": [
    { name: "Mapbox GL JS", description: "Mapas interativos 3D", version: "3.15" },
    { name: "Turf.js", description: "Análise geoespacial (áreas de entrega)", version: "7.2" },
    { name: "@mapbox/mapbox-gl-draw", description: "Desenho de polígonos no mapa", version: "1.5" }
  ],
  "Visualização": [
    { name: "Recharts", description: "Gráficos declarativos para React", version: "2.15" },
    { name: "Embla Carousel", description: "Carrossel leve e acessível", version: "8.6" }
  ],
  "Drag & Drop": [
    { name: "react-beautiful-dnd", description: "Drag and drop fluido (Kanban)", version: "13.1" },
    { name: "react-resizable-panels", description: "Painéis redimensionáveis", version: "2.1" }
  ],
  "PWA & Mobile": [
    { name: "vite-plugin-pwa", description: "Progressive Web App automático", version: "1.1" },
    { name: "date-fns", description: "Manipulação de datas", version: "4.1" }
  ]
};

// APIs Externas
const externalAPIs = [
  {
    name: "Evolution API",
    icon: MessageCircle,
    color: "bg-green-600",
    description: "Automação WhatsApp Business",
    features: ["Bots com IA", "Campanhas em massa", "Gestão de instâncias", "Webhooks"]
  },
  {
    name: "OpenAI",
    icon: Brain,
    color: "bg-emerald-600",
    description: "Inteligência Artificial avançada",
    features: ["GPT-4o", "Text-to-Speech", "Embeddings", "Análise de dados"]
  },
  {
    name: "EFI (Gerencianet)",
    icon: CreditCard,
    color: "bg-orange-500",
    description: "Gateway de pagamentos",
    features: ["PIX instantâneo", "Boleto", "Split Payment", "Cobrança recorrente"]
  },
  {
    name: "Mapbox",
    icon: Map,
    color: "bg-indigo-500",
    description: "Mapas e geolocalização",
    features: ["Geocodificação", "Rotas de entrega", "Áreas de cobertura", "Mapas 3D"]
  },
  {
    name: "iFood",
    icon: ShoppingCart,
    color: "bg-red-500",
    description: "Marketplace de delivery",
    features: ["Sincronização de pedidos", "Cardápio integrado", "Status em tempo real"]
  },
  {
    name: "Google Shopping",
    icon: Globe,
    color: "bg-blue-500",
    description: "Feed de produtos",
    features: ["SEO para e-commerce", "Google Merchant", "Catálogo automático"]
  },
  {
    name: "Meta Commerce",
    icon: Share2,
    color: "bg-blue-600",
    description: "Vendas em redes sociais",
    features: ["Catálogo Facebook", "Instagram Shopping", "WhatsApp Business"]
  }
];

// Infraestrutura
const infrastructure = [
  {
    component: "VPS / Servidor",
    provider: "Contabo / Hetzner",
    icon: Server,
    description: "Servidor dedicado de alta performance na Alemanha",
    details: "Docker, Nginx, SSL automático"
  },
  {
    component: "Database",
    provider: "Supabase PostgreSQL",
    icon: Database,
    description: "Banco relacional com Row Level Security (RLS)",
    details: "Backup automático, Conexão pooling"
  },
  {
    component: "Edge Functions",
    provider: "Supabase (Deno)",
    icon: Zap,
    description: "95+ funções serverless",
    details: "Deploy automático, Logs em tempo real"
  },
  {
    component: "Realtime",
    provider: "Supabase WebSocket",
    icon: Zap,
    description: "Atualizações instantâneas",
    details: "Pedidos, Kanban, Notificações"
  },
  {
    component: "Storage",
    provider: "Supabase Storage",
    icon: Cloud,
    description: "Armazenamento de arquivos",
    details: "Imagens, Documentos, Logos"
  },
  {
    component: "Autenticação",
    provider: "Supabase Auth",
    icon: Shield,
    description: "Sistema de login seguro",
    details: "Email, Magic Link, JWT"
  },
  {
    component: "CDN / Proxy",
    provider: "Nginx + Cloudflare",
    icon: Globe,
    description: "Cache e proteção DDoS",
    details: "SSL, Rate limiting, Rich Link Preview"
  },
  {
    component: "Preview / Deploy",
    provider: "Lovable",
    icon: Code2,
    description: "Ambiente de desenvolvimento",
    details: "Hot reload, Deploy automático"
  }
];

// Referências corporativas
const corporateReferences = [
  { name: "Meta", tech: "React", logo: "🔵" },
  { name: "Netflix", tech: "React, Tailwind", logo: "🔴" },
  { name: "Airbnb", tech: "React, TypeScript", logo: "🏠" },
  { name: "Microsoft", tech: "TypeScript", logo: "🪟" },
  { name: "Google", tech: "TypeScript", logo: "🔍" },
  { name: "GitHub", tech: "Tailwind, React", logo: "🐙" },
  { name: "Shopify", tech: "React, Vite", logo: "🛒" },
  { name: "Vercel", tech: "React, Tailwind", logo: "▲" },
  { name: "Discord", tech: "React", logo: "🎮" },
  { name: "Slack", tech: "TypeScript", logo: "💬" },
  { name: "Figma", tech: "TypeScript", logo: "🎨" },
  { name: "Mozilla", tech: "Supabase", logo: "🦊" },
  { name: "Spotify", tech: "PostgreSQL", logo: "🎵" },
  { name: "Instagram", tech: "PostgreSQL", logo: "📷" },
  { name: "Twitch", tech: "PostgreSQL", logo: "📺" },
  { name: "OpenAI", tech: "Tailwind", logo: "🤖" }
];

export default function TechSpecsPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <Code2 className="h-8 w-8 text-primary" />
          Especificações Técnicas do Sistema
        </h1>
        <p className="text-muted-foreground">
          Stack tecnológica completa do Mostralo 360° - Tecnologias de ponta usadas por empresas líderes mundiais
        </p>
      </div>

      {/* Stack Principal */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Package className="h-5 w-5" />
          Stack Principal
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {mainStack.map((tech) => (
            <Card key={tech.name} className="relative overflow-hidden">
              <div className={`absolute top-0 left-0 right-0 h-1 ${tech.color}`} />
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <tech.icon className="h-6 w-6 text-muted-foreground" />
                  <Badge variant="outline" className="text-xs">v{tech.version}</Badge>
                </div>
                <CardTitle className="text-lg mt-2">{tech.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xs text-muted-foreground mb-3">{tech.description}</p>
                <div className="flex flex-wrap gap-1">
                  {tech.companies.slice(0, 3).map((company) => (
                    <Badge key={company} variant="secondary" className="text-[10px]">
                      {company}
                    </Badge>
                  ))}
                  {tech.companies.length > 3 && (
                    <Badge variant="secondary" className="text-[10px]">
                      +{tech.companies.length - 3}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Tabs para categorias detalhadas */}
      <Tabs defaultValue="libraries" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="libraries">Bibliotecas</TabsTrigger>
          <TabsTrigger value="apis">APIs Externas</TabsTrigger>
          <TabsTrigger value="infra">Infraestrutura</TabsTrigger>
          <TabsTrigger value="references">Referências</TabsTrigger>
        </TabsList>

        {/* Bibliotecas */}
        <TabsContent value="libraries" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(libraries).map(([category, libs]) => (
              <Card key={category}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{category}</CardTitle>
                  <CardDescription>{libs.length} bibliotecas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {libs.map((lib) => (
                    <div key={lib.name} className="flex items-start justify-between gap-2 p-2 rounded-lg bg-muted/50">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{lib.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{lib.description}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">{lib.version}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Total:</strong> 40+ bibliotecas cuidadosamente selecionadas para máxima performance e manutenibilidade.
                Todas as dependências são atualizadas regularmente para garantir segurança e compatibilidade.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* APIs Externas */}
        <TabsContent value="apis" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {externalAPIs.map((api) => (
              <Card key={api.name} className="relative overflow-hidden">
                <div className={`absolute top-0 left-0 right-0 h-1 ${api.color}`} />
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${api.color} text-white`}>
                      <api.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{api.name}</CardTitle>
                      <CardDescription className="text-xs">{api.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {api.features.map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 flex items-start gap-3">
              <Zap className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Integração Segura</p>
                <p className="text-xs text-muted-foreground">
                  Todas as APIs são acessadas via Edge Functions com tokens criptografados. 
                  Nenhuma credencial é exposta no frontend.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Infraestrutura */}
        <TabsContent value="infra" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {infrastructure.map((item) => (
              <Card key={item.component}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{item.component}</CardTitle>
                      <CardDescription className="text-xs">{item.provider}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                  <Badge variant="outline" className="text-xs">{item.details}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Stats de infra */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-green-500/10 border-green-500/20">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">99.9%</p>
                <p className="text-xs text-muted-foreground">Uptime</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/10 border-blue-500/20">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">95+</p>
                <p className="text-xs text-muted-foreground">Edge Functions</p>
              </CardContent>
            </Card>
            <Card className="bg-purple-500/10 border-purple-500/20">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-purple-600">&lt;100ms</p>
                <p className="text-xs text-muted-foreground">Latência API</p>
              </CardContent>
            </Card>
            <Card className="bg-orange-500/10 border-orange-500/20">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-orange-600">256-bit</p>
                <p className="text-xs text-muted-foreground">Criptografia</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Referências Corporativas */}
        <TabsContent value="references" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Empresas que Usam as Mesmas Tecnologias
              </CardTitle>
              <CardDescription>
                O Mostralo utiliza a mesma stack de empresas líderes mundiais em tecnologia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
                {corporateReferences.map((ref) => (
                  <div 
                    key={ref.name} 
                    className="flex flex-col items-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <span className="text-2xl mb-1">{ref.logo}</span>
                    <p className="font-medium text-sm">{ref.name}</p>
                    <p className="text-[10px] text-muted-foreground text-center">{ref.tech}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Por tecnologia */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-blue-500" />
                  React
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  A biblioteca mais popular do mundo para construção de interfaces, 
                  criada pelo Facebook (Meta) e usada por milhões de desenvolvedores.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="h-4 w-4 text-green-500" />
                  PostgreSQL + Supabase
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  O banco de dados open-source mais avançado do mundo, 
                  potencializado pelo Supabase para funcionalidades em tempo real.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Server className="h-4 w-4 text-orange-500" />
                  Contabo / Hetzner
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Provedores europeus de alta qualidade com datacenters na Alemanha, 
                  oferecendo excelente custo-benefício e confiabilidade.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer info */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <p className="font-medium">Segurança & Compliance</p>
              <p className="text-sm text-muted-foreground">
                LGPD compliant • Criptografia ponta-a-ponta • Logs de auditoria
              </p>
            </div>
          </div>
          <a 
            href="https://docs.lovable.dev/features/cloud" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-primary hover:underline text-sm"
          >
            Ver documentação completa
            <ExternalLink className="h-4 w-4" />
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
