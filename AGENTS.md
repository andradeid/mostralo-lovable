# Architecture rules
- Store UaZapi webhook subscriptions and message guards share Central entitlement resolution (active module, store override, then plan) to prevent divergent behavior.
- Synchronize store UaZapi webhooks after persisted Central access or plan changes; synchronization failures must warn without undoing saved access changes.
- Bulk webhook reconciliation is master-only, paginated and limited to registered store instances; never update the master instance or global webhook.
- Booking URL-button notification formatting and transport live in a shared server helper; confirmation/reschedule and reminder reuse it to preserve the same whitelist and fallback behavior.
- Booking button signatures are enforced by the shared server payload builder, not merchant settings or plans; reserve server-only per-store white_label_buttons overrides disabled by default for future master control.