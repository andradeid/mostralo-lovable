// Teste da retenção de mídia com um banco/storage em memória (imita a API do supabase-js usada).
import { deepStrictEqual as assertEquals } from "node:assert";
import { runMediaRetention } from "./chat-media-retention.ts";

const BASE = "https://x.supabase.co/storage/v1/object/public/whatsapp-chat-media/";
const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse("2026-10-24T12:00:00Z");
const ago = (d: number) => new Date(NOW - d * DAY).toISOString();
const STORE_A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"; // Central, sem "manter histórico"
const STORE_B = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"; // manter histórico = sim

type Row = Record<string, any>;

function makeDb() {
  const tables: Record<string, Row[]> = {
    stores: [{ id: STORE_A, retain_whatsapp_history: false }, { id: STORE_B, retain_whatsapp_history: true }],
    master_whatsapp_chat_messages: [
      { id: "m1", timestamp: ago(40), media_url: BASE + "master/556/1.jpg", quoted_message_id: null },
      { id: "m2", timestamp: ago(31), media_url: null, quoted_message_id: null },
      { id: "m3", timestamp: ago(5), media_url: BASE + "master/556/3.jpg", quoted_message_id: "m1" },
    ],
    whatsapp_chat_messages: [
      { id: "s1", store_id: STORE_A, media_url: BASE + `${STORE_A}/556/old.jpg`, metadata: {} },
      { id: "s2", store_id: STORE_A, media_url: BASE + `${STORE_A}/556/new.jpg`, metadata: {} },
      { id: "s3", store_id: STORE_B, media_url: BASE + `${STORE_B}/556/old.jpg`, metadata: {} },
    ],
  };
  const objects = [
    { name: "master/556/1.jpg", size: 100, created_at: ago(40) },
    { name: "master/556/3.jpg", size: 300, created_at: ago(5) },
    { name: "master/556/orfao.mp4", size: 1000, created_at: ago(60) },
    { name: `${STORE_A}/556/old.jpg`, size: 10, created_at: ago(45) },
    { name: `${STORE_A}/556/new.jpg`, size: 20, created_at: ago(2) },
    { name: `${STORE_B}/556/old.jpg`, size: 30, created_at: ago(90) },
  ];
  const calls: string[] = [];

  function query(table: string) {
    let rows = tables[table];
    let op: { kind: "select" | "update" | "delete"; patch?: Row } = { kind: "select" };
    let lim = Infinity;
    const filters: Array<(r: Row) => boolean> = [];
    const builder: any = {
      select() { op = { kind: "select" }; return builder; },
      update(patch: Row) { op = { kind: "update", patch }; return builder; },
      delete() { op = { kind: "delete" }; return builder; },
      eq(c: string, v: any) { filters.push((r) => r[c] === v); return builder; },
      lt(c: string, v: any) { filters.push((r) => r[c] < v); return builder; },
      in(c: string, vs: any[]) { filters.push((r) => vs.includes(r[c])); return builder; },
      limit(n: number) { lim = n; return builder; },
      then(resolve: (v: any) => void) {
        const hit = rows.filter((r) => filters.every((f) => f(r)));
        if (op.kind === "select") return resolve({ data: hit.slice(0, lim), error: null });
        if (op.kind === "update") { hit.forEach((r) => Object.assign(r, op.patch)); calls.push(`update:${table}:${hit.length}`); return resolve({ error: null }); }
        tables[table] = rows.filter((r) => !hit.includes(r)); rows = tables[table];
        calls.push(`delete:${table}:${hit.length}`);
        return resolve({ error: null });
      },
    };
    return builder;
  }

  const supabase = {
    from: (t: string) => query(t),
    rpc: (name: string, args: any) => {
      if (name === "chat_media_list_objects") {
        const list = objects
          .filter((o) => (!args.p_prefix || o.name.startsWith(args.p_prefix)) && (!args.p_before || o.created_at < args.p_before)
            && (!args.p_after_name || o.name > args.p_after_name))
          .sort((a, b) => a.name.localeCompare(b.name)).slice(0, args.p_limit);
        return Promise.resolve({ data: list, error: null });
      }
      if (name === "chat_media_mark_expired") {
        let n = 0;
        for (const t of ["whatsapp_chat_messages", "master_whatsapp_chat_messages"]) {
          for (const r of tables[t]) {
            const p = r.media_url?.replace(BASE, "");
            if (r.media_url && args.p_paths.includes(p)) { r.media_url = null; r.metadata = { ...(r.metadata || {}), media_expired: true }; n++; }
          }
        }
        calls.push(`mark:${n}`);
        return Promise.resolve({ data: n, error: null });
      }
      throw new Error("rpc inesperada " + name);
    },
    storage: {
      from: () => ({
        remove: (paths: string[]) => {
          const gone = objects.filter((o) => paths.includes(o.name));
          gone.forEach((o) => objects.splice(objects.indexOf(o), 1));
          calls.push(`remove:${gone.map((o) => o.name).join(",")}`);
          return Promise.resolve({ data: gone, error: null });
        },
      }),
    },
  };
  return { supabase, tables, objects, calls };
}

Deno.test("retenção de 30 dias: master, arquivos antigos, loja com histórico preservada", async () => {
  const { supabase, tables, objects, calls } = makeDb();
  const r = await runMediaRetention(supabase, 30, NOW);

  // Master: m1 e m2 (>30 dias) apagadas; m3 fica e perde a citação para m1.
  assertEquals(tables.master_whatsapp_chat_messages.map((m) => m.id), ["m3"]);
  assertEquals(tables.master_whatsapp_chat_messages[0].quoted_message_id, null);
  assertEquals(r.deleted_master_messages, 2);

  // Arquivos: sobram os recentes e os da loja que mantém histórico.
  assertEquals(objects.map((o) => o.name).sort(), [`${STORE_A}/556/new.jpg`, `${STORE_B}/556/old.jpg`, "master/556/3.jpg"].sort());
  assertEquals(r.deleted_files, 3); // 1.jpg + orfao.mp4 (master) + old.jpg da loja A
  assertEquals(r.freed_bytes, 1110);

  // Mensagem da loja A com arquivo antigo vira "mídia expirada"; recente e loja B intactas.
  const byId = Object.fromEntries(tables.whatsapp_chat_messages.map((m) => [m.id, m]));
  assertEquals(byId.s1.media_url, null);
  assertEquals(byId.s1.metadata.media_expired, true);
  assertEquals(byId.s2.media_url?.endsWith("new.jpg"), true);
  assertEquals(byId.s3.media_url?.endsWith("old.jpg"), true);
  assertEquals(r.expired_messages, 1);

  // Ordem: marca no banco antes de apagar o arquivo.
  const iMark = calls.findIndex((c) => c.startsWith("mark:"));
  const iRemoveStore = calls.findIndex((c) => c.includes(`${STORE_A}/556/old.jpg`));
  assertEquals(iMark >= 0 && iMark < iRemoveStore, true);
});

Deno.test("segunda execução não apaga mais nada", async () => {
  const { supabase } = makeDb();
  await runMediaRetention(supabase, 30, NOW);
  const r2 = await runMediaRetention(supabase, 30, NOW);
  assertEquals([r2.deleted_master_messages, r2.deleted_files, r2.freed_bytes, r2.expired_messages], [0, 0, 0, 0]);
});
