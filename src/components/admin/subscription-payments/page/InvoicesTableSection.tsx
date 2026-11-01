// Lista de todas as faturas com filtros.
// JSX movido da SubscriptionPaymentsManagementPage sem mudança.
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Receipt,
  Eye,
  Search,
  Pencil,
  Trash2,
  CheckCircle2,
  Copy,
  Ticket,
  Link2,
} from "lucide-react";
import { formatInvoiceDueDate } from "@/lib/invoiceDate";
import { extractTransactionId } from "@/lib/subscriptionPayments/transactionId";
import { copyToClipboard } from "@/lib/subscriptionPayments/clipboard";
import type { SubscriptionPaymentsPageCtx } from "@/hooks/subscriptionPayments/useSubscriptionPaymentsPage";
import { invoicePayPath } from "@/lib/invoiceLinks";

export function InvoicesTableSection({ ctx }: { ctx: SubscriptionPaymentsPageCtx }) {
  const { filteredInvoices, setSelectedInvoice, setShowDetailDialog, statusFilter, setStatusFilter, searchTerm, setSearchTerm, openMarkPaidDialog, openEditDialog, openDeleteDialog, getStatusBadge } = ctx;

  return (
    <>
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm">
        {/* Header + Filters */}
        <div className="px-6 py-4 border-b border-border/40">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Todas as Faturas</h2>
              <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                {filteredInvoices.length} resultado{filteredInvoices.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex flex-col md:flex-row gap-2.5 md:gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                <Input
                  placeholder="Buscar por loja, nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-sm w-full md:w-80 bg-background border-border/50 focus:border-primary/40"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-full md:w-40 text-sm bg-background border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Paga</SelectItem>
                  <SelectItem value="overdue">Vencida</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Mobile: Cards */}
        <div className="md:hidden divide-y divide-border/30">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-16">
              <Receipt className="w-10 h-10 mx-auto mb-3 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground/60">Nenhuma fatura encontrada</p>
            </div>
          ) : (
            filteredInvoices.map((invoice) => (
              <div key={invoice.id} className="p-4 space-y-2.5 hover:bg-muted/20 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{invoice.stores?.name || '-'}</p>
                    <p className="text-[11px] text-muted-foreground/60 truncate">{invoice.stores?.profiles?.full_name || '-'} • {invoice.stores?.profiles?.email || '-'}</p>
                  </div>
                  {getStatusBadge(invoice.payment_status, invoice.paid_at)}
                </div>
                
                {invoice.coupon_info && (
                  <div className="flex items-center justify-between text-xs px-2.5 py-1.5 bg-purple-50/50 dark:bg-purple-500/5 rounded-md">
                    <span className="text-muted-foreground/70 flex items-center gap-1"><Ticket className="w-3 h-3" /> {invoice.coupon_info.coupon_code}</span>
                    <span className="text-purple-600 dark:text-purple-400 font-medium">
                      -{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.coupon_info.discount_applied)}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                    <span className="inline-flex px-2 py-0.5 rounded-full bg-muted/60 text-[10px] font-medium text-foreground/70">{invoice.plans?.name || '-'}</span>
                    <span>{formatInvoiceDueDate(invoice.due_date)}</span>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-foreground">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.amount)}
                  </span>
                </div>
                
                <div className="flex flex-col gap-2 pt-2 border-t border-border/30">
                  {(invoice.payment_status === 'pending' || invoice.payment_status === 'overdue') && (
                    <Button size="sm" className="w-full h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm" onClick={() => openMarkPaidDialog(invoice)}>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Marcar como Pago
                    </Button>
                  )}
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" className="flex-1 h-8 text-xs border-border/50" onClick={() => { setSelectedInvoice(invoice); setShowDetailDialog(true); }}>
                      <Eye className="h-3 w-3 mr-1" />Ver
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground/50 hover:text-foreground" onClick={() => openEditDialog(invoice)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground/50 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10" onClick={() => openDeleteDialog(invoice)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop: Table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border/40">
                <TableHead className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground/60 h-9 pl-6">Loja</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground/60 h-9">Plano</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground/60 h-9">ID Transação</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground/60 h-9">Vencimento</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground/60 h-9 text-right">Valor</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground/60 h-9">Status</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground/60 h-9 text-right pr-6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16">
                    <Receipt className="w-10 h-10 mx-auto mb-3 text-muted-foreground/20" />
                    <p className="text-sm text-muted-foreground/60">Nenhuma fatura encontrada</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => {
                  const txId = extractTransactionId(invoice.notes);
                  return (
                    <TableRow key={invoice.id} className="group hover:bg-muted/30 transition-colors duration-150 border-b border-border/20">
                      {/* Loja */}
                      <TableCell className="py-4 pl-6">
                        <p className="text-[13px] font-medium text-foreground leading-snug">{invoice.stores?.name || '-'}</p>
                        <p className="text-[11px] text-muted-foreground/50 mt-0.5 leading-snug">{invoice.stores?.profiles?.full_name || '-'}</p>
                        <p className="text-[11px] text-muted-foreground/40 leading-snug">{invoice.stores?.profiles?.email || '-'}</p>
                      </TableCell>
                      {/* Plano */}
                      <TableCell className="py-4">
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-muted/70 text-foreground/70">
                          {invoice.plans?.name || '-'}
                        </span>
                      </TableCell>
                      {/* ID Transação */}
                      <TableCell className="py-4">
                        {txId ? (
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-[11px] text-muted-foreground/50 truncate max-w-[90px]" title={txId}>
                              {txId.slice(0, 12)}…
                            </span>
                            <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => copyToClipboard(txId)}>
                              <Copy className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground/25">—</span>
                        )}
                      </TableCell>
                      {/* Vencimento */}
                      <TableCell className="py-4 text-[13px] text-muted-foreground/60 tabular-nums">
                        {formatInvoiceDueDate(invoice.due_date)}
                      </TableCell>
                      {/* Valor */}
                      <TableCell className="py-4 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[13px] font-semibold text-foreground tabular-nums">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.amount)}
                          </span>
                          {invoice.coupon_info && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400">
                              <Ticket className="w-2 h-2" />
                              {invoice.coupon_info.coupon_code}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      {/* Status */}
                      <TableCell className="py-4">
                        {getStatusBadge(invoice.payment_status, invoice.paid_at)}
                      </TableCell>
                      {/* Ações — visíveis no hover */}
                      <TableCell className="py-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-0.5">
                          {(invoice.payment_status === 'pending' || invoice.payment_status === 'overdue') && (
                            <>
                              <Button size="sm" className="h-7 px-2.5 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm" onClick={() => openMarkPaidDialog(invoice)} title="Marcar como pago">
                                <CheckCircle2 className="h-3 w-3 mr-1" />Pago
                              </Button>
                              {invoice.payment_status === 'pending' && (
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground/40 hover:text-foreground" onClick={() => { const paymentLink = `${window.location.origin}${invoicePayPath(invoice)}`; navigator.clipboard.writeText(paymentLink); toast.success('Link de pagamento copiado!'); }} title="Copiar link">
                                  <Link2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground/40 hover:text-foreground" onClick={() => { setSelectedInvoice(invoice); setShowDetailDialog(true); }} title="Ver detalhes">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground/40 hover:text-foreground" onClick={() => openEditDialog(invoice)} title="Editar">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground/30 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10" onClick={() => openDeleteDialog(invoice)} title="Excluir">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
