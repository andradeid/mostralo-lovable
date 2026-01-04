-- Add public SELECT policy for professional_blocks (for availability check)
CREATE POLICY "Public can view blocks for availability check"
ON professional_blocks FOR SELECT
USING (true);

-- Add public SELECT policy for bookings (for availability check)
CREATE POLICY "Public can view booking times for availability"
ON bookings FOR SELECT
USING (true);