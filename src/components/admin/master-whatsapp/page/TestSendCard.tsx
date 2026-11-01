// Testar envio de mensagem.
// JSX movido da MasterWhatsAppPage sem mudança.
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CountryCodeSelect } from "@/components/ui/country-code-select";
import { formatBrazilianPhone, formatInternationalPhone } from "@/lib/utils";
import { Loader2, Send } from "lucide-react";
import type { MasterWhatsAppPageApi } from "./types";

export function TestSendCard({ wa, tests, cfg }: MasterWhatsAppPageApi) {
  const { instanceStatus, loadingAction } = wa;
  const { testPhone, setTestPhone, testMessage, setTestMessage, countryCode, setCountryCode, sendTestMessage } = tests;

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="w-5 h-5" />
          Testar Envio
        </CardTitle>
        <CardDescription>
          Envie uma mensagem de teste
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Número do WhatsApp</Label>
          <div className="flex gap-2">
            <CountryCodeSelect
              value={countryCode}
              onChange={setCountryCode}
              disabled={instanceStatus !== 'connected'}
            />
            <Input
              className="flex-1"
              placeholder={countryCode === '+55' ? "(00) 00000-0000" : "Número"}
              value={testPhone}
              onChange={(e) => {
                const formatted = countryCode === '+55'
                  ? formatBrazilianPhone(e.target.value)
                  : formatInternationalPhone(e.target.value);
                setTestPhone(formatted);
              }}
              maxLength={countryCode === '+55' ? 16 : 20}
              disabled={instanceStatus !== 'connected'}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {countryCode === '+55' ? 'Com DDD' : 'Número sem o código do país'}
          </p>
        </div>
        
        <div className="space-y-2">
          <Label>Mensagem (opcional)</Label>
          <Textarea
            placeholder="✅ Mensagem de teste do WhatsApp Master"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            disabled={instanceStatus !== 'connected'}
            rows={3}
          />
        </div>
        
        <Button 
          onClick={sendTestMessage}
          disabled={!testPhone || instanceStatus !== 'connected' || loadingAction === 'sendTest'}
          className="w-full"
        >
          {loadingAction === 'sendTest' ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          Enviar Teste
        </Button>
      </CardContent>
    </Card>
    </>
  );
}
