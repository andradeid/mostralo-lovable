import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Database, FileText, Bot, RefreshCw } from 'lucide-react';

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, icon, children, defaultOpen = false }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-2 sm:p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-xs sm:text-sm">{title}</span>
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 sm:pt-3 px-1">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function HowItWorksCard() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg">📚 Como Funciona</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Entenda o fluxo completo de integração do bot com a OpenAI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Fluxo Geral */}
        <Section 
          title="🔄 Fluxo Geral" 
          icon={<RefreshCw className="h-4 w-4 text-blue-500" />}
          defaultOpen={true}
        >
          <div className="text-xs sm:text-sm text-muted-foreground space-y-2">
            <p>O sistema funciona em 4 etapas principais:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li><strong>Cliente</strong> envia mensagem no WhatsApp</li>
              <li><strong>Evolution API</strong> recebe e identifica o bot</li>
              <li><strong>OpenAI</strong> processa com o prompt configurado</li>
              <li><strong>Evolution API</strong> responde ao cliente</li>
            </ol>
            
            {/* Diagrama simplificado */}
            <div className="mt-3 p-2 sm:p-3 bg-muted/30 rounded-lg font-mono text-xs overflow-x-auto">
              <div className="min-w-[280px]">
                <p>Cliente → WhatsApp → Evolution API</p>
                <p className="ml-4 sm:ml-8">↓</p>
                <p className="ml-4 sm:ml-8">Bot detecta instância + trigger</p>
                <p className="ml-4 sm:ml-8">↓</p>
                <p className="ml-4 sm:ml-8">OpenAI (via openai_creds_id)</p>
                <p className="ml-4 sm:ml-8">↓</p>
                <p className="ml-4 sm:ml-8">Resposta → Cliente</p>
              </div>
            </div>
          </div>
        </Section>

        {/* Busca de Dados */}
        <Section 
          title="📥 Busca de Dados" 
          icon={<Database className="h-4 w-4 text-green-500" />}
        >
          <div className="text-xs sm:text-sm text-muted-foreground space-y-2">
            <p>O sistema busca dados de 3 tabelas principais:</p>
            
            <div className="space-y-2">
              <div className="p-2 bg-muted/30 rounded">
                <p className="font-medium text-foreground">stores</p>
                <p className="text-xs">Nome, descrição, endereço, horários, WhatsApp</p>
              </div>
              <div className="p-2 bg-muted/30 rounded">
                <p className="font-medium text-foreground">categories</p>
                <p className="text-xs">Categorias de produtos (ativas)</p>
              </div>
              <div className="p-2 bg-muted/30 rounded">
                <p className="font-medium text-foreground">products</p>
                <p className="text-xs">Produtos com nome, descrição e preço</p>
              </div>
            </div>
          </div>
        </Section>

        {/* Montagem do Prompt */}
        <Section 
          title="📝 Montagem do Prompt" 
          icon={<FileText className="h-4 w-4 text-amber-500" />}
        >
          <div className="text-xs sm:text-sm text-muted-foreground space-y-2">
            <p>O prompt é montado dinamicamente com:</p>
            
            <div className="p-2 sm:p-3 bg-muted/30 rounded-lg font-mono text-xs overflow-x-auto">
              <pre className="whitespace-pre-wrap break-words">{`Você é o assistente virtual de [LOJA].
Endereço: [ENDEREÇO]
WhatsApp: [WHATSAPP]

CARDÁPIO:
- [Categoria 1]
  • Produto A - R$ X,XX
  • Produto B - R$ X,XX

- [Categoria 2]
  • Produto C - R$ X,XX

INSTRUÇÕES:
- Seja cordial e prestativo
- Sugira produtos do cardápio
- Informe sobre entrega
- Encaminhe para atendimento humano
  se necessário`}</pre>
            </div>
          </div>
        </Section>

        {/* Integração OpenAI */}
        <Section 
          title="🤖 Integração OpenAI" 
          icon={<Bot className="h-4 w-4 text-purple-500" />}
        >
          <div className="text-xs sm:text-sm text-muted-foreground space-y-2">
            <p>A Evolution API gerencia a conexão com a OpenAI:</p>
            
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Você cadastra a chave da OpenAI</li>
              <li>Evolution retorna um <code className="bg-muted px-1 rounded text-xs">openai_creds_id</code></li>
              <li>Ao criar bot, vinculamos esse ID</li>
              <li>Evolution faz chamadas automáticas</li>
            </ol>

            <div className="mt-3 p-2 sm:p-3 bg-primary/5 rounded-lg border border-primary/10">
              <p className="text-xs">
                <strong>💡 Importante:</strong> A chave da OpenAI fica armazenada 
                na Evolution API, não no nosso banco. O <code className="bg-muted px-1 rounded">openai_creds_id</code> é 
                apenas uma referência.
              </p>
            </div>
          </div>
        </Section>
      </CardContent>
    </Card>
  );
}