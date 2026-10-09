-- Keep rows referenced by session and announcement history; delete means archival.
BEGIN;

ALTER TABLE public.sections
  ADD COLUMN is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN deleted_at timestamptz;

ALTER TABLE public.seats
  ADD COLUMN is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN deleted_at timestamptz;

GRANT SELECT (is_active, deleted_at) ON TABLE public.seats TO anon, authenticated;

DROP POLICY IF EXISTS "Allow public read access to library sections" ON public.sections;
DROP POLICY IF EXISTS "Allow public read access to library seats" ON public.seats;

CREATE POLICY sections_active_public_select
  ON public.sections
  FOR SELECT
  TO anon
  USING (is_active AND deleted_at IS NULL);

CREATE POLICY sections_active_student_select
  ON public.sections
  FOR SELECT
  TO authenticated
  USING (
    (is_active AND deleted_at IS NULL)
    OR EXISTS (
      SELECT 1
      FROM public.users AS profile
      WHERE profile.id = (SELECT auth.uid())
        AND profile.role = 'admin'
        AND profile.account_status = 'active'
        AND profile.must_change_password = false
    )
  );

CREATE POLICY seats_active_public_select
  ON public.seats
  FOR SELECT
  TO anon
  USING (
    is_active
    AND deleted_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.sections AS section
      WHERE section.id = seats.section_id
        AND section.is_active
        AND section.deleted_at IS NULL
    )
  );

CREATE POLICY seats_active_student_select
  ON public.seats
  FOR SELECT
  TO authenticated
  USING (
    (
      is_active
      AND deleted_at IS NULL
      AND EXISTS (
        SELECT 1
        FROM public.sections AS section
        WHERE section.id = seats.section_id
          AND section.is_active
          AND section.deleted_at IS NULL
      )
    )
    OR EXISTS (
      SELECT 1
      FROM public.users AS profile
      WHERE profile.id = (SELECT auth.uid())
        AND profile.role = 'admin'
        AND profile.account_status = 'active'
        AND profile.must_change_password = false
    )
  );

