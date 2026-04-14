
ALTER TABLE public.coupons
ADD COLUMN duration_type VARCHAR(20) NOT NULL DEFAULT 'once',
ADD COLUMN duration_months INTEGER DEFAULT NULL;

COMMENT ON COLUMN public.coupons.duration_type IS 'once = desconto único, multiple = primeiros X meses, forever = permanente';
COMMENT ON COLUMN public.coupons.duration_months IS 'Número de meses que o desconto se aplica (NULL = permanente quando duration_type=forever)';
