import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Layers, 
  Zap, 
  MousePointer, 
  FileCode, 
  FolderTree, 
  CheckCircle2,
  Code2,
  FileText,
  Lightbulb
} from "lucide-react";

const TechnicalDocsPage = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Documentação Técnica
        </h1>
        <p className="text-muted-foreground mt-1">
          Boas práticas de arquitetura e padrões implementados no projeto Mostralo
        </p>
      </div>

      {/* Quick Reference Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Componentização
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Componentes pequenos e focados</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Lazy Loading
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Carregamento sob demanda</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MousePointer className="h-4 w-4 text-blue-500" />
              Preload Inteligente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Pré-carrega no hover</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Code2 className="h-4 w-4 text-green-500" />
              Padrões de Código
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Convenções consistentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Accordion type="multiple" defaultValue={["componentizacao"]} className="space-y-4">
        {/* Componentização */}
        <AccordionItem value="componentizacao" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <Layers className="h-5 w-5 text-primary" />
              <span className="font-semibold">Componentização</span>
              <Badge variant="secondary">Arquitetura</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-foreground mb-2">Landing Page (Index.tsx)</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Refatorada de ~1000 linhas para ~80 linhas. Cada seção é um componente separado.
                </p>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="text-xs font-mono text-muted-foreground">src/components/landing/</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {[
                      'HeroSection.tsx',
                      'WhatsAppMarketingSection.tsx',
                      'DigitalSignageSection.tsx',
                      'PasswordCallSection.tsx',
                      'PDVComandasSection.tsx',
                      'ProblemsSection.tsx',
                      'ComparisonSection.tsx',
                      'FAQSection.tsx',
                      'PlansSection.tsx',
                      'TestimonialsSection.tsx',
                      'CTASection.tsx'
                    ].map((file) => (
                      <code key={file} className="text-xs bg-background px-2 py-1 rounded">
                        {file}
                      </code>
                    ))}
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium text-foreground mb-2">Dashboard (DashboardHome.tsx)</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Componentes modulares para cada seção do dashboard administrativo.
                </p>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="text-xs font-mono text-muted-foreground">src/components/admin/dashboard/</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {[
                      'MasterAdminKPIs.tsx',
                      'GrowthProjections.tsx',
                      'PendingActions.tsx',
                      'RecentActivityReal.tsx',
                      'StoreHealthIndicators.tsx'
                    ].map((file) => (
                      <code key={file} className="text-xs bg-background px-2 py-1 rounded">
                        {file}
                      </code>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Quando aplicar:</p>
                    <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                      <li>• Arquivo com mais de 200-300 linhas</li>
                      <li>• Seções que podem ser reutilizadas</li>
                      <li>• Lógica complexa que pode ser isolada</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Lazy Loading */}
        <AccordionItem value="lazy-loading" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-yellow-500" />
              <span className="font-semibold">Lazy Loading de Rotas</span>
              <Badge variant="secondary">Performance</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Rotas não-críticas são carregadas sob demanda via <code className="bg-muted px-1 rounded">React.lazy()</code>.
              Isso reduz o bundle inicial de 3-5MB para 300-500KB.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <h4 className="font-medium text-green-600 dark:text-green-400 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Páginas Críticas (NÃO lazy)
                </h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Index.tsx (landing page)</li>
                  <li>• Auth.tsx (login/registro)</li>
                  <li>• Store.tsx (loja pública)</li>
                  <li>• NotFound.tsx (404)</li>
                </ul>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <h4 className="font-medium text-yellow-600 dark:text-yellow-400 mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Páginas Lazy (sob demanda)
                </h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• masterRoutes.tsx</li>
                  <li>• storeAdminRoutes.tsx</li>
                  <li>• deliveryRoutes.tsx</li>
                  <li>• salespersonRoutes.tsx</li>
                  <li>• customerRoutes.tsx</li>
                </ul>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-xs font-mono text-muted-foreground mb-2">Exemplo de uso:</p>
              <pre className="text-xs bg-background p-3 rounded overflow-x-auto">
{`const GoalsPage = lazy(() => import("@/pages/admin/GoalsPage"));

<Route path="/dashboard/metas" element={
  <LazyRoute><GoalsPage /></LazyRoute>
} />`}
              </pre>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Preload Inteligente */}
        <AccordionItem value="preload" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <MousePointer className="h-5 w-5 text-blue-500" />
              <span className="font-semibold">Preload Inteligente</span>
              <Badge variant="secondary">UX</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Páginas são pré-carregadas quando o usuário passa o mouse sobre links do menu.
              Reduz o tempo de navegação de 200-500ms para menos de 50ms.
            </p>

            <div className="space-y-3">
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium text-foreground mb-2">Arquivos envolvidos:</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-muted-foreground" />
                    <code className="text-xs">src/config/routePreloads.ts</code>
                    <span className="text-xs text-muted-foreground">- Mapeamento de rotas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-muted-foreground" />
                    <code className="text-xs">src/hooks/usePreloadRoute.ts</code>
                    <span className="text-xs text-muted-foreground">- Hook com debounce</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-muted-foreground" />
                    <code className="text-xs">src/components/PreloadLink.tsx</code>
                    <span className="text-xs text-muted-foreground">- Componentes Link</span>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-xs font-mono text-muted-foreground mb-2">Como usar nos menus:</p>
                <pre className="text-xs bg-background p-3 rounded overflow-x-auto">
{`import { PreloadNavLink, PreloadLink } from "@/components/PreloadLink";

// Em vez de:
<NavLink to="/dashboard/orders">Pedidos</NavLink>

// Use:
<PreloadNavLink to="/dashboard/orders">Pedidos</PreloadNavLink>`}
              </pre>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  <strong>Debounce de 100ms:</strong> Evita preloads acidentais quando o mouse 
                  passa rapidamente sobre vários links.
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Padrões de Código */}
        <AccordionItem value="padroes" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <Code2 className="h-5 w-5 text-green-500" />
              <span className="font-semibold">Padrões de Código</span>
              <Badge variant="secondary">Convenções</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium text-foreground mb-2">Nomenclatura</h4>
                <ul className="text-xs text-muted-foreground space-y-2">
                  <li><code className="bg-background px-1 rounded">kebab-case</code> - Classes/IDs CSS</li>
                  <li><code className="bg-background px-1 rounded">camelCase</code> - Variáveis JS/TS</li>
                  <li><code className="bg-background px-1 rounded">PascalCase</code> - Componentes React</li>
                  <li><code className="bg-background px-1 rounded">UPPER_SNAKE</code> - Constantes</li>
                </ul>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium text-foreground mb-2">Formatação</h4>
                <ul className="text-xs text-muted-foreground space-y-2">
                  <li>• Indentação: 2 espaços</li>
                  <li>• TypeScript com tipagem explícita</li>
                  <li>• Sem uso de <code className="bg-background px-1 rounded">any</code></li>
                  <li>• Validação com Zod em formulários</li>
                </ul>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium text-foreground mb-2">Exemplos</h4>
              <pre className="text-xs bg-background p-3 rounded overflow-x-auto">
{`// ✅ Correto
const UserProfileCard = () => { ... }  // PascalCase - Componente
const totalOrders = 10;                 // camelCase - Variável
<div className="user-card">             // kebab-case - CSS

// ❌ Evitar
const user_profile = { ... };           // snake_case em JS
const data: any = { ... };              // Uso de any`}
              </pre>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Estrutura de Pastas */}
        <AccordionItem value="estrutura" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <FolderTree className="h-5 w-5 text-purple-500" />
              <span className="font-semibold">Estrutura de Pastas</span>
              <Badge variant="secondary">Organização</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <pre className="text-xs overflow-x-auto">
{`src/
├── components/           # Componentes reutilizáveis
│   ├── admin/           # Componentes do painel admin
│   │   ├── dashboard/   # Seções do dashboard
│   │   └── sidebar/     # Componentes do sidebar
│   ├── landing/         # Seções da landing page
│   └── ui/              # Componentes base (shadcn)
│
├── pages/               # Páginas da aplicação
│   ├── admin/           # Páginas do admin
│   ├── salesperson/     # Páginas do vendedor
│   └── store-admin/     # Páginas do lojista
│
├── hooks/               # Hooks customizados
│   ├── use-auth.ts
│   └── usePreloadRoute.ts
│
├── routes/              # Configuração de rotas
│   ├── publicRoutes.tsx
│   ├── masterRoutes.tsx
│   └── storeAdminRoutes.tsx
│
├── config/              # Configurações
│   └── routePreloads.ts
│
├── contexts/            # Contextos React
├── integrations/        # Integrações (Supabase)
└── lib/                 # Utilitários`}
              </pre>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-purple-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Regra de organização:</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Componentes específicos de uma página ficam na pasta da página.
                    Componentes usados em múltiplas páginas ficam em <code className="bg-background px-1 rounded">components/</code>.
                  </p>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Footer Reference */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Referência Completa</CardTitle>
          <CardDescription className="text-xs">
            Documentação detalhada disponível no arquivo ARCHITECTURE.md na raiz do projeto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <code className="text-xs bg-background px-2 py-1 rounded">./ARCHITECTURE.md</code>
        </CardContent>
      </Card>
    </div>
  );
};

export default TechnicalDocsPage;
