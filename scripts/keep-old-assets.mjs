// Mantém no ar os arquivos /assets/* das publicações anteriores (por 7 dias).
// Por quê: cada deploy troca os nomes (hash) dos pedaços do app. Quem abriu a página antes do
// deploy — e o robô do Google, que lê o HTML e só depois busca o JS — pede um arquivo que sumiu,
// e a Cloudflare devolve o index.html no lugar (200 text/html), quebrando a página.
// Como funciona: o build publica dist/assets-manifest.json (arquivo → última vez no ar). No build
// seguinte, este script lê o manifesto publicado, baixa os arquivos antigos que ainda valem e os
// coloca em dist/assets ao lado dos novos. Roda só no build da Cloudflare. Nunca derruba o build.
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(root, "dist");
const MANIFEST = "assets-manifest.json";
export const KEEP_DAYS = 7;
export const MAX_INHERITED = 4000;

/** Site publicado do mesmo ramo (produção = domínio; outros = <ramo>.mostralo.pages.dev). */
export function siteForBranch(branch) {
  if (!branch) return null;
  if (branch === "main") return "https://mostralo.com.br";
  const sub = branch.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/^-+|-+$/g, "").slice(0, 28);
  return sub ? `https://${sub}.mostralo.pages.dev` : null;
}

/** Novo manifesto: arquivos atuais com "agora" + herdados ainda dentro do prazo (mais recentes primeiro). */
export function mergeManifest(previous, currentFiles, now = Date.now()) {
  const limit = now - KEEP_DAYS * 86_400_000;
  const files = {};
  for (const f of currentFiles) files[f] = new Date(now).toISOString();
  const inherited = Object.entries(previous?.files ?? {})
    .filter(([f, t]) => /^assets\/[^/]+$/.test(f) && !(f in files) && Date.parse(t) >= limit)
    .sort((a, b) => Date.parse(b[1]) - Date.parse(a[1]))
    .slice(0, MAX_INHERITED);
  for (const [f, t] of inherited) files[f] = t;
  return { version: 1, files, inherited: inherited.map(([f]) => f) };
}

/** A resposta é o arquivo de verdade (e não o index.html devolvido para caminho inexistente)? */
export function isRealAsset(contentType) {
  return !(contentType || "").toLowerCase().includes("text/html");
}

async function fetchWithTimeout(url, ms) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try {
    return await fetch(url, { signal: ac.signal, headers: { "User-Agent": "mostralo-build" } });
  } finally {
    clearTimeout(t);
  }
}

function listCurrent() {
  const dir = join(DIST, "assets");
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => statSync(join(dir, f)).isFile()).map((f) => `assets/${f}`);
}

async function main() {
  const current = listCurrent();
  const branch = process.env.CF_PAGES === "1" ? process.env.CF_PAGES_BRANCH : process.env.KEEP_ASSETS_BRANCH;
  const site = process.env.KEEP_ASSETS_SITE || siteForBranch(branch);
  let previous = null;
  if (site) {
    try {
      const r = await fetchWithTimeout(`${site}/${MANIFEST}?b=${Date.now()}`, 15_000);
      if (r.ok && (r.headers.get("content-type") || "").includes("json")) previous = await r.json();
      else console.log(`[keep-old-assets] sem manifesto anterior em ${site} (${r.status}).`);
    } catch (e) {
      console.log(`[keep-old-assets] não leu o manifesto anterior: ${e?.message ?? e}`);
    }
  } else {
    console.log("[keep-old-assets] fora do build da Cloudflare; só gera o manifesto.");
  }

  const merged = mergeManifest(previous, current);
  const kept = new Set(current);
  if (site && merged.inherited.length) {
    const queue = [...merged.inherited];
    let ok = 0, fail = 0;
    const deadline = Date.now() + 120_000;
    const worker = async () => {
      while (queue.length && Date.now() < deadline) {
        const f = queue.shift();
        try {
          const r = await fetchWithTimeout(`${site}/${f}`, 20_000);
          if (!r.ok || !isRealAsset(r.headers.get("content-type"))) { fail++; continue; }
          const buf = Buffer.from(await r.arrayBuffer());
          mkdirSync(dirname(join(DIST, f)), { recursive: true });
          writeFileSync(join(DIST, f), buf);
          kept.add(f);
          ok++;
        } catch {
          fail++;
        }
      }
    };
    await Promise.all(Array.from({ length: 16 }, worker));
    console.log(`[keep-old-assets] ${ok} arquivos antigos mantidos, ${fail} sem sucesso, ${queue.length} não tentados.`);
  }

  // Só entra no manifesto o que de fato vai estar no ar
  const files = Object.fromEntries(Object.entries(merged.files).filter(([f]) => kept.has(f)));
  writeFileSync(join(DIST, MANIFEST), JSON.stringify({ version: 1, generated: new Date().toISOString(), files }));
  console.log(`[keep-old-assets] manifesto com ${Object.keys(files).length} arquivos (${current.length} desta versão).`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((e) => console.log(`[keep-old-assets] ignorado: ${e?.message ?? e}`));
}
