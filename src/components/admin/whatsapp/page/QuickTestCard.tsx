// Teste rápido de conexão.
// JSX movido da WhatsAppInstancePage sem mudança.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle, XCircle, Send, TestTube } from "lucide-react";
import type { WhatsAppInstancePageCtx } from "@/hooks/whatsappInstance/useWhatsAppInstancePage";

export function QuickTestCard({ ctx }: { ctx: WhatsAppInstancePageCtx & { isConnected?: boolean } }) {
  const { instance, testPhone, setTestPhone, testLoading, testResult, testConnection } = ctx;

  return (
    <>
      {instance.status === 'connected' && (
        <Card>
          <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
              <TestTube className="h-4 w-4 sm:h-5 sm:w-5" />
              Teste Rápido
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 space-y-2 sm:space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="11999999999"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value.replace(/\D/g, ''))}
                className="h-9 text-sm flex-1"
              />
              <Button 
                onClick={testConnection} 
                disabled={testLoading || !testPhone}
                size="sm"
                className="h-9 px-3"
              >
                {testLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>

            {testResult && (
              <div className={`p-2 rounded-lg flex items-center gap-2 text-xs ${
                testResult.success 
                  ? 'bg-green-500/10 text-green-600' 
                  : 'bg-destructive/10 text-destructive'
              }`}>
                {testResult.success ? (
                  <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 shrink-0" />
                )}
                <span className="line-clamp-2">{testResult.message}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
