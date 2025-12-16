import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, Database, FileCode, Bot, Cpu, 
  ArrowRight, Store, ShoppingBag, Tags, Sparkles
} from 'lucide-react';

export function HowItWorksCard() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    flow: true,
    data: false,
    prompt: false,
    openai: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          Como o Bot IA Funciona
        </CardTitle>
        <CardDescription>
          Entenda o fluxo completo de integração com Evolution API e OpenAI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Fluxo Geral */}
        <Collapsible open={openSections.flow} onOpenChange={() => toggleSection('flow')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
            <div className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-primary" />
              <span className="font-medium">🔄 Fluxo Geral</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${openSections.flow ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 p-4 bg-muted/30 rounded-lg space-y-3">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="font-mono">1</Badge>
                <span>Cliente envia mensagem no WhatsApp</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="font-mono">2</Badge>
                <span>Evolution API recebe a mensagem</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="font-mono">3</Badge>
                <span>Evolution envia para OpenAI com o prompt configurado</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="font-mono">4</Badge>
                <span>OpenAI gera resposta baseada no contexto da loja</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="font-mono">5</Badge>
                <span>Evolution responde automaticamente ao cliente</span>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2 border-t">
              <Bot className="h-4 w-4" />
              <span>WhatsApp</span>
              <ArrowRight className="h-3 w-3" />
              <Cpu className="h-4 w-4" />
              <span>Evolution</span>
              <ArrowRight className="h-3 w-3" />
              <Sparkles className="h-4 w-4" />
              <span>OpenAI</span>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Busca de Dados */}
        <Collapsible open={openSections.data} onOpenChange={() => toggleSection('data')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-500" />
              <span className="font-medium">📥 Busca de Dados</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${openSections.data ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 p-4 bg-muted/30 rounded-lg space-y-3">
            <p className="text-sm text-muted-foreground">
              Quando o bot é criado/atualizado, buscamos automaticamente:
            </p>
            <div className="grid gap-2">
              <div className="flex items-start gap-2 p-2 bg-background rounded border">
                <Store className="h-4 w-4 mt-0.5 text-primary" />
                <div>
                  <p className="font-medium text-sm">stores</p>
                  <p className="text-xs text-muted-foreground">Nome, descrição, WhatsApp, endereço, slug</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2 bg-background rounded border">
                <ShoppingBag className="h-4 w-4 mt-0.5 text-green-500" />
                <div>
                  <p className="font-medium text-sm">products</p>
                  <p className="text-xs text-muted-foreground">Nome, preço, descrição (is_available = true)</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2 bg-background rounded border">
                <Tags className="h-4 w-4 mt-0.5 text-amber-500" />
                <div>
                  <p className="font-medium text-sm">categories</p>
                  <p className="text-xs text-muted-foreground">Nome da categoria (is_active = true)</p>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Montagem do Prompt */}
        <Collapsible open={openSections.prompt} onOpenChange={() => toggleSection('prompt')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
            <div className="flex items-center gap-2">
              <FileCode className="h-4 w-4 text-purple-500" />
              <span className="font-medium">📝 Montagem do Prompt</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${openSections.prompt ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 p-4 bg-muted/30 rounded-lg space-y-3">
            <p className="text-sm text-muted-foreground">
              O prompt é montado automaticamente com esta estrutura:
            </p>
            <div className="text-xs font-mono bg-background p-3 rounded border space-y-1">
              <p className="text-primary">// Identidade</p>
              <p>"Você é o assistente virtual da [LOJA]"</p>
              <p className="text-primary mt-2">// Dados da Loja</p>
              <p>Nome, descrição, WhatsApp, endereço, link</p>
              <p className="text-primary mt-2">// Cardápio</p>
              <p>Lista de categorias ativas</p>
              <p>Lista de produtos com preços</p>
              <p className="text-primary mt-2">// Instruções</p>
              <p>Regras de comportamento do bot</p>
            </div>
            <p className="text-xs text-muted-foreground">
              💡 Veja o preview completo do prompt na aba "Loja Sandbox" abaixo
            </p>
          </CollapsibleContent>
        </Collapsible>

        {/* Integração OpenAI */}
        <Collapsible open={openSections.openai} onOpenChange={() => toggleSection('openai')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-green-500" />
              <span className="font-medium">🤖 Integração OpenAI</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${openSections.openai ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 p-4 bg-muted/30 rounded-lg space-y-3">
            <p className="text-sm text-muted-foreground">
              A Evolution API gerencia toda integração com OpenAI:
            </p>
            <ul className="text-sm space-y-2">
              <li className="flex items-start gap-2">
                <Badge variant="secondary" className="mt-0.5">1</Badge>
                <span>Credenciais OpenAI são armazenadas na Evolution</span>
              </li>
              <li className="flex items-start gap-2">
                <Badge variant="secondary" className="mt-0.5">2</Badge>
                <span>Quando criamos um bot, enviamos o prompt via API</span>
              </li>
              <li className="flex items-start gap-2">
                <Badge variant="secondary" className="mt-0.5">3</Badge>
                <span>Evolution usa o ID das credenciais (openai_creds_id)</span>
              </li>
              <li className="flex items-start gap-2">
                <Badge variant="secondary" className="mt-0.5">4</Badge>
                <span>A cada mensagem, Evolution chama OpenAI automaticamente</span>
              </li>
            </ul>
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded text-xs">
              ⚠️ <strong>Importante:</strong> A chave da OpenAI é configurada diretamente na Evolution API, não no Mostralo.
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
