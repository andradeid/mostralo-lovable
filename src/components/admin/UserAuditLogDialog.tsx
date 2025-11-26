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
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Ações Administrativas
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum histórico encontrado</p>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Administrador</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const actionInfo = ACTION_LABELS[log.action] || { label: log.action, variant: 'default' };
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{log.admin?.full_name || 'Sistema'}</span>
                          <span className="text-xs text-muted-foreground">{log.admin?.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={actionInfo.variant}>
                          {actionInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.details && Object.keys(log.details).length > 0 ? (
                          <div className="text-sm text-muted-foreground">
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
        )}
      </DialogContent>
    </Dialog>
  );
}
