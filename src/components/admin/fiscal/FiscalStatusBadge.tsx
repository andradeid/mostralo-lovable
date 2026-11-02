import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { STATUS_INFO, type FiscalStatus } from '@/lib/fiscal/documents';

const TONE: Record<string, string> = {
  success: 'bg-green-600 hover:bg-green-600 text-white',
  warning: 'bg-amber-500 hover:bg-amber-500 text-white',
  danger: 'bg-destructive hover:bg-destructive text-destructive-foreground',
  muted: 'bg-muted text-muted-foreground hover:bg-muted',
};

export function FiscalStatusBadge({ status }: { status: FiscalStatus }) {
  const info = STATUS_INFO[status] ?? STATUS_INFO.processando;
  return (
    <Badge className={`gap-1 ${TONE[info.tone]}`}>
      {status === 'processando' && <Loader2 className="h-3 w-3 animate-spin" />}
      {info.label}
    </Badge>
  );
}

export function EnvironmentBadge({ environment }: { environment: 'homologacao' | 'producao' }) {
  return environment === 'producao'
    ? <Badge variant="outline" className="border-green-600 text-green-700">Produção</Badge>
    : <Badge variant="outline" className="border-amber-500 text-amber-700">Homologação (teste)</Badge>;
}
