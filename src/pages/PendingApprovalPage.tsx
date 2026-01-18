import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Clock, 
  Building2, 
  CreditCard, 
  Phone, 
  Mail,
  ArrowRight,
  Store as StoreIcon
} from 'lucide-react';

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  'pix': 'PIX',
  'boleto': 'Boleto Bancário',
  'cartao_credito': 'Cartão de Crédito',
  'cartao_debito': 'Cartão de Débito',
  'transferencia': 'Transferência Bancária',
  'permuta': 'Permuta',
  'a_combinar': 'A Combinar',
};

export default function PendingApprovalPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const companyName = searchParams.get('company') || 'Sua Empresa';
  const paymentMethod = searchParams.get('payment_method') || 'a_combinar';
  
  // Determinar se é um método conhecido ou personalizado
  const isCustomPaymentMethod = !Object.keys(PAYMENT_METHOD_LABELS).includes(paymentMethod);
  const displayPaymentMethod = isCustomPaymentMethod 
    ? paymentMethod 
    : PAYMENT_METHOD_LABELS[paymentMethod] || paymentMethod;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-6">
        {/* Success Header */}
        <div className="text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Conta Criada com Sucesso!
          </h1>
          <p className="text-muted-foreground mt-2">
            Sua conta está aguardando ativação pelo nosso time.
          </p>
        </div>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StoreIcon className="h-5 w-5" />
              Dados do Cadastro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Company Name */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Empresa</p>
                <p className="font-medium">{companyName}</p>
              </div>
            </div>

            {/* Payment Method */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Forma de Pagamento</p>
                <p className="font-medium">{displayPaymentMethod}</p>
              </div>
              {(paymentMethod === 'permuta' || paymentMethod === 'a_combinar' || isCustomPaymentMethod) && (
                <Badge variant="outline" className="shrink-0">
                  Sem comprovante digital
                </Badge>
              )}
            </div>

            {/* Status */}
            <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <div className="flex-1">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">Status</p>
                <p className="font-medium text-yellow-700 dark:text-yellow-300">
                  Aguardando Aprovação
                </p>
              </div>
              <Badge className="bg-yellow-500 text-white shrink-0">
                Pendente
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Próximos Passos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-sm font-medium text-primary">1</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Nosso time irá revisar seu cadastro e confirmar os detalhes do pagamento.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-sm font-medium text-primary">2</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Você receberá uma notificação por WhatsApp quando sua loja for ativada.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-sm font-medium text-primary">3</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Após a aprovação, você terá acesso completo ao painel da sua loja.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <p className="text-center text-sm text-muted-foreground mb-4">
              Tem dúvidas? Entre em contato conosco:
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a 
                href="https://wa.me/5511999999999" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Phone className="h-4 w-4" />
                WhatsApp
              </a>
              <a 
                href="mailto:suporte@mostralo.com.br"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Mail className="h-4 w-4" />
                suporte@mostralo.com.br
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button onClick={() => navigate('/auth')} className="w-full">
            Ir para Login
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button variant="outline" onClick={() => navigate('/')} className="w-full">
            Voltar para Página Inicial
          </Button>
        </div>
      </div>
    </div>
  );
}
