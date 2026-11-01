import { lazy, Suspense, useEffect, useState } from 'react';
import { Loader2, LogOut, Package, Printer, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { isNativeApp, nativePlugin } from '@/lib/thermal/nativeBridge';
import { loadPrintSettings, remoteLog, WEB_VERSION } from '@/lib/thermal/nativePrinter';
import { NativePrinterSettings } from '@/components/app/NativePrinterSettings';
import { AppProductsTab } from '@/components/app/AppProductsTab';
import { APP_OPEN_PRINTER_EVENT } from '@/components/admin/orders/MobileAdminNav';
import { useAppAutoAcceptPrinter } from '@/hooks/useAppAutoAcceptPrinter';

const OrdersPage = lazy(() => import('@/pages/admin/OrdersPage'));

/** Tela do app Mostralo Pedidos: só os pedidos da loja e a impressora. */
export default function AppPedidosPage() {
  const { storeId, storeName, availableStores, switchStore } = useStoreAccess();
  const { signOut } = useAuth();
  const native = isNativeApp();
  useAppAutoAcceptPrinter(storeId);
  const [tab, setTab] = useState<'orders' | 'products' | 'printer'>(native && !loadPrintSettings().printer ? 'printer' : 'orders');

  // Segundo plano: liga o serviço que mantém o app recebendo pedidos com a tela desligada
  useEffect(() => {
    if (!native || !storeId) return;
    Promise.resolve().then(() => nativePlugin('PedidosService').start({ store: storeName ?? '' }))
      .then(() => remoteLog(`Segundo plano ligado · ${storeName ?? storeId}`, 'app'))
      .catch(e => remoteLog(`Segundo plano indisponível: ${e instanceof Error ? e.message : String(e)} (APK antigo?)`, 'app'));
  }, [native, storeId, storeName]);

  // Diagnóstico: registra que o app abriu e qual versão do site carregou
  useEffect(() => {
    if (native) remoteLog(`App aberto · ${WEB_VERSION} · ${location.href} · loja ${storeName ?? storeId ?? '?'} · impressora ${loadPrintSettings().printer ? 'escolhida' : 'nenhuma'}`, 'app');
  }, [native, storeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // A lista de pedidos no celular ocupa a tela toda; o botão da impressora dela abre esta aba
  useEffect(() => {
    const open = () => setTab('printer');
    window.addEventListener(APP_OPEN_PRINTER_EVENT, open);
    return () => window.removeEventListener(APP_OPEN_PRINTER_EVENT, open);
  }, []);

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-primary px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)] text-primary-foreground">
        <div className="min-w-0">
          <p className="text-xs opacity-80">Mostralo Pedidos</p>
          {availableStores.length > 1 ? (
            <select value={storeId ?? ''} onChange={e => switchStore(e.target.value)} aria-label="Trocar loja"
              className="max-w-[60vw] truncate bg-transparent text-base font-bold outline-none [&>option]:text-foreground">
              {availableStores.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
            </select>
          ) : (
            <p className="truncate text-base font-bold">{storeName ?? 'Minha loja'}</p>
          )}
        </div>
        <button type="button" onClick={() => signOut('/app/pedidos')} className="flex min-h-11 items-center gap-1 rounded-md px-2 text-sm font-semibold" aria-label="Sair">
          <LogOut className="h-4 w-4" />Sair
        </button>
      </header>

      <nav className="sticky top-[calc(env(safe-area-inset-top)+64px)] z-20 grid grid-cols-3 gap-2 bg-background px-3 py-2 shadow-sm">
        {([['orders', 'Pedidos', ShoppingBag], ['products', 'Produtos', Package], ['printer', 'Impressora', Printer]] as const).map(([id, label, Icon]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={`flex min-h-11 items-center justify-center gap-1.5 rounded-lg text-sm font-bold ${tab === id ? 'bg-foreground text-background' : 'border'}`}>
            <Icon className="h-4 w-4 shrink-0" />{label}
          </button>
        ))}
      </nav>

      <div className={tab === 'orders' ? 'p-2 sm:p-4' : 'hidden'}>
        <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
          <OrdersPage />
        </Suspense>
      </div>
      {tab === 'products' && (
        <div className="p-3 sm:p-4">
          <AppProductsTab storeId={storeId} />
        </div>
      )}
      {tab === 'printer' && (
        <div className="p-4">
          {native
            ? <NativePrinterSettings storeName={storeName ?? 'Loja'} />
            : <p className="text-sm text-muted-foreground">A impressora térmica é configurada no app Mostralo Pedidos (Android).</p>}
        </div>
      )}
    </div>
  );
}
