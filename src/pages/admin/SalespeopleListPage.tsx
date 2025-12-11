import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SalespersonCard } from "@/components/admin/salespeople/SalespersonCard";
import { ApprovalDialog } from "@/components/admin/salespeople/ApprovalDialog";
import { RejectionDialog } from "@/components/admin/salespeople/RejectionDialog";
import { SalespeopleAdminGuide } from "@/components/admin/salespeople/SalespeopleAdminGuide";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Search, User, Building2 } from "lucide-react";

export default function SalespeopleListPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
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
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      s.full_name.toLowerCase().includes(searchLower) ||
      (s.cnpj && s.cnpj.includes(searchTerm)) ||
      (s.cpf && s.cpf.includes(searchTerm)) ||
      s.referral_code.toLowerCase().includes(searchLower);

    const matchesTab =
      selectedTab === "all" ||
      (selectedTab === "pending" && s.status === "pending_approval") ||
      (selectedTab === "active" && s.status === "active") ||
      (selectedTab === "inactive" && s.status === "inactive");

    const matchesType =
      typeFilter === "all" ||
      (typeFilter === "affiliate" && s.salesperson_type === "affiliate") ||
      (typeFilter === "partner" && (s.salesperson_type === "partner" || !s.salesperson_type));

    return matchesSearch && matchesTab && matchesType;
  });

  const pendingCount = salespeople?.filter((s) => s.status === "pending_approval").length || 0;
  const activeCount = salespeople?.filter((s) => s.status === "active").length || 0;
  const inactiveCount = salespeople?.filter((s) => s.status === "inactive").length || 0;
  const affiliateCount = salespeople?.filter((s) => s.salesperson_type === "affiliate").length || 0;
  const partnerCount = salespeople?.filter((s) => s.salesperson_type === "partner" || !s.salesperson_type).length || 0;

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

      <SalespeopleAdminGuide />

      {/* Stats por tipo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border bg-card">
          <div className="text-sm text-muted-foreground">Total</div>
          <div className="text-2xl font-bold">{salespeople?.length || 0}</div>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <User className="h-3 w-3" />
            Afiliados (CPF)
          </div>
          <div className="text-2xl font-bold">{affiliateCount}</div>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Building2 className="h-3 w-3" />
            Parceiros PJ
          </div>
          <div className="text-2xl font-bold">{partnerCount}</div>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <div className="text-sm text-muted-foreground">Pendentes</div>
          <div className="text-2xl font-bold text-amber-500">{pendingCount}</div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CNPJ, CPF ou código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Tipo de vendedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="affiliate">
              <span className="flex items-center gap-2">
                <User className="h-3 w-3" />
                Afiliados (CPF)
              </span>
            </SelectItem>
            <SelectItem value="partner">
              <span className="flex items-center gap-2">
                <Building2 className="h-3 w-3" />
                Parceiros PJ
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
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
            cnpjData={selectedSalesperson.cnpj_validation_data}
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
