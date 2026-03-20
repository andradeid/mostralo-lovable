import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";
import type { ModuleStoreData } from "@/hooks/useSystemHealth";

interface Props {
  data: ModuleStoreData[] | null;
  isLoading: boolean;
}

export function ModulesCard({ data, isLoading }: Props) {
  const totalEnabled = data?.reduce((s, d) => s + d.enabledModules, 0) ?? 0;
  const totalDisabled = data?.reduce((s, d) => s + d.disabledModules, 0) ?? 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Módulos por Loja
          </CardTitle>
          {data && (
            <div className="flex gap-3 text-xs">
              <span className="text-green-500 font-medium">{totalEnabled} ativos</span>
              <span className="text-red-500 font-medium">{totalDisabled} bloqueados</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-10 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b">
                  <th className="text-left py-2 font-medium">Loja</th>
                  <th className="text-center py-2 font-medium">Total</th>
                  <th className="text-center py-2 font-medium">Ativos</th>
                  <th className="text-center py-2 font-medium">Bloqueados</th>
                </tr>
              </thead>
              <tbody>
                {data.map((store) => (
                  <tr key={store.storeId} className="border-b border-muted/50 last:border-0">
                    <td className="py-2 font-medium truncate max-w-[200px]">{store.storeName}</td>
                    <td className="text-center py-2 font-mono">{store.totalModules}</td>
                    <td className="text-center py-2 font-mono text-green-500">{store.enabledModules}</td>
                    <td className="text-center py-2 font-mono text-red-500">{store.disabledModules}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Sem dados</p>
        )}
      </CardContent>
    </Card>
  );
}
