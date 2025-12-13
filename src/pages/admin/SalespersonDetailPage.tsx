import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CheckCircle2, XCircle, User, Building2, Trophy, Star, Sparkles, Medal, ClipboardList, Target, Users, Pencil, DollarSign, Mail, Phone, Key, CreditCard, Ban } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CommissionConfigForm } from "@/components/admin/salespeople/CommissionConfigForm";
import { ApprovalDialog } from "@/components/admin/salespeople/ApprovalDialog";
import { RejectionDialog } from "@/components/admin/salespeople/RejectionDialog";
import { SalespersonEditDialog } from "@/components/admin/salespeople/SalespersonEditDialog";
import { SalespersonBlockDialog } from "@/components/admin/salespeople/SalespersonBlockDialog";
import { SalespersonPerformanceChart } from "@/components/admin/salespeople/SalespersonPerformanceChart";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { getLevelConfig, type QualificationLevel } from "@/lib/qualificationLevels";

// Definição das perguntas para exibir as respostas
const QUESTIONS = [
  {
    id: "experience",
    question: "Experiência em vendas?",
    options: [
      { value: "yes_years", label: "2+ anos", points: 25 },
      { value: "yes_some", label: "< 2 anos", points: 15 },
      { value: "no", label: "Iniciante", points: 10 },
    ],
  },
  {
    id: "availability",
    question: "Disponibilidade semanal?",
    options: [
      { value: "full", label: "30+ horas", points: 20 },
      { value: "partial", label: "15-30 horas", points: 15 },
      { value: "casual", label: "5-15 horas", points: 8 },
    ],
  },
  {
    id: "network",
    question: "Rede de contatos?",
    options: [
      { value: "many", label: "Vários contatos", points: 20 },
      { value: "some", label: "Alguns contatos", points: 12 },
      { value: "few", label: "Poucos contatos", points: 8 },
    ],
  },
  {
    id: "digital",
    question: "Habilidades digitais?",
    options: [
      { value: "advanced", label: "Avançado", points: 15 },
      { value: "intermediate", label: "Intermediário", points: 10 },
      { value: "basic", label: "Básico", points: 5 },
    ],
  },
  {
    id: "communication",
    question: "Comunicação?",
    options: [
      { value: "all", label: "Presencial+Tel+WA", points: 12 },
      { value: "remote", label: "WhatsApp+Tel", points: 8 },
      { value: "digital", label: "Só texto", points: 5 },
    ],
  },
  {
    id: "goal",
    question: "Motivação?",
    options: [
      { value: "main_income", label: "Renda principal", points: 8 },
      { value: "extra_income", label: "Renda extra", points: 6 },
      { value: "trying", label: "Experimentar", points: 4 },
    ],
  },
];

