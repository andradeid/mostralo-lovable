import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Droplets } from "lucide-react";
import { cn } from "@/lib/utils";
import { ODONTOGRAM_TOOLS } from "./OdontogramToolbar";
import { PERIODONTAL_CLASSIFICATION } from "@/hooks/dental/usePeriodontalRecords";

interface OdontogramLegendProps {
  showPeriodontal?: boolean;
  className?: string;
  defaultOpen?: boolean;
}

export function OdontogramLegend({
  showPeriodontal = false,
  className,
  defaultOpen = true,
}: OdontogramLegendProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={cn("w-full", className)}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <span>Legenda</span>
          {isOpen ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-2 pt-2">
        {/* Condições Dentárias */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
            Condições Dentárias
          </p>
          <div className="flex flex-wrap gap-1">
            {ODONTOGRAM_TOOLS.map((tool) => (
              <Badge
                key={tool.id}
                variant="outline"
                className="gap-1 text-[9px] px-1.5 py-0.5 cursor-default"
                style={{ borderColor: tool.color }}
              >
                <span
                  className="h-2 w-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: tool.color }}
                />
                <span className="truncate">{tool.label}</span>
              </Badge>
            ))}
          </div>
        </div>

        {/* Condições Periodontais */}
        {showPeriodontal && (
          <div className="space-y-1.5 pt-1 border-t">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide pt-1">
              Classificação Periodontal
            </p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(PERIODONTAL_CLASSIFICATION).map(([key, { color, label }]) => (
                <Badge
                  key={key}
                  variant="outline"
                  className="gap-1 text-[9px] px-1.5 py-0.5 cursor-default"
                  style={{ borderColor: color }}
                >
                  <span
                    className="h-2 w-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span>{label}</span>
                </Badge>
              ))}
              <Badge
                variant="outline"
                className="gap-1 text-[9px] px-1.5 py-0.5 cursor-default border-destructive"
              >
                <Droplets className="h-2.5 w-2.5 text-destructive flex-shrink-0" />
                <span>Sangramento</span>
              </Badge>
            </div>
            <p className="text-[9px] text-muted-foreground italic">
              Clique nos pontos da linha gengival para registrar medidas periodontais
            </p>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
