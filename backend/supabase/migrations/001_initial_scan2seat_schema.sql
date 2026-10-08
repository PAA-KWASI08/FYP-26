BEGIN;

CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE RESTRICT,
  student_id text UNIQUE,
  full_name text NOT NULL,
  programme text,
  department text,
  level text,
  college text,
  role text NOT NULL DEFAULT 'student'
    CHECK (role IN ('student', 'admin')),
  account_status text NOT NULL DEFAULT 'active'
    CHECK (account_status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_student_id_nonblank
    CHECK (student_id IS NULL OR btrim(student_id) <> '')
);

CREATE TABLE public.sections (
  id text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'closed')),
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sections_id_nonblank CHECK (btrim(id) <> ''),
  CONSTRAINT sections_name_nonblank CHECK (btrim(name) <> '')
);

CREATE TABLE public.seats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id text NOT NULL
    REFERENCES public.sections (id) ON DELETE RESTRICT,
  seat_code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'occupied', 'unavailable')),
  qr_identifier text NOT NULL UNIQUE,
  unavailable_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT seats_code_nonblank CHECK (btrim(seat_code) <> ''),
  CONSTRAINT seats_qr_identifier_nonblank CHECK (btrim(qr_identifier) <> ''),
  CONSTRAINT seats_unavailable_reason_required
    CHECK (
      status <> 'unavailable'
      OR nullif(btrim(unavailable_reason), '') IS NOT NULL
    )
);

CREATE TABLE public.seat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL
    REFERENCES public.users (id) ON DELETE RESTRICT,
  seat_id uuid NOT NULL
    REFERENCES public.seats (id) ON DELETE RESTRICT,
  check_in_time timestamptz NOT NULL DEFAULT now(),
  check_out_time timestamptz,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed')),
  location_status text NOT NULL DEFAULT 'not_verified'
    CHECK (location_status IN ('within_library', 'outside_library', 'not_verified')),
  location_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT seat_sessions_checkout_matches_status
    CHECK (
      (status = 'active' AND check_out_time IS NULL)
      OR (status = 'completed' AND check_out_time IS NOT NULL)
    ),
  CONSTRAINT seat_sessions_checkout_not_before_checkin
    CHECK (check_out_time IS NULL OR check_out_time >= check_in_time)
);

CREATE UNIQUE INDEX seat_sessions_one_active_per_user
  ON public.seat_sessions (user_id)
  WHERE status = 'active';

CREATE UNIQUE INDEX seat_sessions_one_active_per_seat
  ON public.seat_sessions (seat_id)
  WHERE status = 'active';

CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL
    CHECK (
      type IN (
        'general',
        'important',
        'section_update',
        'maintenance',
        'system_notice',
        'examination_academic_activity'
      )
    ),
  audience text NOT NULL
    CHECK (audience IN ('all_students', 'specific_section')),
  section_id text
    REFERENCES public.sections (id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published')),
  expires_at date,
  created_by uuid NOT NULL
    REFERENCES public.users (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT announcements_audience_section_matches
    CHECK (
      (audience = 'all_students' AND section_id IS NULL)
      OR (audience = 'specific_section' AND section_id IS NOT NULL)
    ),
  CONSTRAINT announcements_title_nonblank CHECK (btrim(title) <> ''),
  CONSTRAINT announcements_message_nonblank CHECK (btrim(message) <> '')
);

CREATE FUNCTION public.require_announcement_admin_creator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.users AS profile
    WHERE profile.id = NEW.created_by
      AND profile.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'created_by must reference an admin profile'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.require_announcement_admin_creator() FROM PUBLIC;

CREATE TRIGGER announcements_require_admin_creator
  BEFORE INSERT OR UPDATE OF created_by
  ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.require_announcement_admin_creator();

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

INSERT INTO public.sections (id, name, status)
VALUES
  ('reference-hall', 'Reference Hall', 'open'),
  ('students-reference', 'Students'' Reference', 'open'),
  ('africana', 'Africana', 'open'),
  ('iac', 'IAC', 'open'),
  ('e-resources', 'E-Resources', 'open');

COMMIT;
