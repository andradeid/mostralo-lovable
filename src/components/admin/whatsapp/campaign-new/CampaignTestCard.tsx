// Teste de envio.
// JSX movido da WhatsAppCampaignNewPage sem mudança.
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Send, TestTube, CheckCircle, XCircle, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CampaignNewPageCtx } from "@/hooks/whatsappCampaign/useCampaignNewPage";

export function CampaignTestCard({ ctx }: { ctx: CampaignNewPageCtx }) {
  const { testNumber, setTestNumber, sendingTest, validatingTestNumber, testNumberValid, setTestNumberValid, validationStep, setValidationStep, form, validateTestNumber, sendTestMessage } = ctx;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Testar Envio
          </CardTitle>
          <CardDescription>
            Envie uma mensagem de teste para seu WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Número para teste</Label>
            <div className="relative">
              <Input
                placeholder="Ex: 11941941427"
                value={testNumber}
                onChange={(e) => {
                  setTestNumber(e.target.value);
                  setTestNumberValid(null);
                  setValidationStep('');
                }}
                disabled={validatingTestNumber}
                className={cn(
                  "pr-10",
                  testNumberValid === true && "border-green-500 focus-visible:ring-green-500",
                  testNumberValid === false && "border-red-500 focus-visible:ring-red-500"
                )}
              />
              {testNumberValid === true && (
                <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
              )}
              {testNumberValid === false && (
                <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500" />
              )}
            </div>
            
            {validatingTestNumber && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin" />
                {validationStep}
              </div>
            )}
            
            {!validatingTestNumber && validationStep && (
              <p className={cn(
                "text-sm",
                testNumberValid === true && "text-green-600",
                testNumberValid === false && "text-red-600"
              )}>
                {testNumberValid === true ? '✅' : '❌'} {validationStep}
              </p>
            )}
            
            {!validationStep && !validatingTestNumber && (
              <p className="text-xs text-muted-foreground">
                As variáveis serão substituídas por dados de exemplo
              </p>
            )}
          </div>
          
          <div className="flex gap-2">
            {/* Botão Validar Número */}
            <Button 
              onClick={validateTestNumber} 
              disabled={validatingTestNumber || testNumber.replace(/\D/g, '').length < 10}
              variant={testNumberValid ? "default" : "secondary"}
              className={cn(
                "flex-1",
                testNumberValid && "bg-green-600 hover:bg-green-700"
              )}
            >
              {validatingTestNumber ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Validando...
                </>
              ) : testNumberValid ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Validado
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Validar Número
                </>
              )}
            </Button>

            {/* Botão Enviar Teste */}
            <Button 
              onClick={sendTestMessage} 
              disabled={sendingTest || !form.custom_message.trim() || !testNumberValid}
              variant="outline"
              className="flex-1"
            >
              {sendingTest ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Teste
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
