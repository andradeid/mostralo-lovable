import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Copy, Check, ExternalLink, Printer, Home, FileEdit } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { QRCodeDisplay } from "@/components/share/QRCodeDisplay";

export default function SalespersonMyLink() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState("");
  const [homepageLink, setHomepageLink] = useState("");
  const [signupLink, setSignupLink] = useState("");
  const [copiedHomepage, setCopiedHomepage] = useState(false);
  const [copiedSignup, setCopiedSignup] = useState(false);

  useEffect(() => {
    if (user) {
      loadReferralCode();
    }
  }, [user]);

  const loadReferralCode = async () => {
    try {
      const { data, error } = await supabase
        .from('salespeople')
        .select('referral_code')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      setReferralCode(data.referral_code);
      const baseUrl = window.location.origin;
      setHomepageLink(`${baseUrl}/?ref=${data.referral_code}`);
      setSignupLink(`${baseUrl}/signup?ref=${data.referral_code}`);
    } catch (error) {
      console.error('Erro ao carregar código de referência:', error);
      toast.error('Erro ao carregar link de afiliado');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyHomepage = async () => {
    try {
      await navigator.clipboard.writeText(homepageLink);
      setCopiedHomepage(true);
      toast.success('Link da página inicial copiado!');
      setTimeout(() => setCopiedHomepage(false), 2000);
    } catch {
      toast.error('Erro ao copiar link');
    }
  };

  const handleCopySignup = async () => {
    try {
      await navigator.clipboard.writeText(signupLink);
      setCopiedSignup(true);
      toast.success('Link de cadastro copiado!');
      setTimeout(() => setCopiedSignup(false), 2000);
    } catch {
      toast.error('Erro ao copiar link');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Meu Link de Afiliado</h1>
        <p className="text-muted-foreground">
          Compartilhe seus links exclusivos e ganhe comissões
        </p>
      </div>

      {/* Código de Referência */}
      <Card>
        <CardHeader>
          <CardTitle>Seu Código de Referência</CardTitle>
          <CardDescription>
            Use este código ao compartilhar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input
              value={referralCode}
              readOnly
              className="font-mono text-lg max-w-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Links com QR Codes */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Link Página Inicial */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-blue-500" />
              Link para Página Inicial
            </CardTitle>
            <CardDescription>
              Mostra planos e benefícios antes do cadastro
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={homepageLink}
                readOnly
                className="font-mono text-xs"
              />
              <Button
                onClick={handleCopyHomepage}
                variant="outline"
                size="icon"
                className="flex-shrink-0"
              >
                {copiedHomepage ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                asChild
                variant="outline"
                size="icon"
                className="flex-shrink-0"
              >
                <a href={homepageLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
            
            <div className="flex justify-center p-4 bg-muted/50 rounded-lg">
              <QRCodeDisplay
                url={homepageLink}
                label="🏠 Página Inicial"
                size={120}
                showActions={false}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              💡 <strong>Use quando:</strong> O lead ainda não conhece o sistema
            </p>
          </CardContent>
        </Card>

        {/* Link Cadastro Direto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileEdit className="h-5 w-5 text-green-500" />
              Link Direto para Cadastro
            </CardTitle>
            <CardDescription>
              Vai direto para o formulário de cadastro
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={signupLink}
                readOnly
                className="font-mono text-xs"
              />
              <Button
                onClick={handleCopySignup}
                variant="outline"
                size="icon"
                className="flex-shrink-0"
              >
                {copiedSignup ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                asChild
                variant="outline"
                size="icon"
                className="flex-shrink-0"
              >
                <a href={signupLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
            
            <div className="flex justify-center p-4 bg-muted/50 rounded-lg">
              <QRCodeDisplay
                url={signupLink}
                label="📝 Cadastro Direto"
                size={120}
                showActions={false}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              ⚡ <strong>Use quando:</strong> O lead já conhece e quer contratar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Material de Divulgação */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <h3 className="font-bold text-lg flex items-center gap-2 justify-center md:justify-start">
                <Printer className="h-5 w-5" />
                Material para Impressão
              </h3>
              <p className="text-sm text-muted-foreground">
                Flyers, cartões de visita e adesivos com QR Code prontos para imprimir
              </p>
            </div>
            <Button asChild size="lg" className="gap-2">
              <Link to="/vendedor/compartilhar">
                <Printer className="h-4 w-4" />
                Ver Material de Divulgação
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dicas */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Dicas de Uso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>🏠 <strong>Link da Página Inicial:</strong> Ideal para redes sociais, status do WhatsApp e campanhas de marketing</p>
            <p>📝 <strong>Link de Cadastro:</strong> Use quando o lead já conhece o sistema e está pronto para contratar</p>
            <p>📊 Todas as vendas feitas através destes links serão creditadas automaticamente para você</p>
            <p>💰 Você ganha comissão em cada pagamento realizado pelo cliente indicado</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
