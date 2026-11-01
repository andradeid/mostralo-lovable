// Tipos da tela WhatsApp Master.
export interface TestMessage {
  id: string;
  phone_number: string;
  country_code: string;
  message: string;
  status: string;
  sent_at: string;
  error_message?: string;
}

export interface AssistantStatus {
  id: string;
  name: string;
  model: string;
  tools_count: number;
  created_at: string | null;
}
