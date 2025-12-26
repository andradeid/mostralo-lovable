import { useState } from 'react';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { useTableServiceConfig } from '@/hooks/useTableServiceConfig';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, QrCode, Settings, Download, Printer, Save } from 'lucide-react';
import { toast } from 'sonner';
import { ModuleGate } from '@/components/admin/ModuleGate';
import { TableQRCodeGenerator } from '@/components/table/TableQRCodeGenerator';

export default function TableQRCodePage() {
  const { storeId } = useStoreAccess();
  const { config, isLoading, updateConfig, isUpdating } = useTableServiceConfig(storeId);

  const [tableCount, setTableCount] = useState<number>(config?.table_count || 10);
  const [requireApproval, setRequireApproval] = useState(config?.require_waiter_approval ?? true);
  const [requirePassword, setRequirePassword] = useState(config?.customer_password_required ?? true);

  // Buscar slug da loja
  const { data: store } = useQuery({
    queryKey: ['store-slug', storeId],
    queryFn: async () => {
      if (!storeId) return null;
      const { data, error } = await supabase
        .from('stores')
        .select('slug, name')
        .eq('id', storeId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!storeId
  });

  // Atualizar estados quando config carregar
  useState(() => {
    if (config) {
      setTableCount(config.table_count || 10);
      setRequireApproval(config.require_waiter_approval);
      setRequirePassword(config.customer_password_required);
    }
  });

  const handleSaveConfig = async () => {
    await updateConfig({
      table_count: tableCount,
      require_waiter_approval: requireApproval,
      customer_password_required: requirePassword
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ModuleGate moduleKey="self_service_table" storeId={storeId}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <QrCode className="h-6 w-6" />
            Cardápio na Mesa
          </h1>
          <p className="text-muted-foreground">
            Configure o módulo de pedidos via QR Code e gere os códigos para suas mesas
          </p>
        </div>

        <Tabs defaultValue="config" className="space-y-4">
          <TabsList>
            <TabsTrigger value="config" className="gap-2">
              <Settings className="h-4 w-4" />
              Configurações
            </TabsTrigger>
            <TabsTrigger value="qrcodes" className="gap-2">
              <QrCode className="h-4 w-4" />
              QR Codes
            </TabsTrigger>
          </TabsList>

          {/* Tab: Configurações */}
          <TabsContent value="config" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Módulo</CardTitle>
                <CardDescription>
                  Defina como o cardápio na mesa funciona para seus clientes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Aprovação do garçom */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Exigir aprovação do garçom</Label>
                    <p className="text-sm text-muted-foreground">
                      Pedidos ficam aguardando aprovação antes de ir para a cozinha
                    </p>
                  </div>
                  <Switch
                    checked={requireApproval}
                    onCheckedChange={setRequireApproval}
                  />
                </div>

                {/* Senha do cliente */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Exigir senha do cliente</Label>
                    <p className="text-sm text-muted-foreground">
                      Clientes criam uma senha de 4-6 dígitos para acessar
                    </p>
                  </div>
                  <Switch
                    checked={requirePassword}
                    onCheckedChange={setRequirePassword}
                  />
                </div>

                {/* Número de mesas */}
                <div className="space-y-2">
                  <Label htmlFor="tableCount">Número de mesas</Label>
                  <Input
                    id="tableCount"
                    type="number"
                    min={1}
                    max={100}
                    value={tableCount}
                    onChange={(e) => setTableCount(Number(e.target.value))}
                    className="w-32"
                  />
                  <p className="text-sm text-muted-foreground">
                    Quantidade de QR codes que serão gerados
                  </p>
                </div>

                <Button onClick={handleSaveConfig} disabled={isUpdating}>
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar Configurações
                </Button>
              </CardContent>
            </Card>

            {/* Info sobre funcionamento */}
            <Card>
              <CardHeader>
                <CardTitle>Como funciona</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">1</div>
                  <div>
                    <p className="font-medium text-foreground">Cliente escaneia o QR Code</p>
                    <p>Cada mesa tem um QR code único que leva direto para o cardápio</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">2</div>
                  <div>
                    <p className="font-medium text-foreground">Cliente se identifica</p>
                    <p>Informa nome, telefone e cria uma senha simples</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">3</div>
                  <div>
                    <p className="font-medium text-foreground">Faz pedidos pelo celular</p>
                    <p>Navega o cardápio e adiciona itens à sua comanda individual</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">4</div>
                  <div>
                    <p className="font-medium text-foreground">Garçom aprova (opcional)</p>
                    <p>Se ativado, os pedidos aguardam aprovação antes de ir para a cozinha</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">5</div>
                  <div>
                    <p className="font-medium text-foreground">Pagamento com garçom/caixa</p>
                    <p>Ao final, o garçom fecha a comanda e realiza a cobrança</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: QR Codes */}
          <TabsContent value="qrcodes">
            {store?.slug && (
              <TableQRCodeGenerator 
                storeSlug={store.slug} 
                storeName={store.name}
                tableCount={config?.table_count || tableCount}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ModuleGate>
  );
}
