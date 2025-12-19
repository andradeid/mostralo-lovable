import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface InfoTooltipProps {
  text: string;
  className?: string;
  iconClassName?: string;
}

export function InfoTooltip({ text, className, iconClassName }: InfoTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle 
            className={cn(
              "h-3.5 w-3.5 text-muted-foreground cursor-help hover:text-primary transition-colors shrink-0",
              iconClassName
            )} 
          />
        </TooltipTrigger>
        <TooltipContent className={cn("max-w-xs p-3", className)}>
          <p className="text-xs leading-relaxed">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
