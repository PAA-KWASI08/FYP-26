BEGIN;

CREATE FUNCTION public.admin_list_seat_sessions()
RETURNS SETOF jsonb
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
  SELECT jsonb_build_object(
    'id', study_session.id,
    'user_id', study_session.user_id,
    'student_id', profile.student_id,
    'student_name', profile.full_name,
    'seat_id', study_session.seat_id,
    'seat_code', seat.seat_code,
    'section_id', section.id,
    'section_name', section.name,
    'check_in_time', study_session.check_in_time,
    'check_out_time', study_session.check_out_time,
    'status', study_session.status,
    'location_status', study_session.location_status,
    'location_verified_at', study_session.location_verified_at,
    'outside_since', study_session.outside_since
  )
  FROM public.seat_sessions AS study_session
  JOIN public.users AS profile ON profile.id = study_session.user_id
  JOIN public.seats AS seat ON seat.id = study_session.seat_id
  JOIN public.sections AS section ON section.id = seat.section_id
  ORDER BY study_session.check_in_time DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_seat_sessions() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_seat_sessions() TO authenticated;

COMMIT;
