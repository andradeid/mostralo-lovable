import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomDomainConfig } from "../CustomDomainConfig";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Info } from "lucide-react";
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
      </div>
    </div>
  );
}