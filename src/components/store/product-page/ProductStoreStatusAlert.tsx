// Alerta quando a loja não está operando normalmente (pausada/fechada, com ou sem agendamento).
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface Props {
  storeStatus: {
    isOpenForBusiness: boolean;
    scheduledOrdersEnabled: boolean;
    isPaused: boolean;
    isClosed: boolean;
  };
}

export function ProductStoreStatusAlert({ storeStatus }: Props) {
  if (storeStatus.isOpenForBusiness) return null;
  return (
    <Alert
      className={`mb-6 ${
        storeStatus.scheduledOrdersEnabled
          ? 'bg-blue-50 border-blue-200 text-blue-900'
          : 'bg-orange-50 border-orange-200 text-orange-900'
      }`}
    >
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="font-medium">
        {storeStatus.scheduledOrdersEnabled ? (
          <>
            {storeStatus.isPaused && (
              <>⏸️ <strong>Serviço pausado.</strong></>
            )}
            {storeStatus.isClosed && !storeStatus.isPaused && (
              <>🕒 <strong>Estabelecimento fechado.</strong></>
            )}
            {' '}Você pode fazer pedidos com agendamento para horários futuros.
          </>
        ) : (
          <>
            {storeStatus.isPaused && (
              <>⏸️ <strong>Serviço pausado temporariamente.</strong></>
            )}
            {storeStatus.isClosed && !storeStatus.isPaused && (
              <>🕒 <strong>Estabelecimento fechado no momento.</strong></>
            )}
            {' '}Não estamos aceitando pedidos no momento.
          </>
        )}
      </AlertDescription>
    </Alert>
  );
}
