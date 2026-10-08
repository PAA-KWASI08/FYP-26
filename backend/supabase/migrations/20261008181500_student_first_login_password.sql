BEGIN;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.student_check_in(
  p_seat_code text,
  p_latitude double precision,
  p_longitude double precision,
  p_accuracy_meters double precision,
  p_location_captured_at timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  authenticated_user_id uuid := auth.uid();
  target_seat public.seats%ROWTYPE;
  target_section public.sections%ROWTYPE;
  new_session public.seat_sessions%ROWTYPE;
  latitude_radians double precision;
  longitude_radians double precision;
  distance_haversine double precision;
  distance_meters double precision;
BEGIN
  IF authenticated_user_id IS NULL THEN
    RAISE EXCEPTION 'Sign in is required to check in' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = authenticated_user_id
      AND role = 'student'
      AND account_status = 'active'
      AND must_change_password = false
  ) THEN
    RAISE EXCEPTION 'An active, fully set-up student account is required' USING ERRCODE = '42501';
  END IF;
  IF p_seat_code IS NULL OR nullif(btrim(p_seat_code), '') IS NULL
    OR p_latitude IS NULL OR p_longitude IS NULL
    OR p_latitude NOT BETWEEN -90 AND 90
    OR p_longitude NOT BETWEEN -180 AND 180
    OR p_accuracy_meters IS NULL OR p_accuracy_meters < 0 OR p_accuracy_meters > 50
    OR p_location_captured_at IS NULL
    OR p_location_captured_at < now() - interval '1 minute'
    OR p_location_captured_at > now() + interval '5 seconds'
  THEN
    RAISE EXCEPTION 'A current verified library location and seat are required' USING ERRCODE = '22023';
  END IF;

  latitude_radians := radians(p_latitude - 5.6511292);
  longitude_radians := radians(p_longitude - (-0.1870251));
  distance_haversine := sin(latitude_radians / 2) ^ 2
    + cos(radians(5.6511292)) * cos(radians(p_latitude))
    * sin(longitude_radians / 2) ^ 2;
  distance_meters := 6371000 * 2 * asin(sqrt(least(1, distance_haversine)));
  IF distance_meters + p_accuracy_meters > 50 THEN
    RAISE EXCEPTION 'Location is outside the library check-in area' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO target_seat
  FROM public.seats
  WHERE upper(regexp_replace(seat_code, '\s+', '', 'g'))
      = upper(regexp_replace(btrim(p_seat_code), '\s+', '', 'g'))
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Seat not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO target_section
  FROM public.sections
  WHERE id = target_seat.section_id
  FOR SHARE;
  IF target_section.status <> 'open' THEN
    RAISE EXCEPTION 'This section is closed' USING ERRCODE = '23514';
  END IF;
  IF target_seat.status <> 'available' THEN
    RAISE EXCEPTION 'This seat is no longer available' USING ERRCODE = '23514';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.seat_sessions
    WHERE user_id = authenticated_user_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'You already have an active study session' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.seat_sessions (
    user_id, seat_id, status, location_status, location_verified_at
  )
  VALUES (
    authenticated_user_id, target_seat.id, 'active', 'within_library', p_location_captured_at
  )
  RETURNING * INTO new_session;

  UPDATE public.seats
  SET status = 'occupied', unavailable_reason = NULL
  WHERE id = target_seat.id;

  RETURN jsonb_build_object(
    'id', new_session.id,
    'user_id', new_session.user_id,
    'seat_id', target_seat.id,
    'seat_code', target_seat.seat_code,
    'section_id', target_section.id,
    'section_name', target_section.name,
    'check_in_time', new_session.check_in_time,
    'status', new_session.status,
    'location_status', new_session.location_status,
    'location_verified_at', new_session.location_verified_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_initial_password_change()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  authenticated_user_id uuid := auth.uid();
BEGIN
  IF authenticated_user_id IS NULL THEN
    RAISE EXCEPTION 'Sign in is required to update account setup' USING ERRCODE = '42501';
  END IF;

  UPDATE public.users
  SET must_change_password = false
  WHERE id = authenticated_user_id
    AND role = 'student'
    AND account_status = 'active'
    AND must_change_password = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No pending initial password change was found' USING ERRCODE = 'P0002';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_initial_password_change() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_initial_password_change() TO authenticated;

COMMIT;
