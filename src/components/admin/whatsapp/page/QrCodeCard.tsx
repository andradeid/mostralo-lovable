// QR Code / código de pareamento com contagem.
// JSX movido da WhatsAppInstancePage sem mudança.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw, QrCode, Phone } from "lucide-react";
import type { WhatsAppInstancePageCtx } from "@/hooks/whatsappInstance/useWhatsAppInstancePage";

export function QrCodeCard({ ctx }: { ctx: WhatsAppInstancePageCtx & { isConnected?: boolean } }) {
  const { instance, actionLoading, qrCode, pairCode, connectionMode, setConnectionMode, pairingPhone, setPairingPhone, qrCountdown, isUazapiInstance, handleConnect } = ctx;

  return (
    <>
      {((isUazapiInstance && instance.status !== 'connected') || (qrCode || pairCode || instance.qr_code) && instance.status !== 'connected') && (
        <Card>
          <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
              <QrCode className="h-4 w-4 sm:h-5 sm:w-5" />
              {pairCode ? 'Código de pareamento' : 'Conecte seu WhatsApp'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center p-3 sm:p-6 pt-0 space-y-3">
            {/* Seletor de modo - apenas UaZapi */}
            {isUazapiInstance && (
              <div className="flex gap-2 w-full max-w-xs">
                <Button
                  variant={connectionMode === 'qrcode' ? 'default' : 'outline'}
                  size="sm"
                  className={`flex-1 text-xs ${connectionMode === 'qrcode' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                  onClick={() => {
                    setConnectionMode('qrcode');
                    handleConnect();
                  }}
                  disabled={actionLoading === 'connect'}
                >
                  <QrCode className="h-3 w-3 mr-1" />
                  QR Code
                </Button>
                <Button
                  variant={connectionMode === 'paircode' ? 'default' : 'outline'}
                  size="sm"
                  className={`flex-1 text-xs ${connectionMode === 'paircode' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                  onClick={() => setConnectionMode('paircode')}
                  disabled={actionLoading === 'connect'}
                >
                  <Phone className="h-3 w-3 mr-1" />
                  Código por número
                </Button>
              </div>
            )}

            {/* Input de telefone para pareamento */}
            {isUazapiInstance && connectionMode === 'paircode' && !pairCode && (
              <div className="flex gap-2 w-full max-w-xs">
                <Input
                  placeholder="55 + DDD + número (ex. 5561999999999)"
                  value={pairingPhone}
                  onChange={(e) => setPairingPhone(e.target.value.replace(/\D/g, ''))}
                  className="h-9 text-sm flex-1"
                />
                <Button 
                  size="sm"
                  onClick={() => handleConnect(pairingPhone)}
                  disabled={!pairingPhone || actionLoading === 'connect'}
                >
                  {actionLoading === 'connect' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Gerar'
                  )}
                </Button>
              </div>
            )}

            {/* Estado inicial UaZapi - sem QR nem pair code ainda */}
            {isUazapiInstance && !qrCode && !pairCode && !instance.qr_code && connectionMode === 'qrcode' && (
              <Button 
                onClick={() => handleConnect()} 
                disabled={actionLoading === 'connect'}
                className="w-full max-w-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {actionLoading === 'connect' ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando QR Code...</>
                ) : (
                  <><QrCode className="h-4 w-4 mr-2" /> Gerar QR Code</>
                )}
              </Button>
            )}

            {/* QR Code */}
            {(qrCode || instance.qr_code) && !pairCode && (
              <div className="bg-white p-2 sm:p-4 rounded-lg">
                <img 
                  src={qrCode || instance.qr_code} 
                  alt="QR Code" 
                  className="h-40 w-40 sm:h-64 sm:w-64"
                />
              </div>
            )}
            {(qrCode || instance.qr_code) && !pairCode && (
              <ol className="text-xs sm:text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Abra o WhatsApp no celular da loja</li>
                <li>Toque em <strong>Aparelhos conectados</strong> → <strong>Conectar aparelho</strong></li>
                <li>Aponte a câmera para este QR Code</li>
              </ol>
            )}

            {/* Código de Pareamento */}
            {pairCode && (
              <div className="bg-muted p-4 sm:p-6 rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-2">Digite este código no WhatsApp:</p>
                <p className="text-2xl sm:text-4xl font-mono font-bold tracking-widest text-primary">
                  {pairCode}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  WhatsApp {'>'} Dispositivos conectados {'>'} Conectar dispositivo {'>'} Conectar com número de telefone
                </p>
              </div>
            )}

            {/* Timer Countdown */}
            {qrCountdown > 0 && (
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${qrCountdown > 30 ? 'bg-green-500' : qrCountdown > 10 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                  <span className="text-sm font-mono font-semibold tabular-nums">
                    {Math.floor(qrCountdown / 60).toString().padStart(2, '0')}:{(qrCountdown % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
                  {pairCode ? 'O código expira e será regenerado automaticamente' : 'O QR Code expira e será regenerado automaticamente'}
                </p>
                {/* Progress bar */}
                <div className="w-full max-w-xs h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 rounded-full ${qrCountdown > 30 ? 'bg-green-500' : qrCountdown > 10 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${(qrCountdown / (pairCode ? 300 : 120)) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Botão manual de regenerar (só quando já existe um código na tela) */}
            {(qrCode || pairCode || instance.qr_code) && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleConnect(connectionMode === 'paircode' ? pairingPhone : undefined)}
              disabled={actionLoading === 'connect'}
              className="text-xs"
            >
              {actionLoading === 'connect' ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3 mr-1" />
              )}
              Gerar novo código
            </Button>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
