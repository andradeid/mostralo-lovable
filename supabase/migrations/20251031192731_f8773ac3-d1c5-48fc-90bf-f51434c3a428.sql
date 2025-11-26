-- Allow store owners to view delivery driver roles for their stores
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'user_roles' 
      AND policyname = 'Store owners can view delivery driver roles'
  ) THEN
    CREATE POLICY "Store owners can view delivery driver roles"
    ON user_roles
    FOR SELECT
    TO authenticated
    USING (
      role = 'delivery_driver' AND EXISTS (
        SELECT 1 FROM stores s
        WHERE s.id = user_roles.store_id
          AND s.owner_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Optional: allow master_admin (by profiles) to view all roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'user_roles' 
      AND policyname = 'Master admins can view all roles (profiles based)'
  ) THEN
    CREATE POLICY "Master admins can view all roles (profiles based)"
    ON user_roles
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.user_type = 'master_admin'
      )
    );
  END IF;
END $$;