import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Eye, EyeOff, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PromptPreviewCardProps {
  prompt: string;
  approachLabel: string;
  approachVariant?: "default" | "secondary" | "destructive" | "outline";
}

export function PromptPreviewCard({ 
  prompt, 
  approachLabel, 
  approachVariant = "secondary" 
}: PromptPreviewCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

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
    <Card className="border-dashed">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Preview do Prompt</CardTitle>
              <Badge variant={approachVariant} className="text-xs">
                {approachLabel}
              </Badge>
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
            <ScrollArea className="h-[300px] rounded-md border bg-muted/30 p-4">
              <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
                {prompt}
              </pre>
            </ScrollArea>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex gap-4">
                <span>{charCount.toLocaleString()} caracteres</span>
                <span>{wordCount.toLocaleString()} palavras</span>
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
