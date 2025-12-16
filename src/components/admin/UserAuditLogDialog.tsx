import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, History } from 'lucide-react';
import { useUserManagement, AuditLog } from '@/hooks/useUserManagement';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UserAuditLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
}

const ACTION_LABELS: Record<string, { label: string; variant: any }> = {
  block: { label: 'Bloqueio', variant: 'destructive' },
  unblock: { label: 'Desbloqueio', variant: 'success' },
  delete: { label: 'Exclusão', variant: 'secondary' },
  restore: { label: 'Restauração', variant: 'success' },
  edit: { label: 'Edição', variant: 'default' },
  impersonate: { label: 'Impersonação', variant: 'outline' },
  role_change: { label: 'Alteração de Role', variant: 'default' },
};

// Componente de Card para Mobile
function AuditLogCard({ log }: { log: AuditLog }) {
  const actionInfo = ACTION_LABELS[log.action] || { label: log.action, variant: 'default' };
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yy HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };
  
  return (
    <div className="p-3 border rounded-lg space-y-2 bg-card">
      {/* Header: Data + Badge */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {formatDate(log.created_at)}
        </span>
        <Badge variant={actionInfo.variant} className="text-[10px]">
          {actionInfo.label}
        </Badge>
      </div>
      
      {/* Admin */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Por:</span>
        <span className="text-sm font-medium truncate">
          {log.admin?.full_name || 'Sistema'}
        </span>
      </div>
      {log.admin?.email && (
        <p className="text-xs text-muted-foreground truncate">{log.admin.email}</p>
      )}
      
      {/* Detalhes */}
      {log.details && Object.keys(log.details).length > 0 && (
        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded space-y-0.5">
          {log.details.reason && <p><strong>Motivo:</strong> {log.details.reason}</p>}
          {log.details.action && <p><strong>Tipo:</strong> {log.details.action}</p>}
          {log.details.role && <p><strong>Role:</strong> {log.details.role}</p>}
        </div>
      )}
    </div>
  );
}

export function UserAuditLogDialog({ open, onOpenChange, userId }: UserAuditLogDialogProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const { getAuditLog } = useUserManagement();

  useEffect(() => {
    if (open && userId) {
      loadLogs();
    }
  }, [open, userId]);

  const loadLogs = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await getAuditLog(userId);
      setLogs(data);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto p-4 md:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
            <History className="h-4 w-4 md:h-5 md:w-5" />
            <span className="hidden sm:inline">Histórico de Ações Administrativas</span>
            <span className="sm:hidden">Histórico de Ações</span>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-6 md:py-8">
            <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-6 md:py-8 text-muted-foreground">
            <History className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 opacity-50" />
            <p className="text-sm md:text-base">Nenhum histórico encontrado</p>
          </div>
        ) : (
          <>
            {/* Mobile: Cards */}
            <div className="space-y-2 md:hidden max-h-[60vh] overflow-y-auto">
              {logs.map((log) => (
                <AuditLogCard key={log.id} log={log} />
              ))}
            </div>
            
            {/* Desktop: Tabela */}
            <div className="hidden md:block border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Data/Hora</TableHead>
                    <TableHead className="text-xs">Administrador</TableHead>
                    <TableHead className="text-xs">Ação</TableHead>
                    <TableHead className="text-xs">Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const actionInfo = ACTION_LABELS[log.action] || { label: log.action, variant: 'default' };
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap text-xs md:text-sm">
                          {formatDate(log.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-xs md:text-sm">{log.admin?.full_name || 'Sistema'}</span>
                            <span className="text-[10px] md:text-xs text-muted-foreground">{log.admin?.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={actionInfo.variant} className="text-[10px] md:text-xs">
                            {actionInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.details && Object.keys(log.details).length > 0 ? (
                            <div className="text-xs md:text-sm text-muted-foreground">
                              {log.details.reason && <p>Motivo: {log.details.reason}</p>}
                              {log.details.action && <p>Tipo: {log.details.action}</p>}
                              {log.details.role && <p>Role: {log.details.role}</p>}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
