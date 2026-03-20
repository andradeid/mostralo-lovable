
-- =====================================================
-- Add store_id to comanda_items and order_items
-- with BEFORE INSERT OR UPDATE triggers + exception guard
-- =====================================================

-- 1. Add columns (nullable initially for backfill)
ALTER TABLE public.comanda_items ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id);
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id);

-- 2. Backfill existing rows
UPDATE public.comanda_items ci
SET store_id = c.store_id
FROM public.comandas c
WHERE ci.comanda_id = c.id
  AND ci.store_id IS NULL;

UPDATE public.order_items oi
SET store_id = o.store_id
FROM public.orders o
WHERE oi.order_id = o.id
  AND oi.store_id IS NULL;

-- 3. Set NOT NULL after backfill
ALTER TABLE public.comanda_items ALTER COLUMN store_id SET NOT NULL;
ALTER TABLE public.order_items ALTER COLUMN store_id SET NOT NULL;

-- 4. Create indexes for Realtime filter performance
CREATE INDEX IF NOT EXISTS idx_comanda_items_store_id ON public.comanda_items(store_id);
CREATE INDEX IF NOT EXISTS idx_order_items_store_id ON public.order_items(store_id);

-- 5. Trigger function for comanda_items
CREATE OR REPLACE FUNCTION public.set_comanda_item_store_id()
RETURNS TRIGGER AS $$
DECLARE
  v_store_id UUID;
BEGIN
  -- Always derive on INSERT; on UPDATE only if comanda_id changed
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.comanda_id IS DISTINCT FROM OLD.comanda_id) THEN
    SELECT store_id INTO v_store_id FROM public.comandas WHERE id = NEW.comanda_id;
    IF v_store_id IS NULL THEN
      RAISE EXCEPTION 'comanda_items: cannot derive store_id — comanda_id % not found or has no store_id', NEW.comanda_id;
    END IF;
    NEW.store_id := v_store_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_set_comanda_item_store_id
  BEFORE INSERT OR UPDATE ON public.comanda_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_comanda_item_store_id();

-- 6. Trigger function for order_items
CREATE OR REPLACE FUNCTION public.set_order_item_store_id()
RETURNS TRIGGER AS $$
DECLARE
  v_store_id UUID;
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.order_id IS DISTINCT FROM OLD.order_id) THEN
    SELECT store_id INTO v_store_id FROM public.orders WHERE id = NEW.order_id;
    IF v_store_id IS NULL THEN
      RAISE EXCEPTION 'order_items: cannot derive store_id — order_id % not found or has no store_id', NEW.order_id;
    END IF;
    NEW.store_id := v_store_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_set_order_item_store_id
  BEFORE INSERT OR UPDATE ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_order_item_store_id();
