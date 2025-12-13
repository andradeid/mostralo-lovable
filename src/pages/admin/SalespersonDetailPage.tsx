import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, CheckCircle2, XCircle, User, Building2, Trophy, Star, Sparkles, Medal, ClipboardList, Target, Users, Pencil } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CommissionConfigForm } from "@/components/admin/salespeople/CommissionConfigForm";
import { ApprovalDialog } from "@/components/admin/salespeople/ApprovalDialog";
import { RejectionDialog } from "@/components/admin/salespeople/RejectionDialog";
import { SalespersonEditDialog } from "@/components/admin/salespeople/SalespersonEditDialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { getLevelConfig, type QualificationLevel } from "@/lib/qualificationLevels";

// Definição das perguntas para exibir as respostas
const QUESTIONS = [
  {
    id: "experience",
    question: "Você já trabalhou com vendas antes?",
    options: [
      { value: "yes_years", label: "Sim, tenho mais de 2 anos de experiência", points: 25 },
      { value: "yes_some", label: "Sim, tenho alguma experiência (menos de 2 anos)", points: 15 },
      { value: "no", label: "Não, mas estou disposto(a) a aprender", points: 10 },
    ],
  },
  {
    id: "availability",
    question: "Quantas horas por semana você pode dedicar?",
    options: [
      { value: "full", label: "30+ horas (dedicação integral)", points: 20 },
      { value: "partial", label: "15-30 horas (tempo parcial)", points: 15 },
      { value: "casual", label: "5-15 horas (casual)", points: 8 },
    ],
  },
  {
    id: "network",
    question: "Você conhece empresários ou donos de restaurantes/comércios?",
    options: [
      { value: "many", label: "Sim, conheço vários na minha região", points: 20 },
      { value: "some", label: "Conheço alguns que posso abordar", points: 12 },
      { value: "few", label: "Não conheço, mas sei como prospectar", points: 8 },
    ],
  },
  {
    id: "digital",
    question: "Como você avalia suas habilidades digitais?",
    options: [
      { value: "advanced", label: "Avançado - uso várias ferramentas digitais", points: 15 },
      { value: "intermediate", label: "Intermediário - me viro bem com tecnologia", points: 10 },
      { value: "basic", label: "Básico - preciso de ajuda às vezes", points: 5 },
    ],
  },
  {
    id: "communication",
    question: "Como você prefere se comunicar com clientes?",
    options: [
      { value: "all", label: "Presencial, telefone e WhatsApp", points: 12 },
      { value: "remote", label: "Principalmente WhatsApp e telefone", points: 8 },
      { value: "digital", label: "Prefiro comunicação por texto", points: 5 },
    ],
  },
  {
    id: "goal",
    question: "Qual é sua principal motivação para ser vendedor?",
    options: [
      { value: "main_income", label: "Quero fazer disso minha renda principal", points: 8 },
      { value: "extra_income", label: "Busco uma renda extra consistente", points: 6 },
      { value: "trying", label: "Quero experimentar e ver se gosto", points: 4 },
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
      const [leadsRes, clientsRes] = await Promise.all([
        supabase.from("leads").select("id").eq("salesperson_id", id),
        supabase.from("payment_approvals").select("id").eq("referred_by_salesperson_id", id).eq("status", "approved"),
      ]);

      return {
        leads_count: leadsRes.data?.length || 0,
        clients_count: clientsRes.data?.length || 0,
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
    <div className="space-y-6">
      {/* Header com foto grande */}
      <div className="flex items-start gap-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/salespeople")} className="mt-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        {/* Foto de perfil grande */}
        <Avatar className="h-28 w-28 border-4 border-muted">
          <AvatarImage src={salesperson.profile_photo_url || undefined} alt={salesperson.full_name} />
          <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h1 className="text-3xl font-bold">{salesperson.full_name}</h1>
          <p className="text-muted-foreground">Código: {salesperson.referral_code}</p>
          
          {/* Badges de qualificação e métricas */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {score > 0 && (
              <Badge variant="outline" className={`gap-1 ${levelConfig.color}`}>
                {getQualificationIcon()}
                {levelConfig.label} ({score}pts)
              </Badge>
            )}
            <Badge variant="outline" className="gap-1">
              <Target className="h-3 w-3 text-blue-500" />
              {metrics?.leads_count || 0} leads
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Users className="h-3 w-3 text-green-500" />
              {metrics?.clients_count || 0} clientes
            </Badge>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {isAffiliate ? (
            <Badge variant="outline" className="gap-1">
              <User className="h-3 w-3" />
              Afiliado (CPF)
            </Badge>
          ) : (
            <Badge className="bg-gradient-to-r from-primary to-orange-500 gap-1">
              <Building2 className="h-3 w-3" />
              Parceiro PJ
            </Badge>
          )}
          {getStatusBadge(salesperson.status)}
        </div>
      </div>

      {/* Botão de edição sempre visível */}
      <div className="flex gap-4">
        <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
          <Pencil className="h-4 w-4 mr-2" />
          Editar Dados
        </Button>
        
        {salesperson.status === "pending_approval" && (
          <>
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
          </>
        )}
      </div>

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
            {isAffiliate && salesperson.cpf && (
              <div>
                <span className="text-sm text-muted-foreground">CPF:</span>
                <p className="font-medium font-mono">{salesperson.cpf}</p>
              </div>
            )}
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

        {isAffiliate ? (
          <Card className="border-amber-500/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Limite Mensal (Afiliado)
              </CardTitle>
              <CardDescription>
                Afiliados têm limite de R$ 1.900/mês em ganhos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Ganhos este mês:</span>
                  <span className="font-medium">R$ {monthlyUsed.toFixed(2)} / R$ {monthlyLimit.toFixed(2)}</span>
                </div>
                <Progress 
                  value={monthlyPercentage} 
                  className={`h-3 ${monthlyPercentage >= 80 ? '[&>div]:bg-amber-500' : ''}`}
                />
              </div>
              <div className="text-sm space-y-1">
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
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Dados do CNPJ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">CNPJ:</span>
                <p className="font-medium font-mono">{salesperson.cnpj || "—"}</p>
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
        )}

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

        {/* Questionário de Qualificação */}
        {qualificationAnswers && Object.keys(qualificationAnswers).length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Questionário de Qualificação
              </CardTitle>
              <CardDescription>
                Respostas do questionário de perfil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {QUESTIONS.map((q, index) => {
                const answer = qualificationAnswers[q.id];
                const selectedOption = q.options.find(o => o.value === answer);
                
                if (!answer) return null;
                
                return (
                  <div key={q.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{q.question}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        <span className="text-sm text-muted-foreground">{selectedOption?.label}</span>
                        <Badge variant="outline" className="ml-auto text-xs">
                          +{selectedOption?.points}pts
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Score total */}
              <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${levelConfig.color}`}>
                <div className="flex items-center gap-2">
                  {getQualificationIcon()}
                  <span className="font-semibold">{levelConfig.label}</span>
                </div>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {score}/100 pts
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
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
    </div>
  );
}
