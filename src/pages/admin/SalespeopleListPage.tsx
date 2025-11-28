import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SalespersonCard } from "@/components/admin/salespeople/SalespersonCard";
import { ApprovalDialog } from "@/components/admin/salespeople/ApprovalDialog";
import { RejectionDialog } from "@/components/admin/salespeople/RejectionDialog";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

export default function SalespeopleListPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [selectedSalesperson, setSelectedSalesperson] = useState<any>(null);

  const { data: salespeople, isLoading, refetch } = useQuery({
    queryKey: ["salespeople"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salespeople")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleApprove = async () => {
    if (!selectedSalesperson) return;

    try {
      const { error } = await supabase.functions.invoke("approve-salesperson", {
        body: { salesperson_id: selectedSalesperson.id },
      });

      if (error) throw error;

      toast({
        title: "Vendedor aprovado",
        description: "O vendedor foi aprovado e pode fazer login no sistema",
      });

      setApprovalDialogOpen(false);
      setSelectedSalesperson(null);
      refetch();
    } catch (error) {
      console.error("Erro ao aprovar:", error);
      toast({
        title: "Erro ao aprovar",
        description: "Não foi possível aprovar o vendedor",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (reason: string) => {
    if (!selectedSalesperson) return;

    try {
      const { error } = await supabase.functions.invoke("reject-salesperson", {
        body: { salesperson_id: selectedSalesperson.id, reason },
      });

      if (error) throw error;

      toast({
        title: "Vendedor rejeitado",
        description: "O vendedor foi rejeitado com sucesso",
      });

      setRejectionDialogOpen(false);
      setSelectedSalesperson(null);
      refetch();
    } catch (error) {
      console.error("Erro ao rejeitar:", error);
      toast({
        title: "Erro ao rejeitar",
        description: "Não foi possível rejeitar o vendedor",
        variant: "destructive",
      });
    }
  };

  const filteredSalespeople = salespeople?.filter((s) => {
    const matchesSearch =
      s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.cnpj.includes(searchTerm) ||
      s.referral_code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTab =
      selectedTab === "all" ||
      (selectedTab === "pending" && s.status === "pending_approval") ||
      (selectedTab === "active" && s.status === "active") ||
      (selectedTab === "inactive" && s.status === "inactive");

    return matchesSearch && matchesTab;
  });

  const pendingCount = salespeople?.filter((s) => s.status === "pending_approval").length || 0;
  const activeCount = salespeople?.filter((s) => s.status === "active").length || 0;
  const inactiveCount = salespeople?.filter((s) => s.status === "inactive").length || 0;

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Vendedores / Afiliados</h1>
        <p className="text-muted-foreground">
          Gerencie os vendedores e afiliados do sistema
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, CNPJ ou código..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all">
            Todos ({salespeople?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pendentes {pendingCount > 0 && <Badge className="ml-2">{pendingCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="active">Ativos ({activeCount})</TabsTrigger>
          <TabsTrigger value="inactive">Inativos ({inactiveCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4 mt-6">
          {filteredSalespeople && filteredSalespeople.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredSalespeople.map((salesperson) => (
                <SalespersonCard
                  key={salesperson.id}
                  salesperson={salesperson}
                  onViewDetails={() => navigate(`/dashboard/salespeople/${salesperson.id}`)}
                  onApprove={
                    salesperson.status === "pending_approval"
                      ? () => {
                          setSelectedSalesperson(salesperson);
                          setApprovalDialogOpen(true);
                        }
                      : undefined
                  }
                  onReject={
                    salesperson.status === "pending_approval"
                      ? () => {
                          setSelectedSalesperson(salesperson);
                          setRejectionDialogOpen(true);
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum vendedor encontrado
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedSalesperson && (
        <>
          <ApprovalDialog
            open={approvalDialogOpen}
            onOpenChange={setApprovalDialogOpen}
            onConfirm={handleApprove}
            salespersonName={selectedSalesperson.full_name}
            cnpjData={selectedSalesperson.cnpj_data}
          />

          <RejectionDialog
            open={rejectionDialogOpen}
            onOpenChange={setRejectionDialogOpen}
            onConfirm={handleReject}
            salespersonName={selectedSalesperson.full_name}
          />
        </>
      )}
    </div>
  );
}
