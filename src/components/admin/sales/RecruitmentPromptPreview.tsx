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
      <CardHeader className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start gap-2 md:gap-3 min-w-0">
            <Users className="h-4 w-4 md:h-5 md:w-5 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <CardTitle className="text-sm md:text-base flex flex-wrap items-center gap-1">
                <span>Preview</span>
                <span className="hidden sm:inline">- {info.emoji} {info.name}</span>
              </CardTitle>
              <CardDescription className="text-xs md:text-sm line-clamp-1 md:line-clamp-none">
                Prompt para recrutar vendedores
              </CardDescription>
            </div>
          </div>
          <Button onClick={handleCopy} variant="outline" size="sm" className="h-8 shrink-0">
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                <span className="hidden md:inline ml-2">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span className="hidden md:inline ml-2">Copiar</span>
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
        <ScrollArea className="h-[400px] md:h-[500px] w-full rounded-md border p-3 md:p-4 bg-muted/30">
          <pre className="text-xs md:text-sm whitespace-pre-wrap font-mono">{prompt}</pre>
        </ScrollArea>
        <div className="mt-3 md:mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span className="text-[10px] md:text-xs text-muted-foreground">
            {prompt.length.toLocaleString()} caracteres
          </span>
          <div className="overflow-x-auto w-full sm:w-auto">
            <div className="flex items-center gap-1.5 pb-1 sm:pb-0">
              <Badge variant="outline" className="text-[10px] md:text-xs shrink-0">Planos</Badge>
              <Badge variant="outline" className="text-[10px] md:text-xs shrink-0">Bônus</Badge>
              <Badge variant="outline" className="text-[10px] md:text-xs shrink-0">Links</Badge>
              <Badge variant="outline" className="text-[10px] md:text-xs shrink-0">FAQ</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
