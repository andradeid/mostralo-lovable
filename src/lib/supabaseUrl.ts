// URL do projeto Supabase para montar links de funções (webhooks).
// No Cloudflare a variável VITE_SUPABASE_URL não existe no build; sem o valor reserva o link saía "undefined/functions/v1/...".
export const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL || "https://noshwvwpjtnvndokbfjx.supabase.co";

export const functionUrl = (name: string) => `${SUPABASE_URL}/functions/v1/${name}`;
