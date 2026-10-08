BEGIN;

CREATE TABLE public.application_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  location_verification_enabled boolean NOT NULL
);

INSERT INTO public.application_settings (id, location_verification_enabled)
VALUES (true, false);

REVOKE ALL ON TABLE public.application_settings FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.location_verification_is_enabled()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT location_verification_enabled
  FROM public.application_settings
  WHERE id = true;
$$;

REVOKE ALL ON FUNCTION public.location_verification_is_enabled() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.location_verification_is_enabled() TO authenticated;

ALTER FUNCTION public.student_check_in(text, double precision, double precision, double precision, timestamptz)
  RENAME TO student_check_in_with_geofence;
REVOKE ALL ON FUNCTION public.student_check_in_with_geofence(text, double precision, double precision, double precision, timestamptz)
  FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.student_check_in(
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
  result jsonb;
BEGIN
  IF public.location_verification_is_enabled() THEN
    RETURN public.student_check_in_with_geofence(
      p_seat_code,
      p_latitude,
      p_longitude,
      p_accuracy_meters,
      p_location_captured_at
    );
  END IF;

  result := public.student_check_in_with_geofence(
    p_seat_code,
    5.6511292,
    -0.1870251,
    0,
    now()
  );

  UPDATE public.seat_sessions
  SET location_status = 'not_verified',
      location_verified_at = NULL,
      outside_since = NULL
  WHERE id = (result->>'id')::uuid;

  RETURN result || jsonb_build_object(
    'location_status', 'not_verified',
    'location_verified_at', NULL,
    'outside_since', NULL
  );
END;
$$;

REVOKE ALL ON FUNCTION public.student_check_in(text, double precision, double precision, double precision, timestamptz)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.student_check_in(text, double precision, double precision, double precision, timestamptz)
  TO authenticated;

ALTER FUNCTION public.student_report_geofence_position(uuid, double precision, double precision, double precision, timestamptz)
  RENAME TO student_report_geofence_position_with_geofence;
REVOKE ALL ON FUNCTION public.student_report_geofence_position_with_geofence(uuid, double precision, double precision, double precision, timestamptz)
  FROM PUBLIC, anon, authenticated;

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
BEGIN
  IF NOT public.location_verification_is_enabled() THEN
    RETURN public.student_report_geofence_position_with_geofence(
      p_session_id,
      NULL,
      NULL,
      NULL,
      NULL
    );
  END IF;

  RETURN public.student_report_geofence_position_with_geofence(
    p_session_id,
    p_latitude,
    p_longitude,
    p_accuracy_meters,
    p_location_captured_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.student_report_geofence_position(uuid, double precision, double precision, double precision, timestamptz)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.student_report_geofence_position(uuid, double precision, double precision, double precision, timestamptz)
  TO authenticated;

ALTER FUNCTION public.admin_list_geofence_alerts()
  RENAME TO admin_list_geofence_alerts_with_geofence;
REVOKE ALL ON FUNCTION public.admin_list_geofence_alerts_with_geofence()
  FROM PUBLIC, anon, authenticated;

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
  IF NOT public.location_verification_is_enabled() THEN
    PERFORM * FROM public.admin_list_geofence_alerts_with_geofence();
    RETURN;
  END IF;

  RETURN QUERY
  SELECT * FROM public.admin_list_geofence_alerts_with_geofence();
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_geofence_alerts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_geofence_alerts() TO authenticated;

ALTER FUNCTION public.admin_release_outside_geofence_session(uuid)
  RENAME TO admin_release_outside_geofence_session_with_geofence;
REVOKE ALL ON FUNCTION public.admin_release_outside_geofence_session_with_geofence(uuid)
  FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.admin_release_outside_geofence_session(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NOT public.location_verification_is_enabled() THEN
    RAISE EXCEPTION 'Location verification is disabled' USING ERRCODE = '55000';
  END IF;

  PERFORM public.admin_release_outside_geofence_session_with_geofence(p_session_id);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_release_outside_geofence_session(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_release_outside_geofence_session(uuid) TO authenticated;

ALTER FUNCTION public.auto_release_outside_geofence_sessions()
  RENAME TO auto_release_outside_geofence_sessions_with_geofence;
REVOKE ALL ON FUNCTION public.auto_release_outside_geofence_sessions_with_geofence()
  FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.auto_release_outside_geofence_sessions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NOT public.location_verification_is_enabled() THEN
    RETURN 0;
  END IF;

  RETURN public.auto_release_outside_geofence_sessions_with_geofence();
END;
$$;

REVOKE ALL ON FUNCTION public.auto_release_outside_geofence_sessions() FROM PUBLIC, anon, authenticated;

UPDATE public.seat_sessions
SET location_status = 'not_verified',
    location_verified_at = NULL,
    outside_since = NULL
WHERE status = 'active';

COMMIT;
