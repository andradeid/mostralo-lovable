import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Phone, Mail, MapPin, ShoppingBag, DollarSign, Calendar,
  Bot, User, Clock, MessageSquare, Tag
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Conversation } from '@/pages/admin/WhatsAppChatPage';

interface ContactInfoPanelProps {
  conversation: Conversation;
  storeId: string;
}

interface CustomerData {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  total_orders: number | null;
  total_spent: number | null;
  last_order_at: string | null;
  created_at: string | null;
  notes: string | null;
}

interface ContactData {
  profile_picture_url: string | null;
  push_name: string | null;
  name: string | null;
  source: string | null;
  last_synced_at: string | null;
}

interface LabelData {
  id: string;
  name: string;
  color: string;
}

export function ContactInfoPanel({ conversation, storeId }: ContactInfoPanelProps) {
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [contact, setContact] = useState<ContactData | null>(null);
  const [labels, setLabels] = useState<LabelData[]>([]);
  const [messageCount, setMessageCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conversation || !storeId) return;
    setLoading(true);

    const phone = conversation.phone_number;
    // Buscar últimos 9 dígitos para matching flexível
    const phoneSuffix = phone.slice(-9);

    const fetchData = async () => {
      // Buscar dados em paralelo
      const [customerRes, contactRes, msgCountRes, labelsRes] = await Promise.all([
        // Cliente na tabela customers (phone pode ter formatos diferentes)
        supabase
          .from('customers')
          .select('id, name, phone, email, address, total_orders, total_spent, last_order_at, created_at, notes')
          .ilike('phone', `%${phoneSuffix}`)
          .limit(1)
          .maybeSingle(),
        // Contato WhatsApp
        supabase
          .from('whatsapp_contacts')
          .select('profile_picture_url, push_name, name, source, last_synced_at')
          .eq('phone_number', phone)
          .order('last_synced_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        // Contagem de mensagens
        supabase
          .from('whatsapp_chat_messages')
          .select('id', { count: 'exact', head: true })
          .eq('store_id', storeId)
          .eq('remote_jid', conversation.remote_jid),
        // Labels do cliente
        customerRes2(),
      ]);

      setCustomer(customerRes.data as CustomerData | null);
      setContact(contactRes.data as ContactData | null);
      setMessageCount(msgCountRes.count || 0);
      setLoading(false);
    };

    // Buscar labels precisa do customer_id, então fazemos em sequência
    async function customerRes2() {
      const { data: cust } = await supabase
        .from('customers')
        .select('id')
        .ilike('phone', `%${phoneSuffix}`)
        .limit(1)
        .maybeSingle();

      if (cust?.id) {
        const { data: assignments } = await supabase
          .from('customer_label_assignments')
          .select('label_id, customer_labels(id, name, color)')
          .eq('customer_id', cust.id)
          .eq('store_id', storeId);

        if (assignments) {
          const lbls = assignments
            .map((a: any) => a.customer_labels)
            .filter(Boolean);
          setLabels(lbls);
        }
      }
      return { data: null };
    }

    fetchData();
  }, [conversation?.id, storeId]);

  const displayName = customer?.name || contact?.name || conversation.contact_name || formatPhone(conversation.phone_number);
  const profilePic = conversation.profile_picture_url || contact?.profile_picture_url;
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Avatar e nome principal */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Avatar className="w-20 h-20">
            <AvatarImage src={profilePic || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-base">{displayName}</h3>
            <p className="text-xs text-muted-foreground">{formatPhone(conversation.phone_number)}</p>
          </div>
          <div className="flex items-center gap-2">
            {conversation.is_bot_active ? (
              <Badge variant="secondary" className="gap-1 text-xs">
                <Bot className="w-3 h-3" /> Bot ativo
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-xs">
                <User className="w-3 h-3" /> Atendimento manual
              </Badge>
            )}
          </div>
        </div>

        <Separator />

        {/* Informações de contato */}
        <Section title="Contato">
          <InfoRow icon={Phone} label="Telefone" value={formatPhone(conversation.phone_number)} />
          {customer?.email && (
            <InfoRow icon={Mail} label="E-mail" value={customer.email} />
          )}
          {customer?.address && (
            <InfoRow icon={MapPin} label="Endereço" value={customer.address} />
          )}
        </Section>

        <Separator />

        {/* Estatísticas do cliente */}
        <Section title="Histórico do cliente">
          {customer ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  icon={ShoppingBag}
                  label="Pedidos"
                  value={String(customer.total_orders || 0)}
                />
                <StatCard
                  icon={DollarSign}
                  label="Total gasto"
                  value={`R$ ${(customer.total_spent || 0).toFixed(2)}`}
                />
                <StatCard
                  icon={MessageSquare}
                  label="Mensagens"
                  value={String(messageCount)}
                />
                <StatCard
                  icon={Clock}
                  label="Último pedido"
                  value={customer.last_order_at
                    ? formatDistanceToNow(new Date(customer.last_order_at), { addSuffix: true, locale: ptBR })
                    : 'Nunca'
                  }
                />
              </div>
              {customer.created_at && (
                <p className="text-xs text-muted-foreground mt-2">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  Cliente desde {format(new Date(customer.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Nenhum registro de cliente encontrado para este número.
            </p>
          )}
        </Section>

        {/* Labels */}
        {labels.length > 0 && (
          <>
            <Separator />
            <Section title="Etiquetas">
              <div className="flex flex-wrap gap-1.5">
                {labels.map(label => (
                  <Badge
                    key={label.id}
                    variant="outline"
                    className="text-xs gap-1"
                    style={{ borderColor: label.color, color: label.color }}
                  >
                    <Tag className="w-3 h-3" />
                    {label.name}
                  </Badge>
                ))}
              </div>
            </Section>
          </>
        )}

        {/* Notas */}
        {customer?.notes && (
          <>
            <Separator />
            <Section title="Observações">
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">{customer.notes}</p>
            </Section>
          </>
        )}
      </div>
    </ScrollArea>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h4>
      {children}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium truncate">{value}</span>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-2.5 text-center space-y-0.5">
      <Icon className="w-4 h-4 mx-auto text-muted-foreground" />
      <p className="text-sm font-semibold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function formatPhone(phone: string): string {
  if (phone.length === 13 && phone.startsWith('55')) {
    return `(${phone.slice(2, 4)}) ${phone.slice(4, 9)}-${phone.slice(9)}`;
  }
  if (phone.length === 12 && phone.startsWith('55')) {
    return `(${phone.slice(2, 4)}) ${phone.slice(4, 8)}-${phone.slice(8)}`;
  }
  return phone;
}
