// Conectar WhatsApp: QR Code ou código de pareamento.
// JSX movido da MasterWhatsAppPage sem mudança.
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, QrCode, CheckCircle, AlertCircle, Key, Hash } from "lucide-react";
import type { MasterWhatsAppPageApi } from "./types";

export function ConnectWhatsAppCard({ wa, tests, cfg }: MasterWhatsAppPageApi) {
  const { qrCode, setQrCode, instanceStatus, setInstanceStatus, loadingAction, setLoadingAction, connectionMethod, setConnectionMethod, pairingPhone, setPairingPhone, pairingCode, setPairingCode } = wa;
  const { config } = cfg;

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          Conectar WhatsApp
        </CardTitle>
        <CardDescription>
          Escolha o método de conexão
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toggle método de conexão */}
        {config?.instance_name && instanceStatus !== 'connected' && instanceStatus !== 'open' && (
          <div className="flex gap-2">
            <Button
              variant={connectionMethod === 'qrcode' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              disabled={loadingAction === 'connect'}
              onClick={async () => {
                setConnectionMethod('qrcode');
                setPairingCode(null);
                setLoadingAction('connect');
                try {
                  const response = await supabase.functions.invoke('master-whatsapp-instance', {
                    body: { action: 'connect', connectionMethod: 'qrcode' }
                  });
                  
                  console.log('[MasterWA] Connect response:', response);
                  
                  // Tratar caso onde data pode vir como string
                  let result = response.data;
                  if (typeof result === 'string') {
                    try { result = JSON.parse(result); } catch { /* ignore */ }
                  }
                  
                  if (response.error) throw new Error(response.error.message);
                  if (result?.error) throw new Error(result.error);
                  
                  console.log('[MasterWA] Parsed result:', { hasQR: !!result?.qrcode, status: result?.status });
                  
                  if (result?.qrcode) {
                    setQrCode(result.qrcode);
                    setInstanceStatus('connecting');
                    toast.success('QR Code gerado! Escaneie com seu WhatsApp.');
                  } else if (result?.status === 'connected') {
                    setInstanceStatus('connected');
                    setQrCode(null);
                    toast.success('WhatsApp já está conectado!');
                  } else {
                    console.warn('[MasterWA] Resposta sem QR:', result);
                    toast.info('QR Code não disponível. Tente "Atualizar Status".');
                  }
                } catch (err) {
                  console.error('[MasterWA] Erro:', err);
                  toast.error(err instanceof Error ? err.message : 'Erro ao gerar QR Code');
                } finally {
                  setLoadingAction(null);
                }
              }}
            >
              {loadingAction === 'connect' && connectionMethod === 'qrcode' ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <QrCode className="w-4 h-4 mr-1" />
              )}
              QR Code
            </Button>
            <Button
              variant={connectionMethod === 'pairing_code' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => { setConnectionMethod('pairing_code'); setQrCode(null); }}
            >
              <Hash className="w-4 h-4 mr-1" />
              Código de Pareamento
            </Button>
          </div>
        )}

        {/* Pairing Code */}
        {connectionMethod === 'pairing_code' && config?.instance_name && instanceStatus !== 'connected' && instanceStatus !== 'open' ? (
          <div className="space-y-3">
            {pairingCode ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-3">
                <p className="text-xs text-muted-foreground">Digite este código no seu WhatsApp:</p>
                <p className="text-3xl font-bold font-mono tracking-widest text-primary">{pairingCode}</p>
                <p className="text-xs text-muted-foreground">
                  No celular: WhatsApp → ⋮ → Aparelhos conectados → Conectar aparelho → Conectar com número de telefone
                </p>
                <Button variant="outline" size="sm" onClick={() => setPairingCode(null)}>
                  Gerar novo código
                </Button>
              </div>
            ) : (
              <div className="space-y-3 py-4">
                <div className="space-y-2">
                  <Label className="text-sm">Número do WhatsApp (com DDI)</Label>
                  <Input
                    placeholder="5561999999999"
                    value={pairingPhone}
                    onChange={(e) => setPairingPhone(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Ex: 5561999999999 (DDI + DDD + número)</p>
                </div>
                <Button
                  className="w-full"
                  disabled={!pairingPhone.trim() || loadingAction === 'connect'}
                  onClick={async () => {
                    setLoadingAction('connect');
                    try {
                      const { data, error } = await supabase.functions.invoke('master-whatsapp-instance', {
                        body: { action: 'connect', connectionMethod: 'pairing_code', pairingPhone }
                      });
                      if (error) throw new Error(error.message);
                      if (data?.error) throw new Error(data.error);
                      if (data?.pairingCode) {
                        setPairingCode(data.pairingCode);
                        toast.success('Código de pareamento gerado!');
                      } else {
                        toast.error('Não foi possível gerar o código');
                      }
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : 'Erro ao gerar código');
                    } finally {
                      setLoadingAction(null);
                    }
                  }}
                >
                  {loadingAction === 'connect' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Key className="w-4 h-4 mr-2" />
                  )}
                  Gerar Código de Pareamento
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* QR Code display */
          <>
            {qrCode ? (
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img 
                  src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`} 
                  alt="QR Code" 
                  className="w-64 h-64"
                />
              </div>
            ) : instanceStatus === 'open' || instanceStatus === 'connected' ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                <p className="text-lg font-medium">WhatsApp Conectado!</p>
                <p className="text-sm text-muted-foreground">
                  Configure os bots na aba "Configurar Bots"
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {config?.instance_name 
                    ? 'Clique em "Atualizar Status" para gerar QR Code'
                    : 'Crie uma instância para começar'}
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
    </>
  );
}
