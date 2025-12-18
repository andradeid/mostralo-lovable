import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, Copy, ExternalLink, Info, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CloudflareConfigCardProps {
  id: string;
  title: string;
  description: string;
  config?: string;
  configType?: "json" | "text";
  dashboardUrl?: string;
  dashboardSection?: string;
  isCompleted: boolean;
  onToggle: (id: string) => void;
  priority?: "critical" | "recommended" | "optional";
  warning?: string;
  impact?: string;
}

export function CloudflareConfigCard({
  id,
  title,
  description,
  config,
  configType = "text",
  dashboardUrl,
  dashboardSection,
  isCompleted,
  onToggle,
  priority = "recommended",
  warning,
  impact
}: CloudflareConfigCardProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!config) return;
    
    try {
      await navigator.clipboard.writeText(config);
      setCopied(true);
      toast({
        title: "Copiado!",
        description: "Configuração copiada para a área de transferência."
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar a configuração.",
        variant: "destructive"
      });
    }
  };

  const priorityColors = {
    critical: "bg-red-500/10 text-red-500 border-red-500/20",
    recommended: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    optional: "bg-blue-500/10 text-blue-500 border-blue-500/20"
  };

  const priorityLabels = {
    critical: "Crítico",
    recommended: "Recomendado",
    optional: "Opcional"
  };

  return (
    <Card className={`transition-all ${isCompleted ? "border-green-500/30 bg-green-500/5" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Checkbox
              id={id}
              checked={isCompleted}
              onCheckedChange={() => onToggle(id)}
              className="mt-1"
            />
            <div className="space-y-1">
              <CardTitle className={`text-base ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
                {title}
              </CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={priorityColors[priority]}>
              {priorityLabels[priority]}
            </Badge>
            {impact && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Info className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[250px]">
                  <p className="text-sm">{impact}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {warning && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
            <p className="text-sm text-yellow-600 dark:text-yellow-400">{warning}</p>
          </div>
        )}

        {config && (
          <div className="relative">
            <pre className="p-3 rounded-lg bg-muted text-sm overflow-x-auto font-mono text-foreground">
              {configType === "json" ? JSON.stringify(JSON.parse(config), null, 2) : config}
            </pre>
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  Copiar
                </>
              )}
            </Button>
          </div>
        )}

        {dashboardUrl && (
          <Button variant="outline" size="sm" asChild>
            <a href={dashboardUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-2" />
              {dashboardSection || "Abrir no Cloudflare"}
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
