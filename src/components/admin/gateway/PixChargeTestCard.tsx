import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, 
  QrCode, 
  Copy, 
  CheckCircle2,
  FlaskConical,
  ExternalLink
} from "lucide-react";

interface PixChargeResult {
  txid: string;
  status: string;
  valor: string;
  pixCopiaECola: string;
  qrCodeBase64?: string;
  ambiente: string;
  expiracao: number;
}

interface PixChargeTestCardProps {
  isConfigured: boolean;
  environment: "sandbox" | "production";
}

export function PixChargeTestCard({ isConfigured, environment }: PixChargeTestCardProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [valor, setValor] = useState("1.00");
  const [descricao, setDescricao] = useState("Teste Mostralo");
  const [result, setResult] = useState<PixChargeResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreateCharge = async () => {
    if (!isConfigured) {
      toast({
        title: "Configure primeiro",
        description: "Salve as credenciais e teste a conexão antes de gerar cobranças.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('efi-create-pix-charge', {
        body: {
          valor: valor,
          descricao: descricao,
          expiracao_segundos: 3600, // 1 hora
        },
      });

      if (error) throw error;

      if (data.success) {
        setResult(data);
        toast({
          title: "Cobrança criada!",
          description: `TXID: ${data.txid}`,
        });
      } else {
        throw new Error(data.error || "Falha ao criar cobrança");
      }
    } catch (error) {
      console.error("Erro ao criar cobrança:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar cobrança",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (result?.pixCopiaECola) {
      await navigator.clipboard.writeText(result.pixCopiaECola);
      setCopied(true);
      toast({
        title: "Copiado!",
        description: "Código PIX copiado para a área de transferência.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    return isNaN(num) ? "R$ 0,00" : `R$ ${num.toFixed(2).replace('.', ',')}`;
  };

  return (
    <Card className={environment === "production" ? "border-blue-500/50" : "border-yellow-500/50"}>
      <CardHeader className={environment === "production" ? "bg-blue-500/5" : "bg-yellow-500/5"}>
        <CardTitle className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5" />
          🧪 Testar Cobrança PIX
        </CardTitle>
        <CardDescription>
          Gere uma cobrança de teste para validar a integração completa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {/* Inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="valor">Valor (R$)</Label>
            <Input
              id="valor"
              type="text"
              placeholder="1.00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input
              id="descricao"
              type="text"
              placeholder="Teste Mostralo"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <Button
          onClick={handleCreateCharge}
          disabled={loading || !isConfigured}
          className="w-full"
          variant={environment === "production" ? "default" : "secondary"}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <QrCode className="h-4 w-4 mr-2" />
              Gerar Cobrança PIX
            </>
          )}
        </Button>

        {/* Result */}
        {result && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {result.status.toUpperCase()}
              </Badge>
              <Badge variant="secondary">
                {result.ambiente === "production" ? "🏭 Produção" : "🧪 Sandbox"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">TXID</p>
                <p className="font-mono text-xs truncate">{result.txid}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Valor</p>
                <p className="font-semibold">{formatCurrency(result.valor)}</p>
              </div>
            </div>

            {/* QR Code */}
            {result.qrCodeBase64 && (
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img 
                  src={result.qrCodeBase64} 
                  alt="QR Code PIX" 
                  className="w-48 h-48"
                />
              </div>
            )}

            {/* Copia e Cola */}
            {result.pixCopiaECola && (
              <div className="space-y-2">
                <Label>Código PIX Copia e Cola</Label>
                <div className="relative">
                  <Input
                    value={result.pixCopiaECola}
                    readOnly
                    className="pr-10 font-mono text-xs"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center">
              ⏱️ Expira em {Math.floor(result.expiracao / 60)} minutos
            </p>

            {environment === "sandbox" && (
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  ⚠️ Ambiente Sandbox - Nenhum pagamento real será processado
                </p>
              </div>
            )}
          </div>
        )}

        {!isConfigured && (
          <p className="text-xs text-muted-foreground text-center">
            Configure e teste a conexão primeiro para habilitar cobranças
          </p>
        )}
      </CardContent>
    </Card>
  );
}
