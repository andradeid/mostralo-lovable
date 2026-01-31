import { Store, FileText, User, Shield, CreditCard, AlertTriangle, Mail, ArrowLeft, CheckCircle, Scale, Lock, XCircle, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { MainFooter } from "@/components/MainFooter";
import { usePageSEO } from "@/hooks/useSEO";

export default function TermsOfUse() {
  usePageSEO({
    title: "Termos de Uso | Mostralo Digital Catalog",
    description: "Leia os termos e condições de uso da plataforma Mostralo para criar catálogos digitais para restaurantes.",
    keywords: "termos de uso, condições, mostralo, catálogo digital, restaurante"
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
              <FileText className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Termos de Uso
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Conheça os termos e condições para utilização da plataforma Mostralo
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* Aceitação */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">1. Aceitação dos Termos</h2>
            </div>
            <div className="bg-muted/50 rounded-lg p-6">
              <p className="text-muted-foreground leading-relaxed">
                Ao acessar e usar a plataforma Mostralo, você concorda em cumprir e estar vinculado a estes Termos de Uso. 
                Se você não concordar com qualquer parte destes termos, não deve usar nossos serviços.
              </p>
            </div>
          </section>

          {/* Descrição do Serviço */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Store className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">2. Descrição do Serviço</h2>
            </div>
            <div className="bg-card border rounded-lg p-6">
              <p className="text-muted-foreground leading-relaxed">
                O Mostralo é uma plataforma que permite a restaurantes e estabelecimentos gastronômicos criarem 
                catálogos digitais para seus produtos e serviços. Oferecemos ferramentas para gestão de cardápios, 
                pedidos e relacionamento com clientes.
              </p>
            </div>
          </section>

          {/* Registro e Conta */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">3. Registro e Conta</h2>
            </div>
            <div className="bg-muted/50 rounded-lg p-6">
              <p className="text-muted-foreground mb-4">Para usar nossos serviços, você deve:</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  "Fornecer informações precisas e atualizadas durante o registro",
                  "Manter a segurança da sua conta e senha",
                  "Notificar-nos imediatamente sobre qualquer uso não autorizado",
                  "Ser responsável por todas as atividades em sua conta"
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Uso Aceitável */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <XCircle className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">4. Uso Aceitável</h2>
            </div>
            <div className="bg-card border rounded-lg p-6">
              <p className="text-muted-foreground mb-4 font-medium">Você concorda em não usar a plataforma para:</p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 mt-1 flex-shrink-0" />
                  <span>Violar qualquer lei ou regulamento aplicável</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 mt-1 flex-shrink-0" />
                  <span>Transmitir conteúdo ofensivo, difamatório ou ilegal</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 mt-1 flex-shrink-0" />
                  <span>Interferir no funcionamento da plataforma</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 mt-1 flex-shrink-0" />
                  <span>Tentar acessar contas de outros usuários</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 mt-1 flex-shrink-0" />
                  <span>Usar a plataforma para fins comerciais não autorizados</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Propriedade Intelectual */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Lock className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">5. Propriedade Intelectual</h2>
            </div>
            <div className="bg-muted/50 rounded-lg p-6">
              <p className="text-muted-foreground leading-relaxed">
                Todos os direitos de propriedade intelectual da plataforma Mostralo, incluindo código, design, 
                logotipos e conteúdo, são de propriedade da empresa. Você mantém os direitos sobre o conteúdo 
                que carrega, mas nos concede licença para exibi-lo através da plataforma.
              </p>
            </div>
          </section>

          {/* Pagamentos */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">6. Pagamentos e Cancelamento</h2>
            </div>
            <div className="bg-card border rounded-lg p-6">
              <p className="text-muted-foreground mb-4">Para planos pagos:</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  "Os pagamentos são processados mensalmente",
                  "Você pode cancelar a qualquer momento",
                  "Não oferecemos reembolsos para períodos parciais",
                  "O acesso é mantido até o final do período pago"
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Limitação de Responsabilidade */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">7. Limitação de Responsabilidade</h2>
            </div>
            <div className="bg-muted/50 rounded-lg p-6">
              <p className="text-muted-foreground leading-relaxed">
                A plataforma é fornecida "como está". Não garantimos disponibilidade ininterrupta e não seremos 
                responsáveis por perdas indiretas ou danos consequenciais decorrentes do uso da plataforma.
              </p>
            </div>
          </section>

          {/* Alterações nos Termos */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">8. Alterações nos Termos</h2>
            </div>
            <div className="bg-card border rounded-lg p-6 space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Reservamo-nos o direito de promover alterações, atualizações e melhorias nestes termos a qualquer momento, visando:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                  <span>A sustentabilidade operacional e financeira da empresa</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                  <span>A melhoria contínua dos serviços oferecidos</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                  <span>A adequação às mudanças do mercado, legislação ou tecnologia</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                  <span>A proteção dos interesses legítimos de todas as partes</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                  <span>O aprimoramento da experiência do usuário</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Seus Direitos Garantidos */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Seus Direitos Garantidos</h2>
            </div>
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 space-y-4">
              <div className="grid gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Notificação prévia</h4>
                    <p className="text-sm text-muted-foreground">
                      Alterações serão comunicadas com antecedência mínima de 30 dias através dos canais oficiais 
                      (e-mail, plataforma ou WhatsApp cadastrado).
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <Scale className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Direito de rescisão</h4>
                    <p className="text-sm text-muted-foreground">
                      Caso você não concorde com as alterações propostas, poderá solicitar a rescisão sem multas 
                      ou penalidades, desde que manifestada no prazo de 30 dias.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Alterações financeiras</h4>
                    <p className="text-sm text-muted-foreground">
                      Mudanças que impactem valores ou condições financeiras serão sempre precedidas de 
                      notificação expressa e individual.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Aceite explícito</h4>
                    <p className="text-sm text-muted-foreground">
                      Você será solicitado a aceitar explicitamente as novas condições através de modal de 
                      aceite na plataforma antes de continuar utilizando os serviços.
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground pt-2 border-t">
                O silêncio ou a continuidade do uso dos serviços após o período de notificação e confirmação de aceite 
                será considerado como concordância tácita das novas condições.
              </p>
            </div>
          </section>

          {/* Contato */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">9. Contato</h2>
            </div>
            <div className="bg-card border rounded-lg p-6">
              <p className="text-muted-foreground leading-relaxed">
                Se você tiver dúvidas sobre estes Termos de Uso, entre em contato conosco através da nossa 
                página de suporte ou pelo email:{" "}
                <a href="mailto:contato@mostralo.com.br" className="text-primary hover:underline">
                  contato@mostralo.com.br
                </a>
              </p>
            </div>
          </section>

          {/* Última Atualização */}
          <section className="text-center pt-8 border-t">
            <p className="text-sm text-muted-foreground">
              Esta página foi atualizada pela última vez em <strong>31 de janeiro de 2026</strong>.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="font-semibold">Versão 1.1</span>
            </p>
          </section>
        </div>
      </main>

      <MainFooter showDisclaimer={false} />
    </div>
  );
}