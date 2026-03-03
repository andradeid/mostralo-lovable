-- Histórico de ciclos de conversa (abertura/finalização)
CREATE TABLE IF NOT EXISTS public.whatsapp_conversation_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  conversation_id UUID NULL REFERENCES public.whatsapp_conversations(id) ON DELETE SET NULL,
  remote_jid TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversation_cycles_store_remote_opened
  ON public.whatsapp_conversation_cycles (store_id, remote_jid, opened_at DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversation_cycles_store_phone
  ON public.whatsapp_conversation_cycles (store_id, phone_number);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversation_cycles_store_remote_closed
  ON public.whatsapp_conversation_cycles (store_id, remote_jid, closed_at);

ALTER TABLE public.whatsapp_conversation_cycles ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura (mesmo padrão das tabelas de chat)
DROP POLICY IF EXISTS "Attendants can view conversation cycles" ON public.whatsapp_conversation_cycles;
CREATE POLICY "Attendants can view conversation cycles"
ON public.whatsapp_conversation_cycles
FOR SELECT
USING (public.is_attendant_for_store(store_id));

DROP POLICY IF EXISTS "Store admins can view conversation cycles" ON public.whatsapp_conversation_cycles;
CREATE POLICY "Store admins can view conversation cycles"
ON public.whatsapp_conversation_cycles
FOR SELECT
USING (public.is_store_admin_of(store_id));

-- Trigger para registrar automaticamente ciclos em mudanças de status
CREATE OR REPLACE FUNCTION public.track_whatsapp_conversation_cycles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_open_cycle_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.whatsapp_conversation_cycles (
      store_id,
      conversation_id,
      remote_jid,
      phone_number,
      opened_at,
      closed_at
    )
    VALUES (
      NEW.store_id,
      NEW.id,
      NEW.remote_jid,
      NEW.phone_number,
      COALESCE(NEW.created_at, now()),
      CASE WHEN NEW.status = 'closed' THEN COALESCE(NEW.updated_at, now()) ELSE NULL END
    );

    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      -- Fechamento: encerra ciclo aberto atual
      IF NEW.status = 'closed' AND OLD.status <> 'closed' THEN
        SELECT id
        INTO v_open_cycle_id
        FROM public.whatsapp_conversation_cycles
        WHERE store_id = NEW.store_id
          AND remote_jid = NEW.remote_jid
          AND closed_at IS NULL
        ORDER BY opened_at DESC
        LIMIT 1;

        IF v_open_cycle_id IS NOT NULL THEN
          UPDATE public.whatsapp_conversation_cycles
          SET
            closed_at = COALESCE(NEW.updated_at, now()),
            conversation_id = NEW.id,
            phone_number = NEW.phone_number
          WHERE id = v_open_cycle_id;
        ELSE
          -- Fallback defensivo se não houver ciclo aberto
          INSERT INTO public.whatsapp_conversation_cycles (
            store_id,
            conversation_id,
            remote_jid,
            phone_number,
            opened_at,
            closed_at
          )
          VALUES (
            NEW.store_id,
            NEW.id,
            NEW.remote_jid,
            NEW.phone_number,
            COALESCE(OLD.updated_at, OLD.created_at, NEW.updated_at, now()),
            COALESCE(NEW.updated_at, now())
          );
        END IF;
      END IF;

      -- Reabertura: inicia novo ciclo
      IF OLD.status = 'closed' AND NEW.status <> 'closed' THEN
        INSERT INTO public.whatsapp_conversation_cycles (
          store_id,
          conversation_id,
          remote_jid,
          phone_number,
          opened_at,
          closed_at
        )
        VALUES (
          NEW.store_id,
          NEW.id,
          NEW.remote_jid,
          NEW.phone_number,
          COALESCE(NEW.updated_at, now()),
          NULL
        );
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_track_whatsapp_conversation_cycles ON public.whatsapp_conversations;
CREATE TRIGGER trg_track_whatsapp_conversation_cycles
AFTER INSERT OR UPDATE OF status, updated_at, phone_number, remote_jid
ON public.whatsapp_conversations
FOR EACH ROW
EXECUTE FUNCTION public.track_whatsapp_conversation_cycles();

-- Backfill inicial (um ciclo por conversa atual)
INSERT INTO public.whatsapp_conversation_cycles (
  store_id,
  conversation_id,
  remote_jid,
  phone_number,
  opened_at,
  closed_at
)
SELECT
  wc.store_id,
  wc.id,
  wc.remote_jid,
  wc.phone_number,
  COALESCE(wc.created_at, now()),
  CASE WHEN wc.status = 'closed' THEN COALESCE(wc.updated_at, now()) ELSE NULL END
FROM public.whatsapp_conversations wc
WHERE NOT EXISTS (
  SELECT 1
  FROM public.whatsapp_conversation_cycles c
  WHERE c.conversation_id = wc.id
);