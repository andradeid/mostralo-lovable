import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle, XCircle, Clock, FileText, Building2, Phone, Mail, Calendar, DollarSign, Package } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface Module {
  id: string;
  name: string;
  price: number;
  key?: string;
  included?: boolean;
}

interface Proposal {
  id: string;
  proposal_number: string;
  client_name: string;
  client_phone: string;
  client_email: string | null;
  client_company: string | null;
  status: string;
  selected_modules: Module[];
  modules_total: number;
  discount_percentage: number | null;
  discount_amount: number | null;
  setup_fee: number | null;
  final_monthly_price: number;
  billing_cycle: string;
  valid_until: string | null;
  created_at: string;
  accepted_at: string | null;
  rejected_at: string | null;
  internal_notes: string | null;
  niches?: { name: string } | null;
}

export default function PublicProposalPage() {
  const { slug } = useParams<{ slug: string }>();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [contractAccepted, setContractAccepted] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchProposal();
    }
  }, [slug]);

  const fetchProposal = async () => {
    try {
      const { data, error: fetchError } = await supabase.functions.invoke('proposal-actions', {
        body: { action: 'view', slug }
      });

      if (fetchError) throw fetchError;
      if (data.error) throw new Error(data.error);

      setProposal(data.proposal);
    } catch (err: any) {
      console.error('Error fetching proposal:', err);
      setError(err.message || 'Proposta não encontrada');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!contractAccepted) {
      toast.error("Você precisa aceitar os termos do contrato");
      return;
    }

    setAccepting(true);
    try {
      const { data, error: acceptError } = await supabase.functions.invoke('proposal-actions', {
        body: { 
          action: 'accept', 
          slug,
          data: { contract_accepted: true }
        }
      });

      if (acceptError) throw acceptError;
      if (data.error) throw new Error(data.error);

      toast.success("Proposta aceita com sucesso!");
      setShowAcceptModal(false);
      fetchProposal();
    } catch (err: any) {
      toast.error(err.message || "Erro ao aceitar proposta");
    } finally {
      setAccepting(false);
    }
  };

  const handleReject = async () => {
    setRejecting(true);
    try {
      const { data, error: rejectError } = await supabase.functions.invoke('proposal-actions', {
        body: { 
          action: 'reject', 
          slug,
          data: { reason: rejectReason }
        }
      });

      if (rejectError) throw rejectError;
      if (data.error) throw new Error(data.error);

      toast.success("Proposta recusada");
      setShowRejectModal(false);
      fetchProposal();
    } catch (err: any) {
      toast.error(err.message || "Erro ao recusar proposta");
    } finally {
      setRejecting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const isExpired = proposal?.valid_until && new Date(proposal.valid_until) < new Date();
  const canRespond = proposal?.status === 'sent' || proposal?.status === 'viewed';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Proposta não encontrada</h1>
            <p className="text-muted-foreground">{error || "O link pode estar incorreto ou expirado."}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Todos os módulos no array já são módulos selecionados (não precisam de filtro)
  const selectedModules = (proposal.selected_modules as Module[]) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <FileText className="h-5 w-5" />
            <span className="font-medium">Proposta Comercial</span>
          </div>
          <h1 className="text-3xl font-bold">{proposal.proposal_number}</h1>
          <p className="text-muted-foreground mt-2">
            Criada em {format(new Date(proposal.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>

        {/* Status Banner */}
        {proposal.status === 'accepted' && (
          <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
            <CardContent className="py-4 flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-700 dark:text-green-400">Proposta Aceita</p>
                {proposal.accepted_at && (
                  <p className="text-sm text-green-600">
                    Em {format(new Date(proposal.accepted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {proposal.status === 'rejected' && (
          <Card className="border-red-500 bg-red-50 dark:bg-red-950/20">
            <CardContent className="py-4 flex items-center gap-3">
              <XCircle className="h-6 w-6 text-red-600" />
              <div>
                <p className="font-semibold text-red-700 dark:text-red-400">Proposta Recusada</p>
                {proposal.rejected_at && (
                  <p className="text-sm text-red-600">
                    Em {format(new Date(proposal.rejected_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {isExpired && canRespond && (
          <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
            <CardContent className="py-4 flex items-center gap-3">
              <Clock className="h-6 w-6 text-yellow-600" />
              <div>
                <p className="font-semibold text-yellow-700 dark:text-yellow-400">Proposta Expirada</p>
                <p className="text-sm text-yellow-600">
                  Esta proposta expirou em {format(new Date(proposal.valid_until!), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Client Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Dados do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">{proposal.client_name}</span>
            </div>
            {proposal.client_company && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4" />
                {proposal.client_company}
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              {proposal.client_phone}
            </div>
            {proposal.client_email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                {proposal.client_email}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Módulos Inclusos ({selectedModules.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedModules.map((module) => (
                <div key={module.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <span>{module.name}</span>
                  <Badge variant="outline">{formatCurrency(module.price)}/mês</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Resumo Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal dos módulos</span>
              <span>{formatCurrency(proposal.modules_total)}</span>
            </div>
            
            {(proposal.discount_percentage || proposal.discount_amount) && (
              <div className="flex justify-between text-green-600">
                <span>Desconto aplicado</span>
                <span>
                  -{proposal.discount_percentage 
                    ? `${proposal.discount_percentage}%` 
                    : formatCurrency(proposal.discount_amount || 0)}
                </span>
              </div>
            )}
            
            {proposal.setup_fee && proposal.setup_fee > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxa de setup (única)</span>
                <span>{formatCurrency(proposal.setup_fee)}</span>
              </div>
            )}

            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Valor Mensal</span>
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(proposal.final_monthly_price)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Cobrança {proposal.billing_cycle === 'monthly' ? 'mensal' : 
                         proposal.billing_cycle === 'quarterly' ? 'trimestral' : 'anual'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Validity */}
        {proposal.valid_until && (
          <Card>
            <CardContent className="py-4 flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Validade da Proposta</p>
                <p className="text-sm text-muted-foreground">
                  Até {format(new Date(proposal.valid_until), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {canRespond && !isExpired && (
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              size="lg" 
              className="flex-1"
              onClick={() => setShowAcceptModal(true)}
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Aceitar Proposta
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="flex-1"
              onClick={() => setShowRejectModal(true)}
            >
              <XCircle className="h-5 w-5 mr-2" />
              Recusar
            </Button>
          </div>
        )}

        {/* Accept Modal */}
        <Dialog open={showAcceptModal} onOpenChange={setShowAcceptModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Aceite da Proposta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-start gap-3">
                <Checkbox 
                  id="contract"
                  checked={contractAccepted}
                  onCheckedChange={(checked) => setContractAccepted(checked as boolean)}
                />
                <label htmlFor="contract" className="text-sm leading-relaxed cursor-pointer">
                  Declaro que li e aceito os termos e condições da proposta comercial. 
                  Entendo que ao aceitar esta proposta, estou concordando com os valores 
                  e condições apresentados.
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAcceptModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAccept} disabled={accepting || !contractAccepted}>
                {accepting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirmar Aceite
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Modal */}
        <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Recusar Proposta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-muted-foreground">
                Poderia nos informar o motivo da recusa? Isso nos ajuda a melhorar nossas propostas.
              </p>
              <Textarea
                placeholder="Motivo da recusa (opcional)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectModal(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleReject} disabled={rejecting}>
                {rejecting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirmar Recusa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pt-8 pb-4">
          <p>Powered by Mostralo</p>
        </div>
      </div>
    </div>
  );
}
