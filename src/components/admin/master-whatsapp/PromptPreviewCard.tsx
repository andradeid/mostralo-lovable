import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Copy, Check, Radio, AlertCircle, RefreshCw, Cloud, FileCode, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RealPromptInfo {
  prompt: string | null;
  model: string | null;
  botId: string | null;
  exists: boolean;
  botName: string | null;
}

interface PromptPreviewCardProps {
  prompt: string;
  approachLabel: string;
  approachVariant?: "default" | "secondary" | "destructive" | "outline";
  isSynced?: boolean;
  lastSyncedAt?: string;
  // Novos props para prompt real
  realPrompt?: RealPromptInfo | null;
  onRefreshRealPrompt?: () => void;
  loadingRealPrompt?: boolean;
}

export function PromptPreviewCard({ 
  prompt, 
  approachLabel, 
  approachVariant = "secondary",
  isSynced = true,
  lastSyncedAt,
  realPrompt,
  onRefreshRealPrompt,
  loadingRealPrompt = false
}: PromptPreviewCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedReal, setCopiedReal] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("real");
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

  const handleCopy = async (text: string, setStateFn: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setStateFn(true);
      toast.success("Prompt copiado!");
      setTimeout(() => setStateFn(false), 2000);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  const charCount = prompt.length;
  const wordCount = prompt.split(/\s+/).filter(Boolean).length;

  const realCharCount = realPrompt?.prompt?.length || 0;
  const realWordCount = realPrompt?.prompt?.split(/\s+/).filter(Boolean).length || 0;

  // Verificar se prompt real difere do local
  const promptsDiffer = realPrompt?.prompt && realPrompt.prompt !== prompt;

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
              
              {/* Indicador de status */}
              {realPrompt?.exists ? (
                <Badge 
                  variant="outline" 
                  className="gap-1 text-xs bg-green-500/10 text-green-600 border-green-500/30"
                >
                  <Radio className="w-3 h-3 animate-pulse" />
                  Na IA
                </Badge>
              ) : isSynced ? (
                <Badge 
                  variant="outline" 
                  className="gap-1 text-xs bg-muted text-muted-foreground"
                >
                  Não sincronizado
                </Badge>
              ) : (
                <Badge 
                  variant="outline" 
                  className="gap-1 text-xs bg-yellow-500/10 text-yellow-600 border-yellow-500/30 animate-pulse"
                >
                  <AlertCircle className="w-3 h-3" />
                  Alterações pendentes
                </Badge>
              )}

              {promptsDiffer && (
                <Badge 
                  variant="outline" 
                  className="gap-1 text-xs bg-orange-500/10 text-orange-600 border-orange-500/30"
                >
                  <AlertCircle className="w-3 h-3" />
                  Difere do local
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
                    <span className="hidden sm:inline">Ocultar</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">Ver Prompt</span>
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex items-center justify-between gap-2 mb-2">
                <TabsList className="grid grid-cols-2 w-auto">
                  <TabsTrigger value="real" className="gap-1.5 text-xs">
                    <Cloud className="w-3 h-3" />
                    <span className="hidden sm:inline">Configurado na IA</span>
                    <span className="sm:hidden">IA</span>
                  </TabsTrigger>
                  <TabsTrigger value="local" className="gap-1.5 text-xs">
                    <FileCode className="w-3 h-3" />
                    <span className="hidden sm:inline">Preview Local</span>
                    <span className="sm:hidden">Local</span>
                  </TabsTrigger>
                </TabsList>
                
                {onRefreshRealPrompt && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onRefreshRealPrompt}
                    disabled={loadingRealPrompt}
                    className="gap-1.5"
                  >
                    {loadingRealPrompt ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    <span className="hidden sm:inline">Atualizar</span>
                  </Button>
                )}
              </div>

              {/* Tab: Prompt Real da IA */}
              <TabsContent value="real" className="mt-0">
                {realPrompt?.exists && realPrompt.prompt ? (
                  <>
                    <ScrollArea className="h-[300px] rounded-md border bg-green-500/5 p-4">
                      <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
                        {realPrompt.prompt}
                      </pre>
                    </ScrollArea>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex gap-4 flex-wrap">
                        <span>{realCharCount.toLocaleString()} caracteres</span>
                        <span>{realWordCount.toLocaleString()} palavras</span>
                        {realPrompt.model && (
                          <span className="text-green-600">Modelo: {realPrompt.model}</span>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleCopy(realPrompt.prompt!, setCopiedReal)}
                        className={cn(
                          "gap-2 transition-colors",
                          copiedReal && "text-green-600 border-green-600"
                        )}
                      >
                        {copiedReal ? (
                          <>
                            <Check className="w-3 h-3" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copiar
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="h-[300px] rounded-md border bg-muted/30 p-4 flex flex-col items-center justify-center gap-3 text-center">
                    <Cloud className="w-10 h-10 text-muted-foreground/50" />
                    <div>
                      <p className="font-medium text-muted-foreground">
                        {loadingRealPrompt ? "Carregando..." : "Bot não encontrado na IA"}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {loadingRealPrompt 
                          ? "Buscando prompt configurado na Evolution API..."
                          : "Sincronize o bot para enviar o prompt para a OpenAI/Evolution"
                        }
                      </p>
                    </div>
                    {!loadingRealPrompt && onRefreshRealPrompt && (
                      <Button variant="outline" size="sm" onClick={onRefreshRealPrompt}>
                        <RefreshCw className="w-3 h-3 mr-1.5" />
                        Tentar novamente
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Tab: Preview Local */}
              <TabsContent value="local" className="mt-0">
                <ScrollArea className={cn(
                  "h-[300px] rounded-md border bg-muted/30 p-4 transition-all",
                  isHighlighted && "bg-primary/5"
                )}>
                  <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
                    {prompt}
                  </pre>
                </ScrollArea>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex gap-4 flex-wrap">
                    <span>{charCount.toLocaleString()} caracteres</span>
                    <span>{wordCount.toLocaleString()} palavras</span>
                    {lastSyncedAt && (
                      <span className="text-muted-foreground/70">
                        Última sync: {new Date(lastSyncedAt).toLocaleString('pt-BR')}
                      </span>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleCopy(prompt, setCopied)}
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
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
