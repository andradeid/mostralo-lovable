import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CloudflareChecklist } from "@/components/admin/cloudflare/CloudflareChecklist";
import { Cloud, ExternalLink, Zap, Shield, Clock, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";

export default function CloudflareGuidePage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Cloud className="h-6 w-6 text-orange-500" />
            Guia de Otimização Cloudflare
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure o Cloudflare para máxima performance e segurança
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/dashboard/diagnostics">
              Ver Diagnósticos
            </Link>
          </Button>
          <Button asChild>
            <a href="https://dash.cloudflare.com" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir Cloudflare
            </a>
          </Button>
        </div>
      </div>

      {/* Benefits Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Zap className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-500">-200ms</div>
                <div className="text-sm text-muted-foreground">Redução no TTFB</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <TrendingDown className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-500">-40%</div>
                <div className="text-sm text-muted-foreground">Carga no servidor</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 bg-purple-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Clock className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-500">+25%</div>
                <div className="text-sm text-muted-foreground">Melhoria no LCP</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-500/20 bg-orange-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Shield className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-500">DDoS</div>
                <div className="text-sm text-muted-foreground">Proteção grátis</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert */}
      <Alert>
        <Cloud className="h-4 w-4" />
        <AlertTitle>Pré-requisito</AlertTitle>
        <AlertDescription>
          Para seguir este guia, você precisa ter seu domínio configurado no Cloudflare.
          Se ainda não tem, <a href="https://dash.cloudflare.com/sign-up" target="_blank" rel="noopener noreferrer" className="underline font-medium">crie uma conta gratuita</a> e adicione seu domínio.
        </AlertDescription>
      </Alert>

      {/* Main Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Checklist de Configurações</CardTitle>
          <CardDescription>
            Marque cada item conforme for configurando. Seu progresso é salvo automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CloudflareChecklist />
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Dicas Adicionais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg border bg-muted/50">
              <h4 className="font-medium mb-2">🎯 Ordem Recomendada</h4>
              <p className="text-sm text-muted-foreground">
                Configure primeiro DNS e SSL/TLS, depois Speed e Cache.
                As regras de Firewall e Transform são opcionais mas recomendadas.
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/50">
              <h4 className="font-medium mb-2">⏱️ Tempo de Propagação</h4>
              <p className="text-sm text-muted-foreground">
                Mudanças de DNS podem levar até 24h para propagar.
                Outras configurações são aplicadas em segundos.
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/50">
              <h4 className="font-medium mb-2">🧪 Testando Mudanças</h4>
              <p className="text-sm text-muted-foreground">
                Após configurar, volte para a página de Diagnósticos e execute um novo teste
                para verificar as melhorias.
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/50">
              <h4 className="font-medium mb-2">💡 Plano Gratuito vs Pro</h4>
              <p className="text-sm text-muted-foreground">
                A maioria das otimizações funciona no plano gratuito.
                Items marcados como "PRO" requerem upgrade.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
