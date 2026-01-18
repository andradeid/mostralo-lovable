import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Loader2, CheckCircle, XCircle, Clock, FileText, Building2, Phone, Mail, 
  Calendar, DollarSign, Package, BarChart, Users, Truck, Settings, CreditCard, 
  ShoppingCart, Receipt, Megaphone, Image, Menu, Wallet, Printer, Utensils,
  ExternalLink, QrCode, Monitor, Palette, Tag, MessageSquare, Bell, MapPin,
  Sparkles, LucideIcon
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// Mapa de ícones para módulos
const moduleIconMap: Record<string, LucideIcon> = {
  'BarChart': BarChart,
  'MessageSquare': MessageSquare,
  'Users': Users,
  'Truck': Truck,
  'Settings': Settings,
  'CreditCard': CreditCard,
  'ShoppingCart': ShoppingCart,
  'Receipt': Receipt,
  'Megaphone': Megaphone,
  'Clock': Clock,
  'Calendar': Calendar,
  'FileText': FileText,
  'Package': Package,
  'Image': Image,
  'Menu': Menu,
  'Wallet': Wallet,
  'Printer': Printer,
  'Utensils': Utensils,
  'ExternalLink': ExternalLink,
  'QrCode': QrCode,
  'Monitor': Monitor,
  'Palette': Palette,
  'Tag': Tag,
  'Bell': Bell,
  'MapPin': MapPin,
  'Sparkles': Sparkles,
};

const getModuleIcon = (iconName: string | null): LucideIcon => {
  if (!iconName) return Package;
  return moduleIconMap[iconName] || Package;
};

interface Module {
  id: string;
  name: string;
  price: number;
  key?: string;
  included?: boolean;
  description?: string;
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
  payment_method?: string | null;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  'pix': 'PIX',
  'boleto': 'Boleto Bancário',
  'cartao_credito': 'Cartão de Crédito',
  'cartao_debito': 'Cartão de Débito',
  'transferencia': 'Transferência Bancária',
  'permuta': 'Permuta',
  'a_combinar': 'A Combinar',
};

