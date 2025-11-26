import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building2, Calendar, DollarSign, Percent } from 'lucide-react';
import { formatCurrency } from '@/utils/driverEarnings';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface InvitationCardProps {
  invitation: {
    id: string;
    token: string;
    proposed_payment_type: 'fixed' | 'commission';
    proposed_fixed_amount?: number;
    proposed_commission_percentage?: number;
    invitation_message?: string;
    expires_at: string;
    created_at: string;
    stores: {
      name: string;
      logo_url: string | null;
    };
  };
  onViewDetails: () => void;
}

export function InvitationCard({ invitation, onViewDetails }: InvitationCardProps) {
  const expiresIn = formatDistanceToNow(new Date(invitation.expires_at), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={invitation.stores.logo_url || ''} />
            <AvatarFallback>
              <Building2 className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-lg">{invitation.stores.name}</CardTitle>
            <CardDescription className="flex items-center gap-1 text-xs">
              <Calendar className="h-3 w-3" />
              Expira {expiresIn}
            </CardDescription>
          </div>
          <Badge>Novo</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Proposta de Pagamento */}
        <div className="rounded-lg bg-primary/5 border border-primary/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            {invitation.proposed_payment_type === 'fixed' ? (
              <DollarSign className="h-4 w-4 text-primary" />
            ) : (
              <Percent className="h-4 w-4 text-primary" />
            )}
            <span className="text-sm font-medium">
              {invitation.proposed_payment_type === 'fixed' ? 'Taxa Fixa' : 'Comissão'}
            </span>
          </div>
          <p className="text-2xl font-bold text-primary">
            {invitation.proposed_payment_type === 'fixed'
              ? formatCurrency(invitation.proposed_fixed_amount || 0)
              : `${invitation.proposed_commission_percentage || 0}%`}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {invitation.proposed_payment_type === 'fixed'
              ? 'Por entrega'
              : 'Da taxa de entrega'}
          </p>
        </div>

        {/* Mensagem do Lojista */}
        {invitation.invitation_message && (
          <div className="text-sm text-muted-foreground border-l-2 border-primary/20 pl-3">
            "{invitation.invitation_message}"
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button onClick={onViewDetails} className="w-full">
          Ver Detalhes e Responder
        </Button>
      </CardFooter>
    </Card>
  );
}
