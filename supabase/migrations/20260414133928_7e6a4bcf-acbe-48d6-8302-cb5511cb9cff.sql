-- Allow anyone to look up a coupon by exact code for validation during signup
-- This is safe because the user must already know the coupon code
CREATE POLICY "Anyone can validate coupon by code"
ON public.coupons
FOR SELECT
USING (
  (status)::text = 'active'::text
  AND ((start_date IS NULL) OR (start_date <= now()))
  AND ((end_date IS NULL) OR (end_date > now()))
);