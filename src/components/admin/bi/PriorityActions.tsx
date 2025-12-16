import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Target } from "lucide-react";

const priorityActions = [
  {
    id: "recruit-salespeople",
    label: "Recrutar 10 vendedores ativos",
    description: "Vendedores com CNPJ ativo e pelo menos 1 venda fechada",
    priority: "high"
  },
  {
    id: "get-stores",
    label: "Conseguir 30 lojas pagantes",
    description: "Meta inicial para validar product-market fit",
    priority: "high"
  },
  {
    id: "video-testimonials",
    label: "Coletar 10 depoimentos em vídeo",
    description: "Depoimentos autênticos de lojistas satisfeitos",
    priority: "medium"
  },
  {
    id: "success-cases",
    label: "Criar 3 casos de sucesso documentados",
    description: "Casos com métricas reais de economia e crescimento",
    priority: "medium"
  },
  {
    id: "reach-mrr",
    label: "Atingir R$ 10.000 MRR",
    description: "Primeiro marco importante de receita recorrente",
    priority: "high"
  },
  {
    id: "improve-conversion",
    label: "Melhorar taxa de conversão para 25%+",
    description: "De cadastro para assinante ativo",
    priority: "medium"
  },
  {
    id: "launch-case-study-page",
    label: "Lançar página de casos de sucesso",
    description: "Página pública com depoimentos e resultados",
    priority: "low"
  }
];

const getPriorityConfig = (priority: string) => {
  switch (priority) {
    case "high":
      return { badge: "🔴", label: "Alta", variant: "destructive" as const };
    case "medium":
      return { badge: "🟡", label: "Média", variant: "default" as const };
    default:
      return { badge: "🟢", label: "Baixa", variant: "secondary" as const };
  }
};

export function PriorityActions() {
  return (
    <Card>
      <CardHeader className="p-3 pb-2 md:p-6 md:pb-4">
        <CardTitle className="flex items-center gap-1.5 text-sm md:text-base">
          <Target className="h-4 w-4 md:h-5 md:w-5" />
          Ações Prioritárias
        </CardTitle>
        <CardDescription className="text-xs md:text-sm">
          Checklist estratégico para os próximos 90 dias
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
        <ScrollArea className="h-[280px] md:h-[350px]">
          <div className="space-y-2">
            {priorityActions.map((action) => {
              const config = getPriorityConfig(action.priority);
              return (
                <div 
                  key={action.id} 
                  className="flex items-start space-x-2 md:space-x-3 p-2 md:p-3 rounded-lg border"
                >
                  <Checkbox id={action.id} className="mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor={action.id}
                      className="text-xs md:text-sm font-medium leading-tight cursor-pointer flex flex-wrap items-center gap-1"
                    >
                      <span className="truncate">{action.label}</span>
                      <span className="text-[10px] md:hidden">{config.badge}</span>
                      <Badge 
                        variant={config.variant}
                        className="hidden md:inline-flex text-[10px] md:text-xs"
                      >
                        {config.label}
                      </Badge>
                    </label>
                    <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 line-clamp-1 md:line-clamp-none">
                      {action.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="mt-3 md:mt-4 p-2 md:p-3 bg-muted rounded-lg">
          <h4 className="font-semibold text-xs mb-1">🎯 Foco Atual</h4>
          <p className="text-[10px] md:text-xs text-muted-foreground">
            Priorize as ações marcadas como "Alta" (🔴) para maior impacto.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
