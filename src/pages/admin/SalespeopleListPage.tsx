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
import { Search, User, Building2, Ban } from "lucide-react";

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
    queryKey: ["salespeople-with-metrics"],
    queryFn: async () => {
      // Buscar vendedores
      const { data: spData, error: spError } = await supabase
        .from("salespeople")
        .select("*")
        .order("created_at", { ascending: false });

      if (spError) throw spError;
      if (!spData) return [];

      // Buscar contagem de leads por vendedor
      const { data: leadsData } = await supabase
        .from("leads")
        .select("salesperson_id");

      // Buscar contagem de clientes convertidos por vendedor
      const { data: clientsData } = await supabase
        .from("payment_approvals")
        .select("referred_by_salesperson_id")
        .eq("status", "approved");

      // Agregar métricas
      const leadsCount: Record<string, number> = {};
      const clientsCount: Record<string, number> = {};

      leadsData?.forEach((lead) => {
        if (lead.salesperson_id) {
          leadsCount[lead.salesperson_id] = (leadsCount[lead.salesperson_id] || 0) + 1;
        }
      });

      clientsData?.forEach((client) => {
        if (client.referred_by_salesperson_id) {
          clientsCount[client.referred_by_salesperson_id] = (clientsCount[client.referred_by_salesperson_id] || 0) + 1;
        }
      });

      // Adicionar métricas aos vendedores
      return spData.map((sp) => ({
        ...sp,
        leads_count: leadsCount[sp.id] || 0,
        clients_count: clientsCount[sp.id] || 0,
      }));
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
      (selectedTab === "active" && s.status === "active" && !s.is_blocked) ||
      (selectedTab === "inactive" && s.status === "inactive") ||
      (selectedTab === "blocked" && s.is_blocked);

    const matchesType =
      typeFilter === "all" ||
      (typeFilter === "affiliate" && s.salesperson_type === "affiliate") ||
      (typeFilter === "partner" && (s.salesperson_type === "partner" || !s.salesperson_type));

    return matchesSearch && matchesTab && matchesType;
  });

  const pendingCount = salespeople?.filter((s) => s.status === "pending_approval").length || 0;
  const activeCount = salespeople?.filter((s) => s.status === "active").length || 0;
  const inactiveCount = salespeople?.filter((s) => s.status === "inactive").length || 0;
  const blockedCount = salespeople?.filter((s) => s.is_blocked).length || 0;
  const affiliateCount = salespeople?.filter((s) => s.salesperson_type === "affiliate").length || 0;
  const partnerCount = salespeople?.filter((s) => s.salesperson_type === "partner" || !s.salesperson_type).length || 0;

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header compacto */}
      <div>
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">Vendedores / Afiliados</h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          Gerencie os vendedores e afiliados do sistema
        </p>
      </div>

      <SalespeopleAdminGuide />

      {/* Stats compactos */}
      <div className="grid grid-cols-4 gap-2 md:gap-4">
        <div className="p-2 md:p-4 rounded-lg border bg-card">
          <div className="text-[10px] md:text-sm text-muted-foreground truncate">Total</div>
          <div className="text-lg md:text-2xl font-bold">{salespeople?.length || 0}</div>
        </div>
        <div className="p-2 md:p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-1 text-[10px] md:text-sm text-muted-foreground truncate">
            <User className="h-3 w-3 hidden md:block" />
            <span className="md:hidden">Afil.</span>
            <span className="hidden md:inline">Afiliados</span>
          </div>
          <div className="text-lg md:text-2xl font-bold">{affiliateCount}</div>
        </div>
        <div className="p-2 md:p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-1 text-[10px] md:text-sm text-muted-foreground truncate">
            <Building2 className="h-3 w-3 hidden md:block" />
            <span className="md:hidden">PJ</span>
            <span className="hidden md:inline">Parceiros PJ</span>
          </div>
          <div className="text-lg md:text-2xl font-bold">{partnerCount}</div>
        </div>
        <div className="p-2 md:p-4 rounded-lg border bg-card">
          <div className="text-[10px] md:text-sm text-muted-foreground truncate">
            <span className="md:hidden">Pend.</span>
            <span className="hidden md:inline">Pendentes</span>
          </div>
          <div className="text-lg md:text-2xl font-bold text-amber-500">{pendingCount}</div>
        </div>
      </div>

      {/* Busca e filtro responsivos */}
      <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 md:h-10 text-sm"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px] h-9 md:h-10 text-sm">
            <SelectValue placeholder="Tipo" />
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

      {/* Tabs com scroll horizontal */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <div className="w-full overflow-x-auto pb-1">
          <TabsList className="w-max min-w-full md:w-auto h-auto p-1 gap-1">
            <TabsTrigger value="all" className="text-xs md:text-sm px-2 md:px-3 py-1.5 shrink-0">
              <span className="md:hidden">Todos</span>
              <span className="hidden md:inline">Todos ({salespeople?.length || 0})</span>
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs md:text-sm px-2 md:px-3 py-1.5 shrink-0">
              <span className="md:hidden">Pend.</span>
              <span className="hidden md:inline">Pendentes</span>
              {pendingCount > 0 && (
                <Badge className="ml-1 text-[10px] h-4 px-1">{pendingCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active" className="text-xs md:text-sm px-2 md:px-3 py-1.5 shrink-0">
              <span className="md:hidden">Ativos</span>
              <span className="hidden md:inline">Ativos ({activeCount})</span>
            </TabsTrigger>
            <TabsTrigger value="inactive" className="text-xs md:text-sm px-2 md:px-3 py-1.5 shrink-0">
              <span className="md:hidden">Inat.</span>
              <span className="hidden md:inline">Inativos ({inactiveCount})</span>
            </TabsTrigger>
            <TabsTrigger value="blocked" className="text-xs md:text-sm px-2 md:px-3 py-1.5 shrink-0">
              <Ban className="h-3 w-3 mr-1" />
              <span className="hidden md:inline">Bloq.</span>
              {blockedCount > 0 && (
                <Badge variant="destructive" className="ml-1 text-[10px] h-4 px-1">{blockedCount}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={selectedTab} className="space-y-4 mt-4 md:mt-6">
          {filteredSalespeople && filteredSalespeople.length > 0 ? (
            <div className="grid gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-3">
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
            <div className="text-center py-8 md:py-12 text-muted-foreground text-sm">
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
