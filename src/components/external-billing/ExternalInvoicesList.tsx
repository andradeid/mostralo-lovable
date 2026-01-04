import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  FileText, 
  Copy, 
  ExternalLink,
  Clock,
  AlertCircle,
  DollarSign,
  RefreshCw,
  Receipt,
  MessageCircle,
  Link2,
  Eye,
  Pencil,
  Repeat
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useExternalInvoices, type ExternalInvoice } from "@/hooks/useExternalInvoices";
import { useExternalClients } from "@/hooks/useExternalClients";
import { ExternalInvoiceForm } from "./ExternalInvoiceForm";
import { ProcessRecurringInvoicesButton } from "./ProcessRecurringInvoicesButton";
import { toast } from "sonner";
import { getPublicInvoiceUrl } from "@/lib/publicUrl";
import { SendExternalReceiptWhatsAppModal } from "./SendExternalReceiptWhatsAppModal";
import { SendExternalInvoiceWhatsAppModal } from "./SendExternalInvoiceWhatsAppModal";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "outline" },
  paid: { label: "Pago", variant: "default" },
  overdue: { label: "Vencida", variant: "destructive" },
  cancelled: { label: "Cancelada", variant: "secondary" },
};

const RECURRENCE_LABELS: Record<string, string> = {
  once: "Única",
  monthly: "Mensal",
  quarterly: "Trimestral",
  yearly: "Anual",
};

