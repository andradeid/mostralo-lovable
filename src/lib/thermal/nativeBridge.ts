// Ponte com o app Android "Mostralo Pedidos" (Capacitor). No navegador comum tudo aqui fica desligado.
// Os plugins nativos são acessados pela ponte que o app injeta (window.Capacitor), sem dependência no site.

type Listener = { remove: () => Promise<void> };
type NativePlugin = Record<string, (opts?: unknown) => Promise<any>> & {
  addListener: (event: string, cb: (data: any) => void) => Promise<Listener> | Listener;
};

interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
  registerPlugin?: (name: string) => NativePlugin;
}

const cap = (): CapacitorGlobal | undefined => (typeof window === 'undefined' ? undefined : (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor);

/** Está rodando dentro do app Mostralo Pedidos? */
export function isNativeApp(): boolean {
  try { return !!cap()?.isNativePlatform?.(); } catch { return false; }
}

const cache = new Map<string, NativePlugin>();
export function nativePlugin(name: 'CapacitorThermalPrinter' | 'TcpSocket'): NativePlugin {
  const c = cap();
  if (!c?.registerPlugin) throw new Error('Disponível só no app Mostralo Pedidos');
  if (!cache.has(name)) cache.set(name, c.registerPlugin(name));
  return cache.get(name)!;
}
