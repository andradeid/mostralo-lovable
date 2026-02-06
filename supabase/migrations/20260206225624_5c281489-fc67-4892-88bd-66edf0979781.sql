
-- Fix: set the correct store_id for the Drogaria Farma Bella owner's store_admin role
UPDATE public.user_roles
SET store_id = '2f2bebec-f638-4bea-825b-9c18ba719a7a'
WHERE id = 'eee1f9d0-0a1c-4191-9352-5f0ada2151e8'
  AND user_id = 'fff44925-9e7e-4937-ad1e-40ccbfe40c95'
  AND role = 'store_admin'
  AND store_id IS NULL;
