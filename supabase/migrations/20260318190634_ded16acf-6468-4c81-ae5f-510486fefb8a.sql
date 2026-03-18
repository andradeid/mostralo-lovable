
DROP POLICY IF EXISTS "Public can create bookings" ON bookings;

CREATE POLICY "Public can create bookings" ON bookings
  FOR INSERT TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = bookings.store_id 
      AND stores.status = 'active'
    )
    AND status IN ('pending', 'confirmed')
  );
