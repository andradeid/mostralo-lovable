// Retenção da mídia do chat de WhatsApp (bucket whatsapp-chat-media) e das mensagens do master.
// Usado pela função whatsapp-cleanup-orphan-messages (limpeza automática e manual).
import { removeChatMediaFiles } from "./chat-media.ts";

// deno-lint-ignore no-explicit-any
type Any = any;
const BATCH = 150;

export type ChatMediaObject = { name: string; size: number; created_at: string };

export async function listChatMediaObjects(
  supabase: Any,
  opts: { prefix?: string; before?: string },
): Promise<ChatMediaObject[]> {
  const all: ChatMediaObject[] = [];
  let after: string | null = null;
  while (true) {
    const { data, error } = await supabase.rpc("chat_media_list_objects", {
      p_prefix: opts.prefix ?? null,
      p_before: opts.before ?? null,
      p_limit: 1000,
      p_after_name: after,
    });
    if (error) throw new Error("Failed to list chat media: " + error.message);
    const rows = (data || []) as ChatMediaObject[];
    all.push(...rows);
    if (rows.length < 1000) break;
    after = rows[rows.length - 1].name;
  }
  return all;
}

export async function retainedStoreIds(supabase: Any): Promise<Set<string>> {
  const { data } = await supabase.from("stores").select("id").eq("retain_whatsapp_history", true);
  return new Set((data || []).map((r: { id: string }) => r.id));
}

/**
 * Apaga mensagens do WhatsApp master mais antigas que o corte.
 * Os arquivos delas são do mesmo período e saem na varredura de arquivos antigos.
 */
export async function deleteOldMasterMessages(supabase: Any, cutoffIso: string, batchSize = BATCH) {
  let deleted = 0;
  while (true) {
    const { data, error } = await supabase
      .from("master_whatsapp_chat_messages")
      .select("id")
      .lt("timestamp", cutoffIso)
      .limit(batchSize);
    if (error) throw new Error("Failed to fetch old master messages: " + error.message);
    const ids = ((data || []) as Array<{ id: string }>).map((r) => r.id);
    if (!ids.length) break;

    // Citações apontando para mensagens que vão sair.
    await supabase.from("master_whatsapp_chat_messages").update({ quoted_message_id: null }).in("quoted_message_id", ids);
    const { error: delError } = await supabase.from("master_whatsapp_chat_messages").delete().in("id", ids);
    if (delError) throw new Error("Failed to delete old master messages: " + delError.message);
    deleted += ids.length;
    if (ids.length < batchSize) break;
  }
  return deleted;
}

/**
 * Retenção de mídia: mensagens do master e arquivos do bucket com mais de N dias.
 * Lojas com "manter histórico" ficam de fora. As mensagens de loja continuam no banco,
 * só a mídia vira "expirada".
 */
export async function runMediaRetention(supabase: Any, retentionDays: number, now = Date.now()) {
  const cutoff = new Date(now - retentionDays * 24 * 60 * 60 * 1000).toISOString();

  const deletedMasterMessages = await deleteOldMasterMessages(supabase, cutoff);

  const retained = await retainedStoreIds(supabase);
  const oldFiles = (await listChatMediaObjects(supabase, { before: cutoff }))
    .filter((f) => !retained.has(f.name.split("/")[0]));

  let expiredMessages = 0;
  let deletedFiles = 0;
  let freedBytes = 0;
  for (let i = 0; i < oldFiles.length; i += 500) {
    const batch = oldFiles.slice(i, i + 500);
    const paths = batch.map((f) => f.name);
    const { data: marked, error } = await supabase.rpc("chat_media_mark_expired", { p_paths: paths });
    if (error) throw new Error("Failed to mark expired media: " + error.message);
    expiredMessages += Number(marked || 0);
    deletedFiles += await removeChatMediaFiles(supabase, paths);
    freedBytes += batch.reduce((sum, f) => sum + Number(f.size || 0), 0);
  }

  return {
    cutoff,
    deleted_master_messages: deletedMasterMessages,
    deleted_files: deletedFiles,
    freed_bytes: freedBytes,
    expired_messages: expiredMessages,
  };
}