export function ExternalInvoicesList() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [recurrenceFilter, setRecurrenceFilter] = useState<string>("all");
  const { invoices, isLoading, markAsPaid, cancelInvoice, deleteInvoice } = useExternalInvoices();
  const { clients } = useExternalClients();
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<ExternalInvoice | null>(null);
  const [deletingInvoice, setDeletingInvoice] = useState<ExternalInvoice | null>(null);
  const [sendingReceiptInvoice, setSendingReceiptInvoice] = useState<ExternalInvoice | null>(null);
  const [sendingInvoiceWhatsApp, setSendingInvoiceWhatsApp] = useState<ExternalInvoice | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<ExternalInvoice | null>(null);

  // Extract EndToEndId from notes
  const extractTransactionId = (notes: string | null): string | null => {
    if (!notes) return null;
    const match = notes.match(/EndToEndId:\s*([A-Za-z0-9]+)/);
    return match ? match[1] : null;
  };

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      // Search filter
      const matchesSearch = 
        invoice.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
        invoice.client?.name.toLowerCase().includes(search.toLowerCase()) ||
        invoice.description.toLowerCase().includes(search.toLowerCase());

      // Status filter
      let matchesStatus = true;
      if (statusFilter !== "all") {
        matchesStatus = invoice.payment_status === statusFilter;
      }

      // Client filter
      let matchesClient = true;
      if (clientFilter !== "all") {
        matchesClient = invoice.client_id === clientFilter;
      }

      // Recurrence filter
      let matchesRecurrence = true;
      if (recurrenceFilter !== "all") {
        if (recurrenceFilter === "once") {
          matchesRecurrence = !invoice.is_recurring;
        } else {
          matchesRecurrence = invoice.is_recurring && invoice.recurrence_type === recurrenceFilter;
        }
      }

      return matchesSearch && matchesStatus && matchesClient && matchesRecurrence;
    });
  }, [invoices, search, statusFilter, clientFilter, recurrenceFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = invoices.length;
    const paid = invoices.filter(inv => inv.payment_status === "paid");
    const pending = invoices.filter(inv => inv.payment_status === "pending");
    const overdue = invoices.filter(inv => inv.payment_status === "overdue");
    const cancelled = invoices.filter(inv => inv.payment_status === "cancelled");

    const paidTotal = paid.reduce((sum, inv) => sum + inv.amount, 0);
    const pendingTotal = pending.reduce((sum, inv) => sum + inv.amount, 0);
    const overdueTotal = overdue.reduce((sum, inv) => sum + inv.amount, 0);

    return {
      total,
      paid: { count: paid.length, total: paidTotal },
      pending: { count: pending.length, total: pendingTotal },
      overdue: { count: overdue.length, total: overdueTotal },
      cancelled: { count: cancelled.length }
    };
  }, [invoices]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleMarkAsPaid = async (invoice: ExternalInvoice) => {
    await markAsPaid.mutateAsync({ id: invoice.id, payment_method: "manual" });
  };

  const handleCancel = async (invoice: ExternalInvoice) => {
    await cancelInvoice.mutateAsync(invoice.id);
  };

  const handleDelete = async () => {
    if (deletingInvoice) {
      await deleteInvoice.mutateAsync(deletingInvoice.id);
      setDeletingInvoice(null);
    }
  };

  const handleCopyLink = (invoiceId: string) => {
    const url = getPublicInvoiceUrl(invoiceId);
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setClientFilter("all");
    setRecurrenceFilter("all");
  };

  const statsCards = [
    {
      title: "📄 Total de Faturas",
      value: stats.total,
      description: "Faturas criadas no sistema",
      icon: FileText,
      color: "text-blue-600"
    },
    {
      title: "✅ Faturas Pagas",
      value: stats.paid.count,
      description: formatCurrency(stats.paid.total),
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      title: "⏳ Faturas Pendentes",
      value: stats.pending.count,
      description: formatCurrency(stats.pending.total),
      icon: Clock,
      color: "text-yellow-600"
    },
    {
      title: "⚠️ Faturas Vencidas",
      value: stats.overdue.count,
      description: formatCurrency(stats.overdue.total),
      icon: AlertCircle,
      color: "text-red-600"
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-muted-foreground">
            {filteredInvoices.length} fatura(s) encontrada(s)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ProcessRecurringInvoicesButton />
          <Button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nova Fatura
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <IconComponent className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros e Busca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número da fatura, cliente ou descrição..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                    <SelectItem value="paid">Pagas</SelectItem>
                    <SelectItem value="overdue">Vencidas</SelectItem>
                    <SelectItem value="cancelled">Canceladas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Cliente</label>
                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {clients?.map(client => (
                      <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Recorrência</label>
                <Select value={recurrenceFilter} onValueChange={setRecurrenceFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="once">Única</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium opacity-0">Ações</label>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={clearFilters}
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Faturas ({filteredInvoices.length})</CardTitle>
          <CardDescription>
            Faturas encontradas com os filtros aplicados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma fatura encontrada</h3>
              <p className="text-muted-foreground">
                {search || statusFilter !== "all" || clientFilter !== "all" || recurrenceFilter !== "all"
                  ? "Tente ajustar os filtros ou termos de busca."
                  : "Clique em 'Nova Fatura' para criar a primeira."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              {filteredInvoices.map((invoice) => (
                <InvoiceCard
                  key={invoice.id}
                  invoice={invoice}
                  onMarkAsPaid={handleMarkAsPaid}
                  onCancel={handleCancel}
                  onDelete={setDeletingInvoice}
                  onCopyLink={handleCopyLink}
                  onSendReceiptWhatsApp={setSendingReceiptInvoice}
                  onSendInvoiceWhatsApp={setSendingInvoiceWhatsApp}
                  onViewDetails={setSelectedInvoice}
                  onEdit={setEditingInvoice}
                  formatCurrency={formatCurrency}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog 
        open={isFormOpen || !!editingInvoice} 
        onOpenChange={(open) => {
          if (!open) {
            setIsFormOpen(false);
            setEditingInvoice(null);
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingInvoice ? 'Editar Fatura' : 'Nova Fatura'}</DialogTitle>
            <DialogDescription>
              {editingInvoice 
                ? 'Altere as informações da fatura selecionada' 
                : 'Crie uma nova fatura para um cliente externo'}
            </DialogDescription>
          </DialogHeader>
          <ExternalInvoiceForm 
            invoice={editingInvoice || undefined}
            onClose={() => {
              setIsFormOpen(false);
              setEditingInvoice(null);
            }} 
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingInvoice} onOpenChange={() => setDeletingInvoice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a fatura "{deletingInvoice?.invoice_number}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* WhatsApp Receipt Modal */}
      <SendExternalReceiptWhatsAppModal
        open={!!sendingReceiptInvoice}
        onOpenChange={(open) => !open && setSendingReceiptInvoice(null)}
        invoice={sendingReceiptInvoice}
      />

      {/* WhatsApp Invoice Modal */}
      <SendExternalInvoiceWhatsAppModal
        open={!!sendingInvoiceWhatsApp}
        onOpenChange={(open) => !open && setSendingInvoiceWhatsApp(null)}
        invoice={sendingInvoiceWhatsApp}
      />

      {/* Invoice Details Modal */}
      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Fatura</DialogTitle>
            <DialogDescription>
              Informações completas da fatura {selectedInvoice?.invoice_number}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4">
              {/* Grid de informações básicas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{selectedInvoice.client?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contato</p>
                  <p className="font-medium">{selectedInvoice.client?.phone || selectedInvoice.client?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Serviço</p>
                  <p className="font-medium">{selectedInvoice.service?.name || selectedInvoice.description}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor</p>
                  <p className="font-medium text-lg">{formatCurrency(selectedInvoice.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vencimento</p>
                  <p className="font-medium">
                    {format(new Date(selectedInvoice.due_date), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={STATUS_CONFIG[selectedInvoice.payment_status]?.variant}>
                    {STATUS_CONFIG[selectedInvoice.payment_status]?.label}
                  </Badge>
                </div>
              </div>

              {/* Seção de Recorrência */}
              {selectedInvoice.is_recurring && (
                <div className="p-4 rounded-lg border border-blue-500/30 bg-blue-500/5">
                  <div className="flex items-center gap-2 mb-3">
                    <RefreshCw className="w-5 h-5 text-blue-500" />
                    <p className="font-semibold text-blue-600 dark:text-blue-400">Fatura Recorrente</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Tipo</p>
                      <p className="font-medium">{RECURRENCE_LABELS[selectedInvoice.recurrence_type || 'once']}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Parcela</p>
                      <p className="font-medium">
                        {selectedInvoice.recurrence_count 
                          ? `${selectedInvoice.recurrence_current}/${selectedInvoice.recurrence_count}`
                          : `${selectedInvoice.recurrence_current}/∞`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ID de Transação (EndToEndId) */}
              {extractTransactionId(selectedInvoice.notes) && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">ID de Transação (EndToEndId)</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-xs font-mono bg-background px-2 py-1 rounded break-all">
                      {extractTransactionId(selectedInvoice.notes)}
                    </code>
                    <Button variant="outline" size="sm" onClick={() => {
                      navigator.clipboard.writeText(extractTransactionId(selectedInvoice.notes)!);
                      toast.success('ID copiado!');
                    }}>
                      <Copy className="h-3 w-3 mr-1" />
                      Copiar
                    </Button>
                  </div>
                </div>
              )}

              {/* Data do Pagamento */}
              {selectedInvoice.paid_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Pago em</p>
                  <p className="text-sm font-medium">
                    {format(new Date(selectedInvoice.paid_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              )}

              {/* Observações */}
              {selectedInvoice.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Observações</p>
                  <p className="text-sm whitespace-pre-wrap">{selectedInvoice.notes}</p>
                </div>
              )}

              {/* Links Úteis */}
              <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-lg border border-blue-200 dark:border-blue-500/30">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-3 flex items-center gap-2">
                  <Link2 className="w-4 h-4" />
                  Links Úteis
                </p>
                <div className="space-y-2">
                  {/* Link da Fatura */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-muted-foreground min-w-[60px]">Fatura:</span>
                    <Button variant="outline" size="sm" onClick={() => handleCopyLink(selectedInvoice.id)}>
                      <Receipt className="h-3 w-3 mr-1" />
                      Copiar Link
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => window.open(getPublicInvoiceUrl(selectedInvoice.id), '_blank')}>
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  {/* Link do Recibo - apenas se pago */}
                  {selectedInvoice.payment_status === 'paid' && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-muted-foreground min-w-[60px]">Recibo:</span>
                      <Button variant="outline" size="sm" onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/external-receipt/${selectedInvoice.id}`);
                        toast.success('Link do recibo copiado!');
                      }}>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Copiar Link
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => window.open(`/external-receipt/${selectedInvoice.id}`, '_blank')}>
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Subcomponent for Invoice Card
interface InvoiceCardProps {
  invoice: ExternalInvoice;
  onMarkAsPaid: (invoice: ExternalInvoice) => void;
  onCancel: (invoice: ExternalInvoice) => void;
  onDelete: (invoice: ExternalInvoice) => void;
  onCopyLink: (invoiceId: string) => void;
  onSendReceiptWhatsApp: (invoice: ExternalInvoice) => void;
  onSendInvoiceWhatsApp: (invoice: ExternalInvoice) => void;
  onViewDetails: (invoice: ExternalInvoice) => void;
  onEdit: (invoice: ExternalInvoice) => void;
  formatCurrency: (value: number) => string;
}

function InvoiceCard({ invoice, onMarkAsPaid, onCancel, onDelete, onCopyLink, onSendReceiptWhatsApp, onSendInvoiceWhatsApp, onViewDetails, onEdit, formatCurrency }: InvoiceCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-mono truncate">
              {invoice.invoice_number || "-"}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground truncate">
                {invoice.client?.name || "Cliente não informado"}
              </span>
            </div>
          </div>
          <Badge 
            variant={STATUS_CONFIG[invoice.payment_status]?.variant || "outline"}
            className="shrink-0 ml-2"
          >
            {STATUS_CONFIG[invoice.payment_status]?.label || invoice.payment_status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Descrição:</span>
            <span className="text-sm text-muted-foreground truncate max-w-[60%] text-right">
              {invoice.description}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Valor:</span>
            <Badge variant="outline" className="font-mono">
              {formatCurrency(invoice.amount)}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Vencimento:</span>
            <span className="text-sm text-muted-foreground">
              {format(new Date(invoice.due_date), "dd/MM/yyyy", { locale: ptBR })}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Recorrência:</span>
            {invoice.is_recurring ? (
              <div className="flex flex-col items-end">
                <span className="text-sm">
                  {RECURRENCE_LABELS[invoice.recurrence_type || "once"]}
                </span>
                {invoice.recurrence_count && (
                  <span className="text-xs text-muted-foreground">
                    {invoice.recurrence_current}/{invoice.recurrence_count}
                  </span>
                )}
                {!invoice.recurrence_count && invoice.is_recurring && (
                  <span className="text-xs text-muted-foreground">∞ Infinito</span>
                )}
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Única</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => window.open(getPublicInvoiceUrl(invoice.id), '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver Fatura
          </Button>
          
          {/* Botão WhatsApp para faturas pendentes/vencidas */}
          {(invoice.payment_status === "pending" || invoice.payment_status === "overdue") && (
            <Button
              size="sm"
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50"
              onClick={() => onSendInvoiceWhatsApp(invoice)}
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          )}

          {invoice.payment_status === "paid" && (
            <>
              <Button
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => window.open(`/external-receipt/${invoice.id}`, '_blank')}
              >
                <Receipt className="h-4 w-4 mr-2" />
                Recibo
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-50"
                onClick={() => onSendReceiptWhatsApp(invoice)}
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            </>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewDetails(invoice)}>
                <Eye className="h-4 w-4 mr-2" />
                Ver Detalhes
              </DropdownMenuItem>
              {(invoice.payment_status === "pending" || invoice.payment_status === "overdue") && (
                <DropdownMenuItem onClick={() => onEdit(invoice)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar Fatura
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onCopyLink(invoice.id)}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar Link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(getPublicInvoiceUrl(invoice.id), '_blank')}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Acessar Link
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={getPublicInvoiceUrl(invoice.id)} target="_blank" rel="noopener noreferrer">
                  <FileText className="h-4 w-4 mr-2" />
                  Ver Fatura
                </a>
              </DropdownMenuItem>
              {(invoice.payment_status === "pending" || invoice.payment_status === "overdue") && (
                <DropdownMenuItem onClick={() => onSendInvoiceWhatsApp(invoice)}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Enviar Fatura por WhatsApp
                </DropdownMenuItem>
              )}
              {invoice.payment_status === "paid" && (
                <>
                  <DropdownMenuItem onClick={() => window.open(`/external-receipt/${invoice.id}`, '_blank')}>
                    <Receipt className="h-4 w-4 mr-2" />
                    Ver Recibo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onSendReceiptWhatsApp(invoice)}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Enviar Recibo por WhatsApp
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              {(invoice.payment_status === "pending" || invoice.payment_status === "overdue") && (
                <>
                  <DropdownMenuItem onClick={() => onMarkAsPaid(invoice)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marcar como Pago
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onCancel(invoice)}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancelar
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(invoice)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
