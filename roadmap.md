# UaZapi store webhook configuration
# Interactive booking notifications
- [x] Add store settings, plan footer entitlement and restricted Jeferson rollout.
- [x] Share URL-button formatting/sending with legacy fallback for confirmation, reschedule and reminder.
- [x] Add controls/preview, tests and publish affected booking functions.
- [ ] Verify restricted confirmation/reminder payloads and provider responses — authenticated test request returned 401; no managed session for external Supabase. Use the new authenticated controls after saving settings.

- [x] Share Central module resolution and webhook configuration; use for create/default/sync.
- [x] Sync after Central access changes and provide master bulk sync with per-store results.
- [x] Preserve connection status updates and reject messages for send-only stores early.
- [x] Test rules and publish modified Edge Functions.
- [ ] Verify real synchronization in the master UI — blocked by external Supabase authentication; no managed test session available.