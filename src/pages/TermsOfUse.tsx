import { usePageSEO } from "@/hooks/useSEO";

export default function TermsOfUse() {
  usePageSEO({
    title: "Termos de Uso | Mostralo Digital Catalog",
    description: "Leia os termos e condições de uso da plataforma Mostralo para criar catálogos digitais para restaurantes.",
    keywords: "termos de uso, condições, mostralo, catálogo digital, restaurante"
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Termos de Uso
            </h1>
            <p className="text-muted-foreground">
              Última atualização: Dezembro de 2024 | <span className="font-semibold">Versão 1.1</span>
            </p>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Aceitação dos Termos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Ao acessar e usar a plataforma Mostralo, você concorda em cumprir e estar vinculado a estes Termos de Uso. 
                Se você não concordar com qualquer parte destes termos, não deve usar nossos serviços.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Descrição do Serviço</h2>
              <p className="text-muted-foreground leading-relaxed">
                O Mostralo é uma plataforma que permite a restaurantes e estabelecimentos gastronômicos criarem 
                catálogos digitais para seus produtos e serviços. Oferecemos ferramentas para gestão de cardápios, 
                pedidos e relacionamento com clientes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Registro e Conta</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>Para usar nossos serviços, você deve:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Fornecer informações precisas e atualizadas durante o registro</li>
                  <li>Manter a segurança da sua conta e senha</li>
                  <li>Notificar-nos imediatamente sobre qualquer uso não autorizado</li>
                  <li>Ser responsável por todas as atividades em sua conta</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Uso Aceitável</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>Você concorda em não usar a plataforma para:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Violar qualquer lei ou regulamento aplicável</li>
                  <li>Transmitir conteúdo ofensivo, difamatório ou ilegal</li>
                  <li>Interferir no funcionamento da plataforma</li>
                  <li>Tentar acessar contas de outros usuários</li>
                  <li>Usar a plataforma para fins comerciais não autorizados</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Propriedade Intelectual</h2>
              <p className="text-muted-foreground leading-relaxed">
                Todos os direitos de propriedade intelectual da plataforma Mostralo, incluindo código, design, 
                logotipos e conteúdo, são de propriedade da empresa. Você mantém os direitos sobre o conteúdo 
                que carrega, mas nos concede licença para exibi-lo através da plataforma.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Pagamentos e Cancelamento</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>Para planos pagos:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Os pagamentos são processados mensalmente</li>
                  <li>Você pode cancelar a qualquer momento</li>
                  <li>Não oferecemos reembolsos para períodos parciais</li>
                  <li>O acesso é mantido até o final do período pago</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Limitação de Responsabilidade</h2>
              <p className="text-muted-foreground leading-relaxed">
                A plataforma é fornecida "como está". Não garantimos disponibilidade ininterrupta e não seremos 
                responsáveis por perdas indiretas ou danos consequenciais decorrentes do uso da plataforma.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Alterações nos Termos</h2>
              <div className="space-y-4 text-muted-foreground">
                <p className="leading-relaxed">
                  Reservamo-nos o direito de promover alterações, atualizações e melhorias nestes termos a qualquer momento, visando:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>A sustentabilidade operacional e financeira da empresa</li>
                  <li>A melhoria contínua dos serviços oferecidos</li>
                  <li>A adequação às mudanças do mercado, legislação ou tecnologia</li>
                  <li>A proteção dos interesses legítimos de todas as partes</li>
                  <li>O aprimoramento da experiência do usuário</li>
                </ul>
                <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <h3 className="font-semibold mb-2 text-foreground">Seus Direitos Garantidos:</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong>Notificação prévia:</strong> Alterações serão comunicadas com antecedência mínima de 30 (trinta) dias através dos canais oficiais (e-mail, plataforma ou WhatsApp cadastrado).</li>
                    <li><strong>Direito de rescisão:</strong> Caso você não concorde com as alterações propostas, poderá solicitar a rescisão sem multas ou penalidades, desde que manifestada no prazo de 30 dias.</li>
                    <li><strong>Alterações financeiras:</strong> Mudanças que impactem valores ou condições financeiras serão sempre precedidas de notificação expressa e individual.</li>
                    <li><strong>Aceite explícito:</strong> Você será solicitado a aceitar explicitamente as novas condições através de modal de aceite na plataforma antes de continuar utilizando os serviços.</li>
                  </ul>
                </div>
                <p className="mt-4 leading-relaxed">
                  O silêncio ou a continuidade do uso dos serviços após o período de notificação e confirmação de aceite 
                  será considerado como concordância tácita das novas condições.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Contato</h2>
              <p className="text-muted-foreground leading-relaxed">
                Se você tiver dúvidas sobre estes Termos de Uso, entre em contato conosco através da nossa 
                página de suporte ou pelo email: contato@mostralo.com.br
              </p>
            </section>
          </div>

          <div className="pt-8 border-t">
            <div className="text-center">
              <a 
                href="/" 
                className="inline-flex items-center text-primary hover:text-primary/80 transition-colors"
              >
                ← Voltar para o início
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}