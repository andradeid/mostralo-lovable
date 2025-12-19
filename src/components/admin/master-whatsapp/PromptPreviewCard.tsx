import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Eye, EyeOff, Copy, Check, Radio, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PromptPreviewCardProps {
  prompt: string;
  approachLabel: string;
  approachVariant?: "default" | "secondary" | "destructive" | "outline";
  isSynced?: boolean;
  lastSyncedAt?: string;
}

export function PromptPreviewCard({ 
  prompt, 
  approachLabel, 
  approachVariant = "secondary",
  isSynced = true,
  lastSyncedAt
}: PromptPreviewCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const prevPromptRef = useRef(prompt);

  // Auto-expand quando não sincronizado
  useEffect(() => {
    if (!isSynced && !isOpen) {
      setIsOpen(true);
    }
  }, [isSynced]);

  // Detectar mudanças no prompt e aplicar highlight
  useEffect(() => {
    if (prevPromptRef.current !== prompt && prevPromptRef.current !== "") {
      setIsHighlighted(true);
      const timer = setTimeout(() => setIsHighlighted(false), 2000);
      prevPromptRef.current = prompt;
      return () => clearTimeout(timer);
    }
    prevPromptRef.current = prompt;
  }, [prompt]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      toast.success("Prompt copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  const charCount = prompt.length;
  const wordCount = prompt.split(/\s+/).filter(Boolean).length;

  return (
    <Card className={cn(
      "border-dashed transition-all duration-300",
      isHighlighted && "ring-2 ring-primary/50 border-primary",
      !isSynced && "border-yellow-500/50"
    )}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Preview do Prompt</CardTitle>
              <Badge variant={approachVariant} className="text-xs">
                {approachLabel}
              </Badge>
              
              {/* Indicador de status ao vivo */}
              {isSynced ? (
                <Badge 
                  variant="outline" 
                  className="gap-1 text-xs bg-green-500/10 text-green-600 border-green-500/30"
                >
                  <Radio className="w-3 h-3 animate-pulse" />
                  Ao vivo
                </Badge>
              ) : (
                <Badge 
                  variant="outline" 
                  className="gap-1 text-xs bg-yellow-500/10 text-yellow-600 border-yellow-500/30 animate-pulse"
                >
                  <AlertCircle className="w-3 h-3" />
                  Não sincronizado
                </Badge>
              )}
              
              {isHighlighted && (
                <Badge 
                  variant="outline" 
                  className="gap-1 text-xs bg-primary/10 text-primary border-primary/30 animate-in fade-in"
                >
                  ✨ Atualizado
                </Badge>
              )}
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                {isOpen ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    Ocultar
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Ver Prompt
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-3">
            <ScrollArea className={cn(
              "h-[300px] rounded-md border bg-muted/30 p-4 transition-all",
              isHighlighted && "bg-primary/5"
            )}>
              <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
                {prompt}
              </pre>
            </ScrollArea>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex gap-4">
                <span>{charCount.toLocaleString()} caracteres</span>
                <span>{wordCount.toLocaleString()} palavras</span>
                {lastSyncedAt && (
                  <span className="text-muted-foreground/70">
                    Sincronizado: {new Date(lastSyncedAt).toLocaleString('pt-BR')}
                  </span>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopy}
                className={cn(
                  "gap-2 transition-colors",
                  copied && "text-green-600 border-green-600"
                )}
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copiar Prompt
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
