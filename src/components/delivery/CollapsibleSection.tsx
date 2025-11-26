import { useState, useEffect, ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  title: string;
  icon: ReactNode;
  count: number;
  colorScheme: "orange" | "blue" | "green";
  defaultOpen?: boolean;
  storageKey?: string;
  children: ReactNode;
  alwaysOpen?: boolean;
}

const colorConfig = {
  orange: {
    border: "border-orange-500",
    bg: "bg-orange-50 dark:bg-orange-950/20",
    text: "text-orange-600 dark:text-orange-400",
    badge: "bg-orange-500 text-white",
  },
  blue: {
    border: "border-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    text: "text-blue-600 dark:text-blue-400",
    badge: "bg-blue-500 text-white",
  },
  green: {
    border: "border-green-500",
    bg: "bg-green-50 dark:bg-green-950/20",
    text: "text-green-600 dark:text-green-400",
    badge: "bg-green-500 text-white",
  },
};

export function CollapsibleSection({
  title,
  icon,
  count,
  colorScheme,
  defaultOpen = false,
  storageKey,
  children,
  alwaysOpen = false,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(() => {
    if (alwaysOpen) return true;
    if (!storageKey) return defaultOpen;
    
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : defaultOpen;
  });

  useEffect(() => {
    if (!alwaysOpen && storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(isOpen));
    }
  }, [isOpen, storageKey, alwaysOpen]);

  const colors = colorConfig[colorScheme];

  const handleToggle = () => {
    if (!alwaysOpen) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={cn("border-l-4 transition-shadow hover:shadow-md", colors.border)}>
        <CollapsibleTrigger asChild disabled={alwaysOpen}>
          <CardHeader
            className={cn(
              "py-4 px-6 transition-colors",
              !alwaysOpen && "cursor-pointer hover:bg-muted/50"
            )}
            onClick={handleToggle}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={colors.text}>{icon}</div>
                <h3 className="text-lg font-semibold">{title}</h3>
                {count > 0 && (
                  <Badge className={cn("text-xs font-bold", colors.badge)}>
                    {count}
                  </Badge>
                )}
              </div>
              {!alwaysOpen && (
                <div className={cn("transition-transform duration-200", colors.text)}>
                  {isOpen ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </div>
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
          <Separator />
          <CardContent className="pt-6 pb-6 px-6">
            {children}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
