import { AdminLayout } from "@/components/admin/AdminLayout";
import { LiveKPIs } from "@/components/admin/bi/LiveKPIs";
import { CompetitorAnalysis } from "@/components/admin/bi/CompetitorAnalysis";
import { GrowthScenarios } from "@/components/admin/bi/GrowthScenarios";
import { RecruitmentStrategy } from "@/components/admin/bi/RecruitmentStrategy";
import { PriorityActions } from "@/components/admin/bi/PriorityActions";

export default function BusinessIntelligencePage() {
  return (
    <AdminLayout pageTitle="Inteligência de Negócios">
      <div className="space-y-6">
        <LiveKPIs />
        <CompetitorAnalysis />
        <GrowthScenarios />
        <RecruitmentStrategy />
        <PriorityActions />
      </div>
    </AdminLayout>
  );
}
