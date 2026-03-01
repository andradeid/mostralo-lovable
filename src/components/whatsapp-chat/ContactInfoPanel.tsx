import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Phone, Mail, MapPin, ShoppingBag, DollarSign, Calendar,
  Bot, User, Clock, MessageSquare, Tag, Package, CreditCard
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

interface StoreCustomerData {
  total_orders: number | null;
  total_spent: number | null;
  last_order_at: string | null;
  first_order_at: string | null;
}

interface RecentOrder {
  id: string;
  created_at: string;
  total: number;
  status: string;
  order_number: string;
  delivery_type: string | null;
  payment_method: string | null;
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
  const [storeStats, setStoreStats] = useState<StoreCustomerData | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [contact, setContact] = useState<ContactData | null>(null);
  const [labels, setLabels] = useState<LabelData[]>([]);
  const [messageCount, setMessageCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conversation || !storeId) return;
    setLoading(true);
    setCustomer(null);
    setStoreStats(null);
    setRecentOrders([]);
    setLabels([]);

    const phone = conversation.phone_number;
    const phoneSuffix = phone.slice(-9);

    const fetchData = async () => {
      // 1. Buscar cliente e contato em paralelo
      const [customerRes, contactRes, msgCountRes] = await Promise.all([
        supabase
          .from('customers')
          .select('id, name, phone, email, address, total_orders, total_spent, last_order_at, created_at, notes')
          .or(`phone.ilike.%${phoneSuffix},phone.ilike.%${phone}`)
          .is('deleted_at', null)
          .limit(1)
          .maybeSingle(),
        supabase
          .from('whatsapp_contacts')
          .select('profile_picture_url, push_name, name, source, last_synced_at')
          .eq('phone_number', phone)
          .order('last_synced_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('whatsapp_chat_messages')
          .select('id', { count: 'exact', head: true })
          .eq('store_id', storeId)
          .eq('remote_jid', conversation.remote_jid),
      ]);

      const cust = customerRes.data as CustomerData | null;
      setCustomer(cust);
      setContact(contactRes.data as ContactData | null);
      setMessageCount(msgCountRes.count || 0);

      // 2. Se encontrou cliente, buscar dados da loja, pedidos recentes e labels
      if (cust?.id) {
        const [storeStatsRes, ordersRes, labelsRes] = await Promise.all([
          supabase
            .from('customer_stores')
            .select('total_orders, total_spent, last_order_at, first_order_at')
            .eq('customer_id', cust.id)
            .eq('store_id', storeId)
            .maybeSingle(),
          supabase
            .from('orders')
            .select('id, created_at, total, status, order_number, delivery_type, payment_method')
            .eq('customer_id', cust.id)
            .eq('store_id', storeId)
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('customer_label_assignments')
            .select('label_id, customer_labels(id, name, color)')
            .eq('customer_id', cust.id)
            .eq('store_id', storeId),
        ]);

        setStoreStats(storeStatsRes.data as StoreCustomerData | null);
        setRecentOrders((ordersRes.data as RecentOrder[]) || []);
        
        if (labelsRes.data) {
          const lbls = labelsRes.data
            .map((a: any) => a.customer_labels)
            .filter(Boolean);
          setLabels(lbls);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [conversation?.id, storeId]);

  const displayName = customer?.name || contact?.name || conversation.contact_name || formatPhone(conversation.phone_number);
  const profilePic = conversation.profile_picture_url || contact?.profile_picture_url;
  const initials = displayName.slice(0, 2).toUpperCase();

  // Usar dados da loja se disponíveis, senão globais
  const orders = storeStats?.total_orders ?? customer?.total_orders ?? 0;
  const spent = storeStats?.total_spent ?? customer?.total_spent ?? 0;
  const lastOrder = storeStats?.last_order_at ?? customer?.last_order_at;

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
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-muted-foreground">Endereço:</span>
                <p className="font-medium text-xs mt-0.5 leading-relaxed">{customer.address}</p>
              </div>
            </div>
          )}
        </Section>

        <Separator />

        {/* Estatísticas do cliente */}
        <Section title="Histórico nesta loja">
          {customer ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  icon={ShoppingBag}
                  label="Pedidos"
                  value={String(orders)}
                />
                <StatCard
                  icon={DollarSign}
                  label="Total gasto"
                  value={formatCurrency(spent)}
                />
                <StatCard
                  icon={MessageSquare}
                  label="Mensagens"
                  value={String(messageCount)}
                />
                <StatCard
                  icon={Clock}
                  label="Último pedido"
                  value={lastOrder
                    ? formatDistanceToNow(new Date(lastOrder), { addSuffix: true, locale: ptBR })
                    : 'Nunca'
                  }
                />
              </div>
              {(storeStats?.first_order_at || customer.created_at) && (
                <p className="text-xs text-muted-foreground mt-2">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  Cliente desde {format(new Date(storeStats?.first_order_at || customer.created_at!), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Nenhum registro de cliente encontrado para este número.
            </p>
          )}
        </Section>

        {/* Últimos pedidos */}
        {recentOrders.length > 0 && (
          <>
            <Separator />
            <Section title="Últimos pedidos">
              <div className="space-y-2">
                {recentOrders.map(order => (
                  <div key={order.id} className="rounded-lg border border-border bg-muted/30 p-2.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">
                        #{order.order_number || order.id.slice(0, 6)}
                      </span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {order.delivery_type === 'delivery' ? 'Delivery' :
                         order.delivery_type === 'pickup' ? 'Retirada' :
                         order.delivery_type === 'table' ? 'Mesa' :
                         order.delivery_type === 'pdv' ? 'PDV' : order.delivery_type || '-'}
                      </span>
                      <span className="flex items-center gap-1">
                        <CreditCard className="w-3 h-3" />
                        {translatePayment(order.payment_method)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(order.created_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                      </span>
                      <span className="text-xs font-semibold text-primary">
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </>
        )}

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

// --- Sub-componentes auxiliares ---

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

function OrderStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    entregue: { label: 'Entregue', variant: 'default' },
    concluido: { label: 'Concluído', variant: 'default' },
    preparando: { label: 'Preparando', variant: 'secondary' },
    pronto: { label: 'Pronto', variant: 'secondary' },
    'em_entrega': { label: 'Em entrega', variant: 'secondary' },
    pendente: { label: 'Pendente', variant: 'outline' },
    cancelado: { label: 'Cancelado', variant: 'destructive' },
  };
  const c = config[status] || { label: status, variant: 'outline' as const };
  return <Badge variant={c.variant} className="text-[10px] px-1.5 py-0">{c.label}</Badge>;
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

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

function translatePayment(method: string | null): string {
  if (!method) return '-';
  const map: Record<string, string> = {
    pix: 'PIX',
    credit_card: 'Cartão',
    debit_card: 'Débito',
    cash: 'Dinheiro',
    dinheiro: 'Dinheiro',
    cartao: 'Cartão',
  };
  return map[method] || method;
}
