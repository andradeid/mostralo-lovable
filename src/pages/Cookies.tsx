import { Store, Cookie, ArrowLeft, Settings, BarChart3, Shield, Clock, Globe, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { MainFooter } from "@/components/MainFooter";

export default function Cookies() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-slate-900 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Store className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold">Mostralo</span>
            </Link>
            <Link 
              to="/" 
              className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao início
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary/20 rounded-full">
              <Cookie className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Política de Cookies
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Entenda como utilizamos cookies para melhorar sua experiência na plataforma Mostralo
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* O que são Cookies */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <HelpCircle className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">O que são Cookies?</h2>
            </div>
            <div className="bg-muted/50 rounded-lg p-6 space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Cookies são pequenos arquivos de texto armazenados no seu dispositivo (computador, 
                tablet ou celular) quando você visita um site. Eles são amplamente utilizados para 
                fazer os sites funcionarem de maneira mais eficiente e fornecer informações aos 
                proprietários do site.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Na Mostralo, utilizamos cookies para garantir o funcionamento adequado da plataforma, 
                lembrar suas preferências e melhorar continuamente nossos serviços.
              </p>
            </div>
          </section>

          {/* Tipos de Cookies */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Tipos de Cookies que Utilizamos</h2>
            </div>
            <div className="space-y-4">
              {[
                {
                  icon: Shield,
                  title: "Cookies Essenciais",
                  description: "Necessários para o funcionamento básico do site. Sem eles, algumas funcionalidades não funcionariam corretamente.",
                  examples: ["Autenticação de usuário", "Carrinho de compras", "Sessão de navegação"],
                  required: true
                },
                {
                  icon: Settings,
                  title: "Cookies Funcionais",
                  description: "Permitem que o site lembre suas escolhas e forneça recursos aprimorados e personalizados.",
                  examples: ["Preferências de idioma", "Tema claro/escuro", "Loja favorita"],
                  required: false
                },
                {
                  icon: BarChart3,
                  title: "Cookies Analíticos",
                  description: "Nos ajudam a entender como os visitantes interagem com o site, coletando informações de forma anônima.",
                  examples: ["Páginas visitadas", "Tempo de permanência", "Origem do tráfego"],
                  required: false
                }
              ].map((item, index) => (
                <div key={index} className="bg-card border rounded-lg p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{item.title}</h3>
                        {item.required && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                            Obrigatório
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-muted-foreground">{item.description}</p>
                  <div>
                    <span className="text-sm font-medium">Exemplos:</span>
                    <ul className="mt-2 space-y-1">
                      {item.examples.map((example, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                          {example}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Cookies de Terceiros */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Globe className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Cookies de Terceiros</h2>
            </div>
            <div className="bg-muted/50 rounded-lg p-6 space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Alguns cookies são definidos por serviços de terceiros que aparecem em nossas páginas. 
                Não controlamos esses cookies de terceiros e recomendamos que você consulte as 
                políticas de privacidade desses serviços.
              </p>
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                {[
                  { name: "Google Analytics", purpose: "Análise de tráfego e comportamento" },
                  { name: "Supabase", purpose: "Autenticação e banco de dados" },
                  { name: "Mapbox", purpose: "Serviços de mapas e localização" },
                  { name: "WhatsApp", purpose: "Integração de mensagens" }
                ].map((service, index) => (
                  <div key={index} className="bg-background rounded-lg p-4 border">
                    <p className="font-medium">{service.name}</p>
                    <p className="text-sm text-muted-foreground">{service.purpose}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Validade dos Cookies */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Validade dos Cookies</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-4 font-semibold border">Tipo</th>
                    <th className="text-left p-4 font-semibold border">Duração</th>
                    <th className="text-left p-4 font-semibold border">Descrição</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-4 border">Cookies de Sessão</td>
                    <td className="p-4 border">Até fechar o navegador</td>
                    <td className="p-4 border text-muted-foreground">Temporários, excluídos automaticamente</td>
                  </tr>
                  <tr className="bg-muted/30">
                    <td className="p-4 border">Cookies Persistentes</td>
                    <td className="p-4 border">1 a 365 dias</td>
                    <td className="p-4 border text-muted-foreground">Permanecem até expirar ou serem excluídos</td>
                  </tr>
                  <tr>
                    <td className="p-4 border">Cookies de Autenticação</td>
                    <td className="p-4 border">7 a 30 dias</td>
                    <td className="p-4 border text-muted-foreground">Mantém sua sessão ativa</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Como Gerenciar */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Como Gerenciar Cookies</h2>
            </div>
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 space-y-4">
              <p className="text-foreground leading-relaxed">
                Você pode gerenciar ou desativar cookies através das configurações do seu navegador. 
                Note que desativar alguns cookies pode afetar a funcionalidade do site.
              </p>
              <div className="grid sm:grid-cols-2 gap-3 mt-4">
                {[
                  { browser: "Chrome", url: "chrome://settings/cookies" },
                  { browser: "Firefox", url: "about:preferences#privacy" },
                  { browser: "Safari", url: "Preferências > Privacidade" },
                  { browser: "Edge", url: "edge://settings/privacy" }
                ].map((item, index) => (
                  <div key={index} className="bg-background rounded-lg p-3 border">
                    <p className="font-medium">{item.browser}</p>
                    <p className="text-xs text-muted-foreground">{item.url}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Última Atualização */}
          <section className="text-center pt-8 border-t">
            <p className="text-sm text-muted-foreground">
              Esta política foi atualizada pela última vez em <strong>31 de janeiro de 2026</strong>.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Dúvidas? Consulte nossa{" "}
              <Link to="/lgpd" className="text-primary hover:underline">
                página sobre LGPD
              </Link>
              {" "}ou entre em contato.
            </p>
          </section>
        </div>
      </main>

      <MainFooter showDisclaimer={false} />
    </div>
  );
}
