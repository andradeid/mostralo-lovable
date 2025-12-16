import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Users, Target, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const tactics = [
  {
    icon: "💼",
    title: "LinkedIn",
    potential: "Alto",
    description: "Buscar representantes comerciais e profissionais com CNPJ ativo."
  },
  {
    icon: "📱",
    title: "Instagram/TikTok",
    potential: "Viral",
    description: "Criar conteúdo sobre renda extra para PJs."
  },
  {
    icon: "🤝",
    title: "Parcerias",
    potential: "Escalável",
    description: "Contabilidades, grupos de empreendedores, associações."
  },
  {
    icon: "💰",
    title: "Indicação",
    potential: "Incentivo",
    description: "Bônus para vendedores que indicarem outros ativos."
  },
  {
    icon: "📢",
    title: "Anúncios",
    potential: "Pago",
    description: "Google/Facebook Ads para renda extra e trabalho autônomo."
  }
];

export function RecruitmentStrategy() {
  const [monthlyGoal, setMonthlyGoal] = useState(10);
  const [storesPerSalesperson, setStoresPerSalesperson] = useState(2);
  const { toast } = useToast();

  const calculatedImpact = {
    newStoresPerMonth: monthlyGoal * storesPerSalesperson,
    newMRRPerMonth: monthlyGoal * storesPerSalesperson * 397.90,
    newARRPerYear: monthlyGoal * storesPerSalesperson * 397.90 * 12
  };

  const recruitmentLink = `${window.location.origin}/seja-vendedor`;

  const copyLink = () => {
    navigator.clipboard.writeText(recruitmentLink);
    toast({
      title: "Link copiado!",
      description: "Link de recrutamento copiado."
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="p-3 pb-2 md:p-6 md:pb-4">
          <CardTitle className="text-sm md:text-base">Estratégia de Recrutamento</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Calcule o impacto de recrutar vendedores
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 pt-0 md:p-6 md:pt-0 space-y-4">
          {/* Calculator */}
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="monthlyGoal" className="text-xs md:text-sm">Meta Vendedores/Mês</Label>
              <Input
                id="monthlyGoal"
                type="number"
                value={monthlyGoal}
                onChange={(e) => setMonthlyGoal(Number(e.target.value))}
                min={1}
                className="h-8 md:h-10 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="storesPerSalesperson" className="text-xs md:text-sm">Lojas/Vendedor/Mês</Label>
              <Input
                id="storesPerSalesperson"
                type="number"
                value={storesPerSalesperson}
                onChange={(e) => setStoresPerSalesperson(Number(e.target.value))}
                min={1}
                className="h-8 md:h-10 text-sm"
              />
            </div>
          </div>

          {/* Impact Results */}
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
            <h4 className="font-semibold text-xs md:text-sm mb-2 flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 md:h-4 md:w-4" />
              Impacto Projetado
            </h4>
            <div className="grid gap-2 grid-cols-3">
              <div className="text-center">
                <p className="text-[10px] md:text-xs text-muted-foreground">Lojas/Mês</p>
                <p className="text-base md:text-xl font-bold text-primary">
                  {calculatedImpact.newStoresPerMonth}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] md:text-xs text-muted-foreground">MRR/Mês</p>
                <p className="text-base md:text-xl font-bold text-primary">
                  R$ {(calculatedImpact.newMRRPerMonth / 1000).toFixed(1)}k
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] md:text-xs text-muted-foreground">ARR/Ano</p>
                <p className="text-base md:text-xl font-bold text-primary">
                  R$ {(calculatedImpact.newARRPerYear / 1000).toFixed(0)}k
                </p>
              </div>
            </div>
          </div>

          {/* Recruitment Link */}
          <div className="space-y-1.5">
            <h4 className="font-semibold text-xs md:text-sm flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 md:h-4 md:w-4" />
              Link de Recrutamento
            </h4>
            <div className="flex gap-2">
              <Input 
                value={recruitmentLink} 
                readOnly 
                className="flex-1 text-xs md:text-sm h-8 md:h-10 truncate" 
              />
              <Button onClick={copyLink} variant="outline" size="icon" className="h-8 w-8 md:h-10 md:w-10 shrink-0">
                <Copy className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tactics */}
      <Card>
        <CardHeader className="p-3 pb-2 md:p-6 md:pb-4">
          <CardTitle className="flex items-center gap-1.5 text-sm md:text-base">
            <Lightbulb className="h-4 w-4 md:h-5 md:w-5" />
            Táticas de Recrutamento
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
          <ScrollArea className="h-[200px] md:h-auto md:max-h-none">
            <div className="space-y-2">
              {tactics.map((tactic, index) => (
                <div key={index} className="p-2 md:p-3 border rounded-lg">
                  <h5 className="font-semibold text-xs md:text-sm flex items-center gap-1.5">
                    {tactic.icon} {tactic.title}
                    <Badge variant="secondary" className="text-[10px] md:text-xs px-1.5">
                      {tactic.potential}
                    </Badge>
                  </h5>
                  <p className="text-[10px] md:text-sm text-muted-foreground mt-1 line-clamp-2 md:line-clamp-none">
                    {tactic.description}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
