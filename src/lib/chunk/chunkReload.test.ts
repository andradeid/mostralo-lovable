import { test } from "node:test";
import assert from "node:assert/strict";
import { canReload, isChunkLoadError, RELOAD_WINDOW_MS } from "./chunkReload";

test("reconhece erro de pedaço do app nos navegadores", () => {
  assert.ok(isChunkLoadError(new TypeError("Failed to fetch dynamically imported module: https://x/assets/ProductPage-abc.js")));
  assert.ok(isChunkLoadError(new TypeError("Importing a module script failed.")));
  assert.ok(isChunkLoadError(new Error("error loading dynamically imported module")));
  assert.ok(isChunkLoadError(new Error("Unable to preload CSS for /assets/mapbox-gl-BKWjo1HA.css")));
  assert.ok(isChunkLoadError("Failed to fetch dynamically imported module"));
  assert.ok(!isChunkLoadError(new Error("Cannot read properties of undefined")));
  assert.ok(!isChunkLoadError(null));
});

test("recarrega só uma vez a cada 30 s", () => {
  const now = 1_000_000;
  assert.ok(canReload(null, now));
  assert.ok(!canReload(now - 1000, now));
  assert.ok(canReload(now - RELOAD_WINDOW_MS - 1, now));
  assert.ok(canReload(Number.NaN, now));
});
