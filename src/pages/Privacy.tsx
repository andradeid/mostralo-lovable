import { usePageSEO } from "@/hooks/useSEO";

export default function Privacy() {
  usePageSEO({
    title: "Política de Privacidade | Mostralo Digital Catalog",
    description: "Conheça nossa política de privacidade e como tratamos seus dados na plataforma Mostralo para catálogos digitais.",
    keywords: "política de privacidade, dados, LGPD, mostralo, proteção dados"
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Política de Privacidade
            </h1>
            <p className="text-muted-foreground">
              Última atualização: Dezembro de 2024
            </p>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Introdução</h2>
              <p className="text-muted-foreground leading-relaxed">
                Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações 
                quando você usa a plataforma Mostralo. Estamos comprometidos com a proteção da sua privacidade e 
                cumprimos a Lei Geral de Proteção de Dados (LGPD).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Informações que Coletamos</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium mb-3">Informações de Cadastro:</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
                    <li>Nome completo</li>
                    <li>Endereço de email</li>
                    <li>Telefone</li>
                    <li>Informações da empresa/restaurante</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-medium mb-3">Informações de Uso:</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
                    <li>Dados de navegação e interação</li>
                    <li>Endereço IP e informações do dispositivo</li>
                    <li>Cookies e tecnologias similares</li>
                    <li>Logs de sistema e segurança</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-3">Conteúdo da Loja:</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
                    <li>Informações dos produtos</li>
                    <li>Imagens e descrições</li>
                    <li>Configurações da loja</li>
                    <li>Dados de pedidos e clientes</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Como Usamos suas Informações</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>Utilizamos suas informações para:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Fornecer e manter nossos serviços</li>
                  <li>Processar transações e pagamentos</li>
                  <li>Comunicar sobre atualizações e suporte</li>
                  <li>Melhorar a experiência do usuário</li>
                  <li>Garantir a segurança da plataforma</li>
                  <li>Cumprir obrigações legais</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Compartilhamento de Informações</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>Não vendemos suas informações pessoais. Podemos compartilhar dados apenas nas seguintes situações:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Com seu consentimento explícito</li>
                  <li>Para cumprir obrigações legais</li>
                  <li>Com prestadores de serviços essenciais (processamento de pagamento, hospedagem)</li>
                  <li>Em caso de fusão ou aquisição da empresa</li>
                  <li>Para proteger direitos, propriedade e segurança</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibond mb-4">5. Segurança dos Dados</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>Implementamos medidas de segurança técnicas e organizacionais, incluindo:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Criptografia de dados em trânsito e em repouso</li>
                  <li>Controle de acesso baseado em funções</li>
                  <li>Monitoramento contínuo de segurança</li>
                  <li>Backups regulares e seguros</li>
                  <li>Treinamento de equipe em proteção de dados</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Seus Direitos (LGPD)</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>De acordo com a LGPD, você tem direito a:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Confirmação da existência de tratamento de dados</li>
                  <li>Acesso aos seus dados pessoais</li>
                  <li>Correção de dados incompletos ou inexatos</li>
                  <li>Anonimização, bloqueio ou eliminação de dados</li>
                  <li>Portabilidade dos dados</li>
                  <li>Eliminação dos dados tratados com consentimento</li>
                  <li>Revogação do consentimento</li>
                </ul>
                <p className="mt-4">
                  Para exercer seus direitos, entre em contato através do email: privacidade@mostralo.com.br
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Cookies e Tecnologias Similares</h2>
              <p className="text-muted-foreground leading-relaxed">
                Utilizamos cookies essenciais para o funcionamento da plataforma, cookies de desempenho para melhorar 
                a experiência e cookies de funcionalidade para lembrar suas preferências. Você pode gerenciar suas 
                preferências de cookies através das configurações do seu navegador.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Retenção de Dados</h2>
              <p className="text-muted-foreground leading-relaxed">
                Mantemos seus dados pessoais apenas pelo tempo necessário para cumprir as finalidades descritas nesta política, 
                exceto quando exigido por lei. Dados de contas inativas são automaticamente excluídos após 2 anos de inatividade.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Alterações na Política</h2>
              <p className="text-muted-foreground leading-relaxed">
                Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos sobre alterações significativas 
                por email ou através da plataforma. A data da última atualização sempre estará indicada no início do documento.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Contato</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>Para questões sobre privacidade e proteção de dados:</p>
                <p>Email: <span className="text-primary">privacidade@mostralo.com.br</span></p>
                <p>Encarregado de Dados (DPO): <span className="text-primary">dpo@mostralo.com.br</span></p>
              </div>
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