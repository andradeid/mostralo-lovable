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
    <Card>
<CardHeader className="pb-2 sm:pb-3 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <CardTitle className="text-base sm:text-lg">Preview do Comportamento</CardTitle>
          </div>
          {promptData && (
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="gap-1 text-[10px] sm:text-xs">
                <Package className="h-3 w-3" />
                {promptData.productsCount} produtos
              </Badge>
              <Badge variant="outline" className="gap-1 text-[10px] sm:text-xs">
                <FolderOpen className="h-3 w-3" />
                {promptData.categoriesCount} categorias
              </Badge>
            </div>
          )}
        </div>
        <CardDescription className="text-xs sm:text-sm leading-relaxed break-words">
          Este é o prompt que a IA usa para responder seus clientes. Gerado automaticamente com base nos produtos e configurações da sua loja.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
        <div className="p-2.5 sm:p-3 bg-muted/50 border rounded-lg text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
          💡 <strong>Dica:</strong> Adicione mais produtos e categorias para enriquecer as respostas do bot. O prompt atualiza automaticamente.
        </div>

        <ScrollArea className="h-[250px] sm:h-[350px] w-full rounded-lg border bg-muted/30 p-3 sm:p-4">
          {promptData ? (
            <pre 
              className="text-sm whitespace-pre-wrap font-mono"
              dangerouslySetInnerHTML={{ 
                __html: formatPromptWithHighlights(promptData.prompt) 
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Carregando preview...
            </div>
          )}
        </ScrollArea>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-[10px] sm:text-xs text-muted-foreground">
          <span className="break-words">
            {lastUpdated && (
              <>🔄 Atualizado {formatDistanceToNow(lastUpdated, { addSuffix: true, locale: ptBR })}</>
            )}
          </span>
          
          {promptData?.storeLink && (
            <a 
              href={promptData.storeLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Ver cardápio
            </a>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            className="flex-1 text-xs sm:text-sm"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 text-xs sm:text-sm"
            onClick={handleCopy}
            disabled={!promptData}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copiar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
