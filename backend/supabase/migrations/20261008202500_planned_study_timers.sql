BEGIN;

ALTER TABLE public.seat_sessions
  ADD COLUMN planned_duration_minutes integer
  CHECK (planned_duration_minutes BETWEEN 1 AND 1440);

ALTER FUNCTION public.student_check_in(text, double precision, double precision, double precision, timestamptz)
  RENAME TO student_check_in_before_planned_timer;
REVOKE ALL ON FUNCTION public.student_check_in_before_planned_timer(text, double precision, double precision, double precision, timestamptz)
  FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.student_check_in(
  p_seat_code text,
  p_latitude double precision,
  p_longitude double precision,
  p_accuracy_meters double precision,
  p_location_captured_at timestamptz,
  p_planned_duration_minutes integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  result jsonb;
  session_id uuid;
BEGIN
  IF p_planned_duration_minutes IS NOT NULL
    AND p_planned_duration_minutes NOT BETWEEN 1 AND 1440
  THEN
    RAISE EXCEPTION 'Planned study duration must be between 1 and 1440 minutes'
      USING ERRCODE = '22023';
  END IF;

  result := public.student_check_in_before_planned_timer(
    p_seat_code,
    p_latitude,
    p_longitude,
    p_accuracy_meters,
    p_location_captured_at
  );

  session_id := (result->>'id')::uuid;
  UPDATE public.seat_sessions
  SET planned_duration_minutes = p_planned_duration_minutes
  WHERE id = session_id
    AND user_id = auth.uid()
    AND status = 'active';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'The planned study duration could not be saved with the active session'
      USING ERRCODE = 'P0002';
  END IF;

  RETURN result || jsonb_build_object(
    'planned_duration_minutes', p_planned_duration_minutes
  );
END;
$$;

REVOKE ALL ON FUNCTION public.student_check_in(text, double precision, double precision, double precision, timestamptz, integer)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.student_check_in(text, double precision, double precision, double precision, timestamptz, integer)
  TO authenticated;

COMMIT;
