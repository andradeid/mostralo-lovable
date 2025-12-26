import { AlertCircle } from 'lucide-react';

interface TablePendingWarningProps {
  count: number;
}

export function TablePendingWarning({ count }: TablePendingWarningProps) {
  if (count === 0) return null;

  return (
    <div className="mx-4 mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-sm">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <span className="text-amber-700">
        {count} {count === 1 ? 'item aguardando' : 'itens aguardando'} aprovação do garçom
      </span>
    </div>
  );
}
