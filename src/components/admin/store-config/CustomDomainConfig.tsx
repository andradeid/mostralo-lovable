import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Globe, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Copy,
  ExternalLink 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface CustomDomainConfigProps {
  customDomain: string;
  verified: boolean;
  requestedAt: string | null;
  storeSlug: string;
  onUpdate: (domain: string, verified: boolean) => void;
}

export function CustomDomainConfig({
  customDomain,
  verified,
  requestedAt,
  storeSlug,
  onUpdate,
}: CustomDomainConfigProps) {
  const [domain, setDomain] = useState(customDomain || "");
  const [isVerifying, setIsVerifying] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const { toast } = useToast();

  const validateDomain = (value: string): boolean => {
    if (!value) return true; // Vazio é válido (opcional)
    
    const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i;
    
    // Não permitir subdomínios do mostralo.app
    if (value.includes('mostralo.app') || value.includes('mostralo.com.br')) {
      toast({
        title: "Domínio inválido",
        description: "Use um domínio próprio, não um subdomínio do Mostralo",
        variant: "destructive",
      });
      return false;
    }
    
    if (!domainRegex.test(value)) {
      toast({
        title: "Formato inválido",
        description: "Digite um domínio válido (ex: www.meusite.com.br)",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const handleDomainChange = (value: string) => {
    const cleanDomain = value.toLowerCase().trim();
    setDomain(cleanDomain);
    
    if (cleanDomain && validateDomain(cleanDomain)) {
      onUpdate(cleanDomain, false);
    }
  };

  const handleVerifyDomain = async () => {
    if (!domain) {
      toast({
        title: "Campo vazio",
        description: "Digite um domínio antes de verificar",
        variant: "destructive",
      });
      return;
    }

    if (!validateDomain(domain)) return;

    try {
      setIsVerifying(true);
      
      const { data, error } = await supabase.functions.invoke('verify-domain', {
        body: { domain }
      });

      if (error) throw error;

      if (data.verified) {
        toast({
          title: "✅ Domínio verificado!",
          description: "Seu domínio está configurado corretamente.",
        });
        onUpdate(domain, true);
      } else {
        toast({
          title: "⚠️ DNS não configurado",
          description: data.message || "Verifique as configurações DNS e aguarde a propagação (até 48h).",
          variant: "destructive",
        });
        onUpdate(domain, false);
      }
    } catch (error: any) {
      console.error('Erro ao verificar domínio:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível verificar o domínio",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClearDomain = () => {
    setDomain("");
    onUpdate("", false);
    toast({
      title: "Domínio removido",
      description: "O domínio personalizado foi limpo",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Texto copiado para a área de transferência",
    });
  };

  const getStatusBadge = () => {
    if (!domain) return null;
    
    if (verified) {
      return (
        <Badge variant="default" className="bg-green-600">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Verificado
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary" className="bg-yellow-600">
        <Clock className="w-3 h-3 mr-1" />
        Aguardando DNS
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Domínio Personalizado (Opcional)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Domínio Atual */}
        <Alert>
          <AlertDescription className="flex items-center justify-between">
            <div>
              <span className="font-medium">Seu domínio atual: </span>
              <span className="text-primary">{storeSlug}.mostralo.app</span>
            </div>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </AlertDescription>
        </Alert>

        {/* Campo de Domínio */}
        <div className="space-y-2">
          <Label htmlFor="custom-domain">Domínio Personalizado</Label>
          <div className="flex gap-2">
            <Input
              id="custom-domain"
              placeholder="www.meusite.com.br"
              value={domain}
              onChange={(e) => handleDomainChange(e.target.value)}
              className="flex-1"
            />
            {getStatusBadge()}
          </div>
          <p className="text-xs text-muted-foreground">
            Use seu próprio domínio para acessar sua loja
          </p>
        </div>

        {/* Instruções DNS */}
        {domain && (
          <Collapsible open={showInstructions} onOpenChange={setShowInstructions}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full">
                {showInstructions ? (
                  <ChevronUp className="w-4 h-4 mr-2" />
                ) : (
                  <ChevronDown className="w-4 h-4 mr-2" />
                )}
                {showInstructions ? "Ocultar" : "Ver"} Instruções de Configuração DNS
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-4">
              <Card className="bg-muted/50">
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">📋 Como Configurar Seu Domínio Personalizado</h4>
                    <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                      <li>Acesse o painel DNS do seu provedor de domínio (Registro.br, GoDaddy, Hostinger, Cloudflare, etc.)</li>
                      <li>Localize a seção de "Gerenciamento DNS", "DNS Records" ou "Zona DNS"</li>
                      <li>Adicione os seguintes registros DNS:</li>
                    </ol>
                  </div>

                  {/* Registro A */}
                  <div className="space-y-2 p-3 bg-background rounded-lg border">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">Registro A (Root)</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard("217.216.48.254")}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Tipo:</p>
                        <p className="font-mono">A</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Nome:</p>
                        <p className="font-mono">@</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Valor:</p>
                        <p className="font-mono">217.216.48.254</p>
                      </div>
                    </div>
                  </div>

                  {/* Registro A para www */}
                  <div className="space-y-2 p-3 bg-background rounded-lg border">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">Registro A (www)</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard("217.216.48.254")}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Tipo:</p>
                        <p className="font-mono">A</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Nome:</p>
                        <p className="font-mono">www</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Valor:</p>
                        <p className="font-mono">217.216.48.254</p>
                      </div>
                    </div>
                  </div>

                  {/* Avisos */}
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>⏱️ Tempo de Propagação:</strong> As alterações DNS podem levar de 24 a 48 horas para propagar completamente. Seja paciente!
                    </AlertDescription>
                  </Alert>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ExternalLink className="w-3 h-3" />
                    <span>
                      Precisa de ajuda? Consulte a documentação do seu provedor de domínio
                    </span>
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Ações */}
        {domain && (
          <div className="flex gap-2">
            <Button
              onClick={handleVerifyDomain}
              disabled={isVerifying}
              className="flex-1"
            >
              {isVerifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Verificando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Verificar DNS Agora
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleClearDomain}
              disabled={isVerifying}
            >
              Limpar
            </Button>
          </div>
        )}

        {/* Status da última verificação */}
        {requestedAt && (
          <p className="text-xs text-muted-foreground text-center">
            Última verificação: {new Date(requestedAt).toLocaleString('pt-BR')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
