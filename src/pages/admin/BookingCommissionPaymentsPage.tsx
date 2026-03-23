import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, parseISO, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  DollarSign, 
  Users, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  Download,
  Calendar,
  Filter,
  ChevronRight,
  ArrowLeft,
  CreditCard,
  Receipt,
  Banknote,
  Wallet,
  RotateCcw,
  Eye,
  X,
  FileImage,
  AlertCircle,
  HandCoins,
  History
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useStoreAccess } from "@/hooks/useStoreAccess";
import { 
  useCommissionPayments, 
  exportCommissionsToCSV,
  CommissionWithDetails,
  ProfessionalSummary 
} from "@/hooks/useCommissionPayments";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PAYMENT_METHODS = [
  { value: "pix", label: "PIX", icon: Wallet },
  { value: "transfer", label: "Transferência", icon: Banknote },
  { value: "cash", label: "Dinheiro", icon: DollarSign },
  { value: "other", label: "Outro", icon: CreditCard },
];

export default function BookingCommissionPaymentsPage() {
  const { storeId } = useStoreAccess();
  const [selectedProfessional, setSelectedProfessional] = useState<ProfessionalSummary | null>(null);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  });
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "paid">("all");
  const [selectedCommissions, setSelectedCommissions] = useState<string[]>([]);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    method: "pix",
    reference: "",
    notes: "",
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState<string | null>(null);
  const [viewingReceiptCommission, setViewingReceiptCommission] = useState<CommissionWithDetails | null>(null);

  const {
    commissions,
    professionalSummaries,
    totals,
    isLoading,
    refetch,
    payCommissions,
    revertPayment,
    isPaying,
    isReverting,
  } = useCommissionPayments(storeId, {
    startDate: selectedProfessional ? dateRange.start : undefined,
    endDate: selectedProfessional ? dateRange.end : undefined,
    professionalId: selectedProfessional?.id,
    status: statusFilter,
  });

  const professionalCommissions = useMemo(() => {
    if (!selectedProfessional) return [];
    return commissions.filter(c => c.professional_id === selectedProfessional.id);
  }, [commissions, selectedProfessional]);

  // Histórico recente de pagamentos (últimos pagos)
  const recentPayments = useMemo(() => {
    return commissions
      .filter(c => c.status === "paid" && c.paid_at)
      .sort((a, b) => new Date(b.paid_at!).getTime() - new Date(a.paid_at!).getTime())
      .slice(0, 8);
  }, [commissions]);

  const profsWithBalance = useMemo(() => {
    return professionalSummaries.filter(p => p.pendingAmount > 0);
  }, [professionalSummaries]);

  const handleSelectAll = () => {
    const pendingIds = professionalCommissions
      .filter(c => c.status === "pending")
      .map(c => c.id);
    setSelectedCommissions(prev => prev.length === pendingIds.length ? [] : pendingIds);
  };

  const handleSelectCommission = (id: string) => {
    setSelectedCommissions(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error('Tipo de arquivo inválido. Use JPG, PNG ou PDF.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo: 5MB');
      return;
    }
    setReceiptFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setReceiptPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview(null);
    }
  };

  const handlePayment = async () => {
    if (selectedCommissions.length === 0) return;
    setIsUploading(true);
    let receiptUrl: string | undefined;
    try {
      if (receiptFile && storeId && selectedProfessional) {
        const fileExt = receiptFile.name.split('.').pop();
        const filePath = `${storeId}/${selectedProfessional.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('payment-receipts')
          .upload(filePath, receiptFile);
        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error('Erro ao fazer upload do comprovante');
        } else {
          const { data: urlData } = supabase.storage
            .from('payment-receipts')
            .getPublicUrl(filePath);
          receiptUrl = urlData.publicUrl;
        }
      }
      await payCommissions({
        commissionIds: selectedCommissions,
        paymentMethod: paymentForm.method,
        reference: paymentForm.reference || undefined,
        notes: paymentForm.notes || undefined,
        receiptUrl,
      });
      setSelectedCommissions([]);
      setIsPaymentDialogOpen(false);
      setPaymentForm({ method: "pix", reference: "", notes: "" });
      setReceiptFile(null);
      setReceiptPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const selectedTotal = useMemo(() => {
    return professionalCommissions
      .filter(c => selectedCommissions.includes(c.id))
      .reduce((acc, c) => acc + Number(c.commission_amount), 0);
  }, [professionalCommissions, selectedCommissions]);

  const handleExport = () => {
    const dataToExport = selectedProfessional ? professionalCommissions : commissions;
    const filename = selectedProfessional 
      ? `repasses-${selectedProfessional.name.toLowerCase().replace(/\s+/g, "-")}`
      : "controle-repasses";
    exportCommissionsToCSV(dataToExport, filename);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // ========== VISUALIZAÇÃO DETALHADA DO PROFISSIONAL ==========
  if (selectedProfessional) {
    const pendingCommissions = professionalCommissions.filter(c => c.status === "pending");
    const paidCommissions = professionalCommissions.filter(c => c.status === "paid");

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              setSelectedProfessional(null);
              setSelectedCommissions([]);
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={selectedProfessional.photo_url || undefined} />
              <AvatarFallback>{selectedProfessional.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">{selectedProfessional.name}</h1>
              <p className="text-sm text-muted-foreground">{selectedProfessional.specialty || "Profissional"}</p>
            </div>
          </div>
        </div>

        {/* Resumo do profissional */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-yellow-500/10">
                  <HandCoins className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Saldo a repassar</p>
                  <p className="text-xl font-bold text-yellow-500">
                    R$ {selectedProfessional.pendingAmount.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedProfessional.pendingCount} pendência{selectedProfessional.pendingCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-green-500/10">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pago no período</p>
                  <p className="text-xl font-bold text-green-500">
                    R$ {selectedProfessional.paidThisMonth.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total pago (histórico)</p>
                  <p className="text-xl font-bold">
                    R$ {selectedProfessional.paidTotal.toFixed(2)}
                  </p>
                  {selectedProfessional.lastPaymentDate && (
                    <p className="text-xs text-muted-foreground">
                      Último: {format(parseISO(selectedProfessional.lastPaymentDate), "dd/MM/yyyy")}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA principal de pagamento */}
        {selectedProfessional.pendingAmount > 0 && selectedCommissions.length === 0 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-sm">
                    {selectedProfessional.name} tem R$ {selectedProfessional.pendingAmount.toFixed(2)} para receber
                  </p>
                  <p className="text-xs text-muted-foreground">Selecione as comissões pendentes abaixo para registrar o pagamento</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Calendar className="mr-2 h-4 w-4" />
                {format(dateRange.start, "dd/MM")} - {format(dateRange.end, "dd/MM/yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="range"
                selected={{ from: dateRange.start, to: dateRange.end }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ start: range.from, end: range.to });
                  }
                }}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>

          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger className="w-[140px] h-9">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="paid">Pagos</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex-1" />

          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>

          {selectedCommissions.length > 0 && (
            <Button onClick={() => setIsPaymentDialogOpen(true)} className="gap-2">
              <HandCoins className="h-4 w-4" />
              Registrar Pagamento ({selectedCommissions.length}) — R$ {selectedTotal.toFixed(2)}
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pendentes ({pendingCommissions.length})
            </TabsTrigger>
            <TabsTrigger value="paid" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Pagos ({paidCommissions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-3">
            {pendingCommissions.length > 0 && (
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <Checkbox
                  checked={selectedCommissions.length === pendingCommissions.length && pendingCommissions.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-muted-foreground">Selecionar todas</span>
                {selectedCommissions.length > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    Total: R$ {selectedTotal.toFixed(2)}
                  </Badge>
                )}
              </div>
            )}

            <div className="space-y-2">
              {pendingCommissions.map((commission) => (
                <CommissionCard
                  key={commission.id}
                  commission={commission}
                  selected={selectedCommissions.includes(commission.id)}
                  onSelect={() => handleSelectCommission(commission.id)}
                  showCheckbox
                  onViewReceipt={(url) => {
                    setViewingReceiptUrl(url);
                    setViewingReceiptCommission(commission);
                  }}
                />
              ))}
              {pendingCommissions.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">Tudo em dia!</p>
                  <p className="text-sm">Nenhuma comissão pendente para este profissional</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="paid" className="space-y-2">
            {paidCommissions.map((commission) => (
              <CommissionCard
                key={commission.id}
                commission={commission}
                onRevert={() => revertPayment(commission.id)}
                isReverting={isReverting}
                onViewReceipt={(url) => {
                  setViewingReceiptUrl(url);
                  setViewingReceiptCommission(commission);
                }}
              />
            ))}
            {paidCommissions.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Receipt className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">Sem registros</p>
                <p className="text-sm">Nenhum pagamento registrado neste período</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialog de Pagamento */}
        <PaymentDialog 
          open={isPaymentDialogOpen}
          onOpenChange={setIsPaymentDialogOpen}
          selectedCount={selectedCommissions.length}
          selectedTotal={selectedTotal}
          paymentForm={paymentForm}
          setPaymentForm={setPaymentForm}
          receiptFile={receiptFile}
          receiptPreview={receiptPreview}
          onFileChange={handleFileChange}
          onClearFile={() => { setReceiptFile(null); setReceiptPreview(null); }}
          onConfirm={handlePayment}
          isProcessing={isPaying || isUploading}
        />

        <ReceiptDialog 
          url={viewingReceiptUrl}
          commission={viewingReceiptCommission}
          onClose={() => { setViewingReceiptUrl(null); setViewingReceiptCommission(null); }}
        />
      </div>
    );
  }

  // ========== VISUALIZAÇÃO PRINCIPAL ==========
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <HandCoins className="h-6 w-6 text-primary" />
            Controle de Repasses
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os pagamentos da sua equipe de profissionais
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className={totals.totalPending > 0 ? "border-yellow-500/30 bg-yellow-500/5" : ""}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-yellow-500/10">
                <HandCoins className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Total a repassar</p>
                <p className="text-lg md:text-xl font-bold text-yellow-500">
                  R$ {totals.totalPending.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Pago no mês</p>
                <p className="text-lg md:text-xl font-bold text-green-500">
                  R$ {totals.totalPaidThisMonth.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Pendências abertas</p>
                <p className="text-lg md:text-xl font-bold">
                  {totals.pendingCount}
                </p>
                <p className="text-xs text-muted-foreground">comissões</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Com saldo</p>
                <p className="text-lg md:text-xl font-bold">
                  {profsWithBalance.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  de {professionalSummaries.length} profissional{professionalSummaries.length !== 1 ? 'is' : ''}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerta de pendências */}
      {profsWithBalance.length > 0 && (
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">
                    {profsWithBalance.length} profissional{profsWithBalance.length !== 1 ? 'is' : ''} com repasse pendente — R$ {totals.totalPending.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {profsWithBalance.map(p => `${p.name.split(' ')[0]} (R$ ${p.pendingAmount.toFixed(2)})`).join(' · ')}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="flex-shrink-0 gap-1.5 border-yellow-500/30 text-yellow-600 hover:bg-yellow-500/10">
                <HandCoins className="h-3.5 w-3.5" />
                Pagar pendências
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Profissionais */}
      <div>
        <h2 className="text-base font-semibold flex items-center gap-2 mb-3">
          <Users className="h-4 w-4" />
          Profissionais
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Selecione um profissional para ver pendências e registrar pagamentos
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {professionalSummaries.map((professional) => {
            const hasPending = professional.pendingAmount > 0;
            return (
              <Card
                key={professional.id}
                className={`cursor-pointer transition-all hover:border-primary/50 hover:shadow-sm ${hasPending ? 'border-yellow-500/20' : ''}`}
                onClick={() => setSelectedProfessional(professional)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={professional.photo_url || undefined} />
                      <AvatarFallback className="text-sm">
                        {professional.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-sm truncate">{professional.name}</h3>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {professional.specialty || "Profissional"}
                      </p>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Saldo</p>
                      <p className={`text-sm font-bold ${hasPending ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                        R$ {professional.pendingAmount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Pago (mês)</p>
                      <p className="text-sm font-bold text-green-500">
                        R$ {professional.paidThisMonth.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total</p>
                      <p className="text-sm font-bold">
                        R$ {professional.paidTotal.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {professional.lastPaymentDate && (
                    <p className="text-[10px] text-muted-foreground mt-2 text-center">
                      Último repasse: {format(parseISO(professional.lastPaymentDate), "dd/MM/yyyy")}
                    </p>
                  )}

                  {hasPending && (
                    <div className="mt-3">
                      <Button size="sm" className="w-full h-8 text-xs gap-1.5">
                        <HandCoins className="h-3.5 w-3.5" />
                        Registrar pagamento
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {professionalSummaries.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">Nenhum profissional cadastrado</p>
              <p className="text-sm">Cadastre profissionais para gerenciar repasses</p>
            </div>
          )}
        </div>
      </div>

      {/* Histórico de repasses recentes */}
      {recentPayments.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico de Repasses
            </CardTitle>
            <CardDescription className="text-xs">Últimos pagamentos registrados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentPayments.map((payment) => {
                const prof = professionalSummaries.find(p => p.id === payment.professional_id);
                return (
                  <div key={payment.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={prof?.photo_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {(prof?.name || "??").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{prof?.name || "Profissional"}</p>
                      <p className="text-xs text-muted-foreground">
                        {payment.booking?.service?.name || "Serviço"} · {payment.booking?.customer_name || "Cliente"}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-green-500">
                        R$ {Number(payment.commission_amount).toFixed(2)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {payment.paid_at 
                          ? formatDistanceToNow(parseISO(payment.paid_at), { addSuffix: true, locale: ptBR })
                          : ""
                        }
                      </p>
                    </div>
                    {payment.payment_method && (
                      <Badge variant="outline" className="text-[10px] flex-shrink-0">
                        {PAYMENT_METHODS.find(m => m.value === payment.payment_method)?.label || payment.payment_method}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Receipt Dialog */}
      <ReceiptDialog 
        url={viewingReceiptUrl}
        commission={viewingReceiptCommission}
        onClose={() => { setViewingReceiptUrl(null); setViewingReceiptCommission(null); }}
      />
    </div>
  );
}

// ========== SUB-COMPONENTES ==========

function CommissionCard({
  commission,
  selected,
  onSelect,
  showCheckbox,
  onRevert,
  isReverting,
  onViewReceipt,
}: {
  commission: CommissionWithDetails;
  selected?: boolean;
  onSelect?: () => void;
  showCheckbox?: boolean;
  onRevert?: () => void;
  isReverting?: boolean;
  onViewReceipt?: (url: string) => void;
}) {
  return (
    <div className={`p-3 rounded-lg border bg-card transition-colors ${selected ? "border-primary bg-primary/5" : "hover:bg-muted/30"}`}>
      <div className="flex items-center gap-3">
        {showCheckbox && onSelect && (
          <Checkbox
            checked={selected}
            onCheckedChange={onSelect}
          />
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {commission.booking?.service?.name || "Serviço"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {commission.booking?.customer_name || "Cliente"} · {commission.booking?.booking_date 
                  ? format(parseISO(commission.booking.booking_date), "dd/MM/yyyy")
                  : "-"
                }
              </p>
            </div>
            
            <div className="text-right flex-shrink-0">
              <p className="font-bold text-primary">
                R$ {Number(commission.commission_amount).toFixed(2)}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {commission.commission_type === "percentage" 
                  ? `${commission.commission_value}%` 
                  : "Fixo"
                } de R$ {Number(commission.service_price).toFixed(2)}
              </p>
            </div>
          </div>
          
          {commission.status === "paid" && commission.paid_at && (
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant="secondary" className="bg-green-500/10 text-green-500 text-[10px]">
                Pago em {format(parseISO(commission.paid_at), "dd/MM/yyyy")}
              </Badge>
              {commission.payment_receipt_url && (
                <Badge variant="outline" className="text-[10px] gap-1">
                  <Receipt className="w-3 h-3" />
                  Comprovante
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {commission.payment_receipt_url && onViewReceipt && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onViewReceipt(commission.payment_receipt_url!);
              }}
              title="Ver comprovante"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {onRevert && commission.status === "paid" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onRevert();
              }}
              disabled={isReverting}
              title="Reverter para pendente"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function PaymentDialog({
  open,
  onOpenChange,
  selectedCount,
  selectedTotal,
  paymentForm,
  setPaymentForm,
  receiptFile,
  receiptPreview,
  onFileChange,
  onClearFile,
  onConfirm,
  isProcessing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  selectedTotal: number;
  paymentForm: { method: string; reference: string; notes: string };
  setPaymentForm: React.Dispatch<React.SetStateAction<{ method: string; reference: string; notes: string }>>;
  receiptFile: File | null;
  receiptPreview: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearFile: () => void;
  onConfirm: () => void;
  isProcessing: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Repasse</DialogTitle>
          <DialogDescription>
            Confirme o pagamento de {selectedCount} comissão(ões) — R$ {selectedTotal.toFixed(2)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Método de Pagamento</Label>
            <Select 
              value={paymentForm.method} 
              onValueChange={(v) => setPaymentForm(f => ({ ...f, method: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map(m => (
                  <SelectItem key={m.value} value={m.value}>
                    <div className="flex items-center gap-2">
                      <m.icon className="h-4 w-4" />
                      {m.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Referência / Comprovante (opcional)</Label>
            <Input
              placeholder="Ex: Chave PIX, número da transação..."
              value={paymentForm.reference}
              onChange={(e) => setPaymentForm(f => ({ ...f, reference: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Observações (opcional)</Label>
            <Textarea
              placeholder="Adicione notas sobre este repasse..."
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm(f => ({ ...f, notes: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Comprovante (opcional)</Label>
            {!receiptFile ? (
              <div>
                <Input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  onChange={onFileChange}
                />
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG ou PDF (máx. 5MB)</p>
              </div>
            ) : (
              <div className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileImage className="w-4 h-4 text-primary" />
                    <span className="text-sm truncate">{receiptFile.name}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={onClearFile}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                {receiptPreview && (
                  <img src={receiptPreview} alt="Preview" className="w-full h-24 object-contain rounded" />
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={isProcessing}>
            {isProcessing ? "Processando..." : "Confirmar Repasse"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReceiptDialog({
  url,
  commission,
  onClose,
}: {
  url: string | null;
  commission: CommissionWithDetails | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!url} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Comprovante de Repasse
          </DialogTitle>
        </DialogHeader>
        
        {commission && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Valor:</span>
              <span className="font-medium">
                R$ {Number(commission.commission_amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Data:</span>
              <span className="font-medium">
                {commission.paid_at 
                  ? format(parseISO(commission.paid_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                  : "-"
                }
              </span>
            </div>
            {commission.payment_method && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Método:</span>
                <span className="font-medium">
                  {PAYMENT_METHODS.find(m => m.value === commission.payment_method)?.label || commission.payment_method}
                </span>
              </div>
            )}

            <div className="border rounded-lg overflow-hidden bg-muted/30">
              {url && (url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img src={url} alt="Comprovante" className="w-full h-auto max-h-96 object-contain" />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <svg className="w-16 h-16 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-muted-foreground">Arquivo PDF</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>Fechar</Button>
              <Button onClick={() => url && window.open(url, "_blank")} className="gap-2">
                <Download className="w-4 h-4" />
                Abrir
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
