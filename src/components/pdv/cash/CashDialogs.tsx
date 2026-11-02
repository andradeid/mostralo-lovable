import { OpenCashDialog } from './OpenCashDialog';
import { CashMovementDialog } from './CashMovementDialog';
import { CloseCashDialog } from './CloseCashDialog';
import type { CashController, CashDialogKind } from './types';

interface Props {
  dialog: CashDialogKind;
  onDialogChange: (kind: CashDialogKind) => void;
  cash: CashController;
  storeName: string;
  timeZone?: string;
}

/** Todos os diálogos do caixa num lugar só (abrir, sangria/suprimento, fechar). */
export function CashDialogs({ dialog, onDialogChange, cash, storeName, timeZone }: Props) {
  const close = (open: boolean) => { if (!open) onDialogChange(null); };
  return (
    <>
      <OpenCashDialog open={dialog === 'open'} onOpenChange={close} cash={cash} />
      <CashMovementDialog
        type={dialog === 'sangria' || dialog === 'suprimento' ? dialog : null}
        onOpenChange={close}
        cash={cash}
      />
      <CloseCashDialog open={dialog === 'close'} onOpenChange={close} cash={cash} storeName={storeName} timeZone={timeZone} />
    </>
  );
}
