import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomDomainConfig } from "../CustomDomainConfig";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Info, ShoppingCart, Instagram } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface GeneralStepProps {
  formData: {
    name: string;
    description: string;
    segment: string;
    state: string;
    city: string;
    slug: string;
    status: string;
    custom_domain?: string;
    custom_domain_verified?: boolean;
    custom_domain_requested_at?: string | null;
  };
  updateFormData: (data: any) => void;
}

export function GeneralStep({ formData, updateFormData }: GeneralStepProps) {
  const { toast } = useToast();
  const xmlApiUrl = `${window.location.origin}/loja/${formData.slug}/info.xml`;
  const jsonApiUrl = `https://noshwvwpjtnvndokbfjx.supabase.co/functions/v1/store-info-json?slug=${formData.slug}`;
  const googleShoppingFeedUrl = `https://noshwvwpjtnvndokbfjx.supabase.co/functions/v1/google-shopping-feed?slug=${formData.slug}`;
  const metaCommerceFeedUrl = `https://noshwvwpjtnvndokbfjx.supabase.co/functions/v1/meta-commerce-feed?slug=${formData.slug}`;

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "URL copiada!",
      description: "O endereço foi copiado para a área de transferência.",
    });
  };

  const handleOpenUrl = (url: string) => {
    window.open(url, '_blank');
  };

  const handleCopyPrompt = () => {
    const prompt = `Você é um assistente especializado em ${formData.name || 'esta loja'}.

FONTE DE DADOS:
Acesse em tempo real as informações atualizadas da loja através da API:
${jsonApiUrl}

INSTRUÇÕES:
1. Sempre consulte a API antes de responder perguntas sobre produtos, preços, horários ou disponibilidade
2. Use os dados estruturados em JSON para fornecer respostas precisas
3. Informe os clientes sobre:
   - Produtos disponíveis e seus preços
   - Horários de funcionamento
   - Áreas de entrega e taxas
   - Formas de pagamento aceitas
   - Opções de adicionais para cada produto
4. Seja cordial e use o nome da loja: ${formData.name || '[nome da loja]'}
5. Se um produto estiver indisponível, sugira alternativas similares
6. Caso o cliente queira fazer um pedido, oriente-o a acessar: ${window.location.origin}/loja/${formData.slug}

METADADOS DISPONÍVEIS NA API:
- ai_metadata.purpose: propósito dos dados
- ai_metadata.recommended_actions: ações recomendadas
- ai_metadata.integration_tips: dicas de integração
- ai_metadata.limitations: limitações importantes

Sempre priorize a experiência do cliente e forneça informações atualizadas e precisas.`;

    navigator.clipboard.writeText(prompt);
    toast({
      title: "Prompt copiado!",
      description: "O prompt foi copiado para a área de transferência.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Nome do Estabelecimento *</Label>
          <Input
            id="name"
            value={formData.name || ''}
            onChange={(e) => updateFormData({ name: e.target.value })}
            placeholder="Digite o nome do seu estabelecimento"
          />
        </div>

        <div>
          <Label htmlFor="description">Descrição do Estabelecimento</Label>
          <Textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => updateFormData({ description: e.target.value })}
            placeholder="Faça uma breve descrição de Seu Negócio."
            rows={4}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="segment">Escolha seu Segmento *</Label>
            <Select value={formData.segment || ''} onValueChange={(value) => updateFormData({ segment: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o segmento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alimentacao-e-bebidas">Alimentação e Bebidas</SelectItem>
                <SelectItem value="moda-e-vestuario">Moda e Vestuário</SelectItem>
                <SelectItem value="beleza-e-estetica">Beleza e Estética</SelectItem>
                <SelectItem value="casa-e-decoracao">Casa e Decoração</SelectItem>
                <SelectItem value="esportes-e-lazer">Esportes e Lazer</SelectItem>
                <SelectItem value="tecnologia">Tecnologia</SelectItem>
                <SelectItem value="saude-e-bem-estar">Saúde e Bem-estar</SelectItem>
                <SelectItem value="servicos">Serviços</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="state">Estado *</Label>
            <Select value={formData.state || ''} onValueChange={(value) => updateFormData({ state: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AC">Acre</SelectItem>
                <SelectItem value="AL">Alagoas</SelectItem>
                <SelectItem value="AP">Amapá</SelectItem>
                <SelectItem value="AM">Amazonas</SelectItem>
                <SelectItem value="BA">Bahia</SelectItem>
                <SelectItem value="CE">Ceará</SelectItem>
                <SelectItem value="DF">Distrito Federal</SelectItem>
                <SelectItem value="ES">Espírito Santo</SelectItem>
                <SelectItem value="GO">Goiás</SelectItem>
                <SelectItem value="MA">Maranhão</SelectItem>
                <SelectItem value="MT">Mato Grosso</SelectItem>
                <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                <SelectItem value="MG">Minas Gerais</SelectItem>
                <SelectItem value="PA">Pará</SelectItem>
                <SelectItem value="PB">Paraíba</SelectItem>
                <SelectItem value="PR">Paraná</SelectItem>
                <SelectItem value="PE">Pernambuco</SelectItem>
                <SelectItem value="PI">Piauí</SelectItem>
                <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                <SelectItem value="RO">Rondônia</SelectItem>
                <SelectItem value="RR">Roraima</SelectItem>
                <SelectItem value="SC">Santa Catarina</SelectItem>
                <SelectItem value="SP">São Paulo</SelectItem>
                <SelectItem value="SE">Sergipe</SelectItem>
                <SelectItem value="TO">Tocantins</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="city">Cidade *</Label>
            <Input
              id="city"
              value={formData.city || ''}
              onChange={(e) => updateFormData({ city: e.target.value })}
              placeholder="Digite sua cidade"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="slug">URL (Endereço de Seu Site) *</Label>
          <div className="flex">
            <Input
              id="slug"
              value={formData.slug || ''}
              onChange={(e) => updateFormData({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
              placeholder="meuestablecimento"
              className="rounded-r-none"
            />
            <div className="bg-muted px-3 py-2 border border-l-0 rounded-r-md text-sm text-muted-foreground">
              .mostralo.com.br
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            ATENÇÃO: esta URL é o endereço que seus clientes usarão para acessar seu Site, não é permitido, acentos, pontos e caracteres especiais.
          </p>
        </div>

        {/* Domínio Personalizado */}
        <div className="mt-6 pt-6 border-t">
          <CustomDomainConfig 
            customDomain={formData.custom_domain || ''}
            verified={formData.custom_domain_verified || false}
            requestedAt={formData.custom_domain_requested_at}
            storeSlug={formData.slug || ''}
            onUpdate={(domain, verified) => 
              updateFormData({ 
                custom_domain: domain, 
                custom_domain_verified: verified,
                custom_domain_requested_at: new Date().toISOString()
              })
            }
          />
        </div>

        {/* APIs da Loja para Integração */}
        <div className="mt-6 pt-6 border-t">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Label className="text-base font-semibold">🤖 APIs para Agentes de IA</Label>
              <Info className="w-4 h-4 text-muted-foreground" />
            </div>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Endpoints públicos com informações completas da loja. Use para integrar com 
                agentes de IA, chatbots, assistentes virtuais ou aplicações externas.
              </AlertDescription>
            </Alert>

            {/* Endpoint JSON (Recomendado) */}
            <div className="space-y-2 p-4 border rounded-lg bg-green-50 dark:bg-green-950">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-semibold text-green-700 dark:text-green-300">
                  ✅ JSON (Recomendado para IA)
                </Label>
              </div>
              <div className="flex gap-2">
                <Input
                  value={jsonApiUrl}
                  readOnly
                  className="font-mono text-xs bg-white dark:bg-gray-900"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopyUrl(jsonApiUrl)}
                  title="Copiar URL JSON"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleOpenUrl(jsonApiUrl)}
                  title="Abrir JSON"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-green-700 dark:text-green-300">
                Formato JSON otimizado para LLMs com metadados estruturados, cache de 5 minutos.
              </p>
            </div>

            {/* Endpoint XML (Alternativo) */}
            <div className="space-y-2 p-4 border rounded-lg">
              <Label className="text-sm font-semibold">📄 XML (Alternativo)</Label>
              <div className="flex gap-2">
                <Input
                  value={xmlApiUrl}
                  readOnly
                  className="font-mono text-xs bg-muted"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopyUrl(xmlApiUrl)}
                  title="Copiar URL XML"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleOpenUrl(xmlApiUrl)}
                  title="Abrir XML"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Formato XML tradicional, renderizado client-side.
              </p>
            </div>

            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
              <strong>💡 Dados incluídos:</strong> Informações da loja, produtos completos com variantes, 
              categorias de adicionais, adicionais, horários de funcionamento, localização, 
              métodos de pagamento, zonas de entrega, cores do tema e metadados para IA.
            </div>

            {/* Prompt Recomendado para Agentes de IA */}
            <div className="space-y-3 p-4 border-2 border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-950">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  📝 Prompt Recomendado para IA
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyPrompt()}
                  className="text-blue-700 dark:text-blue-300"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copiar Prompt
                </Button>
              </div>
              
              <div className="bg-white dark:bg-gray-900 p-3 rounded border text-xs font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
{`Você é um assistente especializado em ${formData.name || 'esta loja'}.

FONTE DE DADOS:
Acesse em tempo real as informações atualizadas da loja através da API:
${jsonApiUrl}

INSTRUÇÕES:
1. Sempre consulte a API antes de responder perguntas sobre produtos, preços, horários ou disponibilidade
2. Use os dados estruturados em JSON para fornecer respostas precisas
3. Informe os clientes sobre:
   - Produtos disponíveis e seus preços
   - Horários de funcionamento
   - Áreas de entrega e taxas
   - Formas de pagamento aceitas
   - Opções de adicionais para cada produto
4. Seja cordial e use o nome da loja: ${formData.name || '[nome da loja]'}
5. Se um produto estiver indisponível, sugira alternativas similares
6. Caso o cliente queira fazer um pedido, oriente-o a acessar: ${window.location.origin}/loja/${formData.slug}

METADADOS DISPONÍVEIS NA API:
- ai_metadata.purpose: propósito dos dados
- ai_metadata.recommended_actions: ações recomendadas
- ai_metadata.integration_tips: dicas de integração
- ai_metadata.limitations: limitações importantes

Sempre priorize a experiência do cliente e forneça informações atualizadas e precisas.`}
              </div>
              
              <p className="text-xs text-blue-700 dark:text-blue-300">
                💡 Este prompt pode ser usado em ChatGPT, Claude, agentes n8n, Make, Zapier, ou qualquer LLM que suporte tool calling/function calling.
              </p>
            </div>

            {/* Guia de Integração com Plataformas */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">🔌 Guia de Integração</Label>
              
              <Accordion type="single" collapsible className="w-full">
                {/* n8n */}
                <AccordionItem value="n8n">
                  <AccordionTrigger className="text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">n8n</span>
                      <span className="text-xs text-muted-foreground">(Automação No-Code)</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <div className="text-xs space-y-2 p-3 bg-muted rounded">
                      <p className="font-semibold">Passo a passo:</p>
                      <ol className="list-decimal ml-4 space-y-1">
                        <li>Adicione o nó <code className="bg-background px-1 rounded">HTTP Request</code></li>
                        <li>Configure:
                          <ul className="list-disc ml-4 mt-1">
                            <li><strong>Method:</strong> GET</li>
                            <li><strong>URL:</strong> {jsonApiUrl}</li>
                            <li><strong>Authentication:</strong> None</li>
                            <li><strong>Response Format:</strong> JSON</li>
                          </ul>
                        </li>
                        <li>Use o nó <code className="bg-background px-1 rounded">OpenAI</code> ou <code className="bg-background px-1 rounded">AI Agent</code></li>
                        <li>No prompt do agente, inclua: <code className="bg-background px-1 rounded">{'{{ $json }}'}</code> para injetar os dados da loja</li>
                      </ol>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Make (Integromat) */}
                <AccordionItem value="make">
                  <AccordionTrigger className="text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Make (Integromat)</span>
                      <span className="text-xs text-muted-foreground">(Automação Visual)</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <div className="text-xs space-y-2 p-3 bg-muted rounded">
                      <p className="font-semibold">Configuração:</p>
                      <ol className="list-decimal ml-4 space-y-1">
                        <li>Adicione módulo <code className="bg-background px-1 rounded">HTTP - Make a request</code></li>
                        <li>Configure:
                          <ul className="list-disc ml-4 mt-1">
                            <li><strong>URL:</strong> {jsonApiUrl}</li>
                            <li><strong>Method:</strong> GET</li>
                            <li><strong>Headers:</strong> Nenhum necessário</li>
                          </ul>
                        </li>
                        <li>Conecte com módulo OpenAI ou outro LLM</li>
                        <li>Use <code className="bg-background px-1 rounded">{'{{1.data}}'}</code> para referenciar os dados</li>
                      </ol>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Zapier */}
                <AccordionItem value="zapier">
                  <AccordionTrigger className="text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Zapier</span>
                      <span className="text-xs text-muted-foreground">(Automação Integrada)</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <div className="text-xs space-y-2 p-3 bg-muted rounded">
                      <p className="font-semibold">Configuração:</p>
                      <ol className="list-decimal ml-4 space-y-1">
                        <li>Use a ação <code className="bg-background px-1 rounded">Webhooks by Zapier - GET</code></li>
                        <li>Configure:
                          <ul className="list-disc ml-4 mt-1">
                            <li><strong>URL:</strong> {jsonApiUrl}</li>
                            <li><strong>Payload Type:</strong> JSON</li>
                          </ul>
                        </li>
                        <li>Conecte com OpenAI ou ChatGPT</li>
                        <li>No prompt, referencie os dados retornados</li>
                      </ol>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* JavaScript/Python */}
                <AccordionItem value="code">
                  <AccordionTrigger className="text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Código (JavaScript/Python)</span>
                      <span className="text-xs text-muted-foreground">(Integração Customizada)</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <div className="text-xs space-y-2">
                      <p className="font-semibold">JavaScript (fetch):</p>
                      <pre className="bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
{`const response = await fetch('${jsonApiUrl}');
const storeData = await response.json();
console.log(storeData);`}
                      </pre>
                    </div>
                    
                    <div className="text-xs space-y-2">
                      <p className="font-semibold">Python (requests):</p>
                      <pre className="bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
{`import requests

response = requests.get('${jsonApiUrl}')
store_data = response.json()
print(store_data)`}
                      </pre>
                    </div>
                    
                    <div className="text-xs space-y-2">
                      <p className="font-semibold">cURL (teste rápido):</p>
                      <pre className="bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
{`curl -X GET '${jsonApiUrl}'`}
                      </pre>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Especificações Técnicas */}
            <div className="space-y-2 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
              <Label className="text-sm font-semibold">⚙️ Especificações Técnicas</Label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="font-semibold text-muted-foreground mb-1">Método HTTP:</p>
                  <code className="bg-background px-2 py-1 rounded">GET</code>
                </div>
                
                <div>
                  <p className="font-semibold text-muted-foreground mb-1">Autenticação:</p>
                  <code className="bg-background px-2 py-1 rounded">Não requerida (público)</code>
                </div>
                
                <div>
                  <p className="font-semibold text-muted-foreground mb-1">Content-Type:</p>
                  <code className="bg-background px-2 py-1 rounded">application/json</code>
                </div>
                
                <div>
                  <p className="font-semibold text-muted-foreground mb-1">Cache:</p>
                  <code className="bg-background px-2 py-1 rounded">5 minutos (HTTP Cache-Control)</code>
                </div>
                
                <div>
                  <p className="font-semibold text-muted-foreground mb-1">CORS:</p>
                  <code className="bg-background px-2 py-1 rounded">Habilitado (Access-Control-Allow-Origin: *)</code>
                </div>
                
                <div>
                  <p className="font-semibold text-muted-foreground mb-1">Rate Limit:</p>
                  <code className="bg-background px-2 py-1 rounded">Nenhum (uso livre)</code>
                </div>
              </div>
              
              <Alert className="mt-3">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Dica:</strong> Para melhor performance, implemente cache local no seu agente. 
                  Os dados são atualizados no máximo a cada 5 minutos no servidor.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>

        {/* Feeds de Produtos para E-commerce */}
        <div className="mt-6 pt-6 border-t">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Label className="text-base font-semibold">🛒 Feeds de Produtos para E-commerce</Label>
            </div>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                URLs de feeds para sincronizar seus produtos com Google Shopping, Instagram Shopping e Facebook Shop. 
                Os feeds são atualizados automaticamente quando você altera produtos.
              </AlertDescription>
            </Alert>

            {/* Google Shopping Feed */}
            <div className="space-y-2 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <Label className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  Google Shopping (XML)
                </Label>
              </div>
              <div className="flex gap-2">
                <Input
                  value={googleShoppingFeedUrl}
                  readOnly
                  className="font-mono text-xs bg-white dark:bg-gray-900"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopyUrl(googleShoppingFeedUrl)}
                  title="Copiar URL"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleOpenUrl(googleShoppingFeedUrl)}
                  title="Abrir Feed"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Feed XML no formato Google Merchant Center para anúncios no Google Shopping.
              </p>
            </div>

            {/* Instagram/Meta Feed */}
            <div className="space-y-2 p-4 border rounded-lg bg-pink-50 dark:bg-pink-950">
              <div className="flex items-center gap-2">
                <Instagram className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                <Label className="text-sm font-semibold text-pink-700 dark:text-pink-300">
                  Instagram / Meta Commerce (CSV)
                </Label>
              </div>
              <div className="flex gap-2">
                <Input
                  value={metaCommerceFeedUrl}
                  readOnly
                  className="font-mono text-xs bg-white dark:bg-gray-900"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopyUrl(metaCommerceFeedUrl)}
                  title="Copiar URL"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleOpenUrl(metaCommerceFeedUrl)}
                  title="Abrir Feed"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-pink-700 dark:text-pink-300">
                Feed CSV para Instagram Shopping, Facebook Shop e Meta Commerce Manager.
              </p>
            </div>

            {/* Guia de Configuração */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">📖 Guia de Configuração</Label>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="google-merchant">
                  <AccordionTrigger className="text-sm">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-blue-500" />
                      <span className="font-semibold">📖 Guia Completo: Google Merchant Center</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    {/* Seção 1: Pré-requisitos */}
                    <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <p className="font-semibold text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
                        <span className="bg-amber-500 text-white px-2 py-0.5 rounded text-xs">1</span>
                        📋 Pré-requisitos
                      </p>
                      <ul className="text-xs space-y-1 text-amber-700 dark:text-amber-300">
                        <li className="flex items-center gap-2">
                          <span className="text-green-500">✅</span> Ter conta Google (Gmail)
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-green-500">✅</span> Ter produtos cadastrados com imagens (mínimo 100x100px)
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-green-500">✅</span> Ter preços e descrições definidos
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-green-500">✅</span> Loja ativa e acessível publicamente
                        </li>
                      </ul>
                    </div>

                    {/* Seção 2: Criar Conta */}
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs">2</span>
                        🏪 Criar Conta no Google Merchant Center
                      </p>
                      <ol className="text-xs space-y-2 list-decimal ml-4">
                        <li>
                          Acesse <a href="https://merchants.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">merchants.google.com</a>
                        </li>
                        <li>Clique em <strong>"Criar conta"</strong> ou <strong>"Começar agora"</strong></li>
                        <li>Preencha as informações do negócio:
                          <ul className="list-disc ml-4 mt-1 space-y-0.5">
                            <li><strong>Nome da empresa:</strong> {formData.name || '[Seu nome de estabelecimento]'}</li>
                            <li><strong>País:</strong> Brasil</li>
                            <li><strong>Fuso horário:</strong> Brasília</li>
                          </ul>
                        </li>
                        <li>Aceite os termos de serviço</li>
                      </ol>
                    </div>

                    {/* Seção 3: Verificar Loja */}
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs">3</span>
                        🔐 Verificar e Reivindicar sua Loja
                      </p>
                      <ol className="text-xs space-y-2 list-decimal ml-4">
                        <li>No menu lateral, vá em <strong>Configurações → Informações da empresa → Website</strong></li>
                        <li>
                          Insira a URL da sua loja:
                          <div className="bg-background px-2 py-1 rounded mt-1 font-mono text-[10px] break-all border">
                            {window.location.origin}/loja/{formData.slug || '[seu-slug]'}
                          </div>
                        </li>
                        <li>
                          <strong>Método de verificação:</strong> Escolha <span className="bg-green-100 dark:bg-green-900 px-1 rounded">Tag HTML</span> (mais simples)
                          <div className="mt-1 p-2 bg-blue-50 dark:bg-blue-950 rounded text-blue-700 dark:text-blue-300">
                            💡 <strong>Dica:</strong> Se precisar de ajuda com a verificação, entre em contato com o suporte Mostralo
                          </div>
                        </li>
                        <li>Clique em <strong>"Verificar"</strong> e aguarde confirmação</li>
                      </ol>
                    </div>

                    {/* Seção 4: Adicionar Feed */}
                    <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center gap-2">
                        <span className="bg-green-500 text-white px-2 py-0.5 rounded text-xs">4</span>
                        📦 Adicionar o Feed de Produtos
                        <span className="bg-green-600 text-white px-1.5 py-0.5 rounded text-[10px] ml-1">IMPORTANTE</span>
                      </p>
                      <ol className="text-xs space-y-2 list-decimal ml-4 text-green-700 dark:text-green-300">
                        <li>No menu lateral, clique em <strong>Produtos → Feeds</strong></li>
                        <li>Clique no botão <strong>➕ Adicionar feed principal</strong></li>
                        <li>Configure as opções:
                          <ul className="list-disc ml-4 mt-1 space-y-0.5">
                            <li><strong>País de venda:</strong> Brasil</li>
                            <li><strong>Idioma:</strong> Português</li>
                            <li><strong>Destinos:</strong> Marque <span className="bg-blue-100 dark:bg-blue-900 px-1 rounded">Google Shopping</span></li>
                          </ul>
                        </li>
                        <li>Selecione <strong>"Busca programada"</strong> como método de envio</li>
                        <li>
                          <strong>Cole a URL do feed:</strong>
                          <div className="bg-white dark:bg-gray-900 px-2 py-1 rounded mt-1 font-mono text-[10px] break-all border border-green-300 dark:border-green-700">
                            {googleShoppingFeedUrl}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyUrl(googleShoppingFeedUrl)}
                            className="mt-1 h-6 text-[10px]"
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copiar URL
                          </Button>
                        </li>
                        <li>
                          <strong>Nome do feed:</strong> Produtos {formData.name || '[Nome da Loja]'}
                        </li>
                        <li><strong>Frequência:</strong> Diária</li>
                        <li><strong>Horário:</strong> 06:00 (recomendado)</li>
                        <li>Clique em <strong>"Criar feed"</strong></li>
                      </ol>
                    </div>

                    {/* Seção 5: Configurar Frete */}
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs">5</span>
                        🚚 Configurar Informações de Frete
                      </p>
                      <ol className="text-xs space-y-2 list-decimal ml-4">
                        <li>Vá em <strong>Configurações → Frete e devoluções</strong></li>
                        <li>Clique em <strong>➕ Adicionar serviço de frete</strong></li>
                        <li>Configure:
                          <ul className="list-disc ml-4 mt-1 space-y-0.5">
                            <li><strong>Nome:</strong> Entrega Padrão</li>
                            <li><strong>País:</strong> Brasil</li>
                            <li><strong>Tipo:</strong> Taxa fixa OU Baseada em região</li>
                            <li><strong>Valor:</strong> Insira seu valor médio de entrega</li>
                          </ul>
                        </li>
                        <li>Salve as configurações</li>
                      </ol>
                    </div>

                    {/* Seção 6: Aguardar Validação */}
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs">6</span>
                        ⏳ Aguardar Validação
                      </p>
                      <ul className="text-xs space-y-1 list-disc ml-4">
                        <li>O Google processa o feed em <strong>até 24 horas</strong></li>
                        <li>Verifique o status em <strong>Produtos → Diagnóstico</strong></li>
                        <li className="flex items-center gap-1">
                          <span className="text-green-500">✅</span> Produtos aprovados aparecem com check verde
                        </li>
                        <li className="flex items-center gap-1">
                          <span className="text-amber-500">⚠️</span> Produtos com aviso aparecem em amarelo
                        </li>
                        <li className="flex items-center gap-1">
                          <span className="text-red-500">❌</span> Produtos com erro aparecem em vermelho
                        </li>
                      </ul>
                    </div>

                    {/* Seção 7: Erros Comuns */}
                    <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="font-semibold text-red-800 dark:text-red-200 mb-2 flex items-center gap-2">
                        <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs">7</span>
                        ⚠️ Erros Comuns e Soluções
                      </p>
                      <div className="overflow-x-auto">
                        <table className="text-[10px] w-full border-collapse">
                          <thead>
                            <tr className="bg-red-100 dark:bg-red-900">
                              <th className="border border-red-200 dark:border-red-700 px-2 py-1 text-left">Erro</th>
                              <th className="border border-red-200 dark:border-red-700 px-2 py-1 text-left">Causa</th>
                              <th className="border border-red-200 dark:border-red-700 px-2 py-1 text-left">Solução</th>
                            </tr>
                          </thead>
                          <tbody className="text-red-700 dark:text-red-300">
                            <tr>
                              <td className="border border-red-200 dark:border-red-700 px-2 py-1">"Imagem muito pequena"</td>
                              <td className="border border-red-200 dark:border-red-700 px-2 py-1">Imagem menor que 100x100px</td>
                              <td className="border border-red-200 dark:border-red-700 px-2 py-1">Subir imagem maior</td>
                            </tr>
                            <tr>
                              <td className="border border-red-200 dark:border-red-700 px-2 py-1">"Preço inválido"</td>
                              <td className="border border-red-200 dark:border-red-700 px-2 py-1">Preço zerado ou texto</td>
                              <td className="border border-red-200 dark:border-red-700 px-2 py-1">Verificar campo de preço</td>
                            </tr>
                            <tr>
                              <td className="border border-red-200 dark:border-red-700 px-2 py-1">"GTIN ausente"</td>
                              <td className="border border-red-200 dark:border-red-700 px-2 py-1">Produto sem código de barras</td>
                              <td className="border border-red-200 dark:border-red-700 px-2 py-1">Campo opcional, pode ignorar</td>
                            </tr>
                            <tr>
                              <td className="border border-red-200 dark:border-red-700 px-2 py-1">"Link inválido"</td>
                              <td className="border border-red-200 dark:border-red-700 px-2 py-1">URL do produto incorreta</td>
                              <td className="border border-red-200 dark:border-red-700 px-2 py-1">Verificar slug da loja</td>
                            </tr>
                            <tr>
                              <td className="border border-red-200 dark:border-red-700 px-2 py-1">"Feed não encontrado"</td>
                              <td className="border border-red-200 dark:border-red-700 px-2 py-1">URL errada ou loja inativa</td>
                              <td className="border border-red-200 dark:border-red-700 px-2 py-1">Copiar URL correta deste painel</td>
                            </tr>
                            <tr>
                              <td className="border border-red-200 dark:border-red-700 px-2 py-1">"Website não verificado"</td>
                              <td className="border border-red-200 dark:border-red-700 px-2 py-1">Loja não reivindicada</td>
                              <td className="border border-red-200 dark:border-red-700 px-2 py-1">Completar passo 3 acima</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Seção 8: Dicas Extras */}
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                        <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-xs">8</span>
                        💡 Dicas Extras
                      </p>
                      <ul className="text-xs space-y-2 text-blue-700 dark:text-blue-300">
                        <li className="flex items-start gap-2">
                          <span>🔄</span>
                          <span><strong>Sincronização automática:</strong> O feed atualiza sozinho quando você altera produtos no painel</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>🏷️</span>
                          <span><strong>Promoções:</strong> Produtos em oferta aparecem com preço promocional automaticamente</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>📦</span>
                          <span><strong>Estoque:</strong> Produtos desativados aparecem como "out_of_stock" automaticamente</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>⏱️</span>
                          <span><strong>Cache:</strong> Alterações podem levar até 1 hora para refletir no feed</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>🆓</span>
                          <span><strong>Grátis:</strong> Listar produtos no Google Shopping é gratuito (listagens orgânicas)</span>
                        </li>
                      </ul>
                    </div>

                    {/* Botão de Ajuda */}
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-xs text-muted-foreground">
                        Precisa de ajuda? Entre em contato com nosso suporte
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.open('https://wa.me/5561994009368?text=Olá! Preciso de ajuda para configurar o Google Merchant Center', '_blank')}
                        className="h-7 text-xs"
                      >
                        💬 Falar com Suporte
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="meta-commerce">
                  <AccordionTrigger className="text-sm">
                    <div className="flex items-center gap-2">
                      <Instagram className="w-4 h-4 text-pink-500" />
                      <span className="font-semibold">Instagram / Facebook Shop - Guia Completo</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    
                    {/* Seção 1: Pré-requisitos */}
                    <div className="p-3 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-lg border border-pink-500/20">
                      <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                        📋 Seção 1: Pré-requisitos
                        <span className="text-[10px] bg-pink-500/20 text-pink-700 dark:text-pink-300 px-1.5 py-0.5 rounded">OBRIGATÓRIO</span>
                      </h4>
                      <ul className="text-xs space-y-1.5">
                        <li className="flex items-center gap-2">
                          <span className="text-green-500">✅</span>
                          <span>Ter conta <strong>Facebook Business</strong></span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-green-500">✅</span>
                          <span>Ter <strong>página do Facebook</strong> vinculada ao negócio</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-green-500">✅</span>
                          <span>Ter conta <strong>Instagram Business</strong> (não pessoal)</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-green-500">✅</span>
                          <span>Instagram conectado à página do Facebook</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-green-500">✅</span>
                          <span>Produtos cadastrados com imagens (mínimo <strong>500x500px</strong> para Instagram)</span>
                        </li>
                      </ul>
                      <Alert className="mt-2 py-2">
                        <AlertDescription className="text-xs">
                          ⚠️ <strong>Importante:</strong> Conta Instagram pessoal não funciona. É necessário converter para conta Business ou Profissional nas configurações do Instagram.
                        </AlertDescription>
                      </Alert>
                    </div>

                    {/* Seção 2: Criar conta Meta Business */}
                    <div className="p-3 bg-muted/50 rounded-lg border">
                      <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                        🏢 Seção 2: Criar Conta no Meta Business Suite
                      </h4>
                      <ol className="text-xs list-decimal ml-4 space-y-2">
                        <li>
                          Acesse <a href="https://business.facebook.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">business.facebook.com</a> e faça login
                        </li>
                        <li>
                          Clique em <strong>"Criar conta"</strong> se não tiver
                        </li>
                        <li>
                          Preencha as informações do negócio:
                          <ul className="list-disc ml-4 mt-1 text-muted-foreground">
                            <li>Nome da empresa: <strong>{formData.name || '[nome da loja]'}</strong></li>
                            <li>País: Brasil</li>
                            <li>Moeda: Real Brasileiro (BRL)</li>
                          </ul>
                        </li>
                        <li>
                          Adicione sua página do Facebook existente ou crie uma nova
                        </li>
                        <li>
                          Vincule a conta Instagram Business:
                          <ul className="list-disc ml-4 mt-1 text-muted-foreground">
                            <li>Vá em <strong>Configurações → Contas do Instagram</strong></li>
                            <li>Clique em <strong>"Conectar conta"</strong></li>
                            <li>Faça login no Instagram Business</li>
                          </ul>
                        </li>
                      </ol>
                    </div>

                    {/* Seção 3: Criar Catálogo */}
                    <div className="p-3 bg-muted/50 rounded-lg border">
                      <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                        📦 Seção 3: Criar Catálogo de Produtos
                      </h4>
                      <ol className="text-xs list-decimal ml-4 space-y-2">
                        <li>
                          Acesse <a href="https://business.facebook.com/commerce" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">business.facebook.com/commerce</a>
                        </li>
                        <li>
                          Clique em <strong>"Criar Catálogo"</strong>
                        </li>
                        <li>
                          Selecione o tipo: <strong>"E-commerce"</strong>
                        </li>
                        <li>
                          Configure:
                          <ul className="list-disc ml-4 mt-1 text-muted-foreground">
                            <li>Nome do catálogo: <strong>Produtos {formData.name || '[nome da loja]'}</strong></li>
                            <li>Selecione sua conta Business</li>
                            <li>Vincule à sua página do Facebook</li>
                          </ul>
                        </li>
                        <li>
                          Clique em <strong>"Criar"</strong>
                        </li>
                      </ol>
                    </div>

                    {/* Seção 4: Adicionar Feed */}
                    <div className="p-3 bg-gradient-to-r from-blue-500/10 to-pink-500/10 rounded-lg border border-blue-500/20">
                      <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                        🔗 Seção 4: Adicionar Feed de Dados
                        <span className="text-[10px] bg-blue-500/20 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">IMPORTANTE</span>
                      </h4>
                      <ol className="text-xs list-decimal ml-4 space-y-2">
                        <li>
                          Abra o catálogo criado no passo anterior
                        </li>
                        <li>
                          No menu lateral, vá em <strong>Fontes de dados → Feed de dados</strong>
                        </li>
                        <li>
                          Clique em <strong>"Adicionar feed de dados"</strong>
                        </li>
                        <li>
                          Selecione <strong>"Feed agendado"</strong> (não "Upload manual")
                        </li>
                        <li>
                          Cole a URL do seu feed:
                          <div className="mt-2 p-2 bg-background rounded border flex items-center gap-2">
                            <code className="text-[10px] flex-1 break-all font-mono text-pink-600 dark:text-pink-400">
                              {metaCommerceFeedUrl}
                            </code>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyUrl(metaCommerceFeedUrl)}
                              className="h-6 px-2"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </li>
                        <li>
                          Configure o feed:
                          <ul className="list-disc ml-4 mt-1 text-muted-foreground">
                            <li>Nome: <strong>Produtos {formData.name || '[nome da loja]'}</strong></li>
                            <li>Moeda padrão: <strong>BRL - Real Brasileiro</strong></li>
                            <li>Frequência: <strong>Diária</strong></li>
                            <li>Horário: <strong>06:00</strong> (recomendado)</li>
                          </ul>
                        </li>
                        <li>
                          Clique em <strong>"Iniciar upload"</strong>
                        </li>
                      </ol>
                      <Alert className="mt-3 py-2 border-green-500/30 bg-green-500/10">
                        <AlertDescription className="text-xs">
                          💡 <strong>Dica:</strong> O feed é atualizado automaticamente toda vez que você altera seus produtos no sistema. Não precisa fazer nada manualmente!
                        </AlertDescription>
                      </Alert>
                    </div>

                    {/* Seção 5: Vincular ao Instagram */}
                    <div className="p-3 bg-muted/50 rounded-lg border">
                      <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                        📱 Seção 5: Vincular ao Instagram Shopping
                      </h4>
                      <ol className="text-xs list-decimal ml-4 space-y-2">
                        <li>
                          No catálogo, vá em <strong>Configurações → Contas vinculadas</strong>
                        </li>
                        <li>
                          Clique em <strong>"Vincular conta do Instagram"</strong>
                        </li>
                        <li>
                          Selecione sua conta Instagram Business
                        </li>
                        <li>
                          Confirme a vinculação
                        </li>
                        <li>
                          No <strong>aplicativo Instagram</strong> do celular:
                          <ul className="list-disc ml-4 mt-1 text-muted-foreground">
                            <li>Vá em <strong>Configurações → Empresa → Compras</strong></li>
                            <li>Selecione o catálogo que você criou</li>
                            <li>Aguarde aprovação (1-7 dias úteis)</li>
                          </ul>
                        </li>
                      </ol>
                    </div>

                    {/* Seção 6: Aguardar Aprovação */}
                    <div className="p-3 bg-muted/50 rounded-lg border">
                      <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                        ⏳ Seção 6: Aguardar Aprovação
                      </h4>
                      <div className="text-xs space-y-2">
                        <p>O Meta analisa sua conta em <strong>1-7 dias úteis</strong>. Verifique o status em <strong>Catálogo → Diagnóstico</strong>.</p>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div className="p-2 bg-green-500/10 rounded border border-green-500/30 text-center">
                            <span className="text-green-600 dark:text-green-400 font-medium">✅ Aprovado</span>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Pode marcar produtos nas fotos</p>
                          </div>
                          <div className="p-2 bg-yellow-500/10 rounded border border-yellow-500/30 text-center">
                            <span className="text-yellow-600 dark:text-yellow-400 font-medium">⏳ Em análise</span>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Aguarde a verificação</p>
                          </div>
                          <div className="p-2 bg-orange-500/10 rounded border border-orange-500/30 text-center">
                            <span className="text-orange-600 dark:text-orange-400 font-medium">⚠️ Ação necessária</span>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Verifique erros no catálogo</p>
                          </div>
                          <div className="p-2 bg-red-500/10 rounded border border-red-500/30 text-center">
                            <span className="text-red-600 dark:text-red-400 font-medium">❌ Rejeitado</span>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Verifique motivo e recorra</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Seção 7: Erros Comuns */}
                    <div className="p-3 bg-muted/50 rounded-lg border">
                      <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                        ⚠️ Seção 7: Erros Comuns e Soluções
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-1.5 pr-2 font-semibold">Erro</th>
                              <th className="text-left py-1.5 pr-2 font-semibold">Causa</th>
                              <th className="text-left py-1.5 font-semibold">Solução</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            <tr>
                              <td className="py-1.5 pr-2 text-red-600 dark:text-red-400">"Imagem muito pequena"</td>
                              <td className="py-1.5 pr-2 text-muted-foreground">Imagem &lt; 500x500px</td>
                              <td className="py-1.5">Subir imagem maior (mín. 500x500)</td>
                            </tr>
                            <tr>
                              <td className="py-1.5 pr-2 text-red-600 dark:text-red-400">"Link inválido"</td>
                              <td className="py-1.5 pr-2 text-muted-foreground">URL do produto incorreta</td>
                              <td className="py-1.5">Verificar slug da loja</td>
                            </tr>
                            <tr>
                              <td className="py-1.5 pr-2 text-red-600 dark:text-red-400">"Feed não encontrado"</td>
                              <td className="py-1.5 pr-2 text-muted-foreground">URL do feed errada</td>
                              <td className="py-1.5">Copiar URL correta acima</td>
                            </tr>
                            <tr>
                              <td className="py-1.5 pr-2 text-red-600 dark:text-red-400">"Conta não elegível"</td>
                              <td className="py-1.5 pr-2 text-muted-foreground">Instagram é conta pessoal</td>
                              <td className="py-1.5">Converter para Business</td>
                            </tr>
                            <tr>
                              <td className="py-1.5 pr-2 text-red-600 dark:text-red-400">"Página não vinculada"</td>
                              <td className="py-1.5 pr-2 text-muted-foreground">Instagram não conectado ao FB</td>
                              <td className="py-1.5">Vincular no Business Suite</td>
                            </tr>
                            <tr>
                              <td className="py-1.5 pr-2 text-red-600 dark:text-red-400">"Política de comércio"</td>
                              <td className="py-1.5 pr-2 text-muted-foreground">Produto proibido pelo Meta</td>
                              <td className="py-1.5">Verificar políticas do Meta</td>
                            </tr>
                            <tr>
                              <td className="py-1.5 pr-2 text-red-600 dark:text-red-400">"Domínio não verificado"</td>
                              <td className="py-1.5 pr-2 text-muted-foreground">Domínio não confirmado</td>
                              <td className="py-1.5">Verificar no Business Suite</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Seção 8: Dicas Extras */}
                    <div className="p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                      <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                        💡 Seção 8: Dicas Extras
                      </h4>
                      <ul className="text-xs space-y-1.5">
                        <li className="flex items-start gap-2">
                          <span>🔄</span>
                          <span><strong>Sincronização automática:</strong> O feed atualiza sozinho quando você altera produtos</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>🏷️</span>
                          <span><strong>Promoções:</strong> Produtos em oferta exibem preço promocional automaticamente</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>📦</span>
                          <span><strong>Estoque:</strong> Produtos desativados aparecem como "out_of_stock" no catálogo</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>📸</span>
                          <span><strong>Stories/Reels:</strong> Marque produtos diretamente nas suas mídias após aprovação</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>🛒</span>
                          <span><strong>Checkout:</strong> Clientes podem visualizar e comprar sem sair do Instagram</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>🆓</span>
                          <span><strong>Grátis:</strong> Instagram Shopping é totalmente gratuito para usar</span>
                        </li>
                      </ul>
                    </div>

                    {/* Botão de Ajuda */}
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-xs text-muted-foreground">
                        Precisa de ajuda? Entre em contato com nosso suporte
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.open('https://wa.me/5561994009368?text=Olá! Preciso de ajuda para configurar o Instagram Shopping', '_blank')}
                        className="h-7 text-xs"
                      >
                        💬 Falar com Suporte
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Requisitos */}
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
              <strong>✅ Requisitos para aprovação:</strong>
              <ul className="list-disc ml-4 mt-1 space-y-0.5">
                <li>Imagens de produtos com mínimo 100x100px</li>
                <li>Preços sempre atualizados</li>
                <li>Descrições claras e sem caracteres especiais</li>
                <li>Produtos indisponíveis aparecem como "out_of_stock" automaticamente</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}