export default function PublicProposalPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [lgpdAccepted, setLgpdAccepted] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [moduleDescriptions, setModuleDescriptions] = useState<Record<string, string>>({});
  const [moduleIcons, setModuleIcons] = useState<Record<string, string>>({});

  useEffect(() => {
    if (slug) {
      fetchProposal();
    }
  }, [slug]);

  // Buscar descrições e ícones dos módulos quando a proposta carregar
  useEffect(() => {
    const fetchModuleData = async () => {
      const modules = proposal?.selected_modules as Module[];
      if (!modules || modules.length === 0) return;

      const moduleIds = modules.map(m => m.id);
      
      const { data, error } = await supabase
        .from('modules')
        .select('id, description, icon')
        .in('id', moduleIds);

      if (data && !error) {
        const descriptions: Record<string, string> = {};
        const icons: Record<string, string> = {};
        data.forEach(m => {
          if (m.description) descriptions[m.id] = m.description;
          if (m.icon) icons[m.id] = m.icon;
        });
        setModuleDescriptions(descriptions);
        setModuleIcons(icons);
      }
    };

    if (proposal?.selected_modules) {
      fetchModuleData();
    }
  }, [proposal]);

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
    if (!termsAccepted || !lgpdAccepted) {
      toast.error("Você precisa aceitar os Termos de Uso e a Política de Privacidade (LGPD)");
      return;
    }

    setAccepting(true);
    try {
      const { data, error: acceptError } = await supabase.functions.invoke('proposal-actions', {
        body: { 
          action: 'accept', 
          slug,
          data: { 
            contract_accepted: true,
            terms_accepted: true,
            lgpd_accepted: true
          }
        }
      });

      if (acceptError) throw acceptError;
      if (data.error) throw new Error(data.error);

      toast.success("Proposta aceita! Vamos criar sua conta...");
      setShowAcceptModal(false);
      
      // Preparar dados para signup
      const selectedModulesJson = encodeURIComponent(
        JSON.stringify(selectedModules.map(m => ({
          id: m.id,
          name: m.name,
          price: m.price
        })))
      );
      
      // Redirecionar para página de cadastro com dados da proposta
      const signupParams = new URLSearchParams({
        from: 'proposal',
        proposal_id: proposal?.id || '',
        client_name: proposal?.client_name || '',
        client_phone: proposal?.client_phone || '',
        client_email: proposal?.client_email || '',
        client_company: proposal?.client_company || '',
        final_price: String(proposal?.final_monthly_price || 0),
        modules: selectedModulesJson
      });
      
      navigate(`/signup?${signupParams.toString()}`);
      
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
            <div className="space-y-4">
              {selectedModules.map((module) => {
                const IconComponent = getModuleIcon(moduleIcons[module.id] || null);
                return (
                  <div key={module.id} className="border-b last:border-0 pb-4 last:pb-0">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                        <IconComponent className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-medium">{module.name}</span>
                          <Badge variant="outline" className="shrink-0">
                            {formatCurrency(module.price)}/mês
                          </Badge>
                        </div>
                        {moduleDescriptions[module.id] && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {moduleDescriptions[module.id]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
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
            {/* Número de lojas se aplicável */}
            {(proposal as any).store_count && (proposal as any).store_count > 1 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantidade de lojas</span>
                <span>{(proposal as any).store_count} lojas</span>
              </div>
            )}
            
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

            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Valor Mensal</span>
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(proposal.final_monthly_price)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Cobrança {proposal.billing_cycle === 'monthly' ? 'mensal' : 
                         proposal.billing_cycle === 'quarterly' ? 'trimestral' : 
                         proposal.billing_cycle === 'biannual' ? 'semestral' : 'anual'}
              </p>
            </div>

            {/* Detalhamento do período (para ciclos não mensais) */}
            {proposal.billing_cycle !== 'monthly' && (() => {
              const billingCycleMonths: Record<string, number> = {
                'monthly': 1,
                'quarterly': 3,
                'biannual': 6,
                'annual': 12,
              };
              const months = billingCycleMonths[proposal.billing_cycle] || 1;
              const totalMonthlyPayments = proposal.final_monthly_price * months;
              const totalWithSetup = totalMonthlyPayments + (proposal.setup_fee || 0);
              
              return (
                <div className="pt-3 border-t border-dashed space-y-2">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Mensalidades ({months}x):</span>
                    <span>{months}x {formatCurrency(proposal.final_monthly_price)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>= Subtotal mensalidades:</span>
                    <span>{formatCurrency(totalMonthlyPayments)}</span>
                  </div>
                  {proposal.setup_fee && proposal.setup_fee > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>+ Setup (único):</span>
                      <span>{formatCurrency(proposal.setup_fee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total do Contrato:</span>
                    <span className="text-primary">{formatCurrency(totalWithSetup)}</span>
                  </div>
                </div>
              );
            })()}

            {/* Setup para ciclos mensais */}
            {proposal.billing_cycle === 'monthly' && proposal.setup_fee && proposal.setup_fee > 0 && (
              <div className="pt-3 border-t border-dashed">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa de setup (única)</span>
                  <span>{formatCurrency(proposal.setup_fee)}</span>
                </div>
              </div>
            )}

            {/* Forma de Pagamento */}
            {proposal.payment_method && (
              <div className="pt-3 border-t border-dashed">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Forma de Pagamento</span>
                  <span className="font-medium">
                    {PAYMENT_METHOD_LABELS[proposal.payment_method] || proposal.payment_method}
                  </span>
                </div>
              </div>
            )}
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
          <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
            <CardContent className="p-6">
              <h3 className="text-center text-lg font-semibold mb-4">
                O que deseja fazer?
              </h3>
              <div className="flex flex-col gap-4">
                {/* Botão Aceitar - Grande e em destaque */}
                <Button 
                  size="lg" 
                  className="w-full h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                  onClick={() => setShowAcceptModal(true)}
                >
                  <CheckCircle className="h-6 w-6 mr-3" />
                  Aceitar Proposta
                </Button>
                
                {/* Botão Recusar - Secundário mas visível */}
                <Button 
                  size="lg" 
                  variant="outline"
                  className="w-full h-12 text-base border-2 hover:bg-destructive/10 hover:border-destructive hover:text-destructive transition-all"
                  onClick={() => setShowRejectModal(true)}
                >
                  <XCircle className="h-5 w-5 mr-2" />
                  Recusar Proposta
                </Button>
              </div>
              
              {/* Texto de ajuda */}
              <p className="text-center text-sm text-muted-foreground mt-4">
                Ao aceitar, você será direcionado para criar sua conta
              </p>
            </CardContent>
          </Card>
        )}

        {/* Accept Modal */}
        <Dialog open={showAcceptModal} onOpenChange={setShowAcceptModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Aceite da Proposta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Checkbox 1: Termos de Uso */}
              <div className="flex items-start gap-3">
                <Checkbox 
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                />
                <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                  Li e aceito os{' '}
                  <a 
                    href="/termos" 
                    target="_blank" 
                    className="text-primary underline hover:text-primary/80"
                  >
                    Termos de Uso
                  </a>{' '}
                  da plataforma Mostralo.
                </label>
              </div>

              {/* Checkbox 2: LGPD */}
              <div className="flex items-start gap-3">
                <Checkbox 
                  id="lgpd"
                  checked={lgpdAccepted}
                  onCheckedChange={(checked) => setLgpdAccepted(checked as boolean)}
                />
                <label htmlFor="lgpd" className="text-sm leading-relaxed cursor-pointer">
                  Concordo com a{' '}
                  <a 
                    href="/privacidade" 
                    target="_blank" 
                    className="text-primary underline hover:text-primary/80"
                  >
                    Política de Privacidade (LGPD)
                  </a>{' '}
                  e autorizo o tratamento dos meus dados pessoais.
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAcceptModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAccept} disabled={accepting || !termsAccepted || !lgpdAccepted}>
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
