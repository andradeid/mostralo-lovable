import { Store, Shield, User, Database, Mail, Phone, ArrowLeft, CheckCircle, FileText, Lock, Eye, Trash2, Download, Edit } from "lucide-react";
import { Link } from "react-router-dom";
import { MainFooter } from "@/components/MainFooter";

export default function LGPD() {
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
            LGPD - Lei Geral de Proteção de Dados
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Saiba como a Mostralo protege seus dados pessoais em conformidade com a Lei nº 13.709/2018
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* O que é LGPD */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">O que é a LGPD?</h2>
            </div>
            <div className="bg-muted/50 rounded-lg p-6 space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                A Lei Geral de Proteção de Dados (LGPD) é a legislação brasileira que regula as atividades 
                de tratamento de dados pessoais. Inspirada no GDPR europeu, a LGPD estabelece regras claras 
                sobre como empresas e organizações devem coletar, armazenar, tratar e compartilhar dados 
                pessoais de cidadãos brasileiros.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Na Mostralo, levamos a proteção de dados muito a sério. Implementamos medidas técnicas e 
                organizacionais para garantir que seus dados sejam tratados com segurança e transparência.
              </p>
            </div>
          </section>

          {/* Base Legal */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Base Legal para Tratamento de Dados</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                {
                  title: "Execução de Contrato",
                  description: "Tratamos seus dados para fornecer os serviços contratados na plataforma."
                },
                {
                  title: "Consentimento",
                  description: "Quando necessário, solicitamos sua autorização expressa para tratamentos específicos."
                },
                {
                  title: "Legítimo Interesse",
                  description: "Para melhorar nossos serviços e sua experiência, sempre respeitando seus direitos."
                },
                {
                  title: "Obrigação Legal",
                  description: "Cumprimento de obrigações legais e regulatórias aplicáveis ao nosso negócio."
                }
              ].map((item, index) => (
                <div key={index} className="bg-card border rounded-lg p-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <h3 className="font-semibold">{item.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Direitos do Titular */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Seus Direitos como Titular</h2>
            </div>
            <p className="text-muted-foreground">
              A LGPD garante diversos direitos aos titulares de dados. Na Mostralo, você pode exercer:
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: Eye, title: "Acesso", description: "Saber quais dados temos sobre você" },
                { icon: Edit, title: "Correção", description: "Corrigir dados incompletos ou incorretos" },
                { icon: Trash2, title: "Exclusão", description: "Solicitar a exclusão dos seus dados" },
                { icon: Download, title: "Portabilidade", description: "Receber seus dados em formato estruturado" },
                { icon: Lock, title: "Revogação", description: "Revogar consentimentos concedidos" },
                { icon: Shield, title: "Oposição", description: "Opor-se a tratamentos específicos" }
              ].map((item, index) => (
                <div key={index} className="bg-muted/30 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <item.icon className="w-5 h-5 text-primary" />
                    <h3 className="font-medium">{item.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Como Exercer Direitos */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Como Exercer Seus Direitos</h2>
            </div>
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 space-y-4">
              <p className="text-foreground leading-relaxed">
                Para exercer qualquer um dos seus direitos previstos na LGPD, entre em contato 
                através dos nossos canais oficiais:
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
                  <Phone className="w-5 h-5 text-primary" />
                  <div>
                    <span className="font-medium">WhatsApp:</span>
                    <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer" className="ml-2 text-primary hover:underline">
                      Atendimento LGPD
                    </a>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Responderemos sua solicitação em até 15 dias úteis, conforme determina a legislação.
              </p>
            </div>
          </section>

          {/* Encarregado de Dados */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Encarregado de Dados (DPO)</h2>
            </div>
            <div className="bg-card border rounded-lg p-6 space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Nosso Encarregado de Proteção de Dados (Data Protection Officer) é responsável por 
                garantir a conformidade com a LGPD e atender suas solicitações relacionadas à 
                privacidade.
              </p>
              <div className="border-l-4 border-primary pl-4">
                <p className="font-semibold">Marcos Henrique da Silva Andrade</p>
                <p className="text-sm text-muted-foreground">Encarregado de Proteção de Dados</p>
                <p className="text-sm text-muted-foreground">E-mail: dpo@mostralo.com.br</p>
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
              <Link to="/privacidade" className="text-primary hover:underline">
                Política de Privacidade
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
