// Faxina do bucket whatsapp-chat-media (Mostralo).
// Apaga: (1) todos os arquivos de lojas SEM a Central de WhatsApp e (2) arquivos com mais de N dias
// (padrão 30), inclusive da pasta master/. Lojas com "manter histórico" ficam de fora.
//
// Por padrão só LISTA (quantidade e tamanho). Para apagar de verdade, passe --executar.
//
//   export SUPABASE_URL=https://noshwvwpjtnvndokbfjx.supabase.co
//   export SUPABASE_SERVICE_ROLE_KEY=...   (Supabase > Project Settings > API > service_role)
//   deno run -A scripts/faxina-whatsapp-chat-media.ts               # só lista
//   deno run -A scripts/faxina-whatsapp-chat-media.ts --executar    # apaga
//   deno run -A scripts/faxina-whatsapp-chat-media.ts --dias=60     # outro prazo
//
// Antes de apagar, marca as mensagens que apontam para esses arquivos como "mídia expirada"
// (se a migration 20261024090000_chat_media_retencao.sql já estiver aplicada).
import { createClient } from "npm:@supabase/supabase-js@2";

const BUCKET = "whatsapp-chat-media";
const args = new Set(Deno.args);
const EXECUTAR = args.has("--executar");
const DIAS = Number([...args].find((a) => a.startsWith("--dias="))?.split("=")[1] ?? 30);

const url = Deno.env.get("SUPABASE_URL");
const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!url || !key) {
  console.error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
  Deno.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });
const cutoff = new Date(Date.now() - DIAS * 24 * 60 * 60 * 1000);

type Obj = { name: string; size: number; created_at: string };

// Lista pela função do banco; se a migration ainda não foi aplicada, varre pela API do storage.
async function listarTudo(): Promise<Obj[]> {
  const out: Obj[] = [];
  let after: string | null = null;
  const first = await sb.rpc("chat_media_list_objects", { p_prefix: null, p_before: null, p_limit: 1000, p_after_name: null });
  if (!first.error) {
    let rows = (first.data || []) as Obj[];
    while (true) {
      out.push(...rows);
      if (rows.length < 1000) break;
      after = rows[rows.length - 1].name;
      const next = await sb.rpc("chat_media_list_objects", { p_prefix: null, p_before: null, p_limit: 1000, p_after_name: after });
      if (next.error) throw next.error;
      rows = (next.data || []) as Obj[];
    }
    return out;
  }
  console.log("(função chat_media_list_objects não encontrada; varrendo pela API do storage, mais lento)");
  async function walk(prefix: string) {
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await sb.storage.from(BUCKET).list(prefix, { limit: 1000, offset, sortBy: { column: "name", order: "asc" } });
      if (error) throw error;
      for (const item of data || []) {
        const full = prefix ? `${prefix}/${item.name}` : item.name;
        if (item.id === null) await walk(full);
        else out.push({ name: full, size: Number(item.metadata?.size || 0), created_at: item.created_at ?? new Date().toISOString() });
      }
      if ((data || []).length < 1000) break;
    }
  }
  await walk("");
  return out;
}

const mb = (b: number) => (b / 1048576).toFixed(1).replace(".", ",") + " MB";

const { data: semCentral, error: e1 } = await sb.rpc("get_stores_without_chat_module");
if (e1) throw e1;
const lojasSemCentral = new Map<string, string>((semCentral || []).map((s: { store_id: string; store_name: string }) => [s.store_id, s.store_name]));
const { data: retidas } = await sb.from("stores").select("id").eq("retain_whatsapp_history", true);
const manter = new Set((retidas || []).map((r: { id: string }) => r.id));
const { data: lojas } = await sb.from("stores").select("id, name");
const nomes = new Map<string, string>((lojas || []).map((s: { id: string; name: string }) => [s.id, s.name]));

const todos = await listarTudo();
const apagar: Array<Obj & { motivo: string }> = [];
for (const o of todos) {
  const pasta = o.name.split("/")[0];
  if (manter.has(pasta)) continue;
  if (lojasSemCentral.has(pasta)) apagar.push({ ...o, motivo: "loja sem Central" });
  else if (new Date(o.created_at) < cutoff) apagar.push({ ...o, motivo: `mais de ${DIAS} dias` });
}

const porPasta = new Map<string, { n: number; b: number; motivo: string }>();
for (const o of apagar) {
  const pasta = o.name.split("/")[0];
  const cur = porPasta.get(pasta) || { n: 0, b: 0, motivo: o.motivo };
  cur.n++; cur.b += Number(o.size || 0);
  porPasta.set(pasta, cur);
}
const totalBucket = todos.reduce((s, o) => s + Number(o.size || 0), 0);
const totalApagar = apagar.reduce((s, o) => s + Number(o.size || 0), 0);

console.log(`\nBucket ${BUCKET}: ${todos.length} arquivos, ${mb(totalBucket)}`);
console.log(`Corte: arquivos criados antes de ${cutoff.toISOString().slice(0, 10)} (${DIAS} dias)\n`);
console.log("Pasta | Loja | Motivo | Arquivos | Tamanho");
for (const [pasta, v] of [...porPasta].sort((a, b) => b[1].b - a[1].b)) {
  const nome = pasta === "master" ? "WhatsApp master" : (nomes.get(pasta) || "(loja não encontrada)");
  console.log(`${pasta} | ${nome} | ${v.motivo} | ${v.n} | ${mb(v.b)}`);
}
console.log(`\nA apagar: ${apagar.length} arquivos, ${mb(totalApagar)}. Fica: ${todos.length - apagar.length} arquivos, ${mb(totalBucket - totalApagar)}.`);

if (!EXECUTAR) {
  console.log("\nNada foi apagado (modo lista). Para apagar, rode de novo com --executar.");
  Deno.exit(0);
}

let marcadas = 0;
let removidos = 0;
for (let i = 0; i < apagar.length; i += 100) {
  const lote = apagar.slice(i, i + 100).map((o) => o.name);
  const mk = await sb.rpc("chat_media_mark_expired", { p_paths: lote });
  if (!mk.error) marcadas += Number(mk.data || 0);
  const { data, error } = await sb.storage.from(BUCKET).remove(lote);
  if (error) {
    console.error(`Erro no lote ${i / 100 + 1}: ${error.message}`);
    continue;
  }
  removidos += (data || []).length;
  if ((i / 100) % 10 === 0) console.log(`... ${removidos} removidos`);
}
console.log(`\nPronto: ${removidos} arquivos removidos (${mb(totalApagar)} estimados); ${marcadas} mensagens marcadas como "mídia expirada".`);
