# Architecture rules
- Store UaZapi webhook subscriptions and message guards share Central entitlement resolution (active module, store override, then plan) to prevent divergent behavior.
- Synchronize store UaZapi webhooks after persisted Central access or plan changes; synchronization failures must warn without undoing saved access changes.
- Bulk webhook reconciliation is master-only, paginated and limited to registered store instances; never update the master instance or global webhook.