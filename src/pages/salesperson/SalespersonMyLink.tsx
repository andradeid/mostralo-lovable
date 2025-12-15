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
    <div className="space-y-4 md:space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Meu Link de Afiliado</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Compartilhe seus links exclusivos e ganhe comissões
        </p>
      </div>

      {/* Código de Referência */}
      <Card>
        <CardHeader className="pb-2 md:pb-4">
          <CardTitle className="text-base md:text-lg">Seu Código de Referência</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Use este código ao compartilhar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            value={referralCode}
            readOnly
            className="font-mono text-base md:text-lg max-w-xs h-9 md:h-10"
          />
        </CardContent>
      </Card>

      {/* Links com QR Codes */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-2">
        {/* Link Página Inicial */}
        <Card>
          <CardHeader className="pb-2 md:pb-4">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Home className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
              Link para Página Inicial
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Mostra planos e benefícios antes do cadastro
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4">
            <div className="flex gap-2">
              <Input
                value={homepageLink}
                readOnly
                className="font-mono text-[10px] md:text-xs h-9 md:h-10"
              />
              <Button
                onClick={handleCopyHomepage}
                variant="outline"
                size="icon"
                className="flex-shrink-0 h-9 w-9 md:h-10 md:w-10"
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
                className="flex-shrink-0 h-9 w-9 md:h-10 md:w-10"
              >
                <a href={homepageLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
            
            <div className="flex justify-center p-3 md:p-4 bg-muted/50 rounded-lg">
              <QRCodeDisplay
                url={homepageLink}
                label="🏠 Página Inicial"
                size={100}
                showActions={false}
              />
            </div>

            <p className="text-[10px] md:text-xs text-muted-foreground">
              💡 <strong>Use quando:</strong> O lead ainda não conhece o sistema
            </p>
          </CardContent>
        </Card>

        {/* Link Cadastro Direto */}
        <Card>
          <CardHeader className="pb-2 md:pb-4">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <FileEdit className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
              Link Direto para Cadastro
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Vai direto para o formulário de cadastro
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4">
            <div className="flex gap-2">
              <Input
                value={signupLink}
                readOnly
                className="font-mono text-[10px] md:text-xs h-9 md:h-10"
              />
              <Button
                onClick={handleCopySignup}
                variant="outline"
                size="icon"
                className="flex-shrink-0 h-9 w-9 md:h-10 md:w-10"
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
                className="flex-shrink-0 h-9 w-9 md:h-10 md:w-10"
              >
                <a href={signupLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
            
            <div className="flex justify-center p-3 md:p-4 bg-muted/50 rounded-lg">
              <QRCodeDisplay
                url={signupLink}
                label="📝 Cadastro Direto"
                size={100}
                showActions={false}
              />
            </div>

            <p className="text-[10px] md:text-xs text-muted-foreground">
              ⚡ <strong>Use quando:</strong> O lead já conhece e quer contratar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Material de Divulgação */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-4 md:pt-6">
          <div className="flex flex-col items-center text-center gap-3 md:gap-4">
            <h3 className="font-bold text-base md:text-lg flex items-center gap-2">
              <Printer className="h-4 w-4 md:h-5 md:w-5" />
              Material para Impressão
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground">
              Flyers, cartões de visita e adesivos com QR Code
            </p>
            <Button asChild size="default" className="w-full md:w-auto gap-2">
              <Link to="/vendedor/compartilhar">
                <Printer className="h-4 w-4" />
                Ver Material
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dicas */}
      <Card>
        <CardHeader className="pb-2 md:pb-4">
          <CardTitle className="text-base md:text-lg">💡 Dicas de Uso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs md:text-sm text-muted-foreground space-y-1.5 md:space-y-2">
            <p>🏠 <strong>Página Inicial:</strong> Redes sociais, status do WhatsApp</p>
            <p>📝 <strong>Cadastro:</strong> Lead pronto para contratar</p>
            <p>📊 Vendas creditadas automaticamente para você</p>
            <p>💰 Comissão em cada pagamento do cliente</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
