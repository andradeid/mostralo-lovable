-- Allow authenticated users to check if OAuth is configured (read-only)
CREATE POLICY "Authenticated users can check oauth config status"
ON public.google_oauth_config
FOR SELECT
TO authenticated
USING (true);