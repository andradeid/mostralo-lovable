import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface PromptPreviewProps {
  prompt: string;
  type: 'basic' | 'intermediate' | 'aggressive';
}

export function PromptPreview({ prompt, type }: PromptPreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      toast.success('Prompt copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Erro ao copiar prompt');
    }
  };

  const typeLabels = {
    basic: 'Consultivo',
    intermediate: 'Persuasivo',
    aggressive: 'Urgência',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Preview do Prompt - {typeLabels[type]}</CardTitle>
            <CardDescription>
              Prompt gerado com dados atualizados do sistema
            </CardDescription>
          </div>
          <Button onClick={handleCopy} variant="outline" size="sm">
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copiar Prompt
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] w-full rounded-md border p-4 bg-muted/30">
          <pre className="text-sm whitespace-pre-wrap font-mono">{prompt}</pre>
        </ScrollArea>
        <div className="mt-4 text-xs text-muted-foreground">
          {prompt.length} caracteres · Cole este prompt no ChatGPT, Claude ou outro assistente de IA
        </div>
      </CardContent>
    </Card>
  );
}
