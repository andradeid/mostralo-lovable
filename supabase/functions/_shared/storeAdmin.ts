import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * Confere se quem chamou a função (Authorization: Bearer <jwt do usuário>) é dono/admin da loja
 * (ou master). Usa a função is_store_admin_of do banco com o token do próprio usuário.
 * A chave anônima do site NÃO passa: precisa de um usuário logado.
 */
export async function getStoreAdminUser(req: Request, storeId: string): Promise<{ id: string } | null> {
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) return null;
  const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData } = await userClient.auth.getUser();
  const user = userData?.user;
  if (!user) return null;
  const { data: isAdmin, error } = await userClient.rpc("is_store_admin_of", { _store_id: storeId });
  if (error || isAdmin !== true) return null;
  return { id: user.id };
}
