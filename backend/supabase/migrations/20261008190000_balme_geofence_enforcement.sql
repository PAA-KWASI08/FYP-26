BEGIN;

ALTER TABLE public.seat_sessions
  ADD COLUMN IF NOT EXISTS outside_since timestamptz;

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
    OR p_accuracy_meters IS NULL OR p_accuracy_meters < 0 OR p_accuracy_meters > 30
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
  IF distance_meters + p_accuracy_meters > 30 THEN
    RAISE EXCEPTION 'Location is outside the Balme Library 30 metre check-in area' USING ERRCODE = '22023';
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
    user_id, seat_id, status, location_status, location_verified_at, outside_since
  )
  VALUES (
    authenticated_user_id, target_seat.id, 'active', 'within_library', p_location_captured_at, NULL
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
    'location_verified_at', new_session.location_verified_at,
    'outside_since', new_session.outside_since
  );
END;
$$;

CREATE FUNCTION public.student_report_geofence_position(
  p_session_id uuid,
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
  active_session public.seat_sessions%ROWTYPE;
  next_status text;
  next_outside_since timestamptz;
  latitude_radians double precision;
  longitude_radians double precision;
  distance_haversine double precision;
  distance_meters double precision;
BEGIN
  IF authenticated_user_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = authenticated_user_id
      AND role = 'student'
      AND account_status = 'active'
      AND must_change_password = false
  ) THEN
    RAISE EXCEPTION 'An active, fully set-up student account is required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO active_session
  FROM public.seat_sessions
  WHERE id = p_session_id
    AND user_id = authenticated_user_id
    AND status = 'active'
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Active seat session not found' USING ERRCODE = 'P0002';
  END IF;

  IF p_latitude IS NULL AND p_longitude IS NULL AND p_accuracy_meters IS NULL THEN
    UPDATE public.seat_sessions
    SET location_status = 'not_verified',
        location_verified_at = now(),
        outside_since = NULL
    WHERE id = active_session.id;
    RETURN jsonb_build_object(
      'location_status', 'not_verified',
      'location_verified_at', now(),
      'outside_since', NULL
    );
  END IF;

  IF p_latitude IS NULL OR p_longitude IS NULL
    OR p_latitude NOT BETWEEN -90 AND 90
    OR p_longitude NOT BETWEEN -180 AND 180
    OR p_accuracy_meters IS NULL OR p_accuracy_meters < 0 OR p_accuracy_meters > 100
    OR p_location_captured_at IS NULL
    OR p_location_captured_at < now() - interval '1 minute'
    OR p_location_captured_at > now() + interval '5 seconds'
  THEN
    RAISE EXCEPTION 'A current location sample is required' USING ERRCODE = '22023';
  END IF;

  IF active_session.location_verified_at IS NOT NULL
    AND p_location_captured_at <= active_session.location_verified_at
  THEN
    RETURN jsonb_build_object(
      'location_status', active_session.location_status,
      'location_verified_at', active_session.location_verified_at,
      'outside_since', active_session.outside_since
    );
  END IF;

  latitude_radians := radians(p_latitude - 5.6511292);
  longitude_radians := radians(p_longitude - (-0.1870251));
  distance_haversine := sin(latitude_radians / 2) ^ 2
    + cos(radians(5.6511292)) * cos(radians(p_latitude))
    * sin(longitude_radians / 2) ^ 2;
  distance_meters := 6371000 * 2 * asin(sqrt(least(1, distance_haversine)));

  IF distance_meters + p_accuracy_meters <= 30 THEN
    next_status := 'within_library';
    next_outside_since := NULL;
  ELSIF distance_meters - p_accuracy_meters > 30 THEN
    next_status := 'outside_library';
    next_outside_since := coalesce(active_session.outside_since, now());
  ELSE
    next_status := 'not_verified';
    next_outside_since := NULL;
  END IF;

  UPDATE public.seat_sessions
  SET location_status = next_status,
      location_verified_at = p_location_captured_at,
      outside_since = next_outside_since
  WHERE id = active_session.id;

  RETURN jsonb_build_object(
    'location_status', next_status,
    'location_verified_at', p_location_captured_at,
    'outside_since', next_outside_since
  );
END;
$$;

CREATE FUNCTION public.admin_list_geofence_alerts()
RETURNS TABLE (
  session_id uuid,
  student_id text,
  student_name text,
  seat_code text,
  section_name text,
  outside_since timestamptz,
  auto_release_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND role = 'admin'
      AND account_status = 'active'
      AND must_change_password = false
  ) THEN
    RAISE EXCEPTION 'An active administrator account is required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT study_session.id,
         profile.student_id,
         profile.full_name,
         seat.seat_code,
         section.name,
         study_session.outside_since,
         study_session.outside_since + interval '15 minutes'
  FROM public.seat_sessions AS study_session
  JOIN public.users AS profile ON profile.id = study_session.user_id
  JOIN public.seats AS seat ON seat.id = study_session.seat_id
  JOIN public.sections AS section ON section.id = seat.section_id
  WHERE study_session.status = 'active'
    AND study_session.location_status = 'outside_library'
    AND study_session.outside_since <= now() - interval '10 minutes'
  ORDER BY study_session.outside_since;
END;
$$;

CREATE FUNCTION public.admin_release_outside_geofence_session(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  released_seat_id uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND role = 'admin'
      AND account_status = 'active'
      AND must_change_password = false
  ) THEN
    RAISE EXCEPTION 'An active administrator account is required' USING ERRCODE = '42501';
  END IF;

  UPDATE public.seat_sessions
  SET status = 'completed',
      check_out_time = now(),
      location_status = 'outside_library'
  WHERE id = p_session_id
    AND status = 'active'
    AND location_status = 'outside_library'
    AND outside_since <= now() - interval '10 minutes'
  RETURNING seat_id INTO released_seat_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This session is no longer eligible for outside-geofence release' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.seats
  SET status = 'available',
      unavailable_reason = NULL
  WHERE id = released_seat_id
    AND status = 'occupied';
END;
$$;

CREATE FUNCTION public.auto_release_outside_geofence_sessions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  released_count integer;
BEGIN
  WITH released AS (
    UPDATE public.seat_sessions
    SET status = 'completed',
        check_out_time = now(),
        location_status = 'outside_library'
    WHERE status = 'active'
      AND location_status = 'outside_library'
      AND outside_since <= now() - interval '15 minutes'
    RETURNING seat_id
  )
  UPDATE public.seats AS seat
  SET status = 'available',
      unavailable_reason = NULL
  FROM released
  WHERE seat.id = released.seat_id
    AND seat.status = 'occupied';

  GET DIAGNOSTICS released_count = ROW_COUNT;
  RETURN released_count;
END;
$$;

REVOKE ALL ON FUNCTION public.student_report_geofence_position(uuid, double precision, double precision, double precision, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.student_report_geofence_position(uuid, double precision, double precision, double precision, timestamptz) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_list_geofence_alerts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_geofence_alerts() TO authenticated;
REVOKE ALL ON FUNCTION public.admin_release_outside_geofence_session(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_release_outside_geofence_session(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.auto_release_outside_geofence_sessions() FROM PUBLIC, anon, authenticated;

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'auto-release-outside-geofence-seats';
SELECT cron.schedule(
  'auto-release-outside-geofence-seats',
  '* * * * *',
  'SELECT public.auto_release_outside_geofence_sessions();'
);

COMMIT;
