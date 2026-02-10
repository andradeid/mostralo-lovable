import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Loader2, Store } from "lucide-react";

interface StoreTracking {
  id: string;
  name: string;
  slug: string;
  googleAnalyticsId: string | null;
  facebookPixelId: string | null;
}

export function TrackingOverview() {
  const [stores, setStores] = useState<StoreTracking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from("stores")
        .select("id, name, slug, store_configurations(google_analytics_id, facebook_pixel_id)")
        .order("name");

      if (error) throw error;

      const mapped: StoreTracking[] = (data || []).map((store: any) => {
        const config = Array.isArray(store.store_configurations)
          ? store.store_configurations[0]
          : store.store_configurations;
        return {
          id: store.id,
          name: store.name,
          slug: store.slug,
          googleAnalyticsId: config?.google_analytics_id || null,
          facebookPixelId: config?.facebook_pixel_id || null,
        };
      });

      setStores(mapped);
    } catch (err) {
      console.error("Erro ao buscar lojas:", err);
    } finally {
      setLoading(false);
    }
  };

  const configuredCount = stores.filter(
    (s) => s.googleAnalyticsId || s.facebookPixelId
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Lojas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stores.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Com Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{configuredCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sem Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{stores.length - configuredCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Status de Tracking por Loja
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loja</TableHead>
                <TableHead className="text-center">Google Analytics</TableHead>
                <TableHead className="text-center">Facebook Pixel</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.map((store) => (
                <TableRow key={store.id}>
                  <TableCell className="font-medium">{store.name}</TableCell>
                  <TableCell className="text-center">
                    {store.googleAnalyticsId ? (
                      <Badge variant="default" className="bg-green-600 gap-1">
                        <CheckCircle className="h-3 w-3" /> Configurado
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <XCircle className="h-3 w-3" /> Não configurado
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {store.facebookPixelId ? (
                      <Badge variant="default" className="bg-green-600 gap-1">
                        <CheckCircle className="h-3 w-3" /> Configurado
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <XCircle className="h-3 w-3" /> Não configurado
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {stores.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    Nenhuma loja encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
