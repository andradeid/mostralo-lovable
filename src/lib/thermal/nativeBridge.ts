// Ponte com o app Android "Mostralo Pedidos" (Capacitor). No navegador comum tudo aqui fica desligado.
// Os plugins nativos são acessados pela ponte que o app injeta (window.Capacitor), sem dependência no site.

type Listener = { remove: () => Promise<void> };
type NativePlugin = Record<string, (opts?: unknown) => Promise<any>> & {
  addListener: (event: string, cb: (data: any) => void) => Promise<Listener> | Listener;
};

interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
  registerPlugin?: (name: string) => NativePlugin;
  PluginHeaders?: { name: string; methods: { name: string; rtype?: string }[] }[];
  nativePromise?: (plugin: string, method: string, opts?: unknown) => Promise<any>;
  nativeCallback?: (plugin: string, method: string, opts: unknown, cb: (data: any, err?: any) => void) => string;
}

const cap = (): CapacitorGlobal | undefined => (typeof window === 'undefined' ? undefined : (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor);

/** Está rodando dentro do app Mostralo Pedidos? */
export function isNativeApp(): boolean {
  try { return !!cap()?.isNativePlatform?.(); } catch { return false; }
}

/**
 * O site é carregado de fora (não empacota @capacitor/core), então a ponte injetada pelo Android
 * não tem registerPlugin. Montamos o acesso ao plugin direto com nativePromise / nativeCallback,
 * do mesmo jeito que o @capacitor/core faz por baixo.
 */
function bridgePlugin(c: CapacitorGlobal, name: string): NativePlugin {
  if (!c.nativePromise || !c.nativeCallback) throw new Error('Ponte nativa indisponível neste app');
  const header = c.PluginHeaders?.find(h => h.name === name);
  if (c.PluginHeaders && !header) throw new Error(`Plugin ${name} não existe neste APK (instale o APK novo)`);
  const call = c.nativePromise.bind(c);
  const cb = c.nativeCallback.bind(c);
  return new Proxy({} as NativePlugin, {
    get(_t, prop) {
      if (typeof prop !== 'string' || prop === 'then') return undefined;
      if (prop === 'addListener') {
        return (eventName: string, listener: (data: any) => void) => {
          const callbackId = cb(name, 'addListener', { eventName }, (data: any) => listener(data));
          const remove = async () => { await call(name, 'removeListener', { eventName, callbackId }).catch(() => undefined); };
          return Promise.resolve({ remove });
        };
      }
      const rtype = header?.methods.find(m => m.name === prop)?.rtype;
      if (header && !rtype) return () => Promise.reject(new Error(`${name}.${prop}() not implemented`));
      return (opts?: unknown) => call(name, prop, opts ?? {});
    },
  });
}

const cache = new Map<string, NativePlugin>();
export function nativePlugin(name: 'CapacitorThermalPrinter' | 'TcpSocket' | 'PairedPrinters'): NativePlugin {
  const c = cap();
  if (!c || !isNativeApp()) throw new Error('Disponível só no app Mostralo Pedidos');
  if (!cache.has(name)) cache.set(name, c.registerPlugin ? c.registerPlugin(name) : bridgePlugin(c, name));
  return cache.get(name)!;
}

/** Plugins que o APK instalado oferece (para o diagnóstico). */
export function nativePluginNames(): string[] {
  return (cap()?.PluginHeaders ?? []).map(h => h.name);
}
