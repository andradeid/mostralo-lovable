// Prévia do público, validação e estimativa.
// JSX movido da WhatsAppCampaignNewPage sem mudança.
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Users,
  Eye,
  Shield,
  Timer,
  CheckCircle,
  XCircle,
  Phone,
  HelpCircle,
} from "lucide-react";
import type { CampaignNewPageCtx } from "@/hooks/whatsappCampaign/useCampaignNewPage";

export function CampaignPreviewCard({ ctx }: { ctx: CampaignNewPageCtx }) {
  const { previewing, previewData, validatingBatch, validationStage, validationProgress, form, formatTime, calculateEstimate, formatPhone, validateBatchNumbers, previewCampaign } = ctx;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </CardTitle>
          <CardDescription>
            Veja quantos clientes serão impactados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={previewCampaign} disabled={previewing} className="w-full">
            {previewing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {validationStage || 'Calculando...'}
              </>
            ) : (
              <>
                <Users className="h-4 w-4 mr-2" />
                Calcular Destinatários
              </>
            )}
          </Button>

          {/* Barra de progresso animada */}
          {previewing && validationProgress > 0 && (
            <div className="mt-3 space-y-2">
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300 ease-out"
                  style={{ width: `${validationProgress}%` }}
                />
              </div>
              <p className="text-xs text-center text-muted-foreground">
                {validationStage}
              </p>
            </div>
          )}

          {previewData && (
            <div className="mt-4 p-4 bg-muted rounded-lg space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{previewData.totalRecipients}</p>
                <p className="text-sm text-muted-foreground">clientes serão contatados</p>
              </div>

              {/* Estimativa de tempo */}
              {calculateEstimate() && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-1">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Timer className="h-4 w-4 text-primary" />
                    Estimativa de Tempo
                  </p>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>• Tempo total: <strong className="text-foreground">{calculateEstimate()?.time}</strong></p>
                    <p>• Intervalo médio: <strong className="text-foreground">{calculateEstimate()?.avgInterval}</strong></p>
                    {form.pause_enabled && calculateEstimate()!.pauseCount > 0 && (
                      <p>• {calculateEstimate()?.pauseCount} pausas de {formatTime(form.pause_duration_seconds)}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Stats de validação */}
              {previewData.validationStats && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-green-500/10 rounded-lg p-2">
                    <p className="text-sm font-bold text-green-600">{previewData.validationStats.valid}</p>
                    <p className="text-[10px] text-muted-foreground">Válidos</p>
                  </div>
                  <div className="bg-destructive/10 rounded-lg p-2">
                    <p className="text-sm font-bold text-destructive">{previewData.validationStats.invalid}</p>
                    <p className="text-[10px] text-muted-foreground">Inválidos</p>
                  </div>
                  <div className="bg-secondary rounded-lg p-2">
                    <p className="text-sm font-bold">{previewData.validationStats.pending}</p>
                    <p className="text-[10px] text-muted-foreground">Pendentes</p>
                  </div>
                </div>
              )}

              {/* Botão validar pendentes */}
              {previewData.validationStats?.pending > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={validateBatchNumbers}
                  disabled={validatingBatch}
                >
                  {validatingBatch ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Validando...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Validar {previewData.validationStats.pending} Números Pendentes
                    </>
                  )}
                </Button>
              )}

              {previewData.sampleRecipients?.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Destinatários ({previewData.sampleRecipients.length} de {previewData.totalRecipients}):</p>
                  <div className="space-y-2">
                    {previewData.sampleRecipients.map((r: any, i: number) => (
                      <div key={i} className="text-xs bg-background p-2 rounded border">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium">{r.name}</p>
                          {r.whatsapp_valid === true && (
                            <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px] px-1.5">
                              <CheckCircle className="w-3 h-3 mr-0.5" />
                              Válido
                            </Badge>
                          )}
                          {r.whatsapp_valid === false && (
                            <Badge variant="destructive" className="text-[10px] px-1.5">
                              <XCircle className="w-3 h-3 mr-0.5" />
                              Inválido
                            </Badge>
                          )}
                          {r.whatsapp_valid === null && (
                            <Badge variant="secondary" className="text-[10px] px-1.5">
                              <HelpCircle className="w-3 h-3 mr-0.5" />
                              Pendente
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {formatPhone(r.phone)}
                        </p>
                        <p className="text-muted-foreground">
                          {r.total_orders} pedidos | Último: {r.last_order_at ? new Date(r.last_order_at).toLocaleDateString('pt-BR') : 'Nunca'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
