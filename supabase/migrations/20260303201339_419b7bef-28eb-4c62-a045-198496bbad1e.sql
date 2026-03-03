
-- Add reactions column to whatsapp_chat_messages (stores emoji reactions as JSONB array)
-- Format: [{"emoji": "👍", "from": "5561999999999", "from_me": true}]
ALTER TABLE public.whatsapp_chat_messages 
ADD COLUMN IF NOT EXISTS reactions jsonb DEFAULT '[]'::jsonb;

-- Add quoted_content to store quoted message preview (avoids extra queries)
ALTER TABLE public.whatsapp_chat_messages 
ADD COLUMN IF NOT EXISTS quoted_content jsonb DEFAULT NULL;
-- Format: {"content": "texto da msg", "sender_name": "João", "message_type": "text", "media_url": null}
