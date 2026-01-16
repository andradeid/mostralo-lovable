import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
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
  Upload,
  X,
  FileImage
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

const PAYMENT_METHODS = [
  { value: "pix", label: "PIX", icon: Wallet },
  { value: "transfer", label: "Transferência", icon: Banknote },
  { value: "cash", label: "Dinheiro", icon: DollarSign },
  { value: "other", label: "Outro", icon: CreditCard },
];

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(210, 70%, 50%)",
  "hsl(150, 60%, 45%)",
  "hsl(30, 80%, 55%)",
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

  // Filtrar comissões do profissional selecionado
  const professionalCommissions = useMemo(() => {
    if (!selectedProfessional) return [];
    return commissions.filter(c => c.professional_id === selectedProfessional.id);
  }, [commissions, selectedProfessional]);

  // Dados para gráfico de barras por profissional
  const chartData = useMemo(() => {
    return professionalSummaries
      .filter(p => p.pendingAmount > 0 || p.paidThisMonth > 0)
      .map(p => ({
        name: p.name.split(" ")[0],
        pendente: p.pendingAmount,
        pago: p.paidThisMonth,
      }))
      .slice(0, 8);
  }, [professionalSummaries]);

  // Dados para gráfico de pizza
  const pieData = useMemo(() => {
    return professionalSummaries
      .filter(p => p.pendingAmount > 0)
      .map(p => ({
        name: p.name,
        value: p.pendingAmount,
      }))
      .slice(0, 6);
  }, [professionalSummaries]);

  const handleSelectAll = () => {
    const pendingIds = professionalCommissions
      .filter(c => c.status === "pending")
      .map(c => c.id);
    
    if (selectedCommissions.length === pendingIds.length) {
      setSelectedCommissions([]);
    } else {
      setSelectedCommissions(pendingIds);
    }
  };

  const handleSelectCommission = (id: string) => {
    setSelectedCommissions(prev => 
      prev.includes(id) 
        ? prev.filter(c => c !== id)
        : [...prev, id]
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
      ? `comissoes-${selectedProfessional.name.toLowerCase().replace(/\s+/g, "-")}`
      : "relatorio-comissoes";
    exportCommissionsToCSV(dataToExport, filename);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Visualização detalhada do profissional
  if (selectedProfessional) {
    const pendingCommissions = professionalCommissions.filter(c => c.status === "pending");
    const paidCommissions = professionalCommissions.filter(c => c.status === "paid");

    return (
      <div className="space-y-6">
        {/* Header com navegação */}
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
              <h1 className="text-2xl font-bold">{selectedProfessional.name}</h1>
              <p className="text-sm text-muted-foreground">{selectedProfessional.specialty || "Profissional"}</p>
            </div>
          </div>
        </div>

        {/* Cards de resumo do profissional */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-yellow-500/10">
                  <Clock className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pendente</p>
                  <p className="text-2xl font-bold">
                    R$ {selectedProfessional.pendingAmount.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedProfessional.pendingCount} comissões
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-green-500/10">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pago Este Mês</p>
                  <p className="text-2xl font-bold">
                    R$ {selectedProfessional.paidThisMonth.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Pago (Histórico)</p>
                  <p className="text-2xl font-bold">
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

        {/* Filtros e Ações */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
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
              <SelectTrigger className="w-[140px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="paid">Pagos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1" />

          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>

          {selectedCommissions.length > 0 && (
            <Button onClick={() => setIsPaymentDialogOpen(true)}>
              <CreditCard className="mr-2 h-4 w-4" />
              Pagar Selecionadas ({selectedCommissions.length})
            </Button>
          )}
        </div>

        {/* Tabs de comissões */}
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pendentes ({pendingCommissions.length})
            </TabsTrigger>
            <TabsTrigger value="paid" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Pagas ({paidCommissions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingCommissions.length > 0 && (
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <Checkbox
                  checked={selectedCommissions.length === pendingCommissions.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-muted-foreground">
                  Selecionar todas
                </span>
                {selectedCommissions.length > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    Total: R$ {selectedTotal.toFixed(2)}
                  </Badge>
                )}
              </div>
            )}

            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
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
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma comissão pendente</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="paid" className="space-y-4">
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
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
                    <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum pagamento registrado neste período</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Dialog de Pagamento */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Pagamento</DialogTitle>
              <DialogDescription>
                Confirme o pagamento de {selectedCommissions.length} comissão(ões) 
                totalizando R$ {selectedTotal.toFixed(2)}
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
                  placeholder="Adicione notas sobre este pagamento..."
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Upload de Comprovante */}
              <div className="space-y-2">
                <Label>Comprovante (opcional)</Label>
                {!receiptFile ? (
                  <div>
                    <Input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,application/pdf"
                      onChange={handleFileChange}
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
                      <Button variant="ghost" size="sm" onClick={() => { setReceiptFile(null); setReceiptPreview(null); }}>
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
              <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handlePayment} disabled={isPaying || isUploading}>
                {isPaying || isUploading ? "Processando..." : "Confirmar Pagamento"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Visualização de Comprovante - dentro da view do profissional */}
        <Dialog open={!!viewingReceiptUrl} onOpenChange={(open) => {
          if (!open) {
            setViewingReceiptUrl(null);
            setViewingReceiptCommission(null);
          }
        }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Comprovante de Pagamento
              </DialogTitle>
            </DialogHeader>
            
            {viewingReceiptCommission && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-medium">
                    R$ {Number(viewingReceiptCommission.commission_amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Data do Pagamento:</span>
                  <span className="font-medium">
                    {viewingReceiptCommission.paid_at 
                      ? format(parseISO(viewingReceiptCommission.paid_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                      : "-"
                    }
                  </span>
                </div>
                {viewingReceiptCommission.payment_method && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Método:</span>
                    <span className="font-medium">
                      {PAYMENT_METHODS.find(m => m.value === viewingReceiptCommission.payment_method)?.label || viewingReceiptCommission.payment_method}
                    </span>
                  </div>
                )}

                <div className="border rounded-lg overflow-hidden bg-muted/30">
                  {viewingReceiptUrl && (viewingReceiptUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <img
                      src={viewingReceiptUrl}
                      alt="Comprovante de pagamento"
                      className="w-full h-auto max-h-96 object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <svg
                        className="w-16 h-16 text-muted-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="text-sm text-muted-foreground">Arquivo PDF</p>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => {
                    setViewingReceiptUrl(null);
                    setViewingReceiptCommission(null);
                  }}>
                    Fechar
                  </Button>
                  <Button onClick={() => viewingReceiptUrl && window.open(viewingReceiptUrl, "_blank")} className="gap-2">
                    <Download className="w-4 h-4" />
                    Abrir
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Visualização geral (dashboard)
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pagamentos de Comissões</h1>
          <p className="text-muted-foreground">
            Gerencie os pagamentos de comissões dos profissionais
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Exportar Relatório
        </Button>
      </div>

      {/* Cards de Resumo Geral */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-yellow-500/10">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total a Pagar</p>
                <p className="text-2xl font-bold text-yellow-600">
                  R$ {totals.totalPending.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {totals.pendingCount} comissões pendentes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-green-500/10">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pago Este Mês</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {totals.totalPaidThisMonth.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Histórico</p>
                <p className="text-2xl font-bold">
                  R$ {totals.totalPaidAllTime.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-blue-500/10">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Profissionais</p>
                <p className="text-2xl font-bold">
                  {professionalSummaries.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  {professionalSummaries.filter(p => p.pendingAmount > 0).length} com pendências
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Comissões por Profissional</CardTitle>
              <CardDescription>Pendente vs Pago este mês</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Legend />
                  <Bar dataKey="pendente" name="Pendente" fill="hsl(45, 93%, 47%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pago" name="Pago" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {pieData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Distribuição de Pendências</CardTitle>
                <CardDescription>Por profissional</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name.split(" ")[0]} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Lista de Profissionais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Profissionais
          </CardTitle>
          <CardDescription>
            Clique em um profissional para ver detalhes e registrar pagamentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {professionalSummaries.map((professional) => (
              <Card
                key={professional.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setSelectedProfessional(professional)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={professional.photo_url || undefined} />
                      <AvatarFallback>
                        {professional.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium truncate">{professional.name}</h3>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {professional.specialty || "Profissional"}
                      </p>
                      
                      <Separator className="my-2" />
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Pendente</p>
                          <p className="font-semibold text-yellow-600">
                            R$ {professional.pendingAmount.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Pago (mês)</p>
                          <p className="font-semibold text-green-600">
                            R$ {professional.paidThisMonth.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {professional.lastPaymentDate && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Último pagamento: {format(parseISO(professional.lastPaymentDate), "dd/MM/yyyy")}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {professionalSummaries.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum profissional cadastrado</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Dialog de Visualização de Comprovante */}
      <Dialog open={!!viewingReceiptUrl} onOpenChange={(open) => {
        if (!open) {
          setViewingReceiptUrl(null);
          setViewingReceiptCommission(null);
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Comprovante de Pagamento
            </DialogTitle>
          </DialogHeader>
          
          {viewingReceiptCommission && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Valor:</span>
                <span className="font-medium">
                  R$ {Number(viewingReceiptCommission.commission_amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Data do Pagamento:</span>
                <span className="font-medium">
                  {viewingReceiptCommission.paid_at 
                    ? format(parseISO(viewingReceiptCommission.paid_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                    : "-"
                  }
                </span>
              </div>
              {viewingReceiptCommission.payment_method && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Método:</span>
                  <span className="font-medium">
                    {PAYMENT_METHODS.find(m => m.value === viewingReceiptCommission.payment_method)?.label || viewingReceiptCommission.payment_method}
                  </span>
                </div>
              )}

              <div className="border rounded-lg overflow-hidden bg-muted/30">
                {viewingReceiptUrl && (viewingReceiptUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img
                    src={viewingReceiptUrl}
                    alt="Comprovante de pagamento"
                    className="w-full h-auto max-h-96 object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <svg
                      className="w-16 h-16 text-muted-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-sm text-muted-foreground">Arquivo PDF</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setViewingReceiptUrl(null);
                  setViewingReceiptCommission(null);
                }}>
                  Fechar
                </Button>
                <Button onClick={() => viewingReceiptUrl && window.open(viewingReceiptUrl, "_blank")} className="gap-2">
                  <Download className="w-4 h-4" />
                  Abrir
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente de Card de Comissão
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
    <div className={`p-4 rounded-lg border bg-card ${selected ? "border-primary" : ""}`}>
      <div className="flex items-start gap-3">
        {showCheckbox && onSelect && (
          <Checkbox
            checked={selected}
            onCheckedChange={onSelect}
            className="mt-1"
          />
        )}
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium">
                {commission.booking?.service?.name || "Serviço"}
              </p>
              <p className="text-sm text-muted-foreground">
                {commission.booking?.customer_name || "Cliente"}
              </p>
              <p className="text-xs text-muted-foreground">
                {commission.booking?.booking_date 
                  ? format(parseISO(commission.booking.booking_date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
                  : "-"
                }
              </p>
            </div>
            
            <div className="text-right">
              <p className="font-bold text-lg text-primary">
                R$ {Number(commission.commission_amount).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                {commission.commission_type === "percentage" 
                  ? `${commission.commission_value}%` 
                  : "Fixo"
                } de R$ {Number(commission.service_price).toFixed(2)}
              </p>
              
              {commission.status === "paid" && commission.paid_at && (
                <Badge variant="secondary" className="mt-1 bg-green-100 text-green-700">
                  Pago em {format(parseISO(commission.paid_at), "dd/MM/yyyy")}
                </Badge>
              )}
              
              {commission.payment_receipt_url && (
                <div className="flex items-center gap-1 justify-end mt-1">
                  <Receipt className="w-3 h-3 text-blue-600" />
                  <span className="text-xs text-blue-600">Com comprovante</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          {commission.payment_receipt_url && onViewReceipt && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onViewReceipt(commission.payment_receipt_url!);
              }}
              title="Ver comprovante"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          
          {onRevert && commission.status === "paid" && (
            <Button
              variant="ghost"
              size="icon"
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
