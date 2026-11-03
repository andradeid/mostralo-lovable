import { test } from "node:test";
import assert from "node:assert/strict";
import { isRealAsset, mergeManifest, siteForBranch } from "./keep-old-assets.mjs";

test("site por ramo", () => {
  assert.equal(siteForBranch("main"), "https://mostralo.com.br");
  assert.equal(siteForBranch("componentizacao"), "https://componentizacao.mostralo.pages.dev");
  assert.equal(siteForBranch("feat/Leitor_Auto"), "https://feat-leitor-auto.mostralo.pages.dev");
  assert.equal(siteForBranch(undefined), null);
});

test("manifesto: atuais + antigos dentro de 7 dias", () => {
  const now = Date.parse("2026-11-03T12:00:00Z");
  const prev = { files: {
    "assets/a-OLD.js": "2026-11-01T00:00:00Z",
    "assets/b-VELHO.js": "2026-10-20T00:00:00Z",
    "assets/c.js": "2026-11-02T00:00:00Z",
    "../fora.js": "2026-11-02T00:00:00Z",
  } };
  const m = mergeManifest(prev, ["assets/c.js", "assets/d-NEW.js"], now);
  assert.deepEqual(m.inherited, ["assets/a-OLD.js"]);
  assert.equal(m.files["assets/c.js"], new Date(now).toISOString());
  assert.ok(!("assets/b-VELHO.js" in m.files));
  assert.ok(!("../fora.js" in m.files));
});

test("sem manifesto anterior", () => {
  const m = mergeManifest(null, ["assets/x.js"]);
  assert.deepEqual(m.inherited, []);
  assert.deepEqual(Object.keys(m.files), ["assets/x.js"]);
});

test("index.html devolvido no lugar do arquivo não conta", () => {
  assert.equal(isRealAsset("text/html; charset=utf-8"), false);
  assert.equal(isRealAsset("application/javascript"), true);
  assert.equal(isRealAsset("text/css"), true);
});
