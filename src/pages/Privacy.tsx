import { Store, Shield, User, Database, Mail, ArrowLeft, CheckCircle, FileText, Lock, Eye, Server, Users, Cookie, Clock, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { MainFooter } from "@/components/MainFooter";
import { usePageSEO } from "@/hooks/useSEO";

export default function Privacy() {
  usePageSEO({
    title: "Política de Privacidade | Mostralo Digital Catalog",
    description: "Conheça nossa política de privacidade e como tratamos seus dados na plataforma Mostralo para catálogos digitais.",
    keywords: "política de privacidade, dados, LGPD, mostralo, proteção dados"
  });

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
              <Shield className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Política de Privacidade
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Saiba como coletamos, usamos e protegemos suas informações na plataforma Mostralo
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* Introdução */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">1. Introdução</h2>
            </div>
            <div className="bg-muted/50 rounded-lg p-6">
              <p className="text-muted-foreground leading-relaxed">
                Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações 
                quando você usa a plataforma Mostralo. Estamos comprometidos com a proteção da sua privacidade e 
                cumprimos a Lei Geral de Proteção de Dados (LGPD).
              </p>
            </div>
          </section>

          {/* Informações que Coletamos */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">2. Informações que Coletamos</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-card border rounded-lg p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Informações de Cadastro</h3>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Nome completo</li>
                  <li>• Endereço de email</li>
                  <li>• Telefone</li>
                  <li>• Informações da empresa</li>
                </ul>
              </div>
              <div className="bg-card border rounded-lg p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Informações de Uso</h3>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Dados de navegação</li>
                  <li>• Endereço IP</li>
                  <li>• Cookies</li>
                  <li>• Logs de sistema</li>
                </ul>
              </div>
              <div className="bg-card border rounded-lg p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Conteúdo da Loja</h3>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Informações dos produtos</li>
                  <li>• Imagens e descrições</li>
                  <li>• Configurações</li>
                  <li>• Dados de pedidos</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Como Usamos */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Eye className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">3. Como Usamos suas Informações</h2>
            </div>
            <div className="bg-muted/50 rounded-lg p-6">
              <p className="text-muted-foreground mb-4">Utilizamos suas informações para:</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  "Fornecer e manter nossos serviços",
                  "Processar transações e pagamentos",
                  "Comunicar sobre atualizações e suporte",
                  "Melhorar a experiência do usuário",
                  "Garantir a segurança da plataforma",
                  "Cumprir obrigações legais"
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Compartilhamento */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">4. Compartilhamento de Informações</h2>
            </div>
            <div className="bg-card border rounded-lg p-6 space-y-4">
              <p className="text-muted-foreground font-medium">
                Não vendemos suas informações pessoais. Podemos compartilhar dados apenas nas seguintes situações:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                  <span>Com seu consentimento explícito</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                  <span>Para cumprir obrigações legais</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                  <span>Com prestadores de serviços essenciais (processamento de pagamento, hospedagem)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                  <span>Em caso de fusão ou aquisição da empresa</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                  <span>Para proteger direitos, propriedade e segurança</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Segurança */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Lock className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">5. Segurança dos Dados</h2>
            </div>
            <div className="bg-muted/50 rounded-lg p-6">
              <p className="text-muted-foreground mb-4">Implementamos medidas de segurança técnicas e organizacionais:</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  "Criptografia de dados em trânsito e em repouso",
                  "Controle de acesso baseado em funções",
                  "Monitoramento contínuo de segurança",
                  "Backups regulares e seguros",
                  "Treinamento de equipe em proteção de dados"
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Direitos LGPD */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">6. Seus Direitos (LGPD)</h2>
            </div>
            <p className="text-muted-foreground">
              De acordo com a LGPD, você tem direito a:
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                "Confirmação da existência de tratamento de dados",
                "Acesso aos seus dados pessoais",
                "Correção de dados incompletos ou inexatos",
                "Anonimização, bloqueio ou eliminação de dados",
                "Portabilidade dos dados",
                "Eliminação dos dados tratados com consentimento",
                "Revogação do consentimento"
              ].map((item, index) => (
                <div key={index} className="bg-muted/30 rounded-lg p-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Cookies */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Cookie className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">7. Cookies e Tecnologias Similares</h2>
            </div>
            <div className="bg-card border rounded-lg p-6">
              <p className="text-muted-foreground leading-relaxed">
                Utilizamos cookies essenciais para o funcionamento da plataforma, cookies de desempenho para melhorar 
                a experiência e cookies de funcionalidade para lembrar suas preferências. Você pode gerenciar suas 
                preferências de cookies através das configurações do seu navegador.
              </p>
              <Link 
                to="/cookies" 
                className="inline-flex items-center gap-2 mt-4 text-primary hover:underline text-sm"
              >
                Saiba mais sobre nossa Política de Cookies →
              </Link>
            </div>
          </section>

          {/* Retenção */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">8. Retenção de Dados</h2>
            </div>
            <div className="bg-muted/50 rounded-lg p-6">
              <p className="text-muted-foreground leading-relaxed">
                Mantemos seus dados pessoais apenas pelo tempo necessário para cumprir as finalidades descritas nesta política, 
                exceto quando exigido por lei. Dados de contas inativas são automaticamente excluídos após 2 anos de inatividade.
              </p>
            </div>
          </section>

          {/* Alterações */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">9. Alterações na Política</h2>
            </div>
            <div className="bg-card border rounded-lg p-6">
              <p className="text-muted-foreground leading-relaxed">
                Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos sobre alterações significativas 
                por email ou através da plataforma. A data da última atualização sempre estará indicada no início do documento.
              </p>
            </div>
          </section>

          {/* Contato */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">10. Contato</h2>
            </div>
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 space-y-4">
              <p className="text-foreground leading-relaxed">
                Para questões sobre privacidade e proteção de dados:
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary" />
                  <div>
                    <span className="font-medium">E-mail:</span>
                    <a href="mailto:privacidade@mostralo.com.br" className="ml-2 text-primary hover:underline">
                      privacidade@mostralo.com.br
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-primary" />
                  <div>
                    <span className="font-medium">Encarregado de Dados (DPO):</span>
                    <a href="mailto:dpo@mostralo.com.br" className="ml-2 text-primary hover:underline">
                      dpo@mostralo.com.br
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Última Atualização */}
          <section className="text-center pt-8 border-t">
            <p className="text-sm text-muted-foreground">
              Esta página foi atualizada pela última vez em <strong>31 de janeiro de 2026</strong>.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Para mais informações, consulte nossa{" "}
              <Link to="/lgpd" className="text-primary hover:underline">
                Página sobre LGPD
              </Link>
              .
            </p>
          </section>
        </div>
      </main>

      <MainFooter showDisclaimer={false} />
    </div>
  );
}