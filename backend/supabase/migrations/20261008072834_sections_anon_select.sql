BEGIN;

GRANT SELECT ON TABLE public.sections TO anon;

CREATE POLICY "Allow public read access to library sections"
  ON public.sections
  FOR SELECT
  TO anon
  USING (true);

COMMIT;
