# UaZapi store webhook configuration
- [x] Finalize frontend order tracking/group labels, scheduling settings, address map and bounded session restoration; no database changes.
- [ ] Read storefront minimum order value — blocked: public_stores omits stores.min_order_value; existing public JSON endpoint exposes unrelated sensitive fields, so it is not used. Zero/hardcoded labels are removed and display is ready for a safe projection.
- [x] Preserve all protected deep links through initial session restoration and login; frontend only, no database changes.
- [x] Finish frontend scheduled-order direct-link initialization guards, day-based countdowns and Portuguese Kanban labels; no database changes.
- [x] Correct scheduled-order filtering, metric fallback, deferred rescheduling, hidden-tab alerts, store timezone labels and bounded notification IDs; allow confirmed in the specified Edge Function only.
- [x] Implement frontend scheduled-order status, acceptance/rescheduling, RPC listing/summary/day metrics and one-time alerts without database changes.
# Interactive booking notifications
- [x] Fix scheduled orders and equivalent panel lookups to use the validated active store; preserve master behavior and existing layouts; three scope tests passed and preview build is clean.
- [ ] Verify scheduled orders with a real multi-store session — blocked by unmanaged external Supabase authentication; authenticated end-to-end checks unavailable.
- [x] Simplify shared public/signup plan cards and grouped details; no current pricing build errors remain.
- [x] Persist selected store billing cycle on signup/approved plan changes and master editing; share annual calculation with future invoice generation, preserving null-cycle behavior and existing records.
- [ ] Verify authenticated annual signup/approval and master editing end-to-end — blocked by unmanaged external Supabase authentication; no managed session available.
- [x] Add existing annual offer fields to master plan editor and shared public cards; remove old annual copy without changing billing or data.
- [x] Unify active Mostralo catalog across public pages, calculators, signup, subscription and proposal suggestions; preserve saved commercial amounts.
- [x] Add secure founder availability and master-only shortcut with ten-slot enforcement; test concrete pricing/order/limit rules.
- [x] Verify public desktop/mobile catalog, calculator and segment order; record changed files and former fixed-price locations in docs/relatorio-precos-mostralo.md.
- [ ] Verify founder application and subscription/proposal flows authenticated — blocked by unmanaged external Supabase; no managed session available. Signup was only checked at its first step, without creating an account.
- [x] Fix button signature, remove merchant footer control, test and deploy shared sending changes; visually verify both isolated preview modes.
- [ ] Verify both modes in Barbearia Jeferson Dias settings — blocked by external Supabase authentication (settings redirects to /auth).
- [x] Add store settings, plan footer entitlement and restricted Jeferson rollout.
- [x] Share URL-button formatting/sending with legacy fallback for confirmation, reschedule and reminder.
- [x] Add controls/preview, tests and publish affected booking functions.
- [ ] Verify restricted confirmation/reminder payloads and provider responses — authenticated test request returned 401; no managed session for external Supabase. Use the new authenticated controls after saving settings.

- [x] Share Central module resolution and webhook configuration; use for create/default/sync.
- [x] Sync after Central access changes and provide master bulk sync with per-store results.
- [x] Preserve connection status updates and reject messages for send-only stores early.
- [x] Test rules and publish modified Edge Functions.
- [ ] Verify real synchronization in the master UI — blocked by external Supabase authentication; no managed test session available.