import { AdminLayout } from "@/components/admin/AdminLayout";
import { LiveKPIs } from "@/components/admin/bi/LiveKPIs";
import { CompetitorAnalysis } from "@/components/admin/bi/CompetitorAnalysis";
import { GrowthScenarios } from "@/components/admin/bi/GrowthScenarios";
import { RecruitmentStrategy } from "@/components/admin/bi/RecruitmentStrategy";
import { PriorityActions } from "@/components/admin/bi/PriorityActions";
import { TrendingUp } from "lucide-react";

export default function BusinessIntelligencePage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inteligência de Negócios</h1>
            <p className="text-muted-foreground">
              Dashboard estratégico com KPIs, análise competitiva e projeções de crescimento
            </p>
          </div>
        </div>

        {/* KPIs em Tempo Real */}
        <LiveKPIs />

        {/* Análise Competitiva */}
        <CompetitorAnalysis />

        {/* Cenários de Crescimento */}
        <GrowthScenarios />

        {/* Estratégia de Recrutamento */}
        <RecruitmentStrategy />

        {/* Ações Prioritárias */}
        <PriorityActions />
      </div>
    </AdminLayout>
  );
}
