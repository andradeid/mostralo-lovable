import { useEffect, useState } from "react";
import { SalespersonLayout } from "@/components/salesperson/SalespersonLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function SalespersonMyLink() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState("");
  const [affiliateLink, setAffiliateLink] = useState("");
  const [copied, setCopied] = useState(false);

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
      const link = `${window.location.origin}/signup?ref=${data.referral_code}`;
      setAffiliateLink(link);
    } catch (error) {
      console.error('Erro ao carregar código de referência:', error);
      toast.error('Erro ao carregar link de afiliado');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(affiliateLink);
      setCopied(true);
      toast.success('Link copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Erro ao copiar link');
    }
  };

  if (loading) {
    return (
      <SalespersonLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </SalespersonLayout>
    );
  }

  return (
    <SalespersonLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-3xl font-bold">Meu Link de Afiliado</h1>
          <p className="text-muted-foreground">
            Compartilhe seu link exclusivo e ganhe comissões
          </p>
        </div>

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
                className="font-mono text-lg"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Link de Afiliado</CardTitle>
            <CardDescription>
              Link direto para cadastro com seu código
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={affiliateLink}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                onClick={handleCopy}
                variant="outline"
                size="icon"
                className="flex-shrink-0"
              >
                {copied ? (
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
                <a href={affiliateLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>

            <div className="text-sm text-muted-foreground space-y-2">
              <p>💡 <strong>Dica:</strong> Compartilhe este link em suas redes sociais, WhatsApp ou email</p>
              <p>📊 Todas as vendas feitas através deste link serão creditadas automaticamente para você</p>
              <p>💰 Você ganha comissão em cada pagamento realizado pelo cliente indicado</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </SalespersonLayout>
  );
}
