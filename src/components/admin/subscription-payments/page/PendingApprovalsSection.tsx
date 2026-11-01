// Alerta de assinantes aguardando aprovação.
// JSX movido da SubscriptionPaymentsManagementPage sem mudança.
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Check,
  X,
  Eye,
  UserPlus,
  CheckCircle2,
  Loader2,
  Copy,
  Building2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { brl } from "@/lib/brl";
import { copyToClipboard } from "@/lib/subscriptionPayments/clipboard";
import type { SubscriptionPaymentsPageCtx } from "@/hooks/subscriptionPayments/useSubscriptionPaymentsPage";

export function PendingApprovalsSection({ ctx }: { ctx: SubscriptionPaymentsPageCtx }) {
  const { setShowProofDialog, setSelectedProofUrl, pendingApprovals, loadingApprovals, setSelectedApproval, setShowApprovalDialog, setShowRejectDialog, setShowPaidExternallyDialog, setPaidExternallyAmount } = ctx;

  return (
    <>
      {loadingApprovals ? (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-muted/50 border border-border/40">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Verificando aprovações pendentes...</span>
        </div>
      ) : pendingApprovals.length === 0 ? (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-200/40 dark:border-emerald-500/10">
          <CheckCircle2 className="w-4 h-4 text-emerald-500/60" />
          <span className="text-sm text-muted-foreground">Nenhuma aprovação pendente no momento</span>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-200/60 dark:border-amber-500/20 bg-card overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-border/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center">
                <UserPlus className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Novos Assinantes</h2>
                <p className="text-[11px] text-muted-foreground/70">{pendingApprovals.length} pendente{pendingApprovals.length > 1 ? 's' : ''} de aprovação</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              {pendingApprovals.length}
            </span>
          </div>

          {/* Mobile: Cards */}
          <div className="md:hidden divide-y divide-border/40">
            {pendingApprovals.map((approval) => {
              const fullName = approval.profiles?.full_name || 'Nome não informado';
              const initials = fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
              
              return (
                <div key={approval.id} className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/8 flex items-center justify-center shrink-0">
                      <span className="text-[11px] font-bold text-primary">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{fullName}</p>
                      <p className="text-xs text-muted-foreground/70 truncate">{approval.profiles?.email || '-'}</p>
                    </div>
                    <span className="text-sm font-semibold text-foreground shrink-0">{brl(approval.payment_amount)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                    <Building2 className="w-3 h-3 shrink-0" />
                    <span className="truncate">{approval.company_name || '-'}</span>
                    <span>•</span>
                    <span className="inline-flex px-1.5 py-0.5 rounded bg-muted text-[10px] font-medium text-foreground">{approval.plans?.name || '-'}</span>
                    <span>•</span>
                    <span>{format(new Date(approval.created_at), "dd/MM/yy", { locale: ptBR })}</span>
                  </div>
                  
                  {approval.salesperson && (
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Indicado por <strong>{approval.salesperson.full_name}</strong>
                    </p>
                  )}
                  
                  <div className="flex gap-2 pt-1">
                    {approval.payment_proof_url && (
                      <Button variant="outline" size="sm" className="h-7 text-xs flex-1" onClick={() => { setSelectedProofUrl(approval.payment_proof_url!); setShowProofDialog(true); }}>
                        <Eye className="w-3 h-3 mr-1" />Comprovante
                      </Button>
                    )}
                    <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex-1" onClick={() => { setSelectedApproval(approval); setShowApprovalDialog(true); }} disabled={!approval.payment_proof_url}>
                      <Check className="w-3 h-3 mr-1" />Aprovar
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setSelectedApproval(approval); setPaidExternallyAmount(approval.payment_amount.toString()); setShowPaidExternallyDialog(true); }}>
                      Por Fora
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => { setSelectedApproval(approval); setShowRejectDialog(true); }}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-border/40">
                  <TableHead className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground/70 h-9">Usuário</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground/70 h-9">Empresa</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground/70 h-9">Plano</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground/70 h-9">Valor</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground/70 h-9">PIX ID</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground/70 h-9">Data</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground/70 h-9">Comprovante</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground/70 h-9 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingApprovals.map((approval) => (
                  <TableRow key={approval.id} className="group hover:bg-muted/40 transition-colors duration-150 border-b border-border/30">
                    <TableCell className="py-4">
                      <p className="text-sm font-medium text-foreground">{approval.profiles?.full_name}</p>
                      <p className="text-[11px] text-muted-foreground/60 mt-0.5">{approval.profiles?.email}</p>
                    </TableCell>
                    <TableCell className="py-4">
                      <p className="text-sm text-foreground">{approval.company_name}</p>
                      <p className="text-[11px] text-muted-foreground/60 mt-0.5">{approval.company_document}</p>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-muted/80 text-foreground/80">
                        {approval.plans?.name}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 text-sm font-semibold text-foreground tabular-nums">
                      {brl(approval.payment_amount)}
                    </TableCell>
                    <TableCell className="py-4">
                      {approval.pix_txid ? (
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-[11px] text-muted-foreground/70 truncate max-w-[90px]" title={approval.pix_txid}>
                            {approval.pix_txid.slice(0, 12)}…
                          </span>
                          <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => copyToClipboard(approval.pix_txid!)}>
                            <Copy className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground/30">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4 text-[13px] text-muted-foreground/70 tabular-nums">
                      {format(new Date(approval.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="py-4">
                      {approval.payment_proof_url ? (
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] text-muted-foreground/70 hover:text-foreground" onClick={() => { setSelectedProofUrl(approval.payment_proof_url!); setShowProofDialog(true); }}>
                          <Eye className="w-3 h-3 mr-1" />Ver
                        </Button>
                      ) : (
                        <span className="text-[11px] text-muted-foreground/30">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity duration-150">
                        <Button size="sm" className="h-7 px-2.5 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm" onClick={() => { setSelectedApproval(approval); setShowApprovalDialog(true); }} disabled={!approval.payment_proof_url}>
                          <Check className="w-3 h-3 mr-1" />Aprovar
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 px-2 text-[11px] border-border/60" onClick={() => { setSelectedApproval(approval); setPaidExternallyAmount(approval.payment_amount.toString()); setShowPaidExternallyDialog(true); }}>
                          Por Fora
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground/50 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10" onClick={() => { setSelectedApproval(approval); setShowRejectDialog(true); }}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </>
  );
}
