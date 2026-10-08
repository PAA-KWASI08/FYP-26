BEGIN;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE public.sections TO anon, authenticated;

DROP POLICY IF EXISTS "Allow public read access to library sections"
  ON public.sections;

CREATE POLICY "Allow public read access to library sections"
  ON public.sections
  FOR SELECT
  TO anon, authenticated
  USING (true);

COMMIT;
