// Tipos da tela de WhatsApp da loja.
export interface Template {
  id: string;
  name: string;
  content: string;
  message_type: string;
  media_url?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  total_orders: number;
  total_spent: number;
  last_order_at: string | null;
}

export interface MessageLog {
  id: string;
  phone_number: string;
  content: string;
  status: string;
  error_message?: string;
  sent_at?: string;
  failed_at?: string;
  created_at: string;
  customer?: { name: string } | null;
  template?: { name: string } | null;
}
