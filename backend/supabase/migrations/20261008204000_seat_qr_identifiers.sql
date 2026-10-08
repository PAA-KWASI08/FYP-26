BEGIN;

CREATE FUNCTION public.generate_seat_qr_identifier()
RETURNS text
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  candidate text;
  attempt integer;
BEGIN
  PERFORM pg_advisory_xact_lock(821204882);

  FOR attempt IN 1..100 LOOP
    candidate := '#' || lpad(floor(random() * 10000)::integer::text, 4, '0');
    IF NOT EXISTS (
      SELECT 1 FROM public.seats WHERE qr_identifier = candidate
    ) THEN
      RETURN candidate;
    END IF;
  END LOOP;

  RAISE EXCEPTION 'Unable to generate a unique seat ID after 100 attempts'
    USING ERRCODE = '54000';
END;
$$;

REVOKE ALL ON FUNCTION public.generate_seat_qr_identifier() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  seat_record record;
BEGIN
  FOR seat_record IN
    SELECT id FROM public.seats ORDER BY id
  LOOP
    UPDATE public.seats
    SET qr_identifier = public.generate_seat_qr_identifier()
    WHERE id = seat_record.id;
  END LOOP;
END;
$$;

ALTER TABLE public.seats
  ADD CONSTRAINT seats_qr_identifier_format
  CHECK (qr_identifier ~ '^#[0-9]{4}$');

REVOKE SELECT ON TABLE public.seats FROM anon;
REVOKE SELECT (qr_identifier) ON TABLE public.seats FROM anon;
GRANT SELECT (id, section_id, seat_code, status, unavailable_reason)
  ON TABLE public.seats TO anon;
REVOKE SELECT ON TABLE public.seats FROM authenticated;
GRANT SELECT (id, section_id, seat_code, status, unavailable_reason)
  ON TABLE public.seats TO authenticated;

