import { deepStrictEqual as assertEquals } from "node:assert";
import {
  canonicalChatMediaUrl, chatMediaPathAllowed, chatMediaPathFromUrl, chatMediaPathsFromUrls,
  fetchableChatMediaUrl, removeChatMediaFiles,
} from "./chat-media.ts";

const BASE = "https://noshwvwpjtnvndokbfjx.supabase.co";
const STORE = "c9734c8f-0faf-40a0-b05e-74dd0ccbd0c7";

Deno.test("extrai o caminho de URL pública, assinada e autenticada", () => {
  const path = `${STORE}/5561999990000/1712345_ABC.jpg`;
  assertEquals(chatMediaPathFromUrl(`${BASE}/storage/v1/object/public/whatsapp-chat-media/${path}`), path);
  assertEquals(chatMediaPathFromUrl(`${BASE}/storage/v1/object/sign/whatsapp-chat-media/${path}?token=xyz`), path);
  assertEquals(chatMediaPathFromUrl(`${BASE}/storage/v1/object/authenticated/whatsapp-chat-media/${path}#x`), path);
  assertEquals(chatMediaPathFromUrl(`${BASE}/storage/v1/object/public/whatsapp-chat-media/master/a%20b.pdf`), "master/a b.pdf");
});

Deno.test("ignora URL de outro bucket ou de fora", () => {
  assertEquals(chatMediaPathFromUrl(`${BASE}/storage/v1/object/public/product-images/x.jpg`), null);
  assertEquals(chatMediaPathFromUrl("https://mmg.whatsapp.net/v/t62/abc.enc"), null);
  assertEquals(chatMediaPathFromUrl(null), null);
});

Deno.test("URL canônica faz ida e volta", () => {
  const path = "master/5561/1_nome com espaço.pdf";
  assertEquals(chatMediaPathFromUrl(canonicalChatMediaUrl(BASE, path)), path);
});

Deno.test("pasta permitida", () => {
  assertEquals(chatMediaPathAllowed(`${STORE}/x.jpg`, STORE), true);
  assertEquals(chatMediaPathAllowed(`outra/x.jpg`, STORE), false);
  assertEquals(chatMediaPathAllowed(`${STORE}/../master/x.jpg`, STORE), false);
  assertEquals(chatMediaPathAllowed(`master/x.jpg`, "master"), true);
});

function fakeSupabase(log: string[]) {
  return {
    storage: {
      from: (bucket: string) => ({
        createSignedUrl: (path: string, ttl: number) => {
          log.push(`sign:${bucket}:${path}:${ttl}`);
          return Promise.resolve({ data: { signedUrl: `${BASE}/storage/v1/object/sign/${bucket}/${path}?token=t` }, error: null });
        },
        remove: (paths: string[]) => {
          log.push(`remove:${paths.length}`);
          return Promise.resolve({ data: paths.map((name) => ({ name })), error: null });
        },
      }),
    },
  };
}

Deno.test("URL para a UaZapi: assina arquivo do bucket, respeita a pasta, mantém URL externa", async () => {
  const log: string[] = [];
  const sb = fakeSupabase(log);
  const own = canonicalChatMediaUrl(BASE, `${STORE}/1.jpg`);
  assertEquals((await fetchableChatMediaUrl(sb, own, STORE))?.includes("/object/sign/whatsapp-chat-media/"), true);
  assertEquals(await fetchableChatMediaUrl(sb, canonicalChatMediaUrl(BASE, "outra-loja/1.jpg"), STORE), null);
  assertEquals(await fetchableChatMediaUrl(sb, "https://cdn.exemplo.com/a.jpg", STORE), "https://cdn.exemplo.com/a.jpg");
  assertEquals(await fetchableChatMediaUrl(sb, null), null);
  assertEquals(log, [`sign:whatsapp-chat-media:${STORE}/1.jpg:3600`]);
});

Deno.test("remoção em lotes e caminhos sem repetição", async () => {
  const log: string[] = [];
  const paths = Array.from({ length: 250 }, (_, i) => `master/p/${i}.jpg`);
  assertEquals(await removeChatMediaFiles(fakeSupabase(log), paths), 250);
  assertEquals(log, ["remove:100", "remove:100", "remove:50"]);
  const url = canonicalChatMediaUrl(BASE, "master/p/1.jpg");
  assertEquals(chatMediaPathsFromUrls([url, url, null, "https://x/y.jpg"]), ["master/p/1.jpg"]);
});
