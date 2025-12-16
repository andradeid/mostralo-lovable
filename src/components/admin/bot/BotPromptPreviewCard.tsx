import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, RefreshCw, Copy, ExternalLink, Package, FolderOpen } from "lucide-react";
import { BotPromptData } from "@/lib/botPromptGenerator";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BotPromptPreviewCardProps {
  promptData: BotPromptData | null;
  lastUpdated: Date | null;
  onRefresh: () => void;
  loading?: boolean;
}

export function BotPromptPreviewCard({ 
  promptData, 
  lastUpdated, 
  onRefresh,
  loading 
}: BotPromptPreviewCardProps) {
  const { toast } = useToast();

  const handleCopy = async () => {
    if (!promptData) return;
    
    try {
      await navigator.clipboard.writeText(promptData.prompt);
      toast({
        title: "Copiado!",
        description: "Prompt copiado para a área de transferência",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao copiar texto",
        variant: "destructive",
      });
    }
  };

  const formatPromptWithHighlights = (prompt: string) => {
    // Highlight sections
    const sections = [
      'INFORMAÇÕES DA LOJA:',
      'CATEGORIAS DISPONÍVEIS:',
      'PRODUTOS DISPONÍVEIS:',
      'INSTRUÇÕES:',
      'ENCERRAMENTO:',
    ];

    let formatted = prompt;
    sections.forEach(section => {
      formatted = formatted.replace(
        section,
        `<span class="font-bold text-primary">${section}</span>`
      );
    });

    return formatted;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="!p-3 !pb-2 sm:!p-6 sm:!pb-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
              <CardTitle className="text-base sm:text-lg">Preview do Comportamento</CardTitle>
            </div>
            {promptData && (
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="gap-1 text-[10px] whitespace-nowrap">
                  <Package className="h-3 w-3 shrink-0" />
                  {promptData.productsCount}
                </Badge>
                <Badge variant="outline" className="gap-1 text-[10px] whitespace-nowrap">
                  <FolderOpen className="h-3 w-3 shrink-0" />
                  {promptData.categoriesCount}
                </Badge>
              </div>
            )}
          </div>
          <CardDescription className="text-xs sm:text-sm leading-relaxed break-words hyphens-auto">
            Este é o prompt que a IA usa para responder seus clientes. Gerado automaticamente com base nos produtos e configurações da sua loja.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="!p-3 !pt-0 sm:!p-6 sm:!pt-0 space-y-3 sm:space-y-4">
        <div className="p-2 sm:p-3 bg-muted/50 border rounded-lg overflow-hidden">
          <p className="text-[10px] sm:text-xs text-muted-foreground break-words hyphens-auto">
            💡 <strong>Dica:</strong> Adicione mais produtos e categorias para enriquecer as respostas do bot. O prompt atualiza automaticamente.
          </p>
        </div>

        <ScrollArea className="h-[200px] sm:h-[300px] w-full rounded-lg border bg-muted/30 p-3 sm:p-4">
          {promptData ? (
            <pre 
              className="text-xs sm:text-sm whitespace-pre-wrap font-mono break-words"
              dangerouslySetInnerHTML={{ 
                __html: formatPromptWithHighlights(promptData.prompt) 
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Carregando preview...
            </div>
          )}
        </ScrollArea>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-[10px] sm:text-xs text-muted-foreground">
          <span className="break-words min-w-0">
            {lastUpdated && (
              <>🔄 Atualizado {formatDistanceToNow(lastUpdated, { addSuffix: true, locale: ptBR })}</>
            )}
          </span>
          
          {promptData?.storeLink && (
            <a 
              href={promptData.storeLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline shrink-0"
            >
              <ExternalLink className="h-3 w-3" />
              Ver cardápio
            </a>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="w-full text-xs sm:text-sm"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-2 shrink-0 ${loading ? 'animate-spin' : ''}`} />
            Atualizar Preview
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="w-full text-xs sm:text-sm"
            onClick={handleCopy}
            disabled={!promptData}
          >
            <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-2 shrink-0" />
            Copiar Prompt
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
