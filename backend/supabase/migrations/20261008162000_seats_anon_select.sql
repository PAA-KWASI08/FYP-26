BEGIN;

GRANT SELECT (
  id,
  section_id,
  seat_code,
  status,
  qr_identifier,
  unavailable_reason
) ON TABLE public.seats TO anon;

CREATE POLICY "Allow public read access to library seats"
  ON public.seats
  FOR SELECT
  TO anon
  USING (true);

COMMIT;
