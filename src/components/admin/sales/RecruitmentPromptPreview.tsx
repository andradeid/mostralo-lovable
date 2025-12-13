import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Users } from 'lucide-react';
import { toast } from 'sonner';
import { RecruitmentPromptType, getRecruitmentPromptTypeInfo } from '@/utils/recruitmentPromptGenerator';

interface RecruitmentPromptPreviewProps {
  prompt: string;
  type: RecruitmentPromptType;
}

export function RecruitmentPromptPreview({ prompt, type }: RecruitmentPromptPreviewProps) {
  const [copied, setCopied] = useState(false);
  const info = getRecruitmentPromptTypeInfo(type);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      toast.success('Prompt de recrutamento copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Erro ao copiar prompt');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5" />
            <div>
              <CardTitle className="flex items-center gap-2">
                Preview do Prompt - {info.emoji} {info.name}
              </CardTitle>
              <CardDescription>
                Prompt completo para recrutar novos vendedores com dados dinâmicos
              </CardDescription>
            </div>
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
        <ScrollArea className="h-[500px] w-full rounded-md border p-4 bg-muted/30">
          <pre className="text-sm whitespace-pre-wrap font-mono">{prompt}</pre>
        </ScrollArea>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {prompt.length.toLocaleString()} caracteres
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Planos Dinâmicos</Badge>
            <Badge variant="outline">Bônus Atualizados</Badge>
            <Badge variant="outline">Links Automáticos</Badge>
            <Badge variant="outline">FAQ Completo</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
