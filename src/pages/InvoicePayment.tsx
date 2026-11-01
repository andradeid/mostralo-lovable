// Link antigo de pagamento de fatura (/invoice-payment/:id).
// A página antiga lia uma visão que não existe mais. O pagamento oficial é /pagar/<token>:
// aqui o dono da loja (ou o master) logado é levado para lá; sem acesso, mostra o aviso.
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function InvoicePayment() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from('subscription_invoices')
        .select('public_token')
        .eq('id', invoiceId ?? '')
        .maybeSingle();
      if (!alive) return;
      const token = (data as { public_token?: string | null } | null)?.public_token;
      if (token) navigate(`/pagar/${token}`, { replace: true });
      else setNotFound(true);
    })();
    return () => { alive = false; };
  }, [invoiceId, navigate]);

  if (!notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-3">
        <h1 className="text-xl font-semibold">Este link de pagamento mudou</h1>
        <p className="text-muted-foreground">
          Entre no painel da sua loja em Assinatura para pagar a fatura, ou peça o link novo à equipe Mostralo.
        </p>
        <a href="/auth" className="inline-block text-primary underline">Entrar no painel</a>
      </div>
    </div>
  );
}
