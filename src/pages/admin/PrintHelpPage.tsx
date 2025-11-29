import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Info, HelpCircle, ExternalLink, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrintHelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ajuda - Configuração de Impressão</h1>
        <p className="text-muted-foreground">
          Guias passo-a-passo para configurar sua impressora térmica
        </p>
      </div>

      <Tabs defaultValue="driver" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="driver">Driver (Windows/macOS)</TabsTrigger>
          <TabsTrigger value="qz-tray">QZ Tray</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>

        {/* Tab: Configuração do Driver */}
        <TabsContent value="driver" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Configurar Corte Automático no Driver</h2>
            
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Este é o método mais simples e recomendado. A configuração é feita uma única vez
                nas preferências da impressora.
              </AlertDescription>
            </Alert>

            <div className="space-y-6">
              {/* Windows */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                  Windows 10/11
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Abra <strong>Configurações → Dispositivos → Impressoras e Scanners</strong></li>
                  <li>Clique na sua impressora térmica e selecione <strong>Gerenciar</strong></li>
                  <li>Clique em <strong>Preferências de Impressão</strong></li>
                  <li>Procure pela aba <strong>Opções Avançadas</strong> ou <strong>Layout</strong></li>
                  <li>Encontre a opção <strong>"Corte Automático"</strong>, <strong>"Auto Cut"</strong> ou <strong>"Guilhotina"</strong></li>
                  <li>Ative a opção e configure para <strong>"Cortar após cada página"</strong></li>
                  <li>Clique em <strong>OK</strong> e teste imprimindo um pedido</li>
                </ol>
              </div>

              {/* macOS */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-gray-500" />
                  macOS
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Abra <strong>Preferências do Sistema → Impressoras e Scanners</strong></li>
                  <li>Selecione sua impressora térmica na lista</li>
                  <li>Clique em <strong>Opções e Suprimentos</strong></li>
                  <li>Na aba <strong>Opções</strong>, procure por <strong>"Corte de Papel"</strong> ou <strong>"Auto Cutter"</strong></li>
                  <li>Marque a caixa <strong>"Ativar corte automático"</strong></li>
                  <li>Configure para <strong>"Cortar a cada página"</strong></li>
                  <li>Clique em <strong>OK</strong> e feche as preferências</li>
                </ol>
              </div>

              <Alert>
                <HelpCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Não encontrou a opção?</strong> Alguns drivers têm nomes diferentes:
                  <ul className="list-disc list-inside mt-2 ml-2">
                    <li>"Paper Cut" / "Corte de Papel"</li>
                    <li>"Guillotine" / "Guilhotina"</li>
                    <li>"Auto Cutter" / "Cortador Automático"</li>
                    <li>"Partial Cut" / "Corte Parcial"</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          </Card>
        </TabsContent>

        {/* Tab: QZ Tray */}
        <TabsContent value="qz-tray" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Instalação e Uso do QZ Tray</h2>
            
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                QZ Tray é um software gratuito e open-source que permite enviar comandos 
                ESC/POS diretamente para impressoras térmicas.
              </AlertDescription>
            </Alert>

            <div className="space-y-6">
              {/* Passo 1 */}
              <div>
                <h3 className="text-lg font-semibold mb-2">1. Download e Instalação</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm ml-4">
                  <li>
                    Acesse{" "}
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => window.open('https://qz.io/download/', '_blank')}
                    >
                      qz.io/download
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </li>
                  <li>Baixe a versão para seu sistema operacional (Windows, macOS ou Linux)</li>
                  <li>Execute o instalador e siga as instruções</li>
                  <li>Após instalado, inicie o QZ Tray</li>
                </ol>
              </div>

              {/* Passo 2 */}
              <div>
                <h3 className="text-lg font-semibold mb-2">2. Configuração no Mostralo</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm ml-4">
                  <li>Na página de Configuração de Impressão, selecione <strong>"QZ Tray (Avançado)"</strong> como método de corte</li>
                  <li>Clique em <strong>"Configurar QZ Tray"</strong></li>
                  <li>Clique no botão <strong>"Conectar ao QZ Tray"</strong></li>
                  <li>Selecione sua impressora térmica na lista</li>
                  <li>Clique em <strong>"Testar Impressão"</strong> para verificar se está funcionando</li>
                  <li>Salve as configurações</li>
                </ol>
              </div>

              {/* Passo 3 */}
              <div>
                <h3 className="text-lg font-semibold mb-2">3. Uso Diário</h3>
                <ul className="list-disc list-inside space-y-2 text-sm ml-4">
                  <li>Mantenha o QZ Tray aberto enquanto estiver usando o Mostralo</li>
                  <li>O ícone do QZ Tray ficará na bandeja do sistema (system tray)</li>
                  <li>Quando imprimir pedidos, o corte será executado automaticamente</li>
                </ul>
              </div>

              <Alert>
                <HelpCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Problema de segurança no navegador?</strong> Alguns navegadores podem 
                  bloquear a conexão WebSocket com o QZ Tray. Se isso acontecer:
                  <ul className="list-disc list-inside mt-2 ml-2">
                    <li>Adicione localhost e 127.0.0.1 às exceções de segurança</li>
                    <li>Certifique-se de que o certificado do QZ Tray está instalado</li>
                    <li>Tente usar outro navegador (Chrome funciona melhor)</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          </Card>
        </TabsContent>

        {/* Tab: FAQ */}
        <TabsContent value="faq" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Perguntas Frequentes</h2>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="q1">
                <AccordionTrigger>
                  Por que há espaço em branco entre as vias?
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">
                    O espaço em branco acontece quando a impressora interpreta o comando de 
                    quebra de página (page-break) mas não executa o corte. Para resolver:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                    <li>Configure o corte automático no driver da impressora (método recomendado)</li>
                    <li>Use a opção "Linha de Corte Visual" para ver onde cortar</li>
                    <li>Use QZ Tray para enviar comandos de corte diretamente</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="q2">
                <AccordionTrigger>
                  Qual método de corte devo usar?
                </AccordionTrigger>
                <AccordionContent>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p><strong>Driver da Impressora:</strong> Recomendado para a maioria dos casos. 
                    Configure uma vez e funciona sempre.</p>
                    <p><strong>Linha Visual:</strong> Melhor quando você não tem acesso às 
                    configurações da impressora ou ela não suporta corte automático.</p>
                    <p><strong>QZ Tray:</strong> Para usuários avançados que precisam de controle 
                    total ou têm problemas com o driver.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="q3">
                <AccordionTrigger>
                  Minha impressora não tem opção de corte automático
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">
                    Se sua impressora térmica não tem suporte a corte automático no driver:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                    <li>Verifique se existe um driver atualizado no site do fabricante</li>
                    <li>Use a opção "Linha de Corte Visual" e corte manualmente</li>
                    <li>Instale o QZ Tray para enviar comandos ESC/POS de corte</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="q4">
                <AccordionTrigger>
                  QZ Tray não conecta ou não encontra a impressora
                </AccordionTrigger>
                <AccordionContent>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p><strong>Soluções comuns:</strong></p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Certifique-se de que o QZ Tray está aberto (ícone na bandeja)</li>
                      <li>Verifique se a impressora está ligada e conectada ao computador</li>
                      <li>Reinstale o QZ Tray e o certificado de segurança</li>
                      <li>Teste no Chrome (navegador com melhor suporte)</li>
                      <li>Verifique o firewall - pode estar bloqueando porta 8181</li>
                    </ol>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="q5">
                <AccordionTrigger>
                  Posso usar impressora não-térmica (A4)?
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">
                    Sim! Para impressoras A4 comuns (jato de tinta, laser):
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                    <li>Selecione o tipo de impressora como "A4" na configuração</li>
                    <li>O sistema usará quebra de página tradicional</li>
                    <li>Cada via será impressa em uma página separada</li>
                    <li>Corte manual entre as vias se necessário</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