CREATE FUNCTION public.admin_create_section_with_seats(
  p_section_id text,
  p_name text,
  p_description text DEFAULT NULL,
  p_status text DEFAULT 'open',
  p_initial_seat_count integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  section_record public.sections%ROWTYPE;
  section_prefix text;
  largest_seat_number integer;
  index_number integer;
  seat_record public.seats%ROWTYPE;
  created_seats jsonb := '[]'::jsonb;
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

  IF nullif(btrim(p_section_id), '') IS NULL
    OR nullif(btrim(p_name), '') IS NULL
    OR p_status NOT IN ('open', 'closed')
    OR p_initial_seat_count NOT BETWEEN 0 AND 1000
  THEN
    RAISE EXCEPTION 'Section details or initial seat count are invalid' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.sections (id, name, description, status)
  VALUES (btrim(p_section_id), btrim(p_name), nullif(btrim(p_description), ''), p_status)
  RETURNING * INTO section_record;

  IF p_initial_seat_count = 0 THEN
    RETURN jsonb_build_object('section', to_jsonb(section_record), 'seats', created_seats);
  END IF;

  SELECT string_agg(upper(left(token, 1)), '' ORDER BY ordinal)
  INTO section_prefix
  FROM regexp_split_to_table(section_record.id, '-') WITH ORDINALITY AS words(token, ordinal)
  WHERE token <> '';
  section_prefix := coalesce(nullif(section_prefix, ''), 'S');

  SELECT coalesce(max(substring(seat_code FROM length(section_prefix) + 2)::integer), 0)
  INTO largest_seat_number
  FROM public.seats
  WHERE seat_code ~ ('^' || section_prefix || '-[0-9]+$');

  FOR index_number IN 1..p_initial_seat_count LOOP
    INSERT INTO public.seats (section_id, seat_code, qr_identifier, status)
    VALUES (
      section_record.id,
      section_prefix || '-' || lpad((largest_seat_number + index_number)::text, 3, '0'),
      public.generate_seat_qr_identifier(),
      'available'
    )
    RETURNING * INTO seat_record;

    created_seats := created_seats || jsonb_build_array(to_jsonb(seat_record));
  END LOOP;

  RETURN jsonb_build_object('section', to_jsonb(section_record), 'seats', created_seats);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_create_section_with_seats(text, text, text, text, integer)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_create_section_with_seats(text, text, text, text, integer)
  TO authenticated;

CREATE FUNCTION public.admin_create_seat(
  p_section_id text,
  p_seat_code text,
  p_status text DEFAULT 'available',
  p_unavailable_reason text DEFAULT NULL
)
RETURNS SETOF public.seats
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

  IF nullif(btrim(p_section_id), '') IS NULL
    OR nullif(btrim(p_seat_code), '') IS NULL
    OR p_status NOT IN ('available', 'unavailable')
    OR (p_status = 'unavailable' AND nullif(btrim(p_unavailable_reason), '') IS NULL)
  THEN
    RAISE EXCEPTION 'Seat details are invalid' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
    INSERT INTO public.seats (section_id, seat_code, qr_identifier, status, unavailable_reason)
    VALUES (
      p_section_id,
      btrim(p_seat_code),
      public.generate_seat_qr_identifier(),
      p_status,
      CASE WHEN p_status = 'unavailable' THEN btrim(p_unavailable_reason) ELSE NULL END
    )
    RETURNING *;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_create_seat(text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_create_seat(text, text, text, text) TO authenticated;

CREATE FUNCTION public.admin_list_seat_qr_labels(p_section_id text DEFAULT NULL)
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
    'id', seat.id,
    'section_id', section.id,
    'section_name', section.name,
    'seat_code', seat.seat_code,
    'qr_identifier', seat.qr_identifier
  )
  FROM public.seats AS seat
  JOIN public.sections AS section ON section.id = seat.section_id
  WHERE p_section_id IS NULL OR section.id = p_section_id
  ORDER BY section.name, seat.seat_code;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_seat_qr_labels(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_seat_qr_labels(text) TO authenticated;

CREATE FUNCTION public.admin_regenerate_seat_qr(p_seat_id uuid)
RETURNS SETOF public.seats
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
    UPDATE public.seats
    SET qr_identifier = public.generate_seat_qr_identifier()
    WHERE id = p_seat_id
    RETURNING *;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Seat not found' USING ERRCODE = 'P0002';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_regenerate_seat_qr(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_regenerate_seat_qr(uuid) TO authenticated;

ALTER FUNCTION public.student_check_in(text, double precision, double precision, double precision, timestamptz, integer)
  RENAME TO student_check_in_with_planned_timer;
REVOKE ALL ON FUNCTION public.student_check_in_with_planned_timer(text, double precision, double precision, double precision, timestamptz, integer)
  FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.student_find_seat_by_qr(p_qr_identifier text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  seat_record public.seats%ROWTYPE;
  section_record public.sections%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND role = 'student'
      AND account_status = 'active'
      AND must_change_password = false
  ) THEN
    RAISE EXCEPTION 'An active student account is required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO seat_record
  FROM public.seats
  WHERE qr_identifier = upper(btrim(p_qr_identifier));
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT * INTO section_record
  FROM public.sections
  WHERE id = seat_record.section_id;

  RETURN jsonb_build_object(
    'seat_id', seat_record.id,
    'seat_code', seat_record.seat_code,
    'seat_status', seat_record.status,
    'section_id', section_record.id,
    'section_name', section_record.name,
    'section_status', section_record.status
  );
END;
$$;

REVOKE ALL ON FUNCTION public.student_find_seat_by_qr(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.student_find_seat_by_qr(text) TO authenticated;

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
  target_seat public.seats%ROWTYPE;
  result jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND role = 'student'
      AND account_status = 'active'
      AND must_change_password = false
  ) THEN
    RAISE EXCEPTION 'An active student account is required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO target_seat
  FROM public.seats
  WHERE qr_identifier = upper(btrim(p_seat_code));
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Seat QR identifier was not found' USING ERRCODE = 'P0002';
  END IF;

  result := public.student_check_in_with_planned_timer(
    target_seat.seat_code,
    p_latitude,
    p_longitude,
    p_accuracy_meters,
    p_location_captured_at,
    p_planned_duration_minutes
  );

  RETURN result || jsonb_build_object('seat_id', target_seat.id);
END;
$$;

REVOKE ALL ON FUNCTION public.student_check_in(text, double precision, double precision, double precision, timestamptz, integer)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.student_check_in(text, double precision, double precision, double precision, timestamptz, integer)
  TO authenticated;

COMMIT;
