-- Corrigir search_path nas funções criadas
CREATE OR REPLACE FUNCTION public.generate_proposal_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  year_month TEXT;
  seq_num INTEGER;
  new_number TEXT;
BEGIN
  year_month := to_char(now(), 'YYMM');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(proposal_number FROM 5) AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM commercial_proposals
  WHERE proposal_number LIKE year_month || '%';
  
  new_number := year_month || LPAD(seq_num::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_proposal_slug()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;