export default function SalespersonDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);

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

  // Buscar métricas de performance
  const { data: metrics } = useQuery({
    queryKey: ["salesperson-metrics", id],
    queryFn: async () => {
      const [leadsRes, clientsRes, salesRes] = await Promise.all([
        supabase.from("leads").select("id").eq("salesperson_id", id),
        supabase.from("payment_approvals").select("id").eq("referred_by_salesperson_id", id).eq("status", "approved"),
        supabase.from("salesperson_sales").select("commission_amount").eq("salesperson_id", id),
      ]);

      const totalCommissions = salesRes.data?.reduce((acc, s) => acc + (Number(s.commission_amount) || 0), 0) || 0;

      return {
        leads_count: leadsRes.data?.length || 0,
        clients_count: clientsRes.data?.length || 0,
        total_commissions: totalCommissions,
      };
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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!salesperson) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Vendedor não encontrado</p>
      </div>
    );
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

  const isAffiliate = salesperson.salesperson_type === 'affiliate';
  const monthlyUsed = salesperson.current_month_earnings || 0;
  const monthlyLimit = salesperson.monthly_earnings_limit || 1900;
  const monthlyPercentage = Math.min((monthlyUsed / monthlyLimit) * 100, 100);

  const qualificationLevel = (salesperson.qualification_level || 'evaluation') as QualificationLevel;
  const levelConfig = getLevelConfig(qualificationLevel);
  const score = salesperson.qualification_score || 0;
  const qualificationAnswers = salesperson.qualification_answers as Record<string, string> | null;

  const getQualificationIcon = () => {
    switch (qualificationLevel) {
      case 'top': return <Trophy className="h-4 w-4" />;
      case 'promising': return <Star className="h-4 w-4" />;
      case 'beginner': return <Sparkles className="h-4 w-4" />;
      default: return <Medal className="h-4 w-4" />;
    }
  };

  const initials = salesperson.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-4">
      {/* Header Compacto */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/salespeople")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <Avatar className="h-16 w-16 border-2 border-muted">
          <AvatarImage src={salesperson.profile_photo_url || undefined} alt={salesperson.full_name} />
          <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold truncate">{salesperson.full_name}</h1>
            {isAffiliate ? (
              <Badge variant="outline" className="gap-1 shrink-0">
                <User className="h-3 w-3" />
                Afiliado
              </Badge>
            ) : (
              <Badge className="bg-gradient-to-r from-primary to-orange-500 gap-1 shrink-0">
                <Building2 className="h-3 w-3" />
                Parceiro PJ
              </Badge>
            )}
            {getStatusBadge(salesperson.status)}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
            <span>📋 {salesperson.referral_code}</span>
            {score > 0 && (
              <Badge variant="outline" className={`gap-1 text-xs ${levelConfig.color}`}>
                {getQualificationIcon()}
                {levelConfig.label} ({score}pts)
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
            <Pencil className="h-4 w-4 mr-1" />
            Editar
          </Button>
          {salesperson.status === "pending_approval" && (
            <>
              <Button size="sm" onClick={() => setApprovalDialogOpen(true)}>
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Aprovar
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setRejectionDialogOpen(true)}>
                <XCircle className="h-4 w-4 mr-1" />
                Rejeitar
              </Button>
            </>
          )}
          {salesperson.status === "active" && (
            <Button 
              size="sm" 
              variant={salesperson.is_blocked ? "outline" : "destructive"}
              onClick={() => setBlockDialogOpen(true)}
            >
              <Ban className="h-4 w-4 mr-1" />
              {salesperson.is_blocked ? "Desbloquear" : "Bloquear"}
            </Button>
          )}
        </div>
      </div>

      {/* Bloqueio */}
      {salesperson.is_blocked && (
        <Card className="border-amber-500 bg-amber-500/5">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-amber-600">
              <Ban className="h-4 w-4" />
              <strong>Vendedor Bloqueado</strong>
            </div>
            {salesperson.blocked_reason && (
              <p className="text-sm mt-1 text-muted-foreground">
                Motivo: {salesperson.blocked_reason}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rejeição */}
      {salesperson.status === "rejected" && salesperson.rejection_reason && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="py-3">
            <p className="text-sm text-destructive">
              <strong>Rejeitado:</strong> {salesperson.rejection_reason}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de Performance */}
      <SalespersonPerformanceChart salespersonId={salesperson.id} />

      {/* Layout de 3 Colunas */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Coluna 1: Dados Pessoais + PIX + CNPJ */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Dados Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium">{salesperson.full_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate">{salesperson.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{salesperson.phone}</span>
              </div>
              {isAffiliate && salesperson.cpf && (
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-mono text-xs">{salesperson.cpf}</span>
                </div>
              )}
              <Separator />
              <div className="text-xs text-muted-foreground">
                Cadastro: {format(new Date(salesperson.created_at), "dd/MM/yyyy", { locale: ptBR })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Dados PIX</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="capitalize">{salesperson.pix_key_type}</span>
              </div>
              <div className="p-2 bg-muted rounded-md font-mono text-xs break-all">
                {salesperson.pix_key}
              </div>
            </CardContent>
          </Card>

          {!isAffiliate && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Dados CNPJ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground">CNPJ:</span>
                  <p className="font-mono text-xs">{salesperson.cnpj || "—"}</p>
                </div>
                {salesperson.company_name && (
                  <div>
                    <span className="text-xs text-muted-foreground">Razão Social:</span>
                    <p className="text-xs">{salesperson.company_name}</p>
                  </div>
                )}
                {salesperson.cnpj_validation_data && typeof salesperson.cnpj_validation_data === 'object' && 'situacao_cadastral' in salesperson.cnpj_validation_data && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Situação:</span>
                    <Badge variant={(salesperson.cnpj_validation_data as any).situacao_cadastral === "ATIVA" ? "default" : "destructive"} className="text-xs">
                      {(salesperson.cnpj_validation_data as any).situacao_cadastral}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Coluna 2: Métricas + Limite + Comissão */}
        <div className="space-y-4">
          {/* Métricas Rápidas */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Métricas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-blue-500/10 rounded-lg">
                  <Target className="h-5 w-5 mx-auto text-blue-500" />
                  <p className="text-xl font-bold mt-1">{metrics?.leads_count || 0}</p>
                  <p className="text-xs text-muted-foreground">Leads</p>
                </div>
                <div className="text-center p-2 bg-green-500/10 rounded-lg">
                  <Users className="h-5 w-5 mx-auto text-green-500" />
                  <p className="text-xl font-bold mt-1">{metrics?.clients_count || 0}</p>
                  <p className="text-xs text-muted-foreground">Clientes</p>
                </div>
                <div className="text-center p-2 bg-orange-500/10 rounded-lg">
                  <DollarSign className="h-5 w-5 mx-auto text-orange-500" />
                  <p className="text-lg font-bold mt-1">R$ {(metrics?.total_commissions || 0).toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">Comissões</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Limite Mensal (apenas afiliados) */}
          {isAffiliate && (
            <Card className="border-amber-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-amber-500" />
                  Limite Mensal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Ganhos este mês:</span>
                  <span className="font-medium">R$ {monthlyUsed.toFixed(2)}</span>
                </div>
                <Progress 
                  value={monthlyPercentage} 
                  className={`h-2 ${monthlyPercentage >= 80 ? '[&>div]:bg-amber-500' : ''}`}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Limite: R$ {monthlyLimit.toFixed(2)}</span>
                  <span>{monthlyPercentage.toFixed(0)}%</span>
                </div>
                <Separator />
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Comissão:</span>
                    <span>5-7%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bônus Trimestral:</span>
                    <span className="text-destructive">Não elegível</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Configuração de Comissão */}
          <CommissionConfigForm
            salespersonId={salesperson.id}
            currentConfig={commissionConfig}
            onSuccess={() => refetch()}
          />
        </div>

        {/* Coluna 3: Questionário de Qualificação */}
        <div>
          <Card className="h-fit">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Qualificação
                </CardTitle>
                <Badge variant="outline" className={`${levelConfig.color}`}>
                  {score}/100
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {qualificationAnswers && Object.keys(qualificationAnswers).length > 0 ? (
                <>
                  {QUESTIONS.map((q) => {
                    const answer = qualificationAnswers[q.id];
                    const selectedOption = q.options.find(o => o.value === answer);
                    
                    if (!answer) return null;
                    
                    return (
                      <div key={q.id} className="flex items-center justify-between p-2 rounded bg-muted/50 text-xs">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{q.question}</p>
                          <p className="text-muted-foreground truncate">{selectedOption?.label}</p>
                        </div>
                        <Badge variant="outline" className="ml-2 shrink-0 text-xs">
                          +{selectedOption?.points}
                        </Badge>
                      </div>
                    );
                  })}

                  {/* Score total */}
                  <div className={`flex items-center justify-between p-3 rounded-lg border ${levelConfig.color} mt-3`}>
                    <div className="flex items-center gap-2">
                      {getQualificationIcon()}
                      <span className="font-semibold text-sm">{levelConfig.label}</span>
                    </div>
                    <Badge variant="outline" className="text-base px-2">
                      {score}/100
                    </Badge>
                  </div>
                </>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Questionário não respondido</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <ApprovalDialog
        open={approvalDialogOpen}
        onOpenChange={setApprovalDialogOpen}
        onConfirm={handleApprove}
        salespersonName={salesperson.full_name}
        cnpjData={isAffiliate ? undefined : {
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

      {salesperson && (
        <SalespersonEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          salesperson={salesperson}
          onSuccess={() => refetch()}
        />
      )}

      <SalespersonBlockDialog
        open={blockDialogOpen}
        onOpenChange={setBlockDialogOpen}
        salesperson={salesperson}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
