-- Remove all list templates from the database
DELETE FROM public.whatsapp_templates WHERE message_type = 'list';