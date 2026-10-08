BEGIN;

GRANT SELECT ON TABLE public.users TO authenticated;
REVOKE ALL ON TABLE public.users FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.users FROM authenticated;
REVOKE ALL ON TABLE public.seat_sessions FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.seat_sessions FROM authenticated;
GRANT SELECT ON TABLE public.seat_sessions TO authenticated;

DROP POLICY IF EXISTS users_select_own_profile ON public.users;
CREATE POLICY users_select_own_profile
  ON public.users
  FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS seat_sessions_select_own ON public.seat_sessions;
CREATE POLICY seat_sessions_select_own
  ON public.seat_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

ALTER FUNCTION public.prototype_admin_seats(text, text, text, text, text, text, text, text, text)
  RENAME TO prototype_admin_seats_legacy;
REVOKE ALL ON FUNCTION public.prototype_admin_seats_legacy(text, text, text, text, text, text, text, text, text)
  FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.prototype_admin_seats(
  p_admin_id text,
  p_pin text,
  p_action text,
  p_section_id text DEFAULT NULL,
  p_previous_seat_code text DEFAULT NULL,
  p_seat_code text DEFAULT NULL,
  p_qr_identifier text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_unavailable_reason text DEFAULT NULL
)
RETURNS SETOF public.seats
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  existing_status text;
BEGIN
  IF p_action = 'create' AND p_status = 'occupied' THEN
    RAISE EXCEPTION 'Occupied status can only be set by student check-in' USING ERRCODE = '42501';
  END IF;

  IF p_action = 'update' AND p_status = 'occupied' THEN
    SELECT status INTO existing_status
    FROM public.seats
    WHERE seat_code = p_previous_seat_code;
    IF existing_status IS DISTINCT FROM 'occupied' THEN
      RAISE EXCEPTION 'Occupied status can only be set by student check-in' USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN QUERY
    SELECT * FROM public.prototype_admin_seats_legacy(
      p_admin_id,
      p_pin,
      p_action,
      p_section_id,
      p_previous_seat_code,
      p_seat_code,
      p_qr_identifier,
      p_status,
      p_unavailable_reason
    );
END;
$$;

REVOKE ALL ON FUNCTION public.prototype_admin_seats(text, text, text, text, text, text, text, text, text)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.prototype_admin_seats(text, text, text, text, text, text, text, text, text)
  TO anon, authenticated;

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
  ) THEN
    RAISE EXCEPTION 'An active student account is required' USING ERRCODE = '42501';
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

CREATE OR REPLACE FUNCTION public.student_check_out(p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  authenticated_user_id uuid := auth.uid();
  active_session public.seat_sessions%ROWTYPE;
  target_seat public.seats%ROWTYPE;
  completed_session public.seat_sessions%ROWTYPE;
BEGIN
  IF authenticated_user_id IS NULL THEN
    RAISE EXCEPTION 'Sign in is required to check out' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO active_session
  FROM public.seat_sessions
  WHERE id = p_session_id
    AND user_id = authenticated_user_id
    AND status = 'active'
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Your active session could not be verified' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO target_seat
  FROM public.seats
  WHERE id = active_session.seat_id
  FOR UPDATE;

  UPDATE public.seat_sessions
  SET status = 'completed', check_out_time = now()
  WHERE id = active_session.id
  RETURNING * INTO completed_session;

  IF target_seat.status = 'occupied' THEN
    UPDATE public.seats
    SET status = 'available', unavailable_reason = NULL
    WHERE id = target_seat.id;
  END IF;

  RETURN jsonb_build_object(
    'id', completed_session.id,
    'user_id', completed_session.user_id,
    'seat_id', target_seat.id,
    'seat_code', target_seat.seat_code,
    'section_id', target_seat.section_id,
    'check_in_time', completed_session.check_in_time,
    'check_out_time', completed_session.check_out_time,
    'status', completed_session.status,
    'location_status', completed_session.location_status,
    'location_verified_at', completed_session.location_verified_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.student_check_in(text, double precision, double precision, double precision, timestamptz) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.student_check_out(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.student_check_in(text, double precision, double precision, double precision, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.student_check_out(uuid) TO authenticated;

COMMIT;
