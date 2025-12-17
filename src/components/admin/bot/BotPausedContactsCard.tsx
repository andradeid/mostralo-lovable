import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserCircle, Phone, Clock, RotateCcw, Users } from "lucide-react";
import { usePausedContacts, PausedContact } from "@/hooks/usePausedContacts";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, differenceInMinutes, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useEffect } from "react";

interface BotPausedContactsCardProps {
  storeId: string | null;
}

function formatPhone(remoteJid: string): string {
  // remoteJid vem no formato: 5561999999999@s.whatsapp.net
  const phone = remoteJid.replace('@s.whatsapp.net', '').replace('@c.us', '');
  if (phone.length === 13 && phone.startsWith('55')) {
    const ddd = phone.slice(2, 4);
    const number = phone.slice(4);
    if (number.length === 9) {
      return `(${ddd}) ${number.slice(0, 5)}-${number.slice(5)}`;
    }
  }
  return phone;
}

function TimeUntilReactivation({ autoReactivateAt }: { autoReactivateAt: string | null }) {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!autoReactivateAt) {
      setTimeLeft('Manual');
      return;
    }

    const updateTimeLeft = () => {
      const now = new Date();
      const reactivateDate = new Date(autoReactivateAt);
      const minutesLeft = differenceInMinutes(reactivateDate, now);

      if (minutesLeft <= 0) {
        setTimeLeft('Em breve');
      } else if (minutesLeft < 60) {
        setTimeLeft(`em ${minutesLeft} min`);
      } else {
        const hours = Math.floor(minutesLeft / 60);
        const mins = minutesLeft % 60;
        setTimeLeft(`em ${hours}h ${mins}min`);
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 60000);
    return () => clearInterval(interval);
  }, [autoReactivateAt]);

  return (
    <span className={autoReactivateAt ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}>
      {timeLeft}
    </span>
  );
}

function ContactItem({ 
  contact, 
  onReactivate, 
  isReactivating 
}: { 
  contact: PausedContact; 
  onReactivate: () => void;
  isReactivating: boolean;
}) {
  const pausedAgo = formatDistanceToNow(new Date(contact.paused_at), { 
    addSuffix: true, 
    locale: ptBR 
  });

  return (
    <div className="border rounded-lg p-3 sm:p-4 bg-card hover:bg-accent/50 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <UserCircle className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium truncate">
              {contact.customer_name || 'Cliente'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-3 w-3 shrink-0" />
            <span className="font-mono text-xs">{formatPhone(contact.remote_jid)}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Pausado {pausedAgo}
            </span>
            <span className="flex items-center gap-1">
              <RotateCcw className="h-3 w-3" />
              <TimeUntilReactivation autoReactivateAt={contact.auto_reactivate_at} />
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onReactivate}
          disabled={isReactivating}
          className="shrink-0"
        >
          {isReactivating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reativar Bot
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export function BotPausedContactsCard({ storeId }: BotPausedContactsCardProps) {
  const { toast } = useToast();
  const { 
    contacts, 
    loading, 
    reactivating, 
    reactivateContact,
    reactivateAll,
    refetch 
  } = usePausedContacts(storeId);
  const [reactivatingAll, setReactivatingAll] = useState(false);

  const handleReactivate = async (contact: PausedContact) => {
    const result = await reactivateContact(contact);
    if (result.success) {
      toast({
        title: "Bot Reativado",
        description: `Bot reativado para ${contact.customer_name || 'o cliente'}`,
      });
    } else {
      toast({
        title: "Erro",
        description: result.error || "Não foi possível reativar o bot",
        variant: "destructive",
      });
    }
  };

  const handleReactivateAll = async () => {
    if (contacts.length === 0) return;
    
    setReactivatingAll(true);
    try {
      await reactivateAll();
      toast({
        title: "Todos os Bots Reativados",
        description: `${contacts.length} contato(s) tiveram o bot reativado`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Alguns bots não puderam ser reativados",
        variant: "destructive",
      });
    } finally {
      setReactivatingAll(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-full ${contacts.length > 0 ? 'bg-amber-500/20' : 'bg-muted'}`}>
              <Users className={`h-4 w-4 ${contacts.length > 0 ? 'text-amber-500' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Atendimentos em Andamento
                {contacts.length > 0 && (
                  <Badge variant="secondary" className="bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    {contacts.length}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                Contatos com bot pausado para atendimento manual
              </CardDescription>
            </div>
          </div>
          {contacts.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReactivateAll}
              disabled={reactivatingAll}
            >
              {reactivatingAll ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-1" />
              )}
              Reativar Todos
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {contacts.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum atendimento em andamento</p>
            <p className="text-xs mt-1">
              Quando você pausar o bot para um cliente, ele aparecerá aqui
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {contacts.map((contact) => (
                <ContactItem
                  key={contact.id}
                  contact={contact}
                  onReactivate={() => handleReactivate(contact)}
                  isReactivating={reactivating === contact.id}
                />
              ))}
            </div>
            <div className="flex items-start gap-2 p-2 bg-muted/50 rounded-lg text-xs text-muted-foreground">
              <span className="text-base">💡</span>
              <span>
                O bot está pausado para esses clientes enquanto você faz o atendimento manual.
                Clique em "Reativar Bot" quando terminar.
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
