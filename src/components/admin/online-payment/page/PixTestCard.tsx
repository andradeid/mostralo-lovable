// Card "Testar Cobrança PIX": gera o PIX de teste e mostra QR Code, contagem
// regressiva, código copia e cola e situação do split (pago/expirado/pendente).
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, CheckCircle2, Clock, XCircle, Loader2, RefreshCw, Copy, QrCode, TestTube2 } from 'lucide-react';
import { brl } from '@/lib/brl';
import { formatCurrency } from "@/lib/onlinePayment/efiFormat";
import type { PixTestCharge } from "@/hooks/onlinePayment/usePixTestCharge";

interface Props {
  pixTest: PixTestCharge;
}

export function PixTestCard({ pixTest }: Props) {
  const {
    copied,
    testValue,
    setTestValue,
    testDescription,
    setTestDescription,
    testLoading,
    testResult,
    setTestResult,
    testPaymentStatus,
    setTestPaymentStatus,
    testTimeRemaining,
    setTestTimeRemaining,
    checkingStatus,
    copyToClipboard,
    handleCreateTestCharge,
  } = pixTest;

  return (
            <Card className="border-dashed border-2 border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TestTube2 className="h-5 w-5 text-primary" />
                  Testar Cobrança PIX
                </CardTitle>
                <CardDescription>
                  Gere uma cobrança de teste para validar que o split payment está funcionando
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="testValue">Valor (R$)</Label>
                    <Input
                      id="testValue"
                      value={testValue}
                      onChange={(e) => setTestValue(e.target.value)}
                      placeholder="1.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="testDesc">Descrição</Label>
                    <Input
                      id="testDesc"
                      value={testDescription}
                      onChange={(e) => setTestDescription(e.target.value)}
                      placeholder="Descrição do teste"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleCreateTestCharge}
                  disabled={testLoading}
                  className="w-full"
                >
                  {testLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <QrCode className="h-4 w-4 mr-2" />
                      Gerar PIX de Teste
                    </>
                  )}
                </Button>

                {testResult && (
                  <div className="space-y-4 pt-4 border-t">
                    {/* Payment Status: PAID */}
                    {testPaymentStatus === "paid" && (
                      <div className="flex flex-col items-center gap-3 py-8 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <CheckCircle2 className="w-16 h-16 text-green-500" />
                        <p className="text-lg font-semibold text-green-600 dark:text-green-400">Pagamento Confirmado!</p>
                        <p className="text-sm text-muted-foreground text-center">O split payment foi processado com sucesso</p>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setTestResult(null);
                            setTestPaymentStatus("pending");
                            setTestTimeRemaining(0);
                          }}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Fazer Novo Teste
                        </Button>
                      </div>
                    )}

                    {/* Payment Status: EXPIRED */}
                    {testPaymentStatus === "expired" && (
                      <div className="flex flex-col items-center gap-3 py-6 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                        <XCircle className="w-12 h-12 text-orange-500" />
                        <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">QR Code Expirado</p>
                        <p className="text-sm text-muted-foreground text-center">O tempo para pagamento esgotou</p>
                        <Button onClick={handleCreateTestCharge} disabled={testLoading}>
                          {testLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Gerando...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Gerar Novo QR Code
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Payment Status: PENDING */}
                    {testPaymentStatus === "pending" && (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800">
                              {testResult.status}
                            </Badge>
                            {testResult.splitApplied && (
                              <Badge className="bg-purple-500">Split ✓</Badge>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            TXID: {testResult.txid?.slice(0, 12)}...
                          </span>
                        </div>

                        {/* Timer */}
                        <div className="flex items-center justify-center gap-2 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 px-4 py-2 rounded-full">
                          <Clock className="w-4 h-4" />
                          <span className="font-mono font-semibold">
                            {Math.floor(testTimeRemaining / 60)}:{(testTimeRemaining % 60).toString().padStart(2, "0")}
                          </span>
                        </div>

                        {testResult.splitWarning && (
                          <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900">
                            <Info className="h-4 w-4 text-yellow-600" />
                            <AlertDescription className="text-yellow-800 dark:text-yellow-300 text-sm">
                              <strong>Aviso:</strong> {testResult.splitWarning}
                            </AlertDescription>
                          </Alert>
                        )}

                        <div className="text-center space-y-2">
                          <p className="text-2xl font-bold text-primary">
                            {formatCurrency(testResult.valor)}
                          </p>
                          {testResult.qrcode && (
                            <img
                              src={testResult.qrcode.startsWith('data:') ? testResult.qrcode : `data:image/png;base64,${testResult.qrcode}`}
                              alt="QR Code PIX"
                              className="mx-auto w-48 h-48 rounded-lg border"
                            />
                          )}
                        </div>

                        {/* Polling indicator */}
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className={`w-4 h-4 ${checkingStatus ? 'animate-spin' : ''}`} />
                          <span>Aguardando pagamento...</span>
                        </div>

                        <div className="space-y-2">
                          <Label>Código Copia e Cola</Label>
                          <div className="flex gap-2">
                            <Input
                              value={testResult.pixCopiaECola}
                              readOnly
                              className="font-mono text-xs"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => copyToClipboard(testResult.pixCopiaECola, 'Código PIX')}
                            >
                              {copied ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>

                        {testResult.splitApplied ? (
                          <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800 dark:text-green-300 text-sm">
                              <strong>Split Payment Ativo:</strong> Ao pagar este PIX, você receberá 91,81%
                              ({brl((parseFloat(testResult.valor) * 0.9181))}) e a plataforma 8,19%.
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900">
                            <Info className="h-4 w-4 text-amber-600" />
                            <AlertDescription className="text-amber-800 dark:text-amber-300 text-sm space-y-2">
                              <p><strong>⚠️ Split Payment não aplicado</strong></p>
                              <p>O valor total será creditado na conta principal. Para habilitar o split:</p>
                              <ol className="list-decimal list-inside text-xs space-y-1 mt-2">
                                <li>Acesse o <a href="https://app.gerencianet.com.br" target="_blank" rel="noopener" className="underline font-medium">Painel EFI</a></li>
                                <li>Vá em <strong>API → Minhas Aplicações</strong></li>
                                <li>Selecione sua aplicação</li>
                                <li>Em <strong>Escopos</strong>, ative <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">gn.split.write</code></li>
                                <li>Salve e teste novamente</li>
                              </ol>
                              <p className="text-xs mt-2 opacity-80">
                                Se o escopo não aparecer, entre em contato com o suporte EFI para solicitar a habilitação.
                              </p>
                            </AlertDescription>
                          </Alert>
                        )}
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
  );
}
