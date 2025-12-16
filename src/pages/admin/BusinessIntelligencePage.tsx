import { LiveKPIs } from "@/components/admin/bi/LiveKPIs";
import { CompetitorAnalysis } from "@/components/admin/bi/CompetitorAnalysis";
import { GrowthScenarios } from "@/components/admin/bi/GrowthScenarios";
import { RecruitmentStrategy } from "@/components/admin/bi/RecruitmentStrategy";
import { PriorityActions } from "@/components/admin/bi/PriorityActions";
import { BarChart3 } from "lucide-react";

export default function BusinessIntelligencePage() {
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 md:gap-3">
        <BarChart3 className="h-5 w-5 md:h-6 md:w-6 text-primary" />
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">Inteligência de Negócios</h1>
          <p className="text-xs md:text-sm text-muted-foreground">{currentDate}</p>
        </div>
      </div>

      <LiveKPIs />
      <CompetitorAnalysis />
      <GrowthScenarios />
      <RecruitmentStrategy />
      <PriorityActions />
    </div>
  );
}
