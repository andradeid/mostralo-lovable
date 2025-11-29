import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, Download, CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  connectQZ,
  disconnectQZ,
  getPrinters,
  getQZStatus,
  testPrint,
  isQZAvailable,
} from "@/utils/qzTray";

interface QZTraySetupProps {
  selectedPrinter?: string;
  onPrinterSelect: (printer: string) => void;
}

export const QZTraySetup = ({ selectedPrinter, onPrinterSelect }: QZTraySetupProps) => {
  const [status, setStatus] = useState<ReturnType<typeof getQZStatus>>({
    installed: false,
    connected: false,
  });
  const [printers, setPrinters] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = () => {
    const currentStatus = getQZStatus();
    setStatus(currentStatus);
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      await connectQZ();
      checkStatus();
      
      // Carregar impressoras disponíveis
      const availablePrinters = await getPrinters();
      setPrinters(availablePrinters);
      
      toast.success('Conectado ao QZ Tray!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao conectar QZ Tray');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectQZ();
      checkStatus();
      setPrinters([]);
      toast.success('Desconectado do QZ Tray');
    } catch (error: any) {
      toast.error('Erro ao desconectar');
    }
  };

  const handleTestPrint = async () => {
    if (!selectedPrinter) {
      toast.error('Selecione uma impressora primeiro');
      return;
    }

    setTesting(true);
    try {
      await testPrint(selectedPrinter);
      toast.success('Impressão de teste enviada!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao testar impressão');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Printer className="h-5 w-5" />
            QZ Tray - Corte Automático
          </h3>
          <p className="text-sm text-muted-foreground">
            Software gratuito para impressão térmica com comandos ESC/POS
          </p>
        </div>
        
        <div className="flex gap-2">
          {status.installed ? (
            status.connected ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Conectado
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <XCircle className="h-3 w-3" />
                Desconectado
              </Badge>
            )
          ) : (
            <Badge variant="destructive" className="gap-1">
              <XCircle className="h-3 w-3" />
              Não instalado
            </Badge>
          )}
        </div>
      </div>

      {!status.installed ? (
        <Alert>
          <Download className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">QZ Tray não está instalado</p>
              <p className="text-sm">
                Para usar o corte automático, você precisa instalar o QZ Tray (software gratuito).
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://qz.io/download/', '_blank')}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Baixar QZ Tray
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {!status.connected ? (
            <Button
              onClick={handleConnect}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                'Conectar ao QZ Tray'
              )}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="printer-select">Impressora</Label>
                <Select value={selectedPrinter} onValueChange={onPrinterSelect}>
                  <SelectTrigger id="printer-select">
                    <SelectValue placeholder="Selecione uma impressora" />
                  </SelectTrigger>
                  <SelectContent>
                    {printers.map((printer) => (
                      <SelectItem key={printer} value={printer}>
                        {printer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleTestPrint}
                  disabled={!selectedPrinter || testing}
                  variant="outline"
                  className="flex-1"
                >
                  {testing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Imprimindo...
                    </>
                  ) : (
                    <>
                      <Printer className="h-4 w-4 mr-2" />
                      Testar Impressão
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={handleDisconnect}
                  variant="outline"
                >
                  Desconectar
                </Button>
              </div>

              {status.version && (
                <p className="text-xs text-muted-foreground text-center">
                  Versão: {status.version}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </Card>
  );
};
