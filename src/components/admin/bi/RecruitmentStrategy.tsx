import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, QrCode, Users, TrendingUp, Target, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
      description: "Link de recrutamento copiado para a área de transferência."
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Estratégia de Recrutamento de Vendedores</CardTitle>
          <CardDescription>
            Calcule o impacto de recrutar vendedores ativos no crescimento da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Calculadora de Impacto */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="monthlyGoal">Meta de Vendedores por Mês</Label>
              <Input
                id="monthlyGoal"
                type="number"
                value={monthlyGoal}
                onChange={(e) => setMonthlyGoal(Number(e.target.value))}
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storesPerSalesperson">Lojas por Vendedor/Mês</Label>
              <Input
                id="storesPerSalesperson"
                type="number"
                value={storesPerSalesperson}
                onChange={(e) => setStoresPerSalesperson(Number(e.target.value))}
                min={1}
              />
            </div>
          </div>

          {/* Resultado do Impacto */}
          <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Target className="h-5 w-5" />
              Impacto Projetado
            </h4>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Novas Lojas/Mês</p>
                <p className="text-2xl font-bold text-primary">
                  {calculatedImpact.newStoresPerMonth}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Novo MRR/Mês</p>
                <p className="text-2xl font-bold text-primary">
                  R$ {calculatedImpact.newMRRPerMonth.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Novo ARR/Ano</p>
                <p className="text-2xl font-bold text-primary">
                  R$ {calculatedImpact.newARRPerYear.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>

          {/* Canais de Recrutamento */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Canais de Recrutamento
            </h4>
            <div className="flex gap-2">
              <Input value={recruitmentLink} readOnly className="flex-1" />
              <Button onClick={copyLink} variant="outline" size="icon">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Compartilhe este link em redes sociais, grupos de WhatsApp, e com contatos profissionais
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Estratégias Sugeridas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Táticas de Recrutamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="p-3 border rounded-lg">
              <h5 className="font-semibold mb-1 flex items-center gap-2">
                💼 LinkedIn
                <Badge variant="secondary">Alto Potencial</Badge>
              </h5>
              <p className="text-sm text-muted-foreground">
                Buscar representantes comerciais, consultores de vendas, e profissionais com CNPJ ativo. 
                Filtrar por "representante comercial" ou "vendedor autônomo".
              </p>
            </div>

            <div className="p-3 border rounded-lg">
              <h5 className="font-semibold mb-1 flex items-center gap-2">
                📱 Instagram/TikTok
                <Badge variant="secondary">Viral</Badge>
              </h5>
              <p className="text-sm text-muted-foreground">
                Criar conteúdo sobre renda extra para PJs, vídeos mostrando comissões reais, 
                e depoimentos de vendedores ativos (quando disponível).
              </p>
            </div>

            <div className="p-3 border rounded-lg">
              <h5 className="font-semibold mb-1 flex items-center gap-2">
                🤝 Parcerias Estratégicas
                <Badge variant="secondary">Escalável</Badge>
              </h5>
              <p className="text-sm text-muted-foreground">
                Contabilidades que atendem MEIs, grupos de empreendedores, associações comerciais, 
                e cursos de vendas/marketing.
              </p>
            </div>

            <div className="p-3 border rounded-lg">
              <h5 className="font-semibold mb-1 flex items-center gap-2">
                💰 Programa de Indicação
                <Badge variant="secondary">Incentivo</Badge>
              </h5>
              <p className="text-sm text-muted-foreground">
                Oferecer bônus extra para vendedores que indicarem outros vendedores ativos 
                (ex: R$ 200 por vendedor indicado que feche 3+ vendas).
              </p>
            </div>

            <div className="p-3 border rounded-lg">
              <h5 className="font-semibold mb-1 flex items-center gap-2">
                📢 Anúncios Segmentados
                <Badge variant="secondary">Pago</Badge>
              </h5>
              <p className="text-sm text-muted-foreground">
                Google Ads e Facebook Ads segmentados para "renda extra", "trabalho autônomo", 
                "representante comercial" com landing page otimizada.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
