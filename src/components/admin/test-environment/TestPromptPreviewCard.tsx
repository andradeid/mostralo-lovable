import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Eye, EyeOff, RefreshCw, Check } from 'lucide-react';
import { toast } from 'sonner';

interface SandboxProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
}

interface SandboxCategory {
  id: string;
  name: string;
  description?: string;
}

interface TestPromptPreviewCardProps {
  storeName: string;
  storeDescription: string;
  products: SandboxProduct[];
  categories: SandboxCategory[];
  whatsapp?: string;
  address?: string;
  onRefresh?: () => void;
  loading?: boolean;
}

export function TestPromptPreviewCard({
  storeName,
  storeDescription,
  products,
  categories,
  whatsapp = '5561999999999',
  address = 'Endereço de teste',
  onRefresh,
  loading = false,
}: TestPromptPreviewCardProps) {
  const [showFull, setShowFull] = useState(false);
  const [copied, setCopied] = useState(false);

  // Gerar prompt igual ao Edge Function
  const generatePrompt = () => {
    const productList = products
      .map(p => `- ${p.name}: R$ ${p.price.toFixed(2)} - ${p.description || 'Sem descrição'}`)
      .join('\n');

    const categoryList = categories.map(c => c.name).join(', ');

    return `Você é o assistente virtual da ${storeName}.

INFORMAÇÕES DA LOJA (TESTE):
- Nome: ${storeName}
- Descrição: ${storeDescription}
- WhatsApp: ${whatsapp}
- Endereço: ${address}

CATEGORIAS DISPONÍVEIS:
${categoryList || 'Pizzas, Bebidas'}

PRODUTOS DISPONÍVEIS:
${productList || 'Consulte a loja'}

INSTRUÇÕES:
1. Esta é uma LOJA DE TESTE - responda normalmente como um bot real
2. Seja cordial e prestativo
3. Apresente os produtos quando perguntado
4. Informe preços corretamente
5. Não invente produtos ou preços
6. Responda sempre em português brasileiro
7. Use emojis moderadamente

ENCERRAMENTO:
- Quando o cliente digitar #SAIR, agradeça e finalize`;
  };

  const prompt = generatePrompt();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      toast.success('Prompt copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Falha ao copiar');
    }
  };

  const formatPromptWithHighlights = (text: string) => {
    const sections = [
      'INFORMAÇÕES DA LOJA',
      'CATEGORIAS DISPONÍVEIS',
      'PRODUTOS DISPONÍVEIS',
      'INSTRUÇÕES',
      'ENCERRAMENTO',
    ];

    let formatted = text;
    sections.forEach(section => {
      formatted = formatted.replace(
        new RegExp(`(${section}[^:]*:?)`, 'g'),
        '**$1**'
      );
    });

    return formatted.split('\n').map((line, i) => {
      const isBold = line.includes('**');
      const cleanLine = line.replace(/\*\*/g, '');
      
      if (isBold) {
        return (
          <p key={i} className="font-semibold text-primary mt-3 first:mt-0">
            {cleanLine}
          </p>
        );
      }
      return (
        <p key={i} className="text-muted-foreground">
          {cleanLine || '\u00A0'}
        </p>
      );
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              📋 Preview do Prompt de Teste
            </CardTitle>
            <CardDescription className="mt-1 text-xs sm:text-sm">
              Este é o prompt que será enviado à OpenAI via Evolution
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="font-normal text-xs">
              {products.length} produtos
            </Badge>
            <Badge variant="secondary" className="font-normal text-xs">
              {categories.length} categorias
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <ScrollArea className={showFull ? 'h-[300px] sm:h-[400px]' : 'h-[150px] sm:h-[200px]'}>
            <div className="text-xs sm:text-sm font-mono bg-muted/50 p-3 sm:p-4 rounded-lg border space-y-0">
              {formatPromptWithHighlights(prompt)}
            </div>
          </ScrollArea>
          
          {!showFull && (
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none" />
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFull(!showFull)}
            className="w-full sm:w-auto"
          >
            {showFull ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Ver menos
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Ver completo
              </>
            )}
          </Button>

          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={loading}
                className="flex-1 sm:flex-none"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Atualizar</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="flex-1 sm:flex-none"
            >
              {copied ? (
                <Check className="h-4 w-4 mr-2 text-green-500" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              {copied ? 'Copiado!' : 'Copiar'}
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          💡 O prompt é gerado automaticamente com base nos produtos e categorias configurados
        </p>
      </CardContent>
    </Card>
  );
}
