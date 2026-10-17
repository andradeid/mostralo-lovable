import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { buildStoreWebhookConfig, resolveChatAccess, connectionStatus, isStoreInstance } from '../_shared/store-webhook-config.ts';

Deno.test('send-only stores subscribe only to connection', () => {
  assertEquals(buildStoreWebhookConfig('https://project.supabase.co', false), {
    url: 'https://project.supabase.co/functions/v1/uazapi-webhook', enabled: true,
    events: ['connection'], excludeMessages: ['wasSentByApi'], addUrlEvents: false, addUrlTypesMessages: false,
  });
});
Deno.test('Central stores subscribe to all five events excluding API messages', () => {
  const config = buildStoreWebhookConfig('https://project.supabase.co', true);
  assertEquals(config.events, ['messages', 'messages_update', 'connection', 'contacts', 'presence']);
  assertEquals(config.excludeMessages, ['wasSentByApi']);
});
Deno.test('explicit disable overrides plan entitlement', () => assertEquals(resolveChatAccess(true, false, true), false));
Deno.test('extra access enables Central outside plan', () => assertEquals(resolveChatAccess(true, true, false), true));
Deno.test('no override follows plan', () => {
  assertEquals(resolveChatAccess(true, null, true), true);
  assertEquals(resolveChatAccess(true, null, false), false);
});
Deno.test('inactive global module cannot enable Central', () => assertEquals(resolveChatAccess(false, true, true), false));
Deno.test('connection updates connected and disconnected even for send-only stores', () => {
  assertEquals(connectionStatus('open'), 'connected');
  assertEquals(connectionStatus('connected'), 'connected');
  assertEquals(connectionStatus('close'), 'disconnected');
  assertEquals(connectionStatus('disconnected'), 'disconnected');
});
Deno.test('master instance never belongs in store synchronization', () => {
  assertEquals(isStoreInstance({ store_id: 'store', instance_name: 'master-whatsapp-instance' }), false);
  assertEquals(isStoreInstance({ store_id: null, instance_name: 'other' }), false);
  assertEquals(isStoreInstance({ store_id: 'store', instance_name: 'store-instance' }), true);
});