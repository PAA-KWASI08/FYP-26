BEGIN;

GRANT SELECT (
  id,
  title,
  message,
  type,
  audience,
  section_id,
  status,
  expires_at,
  created_at
) ON TABLE public.announcements TO anon;

CREATE POLICY "Allow public read access to active published announcements"
  ON public.announcements
  FOR SELECT
  TO anon
  USING (
    status = 'published'
    AND (expires_at IS NULL OR expires_at >= CURRENT_DATE)
  );

COMMIT;
