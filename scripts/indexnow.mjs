// Avisa o Bing (e quem usa IndexNow: Yandex, Seznam, Naver...) quando um artigo do blog muda.
// Roda no fim do build da Cloudflare Pages, só no main. Nunca derruba o build.
// Avisa: artigos com date/updated de hoje ou ontem (horário de Brasília) e a página do blog.
// A chave fica em public/<chave>.txt.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const HOST = "mostralo.com.br";
const SITE = `https://${HOST}`;

export function recentDays(now = new Date()) {
  const fmt = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(d);
  return new Set([fmt(now), fmt(new Date(now.getTime() - 86_400_000))]);
}

export function changedUrls(days) {
  const urls = new Set();
  const dir = join(root, "src/content/artigos");
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".json"))) {
    const a = JSON.parse(readFileSync(join(dir, f), "utf8"));
    if (days.has(a.date) || days.has(a.updated)) urls.add(`${SITE}/guia/${a.slug}`);
  }
  if (urls.size) urls.add(`${SITE}/conteudos`);
  return [...urls];
}

async function main() {
  const prod = process.env.CF_PAGES === "1" && process.env.CF_PAGES_BRANCH === "main";
  if (!prod && !process.env.INDEXNOW_FORCE) return console.log("[indexnow] fora do build de produção; nada enviado.");
  const keyFile = readdirSync(join(root, "public")).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
  if (!keyFile) return console.log("[indexnow] sem arquivo de chave em public/; nada enviado.");
  const key = keyFile.slice(0, -4);
  const urlList = changedUrls(recentDays());
  if (!urlList.length) return console.log("[indexnow] nenhuma página nova ou atualizada hoje/ontem.");
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 10_000);
  const r = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST", signal: ac.signal, headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key, keyLocation: `${SITE}/${keyFile}`, urlList }),
  }).finally(() => clearTimeout(t));
  console.log(`[indexnow] ${urlList.length} endereço(s) enviados → HTTP ${r.status}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((e) => console.log("[indexnow] falhou (o build segue):", e.message));
}
