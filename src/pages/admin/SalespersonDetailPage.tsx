import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CommissionConfigForm } from "@/components/admin/salespeople/CommissionConfigForm";
import { ApprovalDialog } from "@/components/admin/salespeople/ApprovalDialog";
import { RejectionDialog } from "@/components/admin/salespeople/RejectionDialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function SalespersonDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);

  const { data: salesperson, isLoading, refetch } = useQuery({
    queryKey: ["salesperson", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salespeople")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: commissionConfig } = useQuery({
    queryKey: ["commission-config", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salesperson_commission_configs")
        .select("*")
        .eq("salesperson_id", id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });

  const handleApprove = async () => {
    if (!salesperson) return;

    try {
      const { error } = await supabase.functions.invoke("approve-salesperson", {
        body: { salesperson_id: salesperson.id },
      });

      if (error) throw error;

      toast({
        title: "Vendedor aprovado",
        description: "O vendedor foi aprovado e pode fazer login no sistema",
      });

      setApprovalDialogOpen(false);
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
    if (!salesperson) return;

    try {
      const { error } = await supabase.functions.invoke("reject-salesperson", {
        body: { salesperson_id: salesperson.id, reason },
      });

      if (error) throw error;

      toast({
        title: "Vendedor rejeitado",
        description: "O vendedor foi rejeitado com sucesso",
      });

      setRejectionDialogOpen(false);
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

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (!salesperson) {
    return <div>Vendedor não encontrado</div>;
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending_approval: { label: "Pendente", variant: "secondary" },
      pending_contract: { label: "Aguardando Contrato", variant: "outline" },
      active: { label: "Ativo", variant: "default" },
      inactive: { label: "Inativo", variant: "destructive" },
      rejected: { label: "Rejeitado", variant: "destructive" },
    };
    
    const config = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/salespeople")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{salesperson.full_name}</h1>
          <p className="text-muted-foreground">Código: {salesperson.referral_code}</p>
        </div>
        {getStatusBadge(salesperson.status)}
      </div>

      {salesperson.status === "pending_approval" && (
        <div className="flex gap-4">
          <Button className="flex-1" onClick={() => setApprovalDialogOpen(true)}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Aprovar Vendedor
          </Button>
          <Button 
            variant="destructive" 
            className="flex-1"
            onClick={() => setRejectionDialogOpen(true)}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Rejeitar Vendedor
          </Button>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dados Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm text-muted-foreground">Nome Completo:</span>
              <p className="font-medium">{salesperson.full_name}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Email:</span>
              <p className="font-medium">{salesperson.email}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Telefone:</span>
              <p className="font-medium">{salesperson.phone}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Data de Cadastro:</span>
              <p className="font-medium">
                {format(new Date(salesperson.created_at), "dd/MM/yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados do CNPJ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm text-muted-foreground">CNPJ:</span>
              <p className="font-medium font-mono">{salesperson.cnpj}</p>
            </div>
            {salesperson.company_name && (
              <div>
                <span className="text-sm text-muted-foreground">Razão Social:</span>
                <p className="font-medium">{salesperson.company_name}</p>
              </div>
            )}
            {salesperson.company_trade_name && (
              <div>
                <span className="text-sm text-muted-foreground">Nome Fantasia:</span>
                <p className="font-medium">{salesperson.company_trade_name}</p>
              </div>
            )}
            {salesperson.cnpj_validation_data && typeof salesperson.cnpj_validation_data === 'object' && 'situacao_cadastral' in salesperson.cnpj_validation_data && (
              <div>
                <span className="text-sm text-muted-foreground">Situação Cadastral:</span>
                <p className={`font-medium ${
                  (salesperson.cnpj_validation_data as any).situacao_cadastral === "ATIVA"
                    ? "text-green-600"
                    : "text-destructive"
                }`}>
                  {(salesperson.cnpj_validation_data as any).situacao_cadastral}
                </p>
              </div>
            )}
            {salesperson.cnae_codes && salesperson.cnae_codes.length > 0 && (
              <div>
                <span className="text-sm text-muted-foreground">CNAEs:</span>
                <ul className="list-disc list-inside mt-1 text-sm">
                  {salesperson.cnae_codes.map((cnae: string, idx: number) => (
                    <li key={idx}>{cnae}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados PIX</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm text-muted-foreground">Tipo de Chave:</span>
              <p className="font-medium capitalize">{salesperson.pix_key_type}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Chave PIX:</span>
              <p className="font-medium font-mono">{salesperson.pix_key}</p>
            </div>
          </CardContent>
        </Card>

        <CommissionConfigForm
          salespersonId={salesperson.id}
          currentConfig={commissionConfig}
          onSuccess={() => refetch()}
        />
      </div>

      {salesperson.status === "rejected" && salesperson.rejection_reason && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Motivo da Rejeição</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{salesperson.rejection_reason}</p>
          </CardContent>
        </Card>
      )}

      <ApprovalDialog
        open={approvalDialogOpen}
        onOpenChange={setApprovalDialogOpen}
        onConfirm={handleApprove}
        salespersonName={salesperson.full_name}
        cnpjData={{
          razao_social: salesperson.company_name,
          nome_fantasia: salesperson.company_trade_name,
          situacao_cadastral: salesperson.cnpj_validation_data && typeof salesperson.cnpj_validation_data === 'object' && 'situacao_cadastral' in salesperson.cnpj_validation_data ? (salesperson.cnpj_validation_data as any).situacao_cadastral : undefined,
          atividades_principais: salesperson.cnae_codes?.map(code => ({ codigo: code, descricao: '' }))
        }}
      />

      <RejectionDialog
        open={rejectionDialogOpen}
        onOpenChange={setRejectionDialogOpen}
        onConfirm={handleReject}
        salespersonName={salesperson.full_name}
      />
    </div>
  );
}
