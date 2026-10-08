BEGIN;

DROP FUNCTION IF EXISTS public.prototype_admin_seats(text, text, text, text, text, text, text, text, text);
DROP FUNCTION IF EXISTS public.prototype_admin_seats_legacy(text, text, text, text, text, text, text, text, text);
DROP FUNCTION IF EXISTS public.prototype_admin_sections(text, text, text, text, text, text, text);
DROP FUNCTION IF EXISTS public.prototype_admin_announcements(text, text, text, uuid, jsonb);

CREATE POLICY seat_sessions_select_for_active_admin
  ON public.seat_sessions
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.users AS profile
    WHERE profile.id = (SELECT auth.uid())
      AND profile.role = 'admin'
      AND profile.account_status = 'active'
      AND profile.must_change_password = false
  ));

CREATE FUNCTION public.admin_manage_sections(
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

  IF p_action = 'create' THEN
    IF p_status NOT IN ('open', 'closed') OR nullif(btrim(p_name), '') IS NULL THEN
      RAISE EXCEPTION 'Section name and status are required' USING ERRCODE = '22023';
    END IF;
    RETURN QUERY
      INSERT INTO public.sections (id, name, description, status)
      VALUES (p_section_id, btrim(p_name), nullif(btrim(p_description), ''), p_status)
      RETURNING *;
  ELSIF p_action = 'update' THEN
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
      WHERE id = p_section_id
      RETURNING *;
  ELSIF p_action = 'deactivate' THEN
    IF EXISTS (
      SELECT 1
      FROM public.seats AS seat
      JOIN public.seat_sessions AS study_session ON study_session.seat_id = seat.id
      WHERE seat.section_id = p_section_id
        AND study_session.status = 'active'
    ) THEN
      RAISE EXCEPTION 'This section has an active seat session and cannot be closed' USING ERRCODE = '23514';
    END IF;
    RETURN QUERY
      UPDATE public.sections SET status = 'closed'
      WHERE id = p_section_id
      RETURNING *;
  ELSE
    RAISE EXCEPTION 'Unsupported section action' USING ERRCODE = '22023';
  END IF;
END;
$$;

CREATE FUNCTION public.admin_manage_seats(
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

  IF p_action = 'create' THEN
    IF nullif(btrim(p_section_id), '') IS NULL
      OR nullif(btrim(p_seat_code), '') IS NULL
      OR nullif(btrim(p_qr_identifier), '') IS NULL
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
        btrim(p_qr_identifier),
        p_status,
        CASE WHEN p_status = 'unavailable' THEN btrim(p_unavailable_reason) ELSE NULL END
      )
      RETURNING *;
  ELSIF p_action IN ('update', 'deactivate') THEN
    SELECT * INTO existing_seat
    FROM public.seats
    WHERE seat_code = p_previous_seat_code
    FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Seat not found' USING ERRCODE = 'P0002';
    END IF;

    IF EXISTS (
      SELECT 1 FROM public.seat_sessions
      WHERE seat_id = existing_seat.id AND status = 'active'
    ) THEN
      RAISE EXCEPTION 'This seat has an active session and cannot be changed' USING ERRCODE = '23514';
    END IF;

    IF p_action = 'deactivate' THEN
      RETURN QUERY
        UPDATE public.seats
        SET status = 'unavailable', unavailable_reason = 'Deactivated by administrator'
        WHERE id = existing_seat.id
        RETURNING *;
    ELSE
      IF p_status NOT IN ('available', 'unavailable')
        OR nullif(btrim(p_seat_code), '') IS NULL
        OR nullif(btrim(p_qr_identifier), '') IS NULL
        OR (p_status = 'unavailable' AND nullif(btrim(p_unavailable_reason), '') IS NULL)
      THEN
        RAISE EXCEPTION 'Seat details are invalid' USING ERRCODE = '22023';
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
    END IF;
  ELSE
    RAISE EXCEPTION 'Unsupported seat action' USING ERRCODE = '22023';
  END IF;
END;
$$;

CREATE FUNCTION public.admin_manage_announcements(
  p_action text,
  p_announcement_id uuid DEFAULT NULL,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS SETOF jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  audience_value text;
  announcement_type text;
  announcement_status text;
  section_value text;
  expiry_value date;
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

  IF p_action = 'list' THEN
    RETURN QUERY SELECT to_jsonb(announcement)
      FROM public.announcements AS announcement
      ORDER BY announcement.created_at DESC;
    RETURN;
  ELSIF p_action = 'delete' THEN
    DELETE FROM public.announcements WHERE id = p_announcement_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Announcement not found' USING ERRCODE = 'P0002'; END IF;
    RETURN;
  END IF;

  audience_value := CASE p_payload->>'audience'
    WHEN 'Specific Section' THEN 'specific_section'
    WHEN 'All Students' THEN 'all_students'
    ELSE NULL
  END;
  announcement_type := CASE p_payload->>'type'
    WHEN 'General' THEN 'general'
    WHEN 'Important' THEN 'important'
    WHEN 'Section Update' THEN 'section_update'
    WHEN 'Maintenance' THEN 'maintenance'
    WHEN 'System Notice' THEN 'system_notice'
    WHEN 'Examination or Academic Activity' THEN 'examination_academic_activity'
    ELSE NULL
  END;
  announcement_status := CASE p_payload->>'status'
    WHEN 'Published' THEN 'published'
    WHEN 'Draft' THEN 'draft'
    ELSE NULL
  END;
  section_value := CASE WHEN audience_value = 'specific_section' THEN p_payload->>'sectionId' ELSE NULL END;
  expiry_value := nullif(p_payload->>'expiryDate', '')::date;

  IF p_action NOT IN ('create', 'update')
    OR nullif(btrim(p_payload->>'title'), '') IS NULL
    OR nullif(btrim(p_payload->>'message'), '') IS NULL
    OR audience_value IS NULL
    OR announcement_type IS NULL
    OR announcement_status IS NULL
    OR (audience_value = 'specific_section' AND section_value IS NULL)
  THEN
    RAISE EXCEPTION 'Announcement details are invalid' USING ERRCODE = '22023';
  END IF;

  IF p_action = 'create' THEN
    RETURN QUERY
      WITH inserted AS (
        INSERT INTO public.announcements (
          title, message, type, audience, section_id, status, expires_at, created_by, created_by_prototype
        )
        VALUES (
          btrim(p_payload->>'title'),
          btrim(p_payload->>'message'),
          announcement_type,
          audience_value,
          section_value,
          announcement_status,
          expiry_value,
          auth.uid(),
          NULL
        )
        RETURNING *
      )
      SELECT to_jsonb(inserted) FROM inserted;
  ELSE
    RETURN QUERY
      WITH changed AS (
        UPDATE public.announcements
        SET title = btrim(p_payload->>'title'),
            message = btrim(p_payload->>'message'),
            type = announcement_type,
            audience = audience_value,
            section_id = section_value,
            status = announcement_status,
            expires_at = expiry_value
        WHERE id = p_announcement_id
        RETURNING *
      )
      SELECT to_jsonb(changed) FROM changed;
    IF NOT FOUND THEN RAISE EXCEPTION 'Announcement not found' USING ERRCODE = 'P0002'; END IF;
  END IF;
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
    AND role IN ('student', 'admin')
    AND account_status = 'active'
    AND must_change_password = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No pending initial password change was found' USING ERRCODE = 'P0002';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_manage_sections(text, text, text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_manage_seats(text, text, text, text, text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_manage_announcements(text, uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_manage_sections(text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_manage_seats(text, text, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_manage_announcements(text, uuid, jsonb) TO authenticated;

REVOKE ALL ON FUNCTION public.complete_initial_password_change() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_initial_password_change() TO authenticated;

COMMIT;
