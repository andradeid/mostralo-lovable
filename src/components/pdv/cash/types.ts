import type { useCashSession } from '@/hooks/pdvCash/useCashSession';

export type CashController = ReturnType<typeof useCashSession>;
export type CashDialogKind = 'open' | 'sangria' | 'suprimento' | 'close' | null;
