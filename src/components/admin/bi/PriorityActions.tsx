import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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

export function PriorityActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Ações Prioritárias
        </CardTitle>
        <CardDescription>
          Checklist estratégico para os próximos 90 dias
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {priorityActions.map((action) => (
            <div key={action.id} className="flex items-start space-x-3 p-3 rounded-lg border">
              <Checkbox id={action.id} className="mt-1" />
              <div className="flex-1 space-y-1">
                <label
                  htmlFor={action.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {action.label}
                  <Badge 
                    variant={
                      action.priority === "high" ? "destructive" : 
                      action.priority === "medium" ? "default" : 
                      "secondary"
                    }
                    className="ml-2"
                  >
                    {action.priority === "high" ? "Alta" : 
                     action.priority === "medium" ? "Média" : 
                     "Baixa"}
                  </Badge>
                </label>
                <p className="text-sm text-muted-foreground">
                  {action.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">🎯 Foco Atual</h4>
          <p className="text-sm text-muted-foreground">
            Priorize as ações marcadas como "Alta". Elas têm o maior impacto no crescimento 
            da plataforma neste momento. As ações de prioridade "Média" e "Baixa" podem ser 
            executadas conforme capacidade do time.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
