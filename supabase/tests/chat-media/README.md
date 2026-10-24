# Testes da mídia do chat (bucket whatsapp-chat-media)

Funções (Deno):

    deno test supabase/functions/_shared/chat_media_test.ts supabase/functions/_shared/chat_media_retention_test.ts

Banco (Postgres 16 local, esquema mínimo que imita o Supabase):

    createdb t1
    psql -d t1 -f supabase/tests/chat-media/00_stub_schema.sql
    psql -d t1 -f supabase/migrations/20261024090000_chat_media_retencao.sql
    psql -d t1 -f supabase/tests/chat-media/10_tests.sql
    psql -d t1 -f docs/manutencao/2-bucket-whatsapp-chat-media-privado.sql
    psql -d t1 -f supabase/tests/chat-media/20_policies.sql
