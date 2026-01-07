import { useState } from "react";
import { useStoreAccess } from "@/hooks/useStoreAccess";
import { useTreatmentPlans, TreatmentPlan } from "@/hooks/dental/useTreatmentPlans";
import { useDentalProcedures } from "@/hooks/dental/useDentalProcedures";
import { usePatients } from "@/hooks/dental/usePatients";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, FileText, User, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import TreatmentPlanDialog from "@/components/admin/dental/TreatmentPlanDialog";

export default function TreatmentPlansPage() {
  const { storeId } = useStoreAccess();
  const { plans, isLoading } = useTreatmentPlans(storeId);
  const { patients } = usePatients(storeId);
  const { procedures } = useDentalProcedures(storeId);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<TreatmentPlan | null>(null);

  const filteredPlans = plans.filter(plan => {
    const patient = patients.find(p => p.id === plan.patient_id);
    const patientName = patient?.name?.toLowerCase() || "";
    return patientName.includes(searchTerm.toLowerCase()) ||
           plan.name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: "bg-muted text-muted-foreground",
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-blue-100 text-blue-800",
      in_progress: "bg-purple-100 text-purple-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    const labels: Record<string, string> = {
      draft: "Rascunho",
      pending: "Pendente",
      approved: "Aprovado",
      in_progress: "Em Andamento",
      completed: "Concluído",
      cancelled: "Cancelado",
    };
    return <Badge className={styles[status] || styles.draft}>{labels[status] || status}</Badge>;
  };

  const handleEdit = (plan: any) => {
    setSelectedPlan(plan);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setSelectedPlan(null);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Planos de Tratamento</h1>
          <p className="text-muted-foreground">Gerencie os planos de tratamento dos pacientes</p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por paciente ou título..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredPlans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum plano de tratamento encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredPlans.map((plan) => {
            const patient = patients.find(p => p.id === plan.patient_id);
            return (
              <Card 
                key={plan.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleEdit(plan)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{plan.name || "Plano sem título"}</h3>
                        {getStatusBadge(plan.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {patient?.name || "Paciente não encontrado"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(plan.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="font-semibold flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {plan.final_value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <TreatmentPlanDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        plan={selectedPlan}
        patients={patients}
        procedures={procedures}
        storeId={storeId || ""}
      />
    </div>
  );
}
