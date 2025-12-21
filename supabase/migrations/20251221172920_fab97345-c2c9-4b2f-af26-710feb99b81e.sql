-- Função para incrementar contadores de campanha
CREATE OR REPLACE FUNCTION public.increment_campaign_counter(
  p_campaign_id UUID,
  p_counter_name TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_counter_name = 'delivered_count' THEN
    UPDATE whatsapp_campaigns 
    SET delivered_count = COALESCE(delivered_count, 0) + 1
    WHERE id = p_campaign_id;
  ELSIF p_counter_name = 'read_count' THEN
    UPDATE whatsapp_campaigns 
    SET read_count = COALESCE(read_count, 0) + 1
    WHERE id = p_campaign_id;
  ELSIF p_counter_name = 'sent_count' THEN
    UPDATE whatsapp_campaigns 
    SET sent_count = COALESCE(sent_count, 0) + 1
    WHERE id = p_campaign_id;
  ELSIF p_counter_name = 'failed_count' THEN
    UPDATE whatsapp_campaigns 
    SET failed_count = COALESCE(failed_count, 0) + 1
    WHERE id = p_campaign_id;
  END IF;
END;
$$;