CREATE OR REPLACE FUNCTION public.admin_create_seat(
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

  IF NOT EXISTS (
    SELECT 1 FROM public.sections
    WHERE id = p_section_id AND is_active AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Choose an active section for the seat' USING ERRCODE = '23514';
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

CREATE OR REPLACE FUNCTION public.admin_manage_sections(
  p_action text,
  p_section_id text DEFAULT NULL,
  p_name text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_status text DEFAULT NULL
)
RETURNS SETOF public.sections
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

  IF p_action = 'update' THEN
    IF p_status NOT IN ('open', 'closed')
      OR (p_name IS NOT NULL AND nullif(btrim(p_name), '') IS NULL)
    THEN
      RAISE EXCEPTION 'Section updates are invalid' USING ERRCODE = '22023';
    END IF;
    RETURN QUERY
      UPDATE public.sections
      SET name = CASE WHEN p_name IS NULL THEN name ELSE btrim(p_name) END,
          description = CASE WHEN p_description IS NULL THEN description ELSE nullif(btrim(p_description), '') END,
          status = p_status
      WHERE id = p_section_id AND deleted_at IS NULL
      RETURNING *;
  ELSIF p_action = 'deactivate' THEN
    IF EXISTS (
      SELECT 1
      FROM public.seats AS seat
      JOIN public.seat_sessions AS study_session ON study_session.seat_id = seat.id
      WHERE seat.section_id = p_section_id
        AND study_session.status = 'active'
    ) THEN
      RAISE EXCEPTION 'This section has an active seat session and cannot be deactivated' USING ERRCODE = '23514';
    END IF;
    RETURN QUERY
      UPDATE public.sections
      SET is_active = false
      WHERE id = p_section_id AND deleted_at IS NULL AND is_active
      RETURNING *;
  ELSIF p_action = 'activate' THEN
    RETURN QUERY
      UPDATE public.sections
      SET is_active = true
      WHERE id = p_section_id AND deleted_at IS NULL AND NOT is_active
      RETURNING *;
  ELSIF p_action = 'delete' THEN
    IF EXISTS (
      SELECT 1
      FROM public.seats AS seat
      JOIN public.seat_sessions AS study_session ON study_session.seat_id = seat.id
      WHERE seat.section_id = p_section_id
        AND study_session.status = 'active'
    ) THEN
      RAISE EXCEPTION 'This section has an active seat session and cannot be deleted' USING ERRCODE = '23514';
    END IF;
    UPDATE public.seats
    SET is_active = false, deleted_at = coalesce(deleted_at, now())
    WHERE section_id = p_section_id AND deleted_at IS NULL;
    RETURN QUERY
      UPDATE public.sections
      SET is_active = false, status = 'closed', deleted_at = coalesce(deleted_at, now())
      WHERE id = p_section_id AND deleted_at IS NULL
      RETURNING *;
  ELSE
    RAISE EXCEPTION 'Unsupported section action' USING ERRCODE = '22023';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_manage_seats(
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
  existing_seat public.seats%ROWTYPE;
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

  SELECT * INTO existing_seat
  FROM public.seats
  WHERE seat_code = p_previous_seat_code
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Seat not found' USING ERRCODE = 'P0002';
  END IF;

  IF p_action IN ('deactivate', 'delete') AND EXISTS (
    SELECT 1 FROM public.seat_sessions
    WHERE seat_id = existing_seat.id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'This seat has an active session and cannot be changed' USING ERRCODE = '23514';
  END IF;

  IF p_action = 'deactivate' THEN
    RETURN QUERY
      UPDATE public.seats SET is_active = false
      WHERE id = existing_seat.id AND deleted_at IS NULL AND is_active
      RETURNING *;
  ELSIF p_action = 'activate' THEN
    RETURN QUERY
      UPDATE public.seats SET is_active = true
      WHERE id = existing_seat.id AND deleted_at IS NULL AND NOT is_active
      RETURNING *;
  ELSIF p_action = 'delete' THEN
    RETURN QUERY
      UPDATE public.seats
      SET is_active = false, deleted_at = coalesce(deleted_at, now())
      WHERE id = existing_seat.id AND deleted_at IS NULL
      RETURNING *;
  ELSIF p_action = 'update' THEN
    IF NOT existing_seat.is_active OR existing_seat.deleted_at IS NOT NULL THEN
      RAISE EXCEPTION 'A deactivated or deleted seat cannot be edited' USING ERRCODE = '23514';
    END IF;
    IF p_status NOT IN ('available', 'unavailable')
      OR nullif(btrim(p_seat_code), '') IS NULL
      OR nullif(btrim(p_qr_identifier), '') IS NULL
      OR (p_status = 'unavailable' AND nullif(btrim(p_unavailable_reason), '') IS NULL)
    THEN
      RAISE EXCEPTION 'Seat details are invalid' USING ERRCODE = '22023';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.sections
      WHERE id = coalesce(p_section_id, existing_seat.section_id) AND is_active AND deleted_at IS NULL
    ) THEN
      RAISE EXCEPTION 'Choose an active section for the seat' USING ERRCODE = '23514';
    END IF;
    RETURN QUERY
      UPDATE public.seats
      SET section_id = coalesce(p_section_id, section_id),
          seat_code = btrim(p_seat_code),
          qr_identifier = btrim(p_qr_identifier),
          status = p_status,
          unavailable_reason = CASE WHEN p_status = 'unavailable' THEN btrim(p_unavailable_reason) ELSE NULL END
      WHERE id = existing_seat.id
      RETURNING *;
  ELSE
    RAISE EXCEPTION 'Unsupported seat action' USING ERRCODE = '22023';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.student_find_seat_by_qr(p_qr_identifier text)
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

  SELECT seat.* INTO seat_record
  FROM public.seats AS seat
  JOIN public.sections AS section ON section.id = seat.section_id
  WHERE seat.qr_identifier = upper(btrim(p_qr_identifier))
    AND seat.is_active
    AND seat.deleted_at IS NULL
    AND section.is_active
    AND section.deleted_at IS NULL;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT * INTO section_record FROM public.sections WHERE id = seat_record.section_id;
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

CREATE OR REPLACE FUNCTION public.student_check_in(
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

  SELECT seat.* INTO target_seat
  FROM public.seats AS seat
  JOIN public.sections AS section ON section.id = seat.section_id
  WHERE seat.qr_identifier = upper(btrim(p_seat_code))
    AND seat.is_active
    AND seat.deleted_at IS NULL
    AND section.is_active
    AND section.deleted_at IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Seat QR identifier was not found or is inactive' USING ERRCODE = 'P0002';
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

CREATE OR REPLACE FUNCTION public.admin_list_seat_qr_labels(p_section_id text DEFAULT NULL)
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
    'qr_identifier', seat.qr_identifier,
    'is_active', seat.is_active,
    'section_is_active', section.is_active
  )
  FROM public.seats AS seat
  JOIN public.sections AS section ON section.id = seat.section_id
  WHERE seat.deleted_at IS NULL
    AND section.deleted_at IS NULL
    AND (p_section_id IS NULL OR section.id = p_section_id)
  ORDER BY section.name, seat.seat_code;
END;
$$;

COMMIT;
